// Pure scoring helpers. No DOM access, so they run in the browser and under node --test.

const PUNCT = /[.,!?;:"'”“„«»()\[\]{}…–—\-]/g;

/** Lower-case, strip punctuation, collapse whitespace. Keeps å, ä, ö. */
export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Like normalize, but also folds å/ä→a, ö→o, é→e: used to spot diacritic-only slips. */
export function fold(text) {
  return normalize(text)
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[éè]/g, "e")
    .replace(/ü/g, "u");
}

export function tokens(text) {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/** Classic Levenshtein distance over any two sequences (strings or arrays). */
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/** Word-level similarity in [0, 1]: 1 - wordEditDistance / max(wordCount). */
export function wordSimilarity(heard, target) {
  const h = tokens(heard);
  const t = tokens(target);
  if (t.length === 0) return h.length === 0 ? 1 : 0;
  return Math.max(0, 1 - levenshtein(h, t) / Math.max(h.length, t.length));
}

/**
 * Score a typed short answer against accepted alternatives.
 * 1 = exact (after normalisation); 0.5 = only å/ä/ö differ, or one typo in a word of 6+ letters; 0 otherwise.
 */
export function scoreTyped(input, accepted, near = []) {
  const given = normalize(input);
  if (!given) return { points: 0, note: "No answer." };
  const list = accepted.map(normalize);
  if (list.includes(given)) return { points: 1, note: "Correct!" };
  if (near.map(normalize).includes(given)) return { points: 0, note: "Not quite: check the ending." };
  if (list.some((a) => fold(a) === fold(given))) {
    return { points: 0.5, note: "Almost: check ä and ö." };
  }
  if (list.some((a) => a.length >= 6 && levenshtein(a, given) === 1)) {
    return { points: 0.5, note: "Almost: one typo." };
  }
  return { points: 0, note: "Not quite." };
}

/** Word-order task: the built sentence must equal one accepted order (punctuation and case ignored). */
export function scoreOrder(builtWords, accepted) {
  const built = normalize(builtWords.join(" "));
  return accepted.map(normalize).includes(built)
    ? { points: 1, note: "Correct word order!" }
    : { points: 0, note: "Wrong word order." };
}

/**
 * Keyword task (translations, spoken answers). Each keyword group is a list of acceptable stems;
 * a group matches when any word of the answer contains one of its stems (rules by stem length, D-017).
 * Stems of six or more letters also match across a space the recogniser may have put inside a compound (D-019).
 * A stem starting with "=" must equal a whole word (numerals: "=kolme" is not found in "kolmekymmentä").
 * All groups → 1, at least half → 0.5, else 0. A group that matches only after folding ä/ö/å to a/o
 * (a learner without a Finnish keyboard) counts for half marks overall, like a gap slip (D-019).
 * `missing` lists groups found neither exactly nor folded; `slips` lists groups found only folded.
 */
export function scoreKeywords(answer, groups) {
  const exact = keywordHits(answer, groups, false);
  const loose = keywordHits(answer, groups, true);
  const n = groups.length;
  const found = exact.filter(Boolean).length;
  const foundLoose = loose.filter(Boolean).length;
  const missing = groups.filter((_, i) => !loose[i]).map((g) => g[0]);
  const slips = groups.filter((_, i) => loose[i] && !exact[i]).map((g) => g[0]);
  if (found === n) return { points: 1, note: "All key words are there!", missing, slips };
  if (foundLoose === n) return { points: 0.5, note: "Almost: check ä and ö.", missing, slips };
  if (foundLoose * 2 >= n) return { points: 0.5, note: slips.length ? "Partly right: check ä and ö." : "Partly right.", missing, slips };
  return { points: 0, note: "Too many key words missing.", missing, slips };
}

function keywordHits(answer, groups, folded) {
  const prep = folded ? fold : normalize;
  const words = prep(answer).split(" ").filter(Boolean);
  const joined = ` ${words.join(" ")} `;
  const compact = words.join("");
  return groups.map((stems) =>
    stems.some((stem) => {
      // "=kolme" matches the whole word only, so "kolmekymmentä" does not count as "kolme" (D-019).
      if (String(stem).startsWith("=")) return words.includes(prep(String(stem).slice(1)));
      const s = prep(stem);
      if (s.includes(" ")) return joined.includes(` ${s}`);
      if (s.length <= 2) return words.includes(s);
      if (s.length >= 6 && compact.includes(s)) return true;
      if (s.length >= 4) return words.some((w) => w.includes(s));
      return words.some((w) => w.startsWith(s));
    }),
  );
}

/** Dictation / read-aloud: ≥ 0.9 word similarity → 1, ≥ 0.7 → 0.5, else 0. */
export function scoreSimilarity(heard, target, full = 0.9, half = 0.7) {
  const sim = wordSimilarity(heard, target);
  if (sim >= full) return { points: 1, sim, note: "Very good!" };
  if (sim >= half) return { points: 0.5, sim, note: "Almost." };
  return { points: 0, sim, note: "Try again." };
}

/** Sum points and clamp to [0, max], rounding to the nearest half point. */
export function total(pointsList, max = 10) {
  const sum = pointsList.reduce((acc, p) => acc + p, 0);
  return Math.min(max, Math.max(0, Math.round(sum * 2) / 2));
}

/** Deterministic Fisher–Yates shuffle driven by a numeric seed (mulberry32). */
export function shuffle(items, seed) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Inline markup for glossed words: [[shown text|gloss|label]] where label is
 * "slangi", "puhekieli", "idiomi" or empty. Returns a list of text / term parts.
 */
export function parseMarkup(text) {
  const parts = [];
  const re = /\[\[([^|\]]+)\|([^|\]]+)(?:\|([^\]]*))?\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    parts.push({ type: "term", text: m[1], gloss: m[2], label: (m[3] || "").trim() });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

/** Plain text of marked-up text (used for speech synthesis and dictation targets). */
export function plain(text) {
  return parseMarkup(text)
    .map((p) => p.text)
    .join("");
}

/** Spoken answers: character similarity with spaces removed, best alternative; ≥ 0.9 → 1, ≥ 0.6 → ½. */
export function scoreSpoken(alternatives, target, full = 0.9, half = 0.6) {
  const t = normalize(target).replace(/ /g, "");
  let best = 0;
  for (const a of alternatives || []) {
    const h = normalize(a).replace(/ /g, "");
    const sim = t.length === 0 ? 0 : Math.max(0, 1 - levenshtein(h, t) / Math.max(h.length, t.length));
    best = Math.max(best, sim);
  }
  if (best >= full) return { points: 1, sim: best, note: "Very good!" };
  if (best >= half) return { points: 0.5, sim: best, note: "Almost." };
  return { points: 0, sim: best, note: "Try again." };
}

const ABBREVIATIONS = new Set(["esim.", "mm.", "n.", "ns.", "ts.", "jne."]);

/**
 * Split text into sentences for speech. A full stop after a number is an ordinal (7. marraskuuta) only
 * when the next word starts with a lower-case letter; "linjat 11 ja 12. Ylen mukaan" ends a sentence (D-019).
 * Known abbreviations never end a sentence.
 */
export function splitSentences(text) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const out = [];
  let cur = [];
  words.forEach((word, i) => {
    cur.push(word);
    const ends = /[.!?]["”)»]?$/.test(word);
    const ordinal = /^\d+\.$/.test(word) && /^\p{Ll}/u.test(words[i + 1] || "");
    if (ends && !ordinal && !ABBREVIATIONS.has(word.toLowerCase())) {
      out.push(cur.join(" "));
      cur = [];
    }
  });
  if (cur.length) out.push(cur.join(" "));
  return out;
}
