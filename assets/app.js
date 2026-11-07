import {
  normalize,
  scoreTyped,
  scoreOrder,
  scoreKeywords,
  scoreSimilarity,
  scoreSpoken,
  total,
  shuffle,
  parseMarkup,
  plain,
  splitSentences,
} from "./scoring.js";

const KINDS = ["luku", "kuuntelu", "kirjoitus", "puhe"];
const KIND_NAMES = {
  luku: { fi: "Luetun ymmärtäminen", en: "Reading" },
  kuuntelu: { fi: "Kuullun ymmärtäminen", en: "Listening" },
  kirjoitus: { fi: "Kirjoittaminen", en: "Writing" },
  puhe: { fi: "Puhuminen", en: "Speaking" },
};
const LABEL_NAMES = { slangi: "slangi", puhekieli: "puhekieli", idiomi: "idiomi" };
const STORE_KEY = "suomi-harjoitukset:v1";
const KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*-\d{8}-(luku|kuuntelu|kirjoitus|puhe)$/;
const MAX = 10;
const IMPORT_LIMIT = 1024 * 1024;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MARKER = /\(keksitty esimerkki\)\s*/gi;
const ISO_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const LOCK_MS = 600; // after a click on the sticky bar the controls stay inert for this long (double taps, B-01)
const DRAFT_MAX = 10000;

const app = document.getElementById("app");
let themes = [];
let knownIds = [];
let skippedFiles = [];
let timerHandle = null;
let activeListen = null;

/* ---------- storage ---------- */

function emptyStore() {
  return { version: 1, scores: {}, drafts: {} };
}

function isPlainObject(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** A finite number from a number or a numeric string, else NaN. */
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
}

/** Lenient clean-up of a stored entry (CR-01): coerce what can be read, drop what cannot. Never throws. */
function sanitiseEntry(raw) {
  if (!isPlainObject(raw)) return null;
  const clamp = (n) => Math.round(Math.min(MAX, Math.max(0, n)) * 2) / 2;
  const best = num(raw.best);
  if (!Number.isFinite(best)) return null;
  const history = [];
  if (Array.isArray(raw.history)) {
    for (const item of raw.history.slice(-20)) {
      const score = isPlainObject(item) ? num(item.score) : NaN;
      if (Number.isFinite(score) && typeof item.at === "string" && item.at.length <= 40) history.push({ score: clamp(score), at: item.at });
    }
  }
  const last = num(raw.last);
  const attempts = num(raw.attempts);
  return {
    best: clamp(best),
    last: Number.isFinite(last) ? clamp(last) : clamp(best),
    attempts: Number.isInteger(attempts) && attempts >= 0 && attempts <= 100000 ? attempts : Math.max(1, history.length),
    history,
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const store = emptyStore();
    if (isPlainObject(data.scores)) {
      for (const key of Object.keys(data.scores)) {
        const entry = KEY_PATTERN.test(key) ? sanitiseEntry(data.scores[key]) : null;
        if (entry) store.scores[key] = entry;
      }
    }
    if (isPlainObject(data.drafts)) {
      for (const key of Object.keys(data.drafts)) if (KEY_PATTERN.test(key) && typeof data.drafts[key] === "string") store.drafts[key] = data.drafts[key];
    }
    if (typeof data.lastExport === "string") store.lastExport = data.lastExport;
    return store;
  } catch {
    return emptyStore();
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

function recordScore(exId, score) {
  const store = loadStore();
  const prev = store.scores[exId] || { best: 0, last: null, attempts: 0, history: [] };
  const history = Array.isArray(prev.history) ? prev.history : [];
  const entry = {
    best: Math.max(Number(prev.best) || 0, score),
    last: score,
    attempts: (Number(prev.attempts) || 0) + 1,
    history: [...history, { at: new Date().toISOString(), score }].slice(-20),
  };
  store.scores[exId] = entry;
  return { saved: saveStore(store), entry };
}

function saveDraft(exId, text) {
  const store = loadStore();
  store.drafts[exId] = String(text).slice(0, DRAFT_MAX);
  return saveStore(store);
}

const isHalf = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= MAX && Number.isInteger(n * 2);

const isIsoAt = (at) => typeof at === "string" && at.length <= 40 && ISO_AT.test(at) && Number.isFinite(Date.parse(at));

/** Validate one imported entry; returns a fresh clean object or null. */
function cleanEntry(raw) {
  if (!isPlainObject(raw)) return null;
  if (!isHalf(raw.best) || !isHalf(raw.last)) return null;
  if (!Number.isInteger(raw.attempts) || raw.attempts < 0 || raw.attempts > 100000) return null;
  if (!Array.isArray(raw.history)) return null;
  const history = [];
  for (const item of raw.history.slice(0, 200)) {
    if (isPlainObject(item) && isHalf(item.score) && isIsoAt(item.at)) history.push({ score: item.score, at: item.at });
  }
  return { best: Math.max(raw.best, raw.last), last: raw.last, attempts: raw.attempts, history };
}

const newestAt = (entry) => entry.history.reduce((m, h) => (h.at > m ? h.at : m), "");

/** Merge an imported entry into the local one: best and attempts are maxima, history is a union by time. */
function mergeEntry(local, incoming) {
  if (!local) return { ...incoming, history: incoming.history.slice().sort((a, b) => (a.at < b.at ? -1 : 1)).slice(-20) };
  const l = cleanEntry(local) || { best: 0, last: 0, attempts: 0, history: [] };
  const byAt = new Map();
  for (const h of [...incoming.history, ...l.history]) byAt.set(h.at, h);
  const history = [...byAt.values()].sort((a, b) => (a.at < b.at ? -1 : 1)).slice(-20);
  const incomingNewer = newestAt(incoming) > newestAt(l);
  return {
    best: Math.max(l.best, incoming.best),
    last: incomingNewer ? incoming.last : l.last,
    attempts: Math.max(l.attempts, incoming.attempts),
    history,
  };
}

/** Only exercises of the published themes can be imported (B-08): the key is <theme id>-<kind>. */
function isKnownExercise(key) {
  return knownIds.some((id) => KINDS.some((k) => key === `${id}-${k}`));
}

/** Merge a parsed export into the stored scores. Returns { ok, imported, skipped }. */
function importScores(data) {
  if (!isPlainObject(data) || data.version !== 1 || !isPlainObject(data.scores)) return { ok: false, imported: 0, skipped: 0 };
  const store = loadStore();
  let imported = 0;
  let skipped = 0;
  for (const key of Object.keys(data.scores)) {
    const entry = KEY_PATTERN.test(key) && isKnownExercise(key) ? cleanEntry(data.scores[key]) : null;
    if (!entry) {
      skipped += 1;
      continue;
    }
    const own = Object.prototype.hasOwnProperty.call(store.scores, key) ? store.scores[key] : null;
    store.scores[key] = mergeEntry(own, entry);
    imported += 1;
  }
  if (imported === 0) return { ok: false, imported: 0, skipped, empty: true };
  if (!saveStore(store)) return { ok: false, imported: 0, skipped, saveFailed: true };
  return { ok: true, imported, skipped };
}

/* ---------- helpers ---------- */

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** append / replaceChildren that flatten arrays and skip null, undefined and false. */
function kids(list) {
  return list.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false);
}
function add(el, ...children) {
  el.append(...kids(children));
}
function fill(el, ...children) {
  el.replaceChildren(...kids(children));
}

function exId(themeId, kind) {
  return `${themeId}-${kind}`;
}

function sequence() {
  return themes.flatMap((t) => KINDS.map((k) => ({ theme: t, kind: k })));
}

function fmtScore(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "–";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function exHref(themeId, kind) {
  return `#/harjoitus/${themeId}/${kind}`;
}

function badgeFor(id) {
  const s = loadStore().scores[id];
  if (!s) return h("span", { class: "badge", text: "–/10" });
  const cls = s.best >= MAX ? "badge done" : "badge part";
  return h("span", { class: cls, title: `Best ${fmtScore(s.best)}, last ${fmtScore(s.last)}, ${s.attempts} attempts` }, `${fmtScore(s.best)}/10`);
}

/** Finnish text with glossed terms, marked as Finnish for screen readers and spell checkers. */
function fi(text, tag = "span") {
  return h(tag, { lang: "fi" }, rich(text));
}

/** At most one explanation is open; tapping elsewhere, Escape or navigating closes it. */
function closeTerms(except = null) {
  document.querySelectorAll(".term.open").forEach((t) => {
    if (t !== except) {
      t.classList.remove("open");
      t.setAttribute("aria-expanded", "false");
    }
  });
}
function toggleTerm(el) {
  const open = !el.classList.contains("open");
  closeTerms(el);
  el.classList.toggle("open", open);
  el.setAttribute("aria-expanded", String(open));
  if (open) {
    const rect = el.getBoundingClientRect();
    el.classList.toggle("flip", rect.left > window.innerWidth / 2);
  }
}
document.addEventListener("click", () => closeTerms());
document.addEventListener("keydown", (e) => e.key === "Escape" && closeTerms());

/** Render marked-up text: terms get a dotted underline, a register tag and a tap/hover gloss. */
function rich(text) {
  return parseMarkup(text).map((p) => {
    if (p.type === "text") return document.createTextNode(p.text);
    const cls = `term ${p.label || "sana"}`;
    const el = h(
      "span",
      { class: cls, tabindex: "0", "data-gloss": p.gloss, "data-label": p.label || "" },
      p.text,
      p.label ? h("span", { class: `tag ${p.label}`, text: LABEL_NAMES[p.label] || p.label }) : null,
      h("span", { class: "pop", role: "tooltip" }, p.gloss),
    );
    el.setAttribute("role", "button");
    el.setAttribute("aria-expanded", "false");
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTerm(el);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleTerm(el);
      }
    });
    return el;
  });
}

function collectTerms(texts) {
  const seen = new Map();
  for (const t of texts) {
    for (const p of parseMarkup(t)) {
      if (p.type === "term" && !seen.has(p.text.toLowerCase())) seen.set(p.text.toLowerCase(), p);
    }
  }
  return [...seen.values()];
}

function glossaryList(terms) {
  if (!terms.length) return null;
  return h(
    "details",
    { class: "card", open: true },
    h("summary", {}, "Word list"),
    h(
      "ul",
      { class: "glossary" },
      terms.map((t) =>
        h(
          "li",
          {},
          h("strong", { lang: "fi" }, t.text),
          t.label ? h("span", { class: `tag ${t.label}`, text: LABEL_NAMES[t.label] || t.label }) : null,
          " – ",
          h("span", { lang: "fi" }, t.gloss.split(" · ")[0]),
          t.gloss.includes(" · ") ? ` · ${t.gloss.split(" · ").slice(1).join(" · ")}` : null,
        ),
      ),
    ),
  );
}

function legend() {
  return h(
    "div",
    { class: "legend small" },
    h("span", {}, h("span", { class: "tag slangi", text: "slangi" }), " slang: informal and often group-bound"),
    h("span", {}, h("span", { class: "tag puhekieli", text: "puhekieli" }), " everyday spoken Finnish"),
    h("span", {}, h("span", { class: "tag idiomi", text: "idiomi" }), " fixed expression"),
    h("span", {}, h("span", { class: "tag sana", text: "sana" }), " ordinary word"),
  );
}

function feedbackBox(points, note, explain) {
  const cls = points >= 1 ? "ok" : points > 0 ? "half" : "bad";
  return h(
    "div",
    { class: `feedback ${cls}`, "data-points": String(points) },
    `${note} (${fmtScore(points)} pt)`,
    explain ? h("span", { class: "explain" }, explain) : null,
  );
}

/* ---------- speech ---------- */

const speech = {
  synth: "speechSynthesis" in window ? window.speechSynthesis : null,
  voice: null,
  rate: 0.9,
  ready: null,
};

function recognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const normLang = (v) => String(v?.lang || "").toLowerCase().replace(/_/g, "-");

/** D-007 ranking: (1) fi-FI Natural/Online, (2) fi-FI, (3) any fi*. */
function chooseVoice(voices) {
  const list = Array.from(voices || []);
  const ranks = [
    list.filter((v) => normLang(v) === "fi-fi" && /Natural|Online/.test(v.name || "")),
    list.filter((v) => normLang(v) === "fi-fi"),
    list.filter((v) => normLang(v).startsWith("fi")),
  ];
  for (const r of ranks) if (r.length) return r[0];
  return null;
}

function currentVoices() {
  try {
    return speech.synth ? speech.synth.getVoices() : [];
  } catch {
    return [];
  }
}

/** Resolve once voices exist, or after 2 s (page load only; a tap on Play never waits). */
function voicesReady() {
  if (!speech.synth) return Promise.resolve([]);
  if (!speech.ready) {
    speech.ready = new Promise((resolve) => {
      if (currentVoices().length) {
        resolve(currentVoices());
        return;
      }
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        resolve(currentVoices());
      };
      try {
        speech.synth.addEventListener("voiceschanged", finish);
      } catch {
        /* no event support */
      }
      setTimeout(finish, 2000);
    });
  }
  return speech.ready;
}

function speakable(text) {
  return plain(text).replace(MARKER, "").trim();
}

/** Show why audio did not play, next to the control that was pressed (CR-02, B-06). */
function speechProblem(anchor, code) {
  const host = anchor?.closest?.(".q") || anchor?.closest?.("section") || app;
  let el = host.querySelector(":scope > .speech-problem");
  if (!el) {
    el = h("p", { class: "notice speech-problem", role: "status" });
    host.append(el);
  }
  const hint = document.getElementById("transcript") ? " Read the transcript instead." : " Try another browser, or install a Finnish voice in your device settings.";
  el.dataset.problem = code;
  el.textContent = code === "unsupported" ? `This browser has no speech synthesis, so the audio cannot be played.${hint}` : `Your browser could not play the audio (${code}).${hint}`;
}

function clearSpeechProblem(anchor) {
  const host = anchor?.closest?.(".q") || anchor?.closest?.("section") || app;
  host.querySelector(":scope > .speech-problem")?.remove();
}

/**
 * Queue every sentence at once (no onend chaining). Voice choice uses the voices known right now.
 * Returns false and tells the learner (next to `anchor`) when nothing could be played.
 */
function speakParagraphs(paragraphs, rate = speech.rate, anchor = null) {
  if (!speech.synth) {
    speechProblem(anchor, "unsupported");
    return false;
  }
  try {
    const voice = chooseVoice(currentVoices());
    speech.synth.cancel();
    clearSpeechProblem(anchor);
    for (const p of paragraphs) {
      for (const sentence of splitSentences(speakable(p))) {
        const clean = sentence.replace(/^[–—-]\s*/, "").replace(/\s[–—]\s/g, ", ");
        if (!clean) continue;
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = "fi-FI";
        if (voice) u.voice = voice;
        u.rate = rate;
        u.onerror = (e) => {
          const code = (e && e.error) || "error";
          if (code !== "interrupted" && code !== "canceled") speechProblem(anchor, code);
        };
        speech.synth.speak(u);
      }
    }
    return true;
  } catch (err) {
    speechProblem(anchor, (err && err.name) || "error");
    return false;
  }
}

function stopSpeaking() {
  try {
    speech.synth?.cancel();
  } catch {
    /* ignore */
  }
}

function rateSelect() {
  return h(
    "select",
    { "aria-label": "Speaking speed", class: "auto", onchange: (e) => (speech.rate = Number(e.target.value)) },
    [
      ["0.7", "Slow"],
      ["0.9", "Normal"],
      ["1.05", "Quick"],
    ].map(([v, n]) => h("option", { value: v, selected: Number(v) === speech.rate }, n)),
  );
}

const RECOGNITION_PROBLEMS = {
  "not-allowed": "The browser did not allow the microphone.",
  "service-not-allowed": "The browser did not allow speech recognition.",
  network: "Speech recognition needs an internet connection.",
  "audio-capture": "No microphone was found.",
  unsupported: "This browser has no speech recognition.",
};

const NO_VOICE_MESSAGE =
  "No Finnish voice found. Install a Finnish text-to-speech voice in your device settings, or use Microsoft Edge, Safari or Chrome on Android. You can still read the transcript.";

function voiceStatus() {
  const el = h("p", { class: "muted small", id: "voice-status" }, "Looking for a Finnish voice…");
  const apply = () => {
    const voice = chooseVoice(currentVoices());
    if (voice) {
      el.dataset.voice = "fi";
      el.className = "muted small";
      el.textContent = `Voice: ${voice.name} (${voice.lang})`;
    } else {
      el.dataset.voice = "none";
      el.className = "notice";
      el.textContent = speech.synth ? NO_VOICE_MESSAGE : "This browser has no speech synthesis. You can read the transcript instead.";
    }
  };
  voicesReady().then(apply);
  // Voices may arrive after the 2 s wait (B-07): keep listening while this line is on screen.
  const late = () => {
    if (!el.isConnected) {
      try {
        speech.synth.removeEventListener("voiceschanged", late);
      } catch {
        /* no removeEventListener */
      }
      return;
    }
    apply();
  };
  try {
    speech.synth?.addEventListener("voiceschanged", late);
  } catch {
    /* no event support */
  }
  return el;
}

/** Stop the running recognition, if any; its promise rejects with { aborted: true } and the page ignores it (B-04). */
function abortListening() {
  activeListen?.cancel();
}

/** Listen once with the Web Speech API. Resolves with the transcript alternatives; always settles. */
function listenOnce() {
  return new Promise((resolve, reject) => {
    const Recognition = recognitionCtor();
    if (!Recognition) {
      reject(new Error("unsupported"));
      return;
    }
    abortListening();
    const rec = new Recognition();
    let done = false;
    let timer = null;
    const handle = {
      cancel: () => finish(reject, Object.assign(new Error("aborted"), { aborted: true }), true),
    };
    const finish = (fn, value, abort = false) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (activeListen === handle) activeListen = null;
      try {
        if (abort && typeof rec.abort === "function") rec.abort();
        else rec.stop();
      } catch {
        /* already stopped */
      }
      fn(value);
    };
    activeListen = handle;
    rec.lang = "fi-FI";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const res = e?.results?.[0];
      const alts = [];
      for (let i = 0; res && i < res.length; i += 1) alts.push(res[i].transcript);
      finish(resolve, alts);
    };
    rec.onerror = (e) => finish(reject, new Error((e && e.error) || "error"));
    rec.onend = () => finish(resolve, []);
    timer = setTimeout(() => finish(resolve, []), 15000);
    try {
      rec.start();
    } catch (err) {
      finish(reject, err);
    }
  });
}

/* ---------- start-up helpers ---------- */

/** Ask the browser to keep this site's storage; best effort, never blocks. */
async function askPersist() {
  try {
    const request = navigator.storage?.persist?.();
    if (request) await Promise.race([request, new Promise((resolve) => setTimeout(resolve, 2000))]);
  } catch (err) {
    console.warn("storage.persist failed", err);
  }
}

function needsBackup(store) {
  const keys = Object.keys(store.scores);
  if (!keys.length) return false;
  let reference = store.lastExport || "";
  if (!reference) {
    for (const k of keys) {
      const hist = Array.isArray(store.scores[k]?.history) ? store.scores[k].history : [];
      for (const item of hist) if (typeof item?.at === "string" && (!reference || item.at < reference)) reference = item.at;
    }
  }
  const t = Date.parse(reference);
  return Number.isFinite(t) && Date.now() - t > WEEK_MS;
}

/* ---------- pages ---------- */

function setTitle(t) {
  document.title = t ? `${t} · Suomea uutisista` : "Suomea uutisista – Finnish current-affairs exercises";
}

function stopTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
}

function renderIndex() {
  setTitle("");
  const store = loadStore();
  const seq = sequence();
  const bestOf = (theme, kind) => Number(store.scores[exId(theme.id, kind)]?.best) || 0;
  const best = seq.reduce((acc, { theme, kind }) => acc + bestOf(theme, kind), 0);
  const done = seq.filter(({ theme, kind }) => store.scores[exId(theme.id, kind)]).length;
  const possible = seq.length * MAX;
  const firstUnfinished = seq.find(({ theme, kind }) => bestOf(theme, kind) < MAX);
  const bar = h("span", {});
  bar.style.setProperty("width", `${possible ? (100 * best) / possible : 0}%`);

  fill(app,
    h("h1", {}, "Finnish from the news"),
    h(
      "p",
      { class: "lead" },
      "Read, listen, write and speak about current affairs in Finland. Each exercise takes about ten minutes, scores 0–10 and can be repeated as often as you like. Your results are saved in this browser.",
    ),
    skippedFiles.length
      ? h("p", { class: "notice", id: "theme-warning", role: "status" }, `Some exercises could not be loaded and were left out (${skippedFiles.join("; ")}). The rest works. Reload the page to try again.`)
      : null,
    needsBackup(store)
      ? h("p", { class: "notice backup-reminder" }, h("a", { href: "#/tietoja" }, "Back up your scores"), " – your browser may delete saved data you have not exported.")
      : null,
    h(
      "div",
      { class: "card summary" },
      h("span", { class: "big", id: "total-best" }, `${fmtScore(best)} / ${possible}`),
      h("span", {}, `best points in total · ${done} of ${seq.length} exercises started`),
      h("div", { class: "bar", "aria-hidden": "true" }, bar),
      firstUnfinished
        ? h("a", { class: "btn primary", id: "continue", href: exHref(firstUnfinished.theme.id, firstUnfinished.kind) }, done ? "Continue →" : "Start here →")
        : h("span", {}, "Full marks everywhere – well done!"),
    ),
    legend(),
    themes.map((t) =>
      h(
        "section",
        { class: "card theme-card" },
        h("header", {}, h("h2", { lang: "fi" }, t.title), h("span", { class: "date" }, `News of ${t.dateLabel} · level ${t.level}`)),
        h("p", { class: "muted tight", lang: "fi" }, t.summary),
        h(
          "div",
          { class: "ex-links" },
          KINDS.map((k) =>
            h(
              "a",
              { class: "ex-link", href: exHref(t.id, k), "data-ex": exId(t.id, k) },
              h("span", {}, h("span", { lang: "fi" }, KIND_NAMES[k].fi), h("small", { class: "en" }, KIND_NAMES[k].en)),
              badgeFor(exId(t.id, k)),
            ),
          ),
        ),
      ),
    ),
  );
}

function renderAbout() {
  setTitle("About");
  const store = loadStore();
  const voices = currentVoices().filter((v) => normLang(v).startsWith("fi"));
  const status = h("p", { class: "muted", id: "import-status", role: "status" });
  const savedCount = h("span", { id: "saved-count" }, String(Object.keys(store.scores).length));
  const importInput = h("input", { type: "file", accept: "application/json,.json", class: "visually-hidden", id: "import" });
  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const fail = (msg) => {
      status.dataset.ok = "0";
      status.textContent = msg;
    };
    try {
      if (file.size > IMPORT_LIMIT) {
        fail("That file is larger than 1 MB, so it was not imported. Your scores are unchanged.");
        return;
      }
      const result = importScores(JSON.parse(await file.text()));
      if (!result.ok) {
        if (result.saveFailed) fail("Your browser would not save the imported scores. Your scores are unchanged.");
        else if (result.empty) fail(`That file has no results for these exercises (${result.skipped} invalid entr${result.skipped === 1 ? "y" : "ies"} skipped). Your scores are unchanged.`);
        else fail("That file is not an export from this site. Your scores are unchanged.");
        return;
      }
      savedCount.textContent = String(Object.keys(loadStore().scores).length);
      status.dataset.ok = "1";
      status.textContent = `Imported ${result.imported} exercise${result.imported === 1 ? "" : "s"}; ${result.skipped} invalid entr${result.skipped === 1 ? "y" : "ies"} skipped. Better scores are kept.`;
    } catch {
      fail("That file could not be read as an export from this site. Your scores are unchanged.");
    } finally {
      importInput.value = "";
    }
  });

  fill(app,
    h("h1", {}, "About"),
    h(
      "div",
      { class: "card" },
      h("h2", { class: "first" }, "How it works"),
      h(
        "ul",
        {},
        h("li", {}, h("strong", {}, "Reading (", h("span", { lang: "fi" }, "luku"), "): "), "a news text in standard Finnish, a spoken-Finnish dialogue, a word list and ten questions."),
        h("li", {}, h("strong", {}, "Listening (", h("span", { lang: "fi" }, "kuuntelu"), "): "), "your browser reads a news report and a dialogue aloud; eight questions and two dictation sentences."),
        h("li", {}, h("strong", {}, "Writing (", h("span", { lang: "fi" }, "kirjoitus"), "): "), "fill gaps with the right form, build sentences in neutral word order and translate. A free writing task with a model text comes as an extra and is not scored."),
        h("li", {}, h("strong", {}, "Speaking (", h("span", { lang: "fi" }, "puhe"), "): "), "read six sentences aloud and answer four questions. Speech recognition compares what it hears with the target; without it you rate yourself."),
      ),
      h("h2", {}, "Scoring"),
      h(
        "p",
        {},
        "Every exercise has ten items worth 1, ½ or 0 points. Typed answers must match exactly; half a point is given when only ä or ö is wrong, or for one typo in a word of six letters or more (Finnish vowel and consonant length changes the word, so short words get no typo allowance). Word-order tasks need the neutral order. Translations and spoken answers are checked for key words, and key words are matched inside inflected forms and compounds. A key word typed without ä or ö still counts but caps the item at half a point, as in the gap tasks. Key-word scoring does not understand negation, so an answer that denies the fact (“ei …”) can still earn points. Dictation and read-aloud answers earn full marks at about 90 % similarity. Speaking allows up to three recordings per item and the best one counts.",
      ),
      h("h2", {}, "Register labels"),
      legend(),
      h(
        "p",
        { class: "small muted" },
        "News texts are written for language learning from the news of the date shown, in standard Finnish (yleiskieli). Each text ends with an invented dialogue in spoken Finnish (puhekieli). The register labels (slangi, puhekieli, idiomi) were set by checking each slang word against at least two independent web sources; the evidence is in the content notes in the repository. Kielitoimiston sanakirja, the dictionary of the Institute for the Languages of Finland, could not be consulted when the exercises were made, so a label may differ from the dictionary's. Slang can be regional or age-bound. The texts are original and the news may have moved on since.",
      ),
    ),
    h(
      "div",
      { class: "card" },
      h("h2", { class: "first" }, "Your browser"),
      h("p", {}, `Speech synthesis: ${speech.synth ? "yes" : "no"} · Finnish voices found: ${voices.length ? voices.map((v) => v.name).join(", ") : "none (yet)"}`),
      h("p", {}, `Speech recognition: ${recognitionCtor() ? "yes (Chrome and Edge send the recording to an online service)" : "no, so the speaking exercises use self-assessment"}`),
      h(
        "p",
        { class: "small muted" },
        "Listening needs a Finnish voice. Chrome on desktop may have no Finnish voice; the page tells you if none is found. Edge, Safari and Chrome on Android usually have one. Speech recognition works in Chrome, Edge and Safari; Firefox uses self-assessment. Support varies by device and version.",
      ),
    ),
    h(
      "div",
      { class: "card" },
      h("h2", { class: "first" }, "Your results"),
      h("p", {}, "Saved results: ", savedCount, ` exercises. They live only in this browser. Safari may delete site data after seven days without a visit unless you add the site to your Home Screen, so export a backup now and then.`),
      h(
        "div",
        { class: "row" },
        h(
          "button",
          {
            type: "button",
            class: "btn",
            id: "export",
            onclick: () => {
              const current = loadStore();
              current.lastExport = new Date().toISOString();
              saveStore(current);
              const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = h("a", { href: url, download: "suomea-uutisista-results.json" });
              document.body.append(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
          },
          "Export",
        ),
        h("label", { class: "btn", for: "import" }, "Import"),
        importInput,
        h(
          "button",
          {
            type: "button",
            class: "btn",
            onclick: (e) => {
              if (e.target.dataset.confirm !== "1") {
                e.target.dataset.confirm = "1";
                e.target.textContent = "Sure? Tap again";
                return;
              }
              const cleared = loadStore();
              cleared.scores = {};
              cleared.drafts = {};
              saveStore(cleared);
              renderAbout();
            },
          },
          "Reset all results",
        ),
      ),
      status,
    ),
  );
}

function renderExercise(themeId, kind) {
  abortListening();
  const theme = themes.find((t) => t.id === themeId);
  const known = KINDS.includes(kind) && theme && Object.prototype.hasOwnProperty.call(theme.exercises || {}, kind);
  const ex = known ? theme.exercises[kind] : null;
  if (!theme || !ex) {
    fill(app, h("h1", {}, "That exercise does not exist"), h("a", { href: "#/" }, "Back to the start"));
    return;
  }
  const id = exId(themeId, kind);
  setTitle(`${KIND_NAMES[kind].en}: ${theme.title}`);
  const seq = sequence();
  const pos = seq.findIndex((s) => s.theme.id === themeId && s.kind === kind);
  const prev = seq[pos - 1];
  const next = seq[pos + 1];
  const seed = Math.floor(Math.random() * 2 ** 31);

  const started = Date.now();
  const timerEl = h("span", { class: "timer" }, "0:00 · aim for about 10 min");
  stopTimer();
  timerHandle = setInterval(() => {
    const s = Math.floor((Date.now() - started) / 1000);
    timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} · aim for about 10 min`;
  }, 1000);

  const pager = () =>
    h(
      "nav",
      { class: "pager", "aria-label": "Move between exercises" },
      prev
        ? h("a", { class: "btn small", href: exHref(prev.theme.id, prev.kind), "data-nav": "prev" }, `← ${KIND_NAMES[prev.kind].en}: `, h("span", { lang: "fi" }, prev.theme.short))
        : h("a", { class: "btn small", href: "#/" }, "← Start"),
      next
        ? h("a", { class: "btn small", href: exHref(next.theme.id, next.kind), "data-nav": "next" }, `${KIND_NAMES[next.kind].en}: `, h("span", { lang: "fi" }, next.theme.short), " →")
        : h("a", { class: "btn small", href: "#/" }, "Finished! Back to the start →"),
    );

  const body = h("div", {});
  const resultBar = h("div", { class: "result", id: "result" });
  const builders = { luku: buildReading, kuuntelu: buildListening, kirjoitus: buildWriting, puhe: buildSpeaking };
  const items = builders[kind](ex, theme, body, seed, id);

  const prevScore = loadStore().scores[id];
  // The Check button is inert for a moment after every render, so the second tap of a double tap on
  // "Try again" cannot land on the new Check button in the same place (B-01).
  const checkBtn = h("button", { type: "button", class: "btn primary", id: "check", disabled: true }, "Check my answers");
  setTimeout(() => {
    checkBtn.disabled = false;
  }, LOCK_MS);
  const status = h("span", {}, prevScore ? `Best so far: ${fmtScore(prevScore.best)}/10 (${prevScore.attempts} attempts)` : "Answer every item, then press Check.");
  add(resultBar, status, checkBtn);

  let checked = false;
  checkBtn.addEventListener("click", () => {
    if (checked) return;
    checked = true;
    stopTimer();
    stopSpeaking();
    abortListening();
    const points = items.map((it) => it.check());
    const score = total(points, MAX);
    const { saved, entry } = recordScore(id, score);
    const nextLink = next ? h("a", { class: "btn primary", href: exHref(next.theme.id, next.kind) }, "Next →") : h("a", { class: "btn primary", href: "#/" }, "Back to the start");
    nextLink.addEventListener("click", (e) => nextLink.getAttribute("aria-disabled") === "true" && e.preventDefault());
    const afterCheck = h("span", { class: "row tight" }, h("button", { type: "button", class: "btn", id: "retry", onclick: () => renderExercise(themeId, kind) }, "Try again"), nextLink);
    body.querySelectorAll("input, textarea, select, .chip, button.lock").forEach((el) => {
      if (!el.closest(".keep-enabled")) el.disabled = true;
    });
    fill(resultBar,
      h("span", {},
        h("span", { class: "score", id: "score", "data-score": String(score) }, `${fmtScore(score)}/10`),
        " ",
        h("span", { class: "muted small" }, `best ${fmtScore(entry.best)} · ${entry.attempts} attempts`),
        saved ? null : h("span", { class: "save-error", id: "save-error", role: "alert" }, " Your browser would not save this result. Export is unavailable too, so note the score yourself."),
      ),
      afterCheck,
    );
    // Same place as Check, but inert for LOCK_MS: the second tap of a double tap on Check is ignored (B-01).
    const locked = [...afterCheck.querySelectorAll("button, a")];
    locked.forEach((el) => {
      el.setAttribute("aria-disabled", "true");
      if (el.tagName === "BUTTON") el.disabled = true;
    });
    setTimeout(() => {
      locked.forEach((el) => {
        el.removeAttribute("aria-disabled");
        el.disabled = false;
      });
    }, LOCK_MS);
    resultBar.scrollIntoView({ block: "nearest" });
  });

  fill(app,
    pager(),
    h("div", { class: "ex-top" },
      h("span", { class: "kind" }, `${KIND_NAMES[kind].en} · `, h("span", { lang: "fi" }, theme.title)),
      timerEl,
    ),
    h("p", { class: "news-date small muted" }, `Based on the news of ${theme.dateLabel} · level ${theme.level}`),
    h("h1", { lang: "fi" }, ex.title),
    ex.intro ? h("p", { class: "lead", lang: "fi" }, ex.intro) : null,
    body,
    sourcesBlock(theme),
    resultBar,
    pager(),
  );
  window.scrollTo(0, 0);
}

/* ---------- question widgets ---------- */

function mcQuestion(q, n, seed) {
  const name = `q${n}-${seed}`;
  const order = shuffle(q.options.map((_, i) => i), seed + n * 7919);
  const labels = [];
  const box = h("div", { class: "options" });
  for (const i of order) {
    const input = h("input", { type: "radio", name, value: String(i) });
    const label = h("label", { class: "option", "data-correct": i === q.answer ? "1" : "0" }, input, fi(q.options[i]));
    labels.push(label);
    box.append(label);
  }
  const fb = h("div", {});
  const el = h("div", { class: "q", "data-type": "mc" }, h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), fi(q.q)), box, fb);
  return {
    el,
    check() {
      const chosen = el.querySelector("input:checked");
      const ok = chosen && Number(chosen.value) === q.answer;
      labels.forEach((l) => {
        if (l.dataset.correct === "1") l.classList.add("correct");
        else if (chosen && l.contains(chosen)) l.classList.add("wrong");
      });
      fb.replaceChildren(feedbackBox(ok ? 1 : 0, ok ? "Correct!" : chosen ? "Not quite." : "No answer.", q.explain));
      return ok ? 1 : 0;
    },
  };
}

function tfQuestion(q, n, seed) {
  const name = `q${n}-${seed}`;
  const mk = (val, text) =>
    h("label", { class: "option", "data-correct": val === q.answer ? "1" : "0" }, h("input", { type: "radio", name, value: String(val) }), text);
  const t = mk(true, "True");
  const f = mk(false, "False");
  const fb = h("div", {});
  const el = h("div", { class: "q", "data-type": "tf" }, h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), fi(q.q)), h("div", { class: "tf" }, t, f), fb);
  return {
    el,
    check() {
      const chosen = el.querySelector("input:checked");
      const ok = chosen && (chosen.value === "true") === q.answer;
      [t, f].forEach((l) => {
        if (l.dataset.correct === "1") l.classList.add("correct");
        else if (chosen && l.contains(chosen)) l.classList.add("wrong");
      });
      fb.replaceChildren(feedbackBox(ok ? 1 : 0, ok ? "Correct!" : chosen ? "Not quite." : "No answer.", q.explain));
      return ok ? 1 : 0;
    },
  };
}

function gapQuestion(q, n) {
  const input = h("input", { type: "text", lang: "fi", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": `Answer ${n}` });
  const fb = h("div", {});
  const el = h(
    "div",
    { class: "q", "data-type": "gap" },
    h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), fi(q.q)),
    q.hint ? h("p", { class: "hint", lang: "fi" }, q.hint) : null,
    input,
    fb,
  );
  return {
    el,
    check() {
      const r = scoreTyped(input.value, q.accept, q.near || []);
      fb.replaceChildren(feedbackBox(r.points, r.note, r.points < 1 ? `Answer: ${q.accept[0]}. ${q.explain || ""}` : q.explain));
      return r.points;
    },
  };
}

function orderQuestion(q, n, seed) {
  const words = q.accept[0].replace(/[.!?]$/, "").split(" ");
  const pool = h("div", { class: "chips", lang: "fi" });
  const built = h("div", { class: "chips built", lang: "fi", "aria-label": "Your sentence" });
  const chosen = [];
  const redraw = () => {
    fill(built,
      chosen.map((c, idx) =>
        h("button", {
          type: "button",
          class: "chip",
          onclick: () => {
            chosen.splice(idx, 1);
            c.btn.disabled = false;
            redraw();
          },
        }, c.word),
      ),
    );
  };
  shuffle(words.map((w, i) => ({ w, i })), seed + n * 104729).forEach(({ w }) => {
    const btn = h("button", { type: "button", class: "chip", "data-word": w }, w);
    btn.addEventListener("click", () => {
      chosen.push({ word: w, btn });
      btn.disabled = true;
      redraw();
    });
    pool.append(btn);
  });
  const fb = h("div", {});
  const el = h(
    "div",
    { class: "q", "data-type": "order" },
    h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), "Build the sentence in neutral word order (subject – verb – object/adverbial): ", h("em", {}, q.en)),
    pool,
    built,
    fb,
  );
  return {
    el,
    check() {
      const r = scoreOrder(chosen.map((c) => c.word), q.accept);
      fb.replaceChildren(feedbackBox(r.points, r.note, r.points < 1 ? `Neutral order: ${q.accept[0]} ${q.explain || ""}` : q.explain));
      return r.points;
    },
  };
}

function translateQuestion(q, n) {
  const input = h("textarea", { rows: "2", class: "short", lang: "fi", autocapitalize: "sentences", spellcheck: "false", "aria-label": `Translation ${n}` });
  const fb = h("div", {});
  const el = h(
    "div",
    { class: "q", "data-type": "translate" },
    h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), "Translate into Finnish: ", h("em", {}, q.en)),
    input,
    fb,
  );
  return {
    el,
    check() {
      const r = scoreKeywords(input.value, q.keywords);
      const miss = r.missing.length ? ` Missing: ${r.missing.join(", ")}.` : "";
      fb.replaceChildren(feedbackBox(r.points, r.note + miss, `Suggestion: ${q.model}`));
      return r.points;
    },
  };
}

function dictationQuestion(q, n) {
  const input = h("input", { type: "text", lang: "fi", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": `Dictation ${n}` });
  const fb = h("div", {});
  const el = h(
    "div",
    { class: "q", "data-type": "dictation" },
    h("p", { class: "prompt" }, h("span", { class: "num" }, `${n}.`), "Dictation: listen and type the sentence."),
    h("div", { class: "row keep-enabled" },
      h("button", { type: "button", class: "btn small", onclick: (e) => speakParagraphs([q.text], undefined, e.currentTarget) }, "▶ Listen"),
      h("button", { type: "button", class: "btn small", onclick: (e) => speakParagraphs([q.text], 0.65, e.currentTarget) }, "▶ Slowly"),
    ),
    input,
    fb,
  );
  return {
    el,
    check() {
      const r = scoreSimilarity(input.value, q.text);
      fb.replaceChildren(feedbackBox(r.points, `${r.note} ${Math.round(r.sim * 100)} % of the words right.`, `The sentence: ${q.text}`));
      return r.points;
    },
  };
}

function speakingTask(q, n) {
  const target = q.type === "read" ? plain(q.text) : null;
  const hasRecognition = Boolean(recognitionCtor());
  let best = 0;
  let tries = 0;
  let busy = false;
  let selfMode = !hasRecognition;
  const fb = h("div", {});
  const heard = h("p", { class: "transcript muted small", lang: "fi" });
  const recBtn = h("button", { type: "button", class: "btn rec lock" }, "🎤 Speak");
  const selfBox = h("div", { class: "selfscore", hidden: !selfMode });
  const name = `self-${n}-${Math.random().toString(36).slice(2)}`;
  [
    ["0", "Did not work"],
    ["0.5", "Nearly"],
    ["1", "Good!"],
  ].forEach(([v, t]) => selfBox.append(h("label", {}, h("input", { type: "radio", name, value: v }), ` ${t}`)));

  const score = (alts) => {
    const results = alts.map((a) => (q.type === "read" ? { ...scoreSpoken([a], target), text: a } : { ...scoreKeywords(a, q.keywords), text: a }));
    return results.sort((a, b) => b.points - a.points)[0];
  };

  recBtn.addEventListener("click", async () => {
    if (busy || tries >= 3) return;
    busy = true;
    stopSpeaking();
    recBtn.classList.add("on");
    recBtn.textContent = "Listening…";
    let aborted = false;
    try {
      const alts = await listenOnce();
      tries += 1;
      if (!alts.length) {
        heard.dataset.heard = "";
        heard.textContent = `I heard nothing – try again. (attempt ${tries}/3)`;
      } else {
        const r = score(alts);
        best = Math.max(best, r.points);
        heard.dataset.heard = r.text;
        heard.textContent = `I heard: “${r.text}” → ${fmtScore(r.points)} pt (best ${fmtScore(best)} pt, attempt ${tries}/3)`;
      }
    } catch (err) {
      if (err.aborted) {
        aborted = true; // the learner left, retried or pressed Check: the page no longer wants this result
      } else if (err.message === "no-speech" || err.message === "aborted") {
        tries += 1;
        heard.dataset.heard = "";
        heard.textContent = `I heard nothing – try again. (attempt ${tries}/3)`;
      } else {
        heard.dataset.heard = "";
        heard.textContent = `${RECOGNITION_PROBLEMS[err.message] || `Speech recognition did not work (${err.message}).`} Please rate yourself instead.`;
        selfMode = true;
        selfBox.hidden = false;
      }
    } finally {
      busy = false;
      if (!aborted) {
        recBtn.classList.remove("on");
        recBtn.textContent = tries >= 3 ? "No more attempts" : "🎤 Speak again";
        if (tries >= 3) recBtn.disabled = true;
      }
    }
  });

  const toggle = h("button", { type: "button", class: "btn small lock" }, "Rate myself instead");
  toggle.addEventListener("click", () => {
    selfMode = true;
    selfBox.hidden = false;
    toggle.hidden = true;
  });

  const el = h(
    "div",
    { class: "q", "data-type": q.type },
    h(
      "p",
      { class: "prompt" },
      h("span", { class: "num" }, `${n}.`),
      q.type === "read" ? ["Read aloud: ", h("strong", {}, fi(q.text))] : ["Answer in a full sentence: ", h("strong", {}, fi(q.q))],
    ),
    q.type === "respond" && q.hint ? h("p", { class: "hint", lang: "fi" }, q.hint) : null,
    h(
      "div",
      { class: "row" },
      h("button", { type: "button", class: "btn small keep-enabled", onclick: (e) => speakParagraphs([q.type === "read" ? q.text : q.q], undefined, e.currentTarget) }, q.type === "read" ? "▶ Hear the model" : "▶ Hear the question"),
      hasRecognition ? recBtn : null,
      hasRecognition ? toggle : null,
    ),
    heard,
    selfBox,
    fb,
  );
  return {
    el,
    check() {
      let pts = best;
      let note = tries ? "Speech recognition" : "Not recorded";
      if (selfMode && best === 0) {
        const chosen = selfBox.querySelector("input:checked");
        pts = chosen ? Number(chosen.value) : 0;
        note = chosen ? "Self-assessment" : "Not rated";
      }
      const model = q.type === "read" ? null : `Example: ${q.model}`;
      fb.replaceChildren(feedbackBox(pts, note, model));
      return pts;
    },
  };
}

function questionWidget(q, n, seed) {
  switch (q.type) {
    case "mc":
      return mcQuestion(q, n, seed);
    case "tf":
      return tfQuestion(q, n, seed);
    case "gap":
      return gapQuestion(q, n);
    case "order":
      return orderQuestion(q, n, seed);
    case "translate":
      return translateQuestion(q, n);
    case "dictation":
      return dictationQuestion(q, n);
    case "read":
    case "respond":
      return speakingTask(q, n);
    default:
      throw new Error(`Unknown question type ${q.type}`);
  }
}

/* ---------- exercise builders ---------- */

function sourcesBlock(theme) {
  if (!theme.sources?.length) return null;
  return h(
    "section",
    { class: "card small" },
    h("h2", { class: "first" }, "Sources and date"),
    h("p", { class: "muted" }, `The texts are original and were written for language learning from the news of ${theme.dateLabel}. The situation may have changed since.`),
    h("ul", { class: "sources" }, theme.sources.map((s) => h("li", {}, /^https:\/\//i.test(s.url || "") ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, s.title) : s.title))),
  );
}

function buildReading(ex, theme, body, seed) {
  const article = h("article", { class: "card article", lang: "fi" },
    ex.text.map((p) => h("p", {}, rich(p))),
    h("h2", { lang: "en" }, "Spoken Finnish (puhekieli) – invented example"),
    ex.dialogue.map((p) => h("p", { class: "dialogue" }, rich(p))),
  );
  const widgets = ex.questions.map((q, i) => questionWidget(q, i + 1, seed));
  add(body,
    legend(),
    article,
    glossaryList(collectTerms([...ex.text, ...ex.dialogue])),
    h("section", { class: "card" }, h("h2", { class: "first" }, "Questions"), widgets.map((w) => w.el)),
  );
  return widgets;
}

function buildListening(ex, theme, body, seed) {
  const playAll = h("button", { type: "button", class: "btn primary", id: "play" }, "▶ Play the report and the dialogue");
  playAll.addEventListener("click", (e) => speakParagraphs([...ex.script, ...ex.dialogue], undefined, e.currentTarget));
  const parts = [
    ...ex.script.map((p, i) => h("button", { type: "button", class: "btn small", onclick: (e) => speakParagraphs([p], undefined, e.currentTarget) }, `Report ${i + 1}`)),
    ex.dialogue.length ? h("button", { type: "button", class: "btn small", onclick: (e) => speakParagraphs(ex.dialogue, undefined, e.currentTarget) }, "Dialogue") : null,
  ];
  const transcript = h(
    "details",
    { class: "card keep-enabled", id: "transcript" },
    h("summary", {}, "Show the transcript (only after listening!)"),
    h("div", { lang: "fi", class: "article" },
      ex.script.map((p) => h("p", {}, rich(p))),
      h("h2", { lang: "en" }, "Spoken Finnish (puhekieli) – invented example"),
      ex.dialogue.map((p) => h("p", { class: "dialogue" }, rich(p))),
    ),
    glossaryList(collectTerms([...ex.script, ...ex.dialogue])),
  );
  const widgets = ex.questions.map((q, i) => questionWidget(q, i + 1, seed));
  add(body,
    legend(),
    h(
      "section",
      { class: "card keep-enabled" },
      voiceStatus(),
      h("div", { class: "row" }, playAll, h("button", { type: "button", class: "btn", onclick: stopSpeaking }, "■ Stop"), rateSelect()),
      h("div", { class: "row" }, h("span", { class: "muted small" }, "Listen to one part at a time:"), parts),
      ex.vocab?.length ? h("p", { class: "small" }, "Useful words: ", ex.vocab.map((v, i) => [i ? " · " : "", fi(v)])) : null,
    ),
    h("section", { class: "card" }, h("h2", { class: "first" }, "Questions"), widgets.map((w) => w.el)),
    transcript,
  );
  return widgets;
}

function buildWriting(ex, theme, body, seed, id) {
  const widgets = ex.tasks.map((q, i) => questionWidget(q, i + 1, seed));
  const sections = [];
  let current = null;
  ex.tasks.forEach((q, i) => {
    const heading = { gap: "Fill in the right form", order: "Word order", translate: "Translate" }[q.type];
    if (!current || current.type !== q.type) {
      current = { type: q.type, el: h("section", { class: "card" }, h("h2", { class: "first" }, heading)) };
      sections.push(current);
    }
    current.el.append(widgets[i].el);
  });
  add(body, legend(), sections.map((s) => s.el));

  if (ex.free) {
    const drafts = loadStore().drafts;
    const ta = h("textarea", { class: "keep-enabled", lang: "fi", "aria-label": "Free writing", maxlength: String(DRAFT_MAX) });
    const draftNote = h("span", { class: "muted small", id: "draft-error", role: "status" });
    ta.value = typeof drafts[id] === "string" ? drafts[id] : "";
    const count = h("span", { class: "muted small" });
    const upd = () => {
      const words = normalize(ta.value) ? normalize(ta.value).split(" ").length : 0;
      count.textContent = `${words} words (aim for ${ex.free.words})`;
    };
    ta.addEventListener("input", () => {
      upd();
      draftNote.textContent = saveDraft(id, ta.value) ? "" : "Draft not saved: your browser would not store it.";
    });
    upd();
    add(body,
      h(
        "section",
        { class: "card keep-enabled" },
        h("h2", { class: "first" }, "Extra: free writing (not scored)"),
        h("p", {}, fi(ex.free.prompt)),
        h("ul", { class: "small" }, ex.free.checklist.map((c) => h("li", {}, fi(c)))),
        ta,
        h("div", { class: "row" }, count, h("span", { class: "muted small" }, "· saved automatically in this browser"), draftNote),
        h("details", {}, h("summary", {}, "Show a model text"), h("p", { class: "article" }, fi(ex.free.model))),
      ),
    );
  }
  return widgets;
}

function buildSpeaking(ex, theme, body, seed) {
  const widgets = ex.tasks.map((q, i) => questionWidget(q, i + 1, seed));
  add(body,
    h(
      "section",
      { class: "card" },
      recognitionCtor()
        ? h("p", { class: "notice" }, "Press 🎤 and speak clearly. You have three attempts per item and the best one counts. The browser asks for permission to use the microphone, and Chrome and Edge send the recording to an online service. If recognition does not work you can rate yourself.")
        : h("p", { class: "notice" }, "Your browser has no speech recognition (try Chrome, Edge or Safari). Listen to the model, say the sentence aloud and rate yourself honestly."),
      h("div", { class: "row keep-enabled" }, h("span", { class: "muted small" }, "Speed of the model voice:"), rateSelect()),
      legend(),
    ),
    h("section", { class: "card" }, h("h2", { class: "first" }, "Tasks"), widgets.map((w) => w.el)),
  );
  return widgets;
}

/* ---------- router ---------- */

function route() {
  stopTimer();
  stopSpeaking();
  abortListening();
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  let ok = true;
  try {
    if (parts[0] === "harjoitus" && parts.length === 3) renderExercise(parts[1], parts[2]);
    else if (parts[0] === "tietoja") renderAbout();
    else renderIndex();
  } catch (err) {
    ok = false;
    console.warn("route failed", err);
    fill(
      app,
      h("h1", {}, "Something went wrong"),
      h("p", { id: "route-error" }, "This page could not be shown. Saved data in this browser may be damaged."),
      h("p", {}, h("a", { href: "#/tietoja" }, "Open About and use “Reset all results”"), " or ", h("a", { href: "#/" }, "go to the start"), "."),
    );
  }
  document.documentElement.dataset.route = location.hash || "#/";
  announceRoute();
  return ok;
}

/** Tell screen readers about the new page and move focus to its heading (CR-14). */
function announceRoute() {
  const status = document.getElementById("route-status");
  if (status) status.textContent = document.title;
  const heading = app.querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

/** Fetch JSON, bypassing stale caches, and say exactly what came back when it is not JSON. */
async function fetchJson(path) {
  let res;
  try {
    res = await fetch(new URL(path, document.baseURI).href, { cache: "no-cache" });
  } catch (err) {
    throw new Error(`${path}: network error (${err.message})`);
  }
  const type = res.headers.get("content-type") || "unknown type";
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}, ${type}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path}: HTTP ${res.status}, ${type} (not valid JSON)`);
  }
}

function validTheme(t) {
  return isPlainObject(t) && typeof t.id === "string" && isPlainObject(t.exercises) && KINDS.every((k) => isPlainObject(t.exercises[k]));
}

async function boot() {
  askPersist();
  window.addEventListener("pagehide", abortListening);
  try {
    const manifest = await fetchJson("data/manifest.json");
    if (!Array.isArray(manifest?.themes)) throw new Error("data/manifest.json: no list of themes");
    // One missing or broken theme file must not take the whole site down (B-03): load what can be loaded.
    const results = await Promise.allSettled(
      manifest.themes.map(async (f) => {
        const theme = await fetchJson(`data/${f}`);
        if (!validTheme(theme)) throw new Error(`data/${f}: not a valid theme file`);
        return theme;
      }),
    );
    themes = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    skippedFiles = results.filter((r) => r.status === "rejected").map((r) => r.reason?.message || "unknown error");
    knownIds = manifest.themes.map((f) => String(f).replace(/^themes\//, "").replace(/\.json$/, ""));
    if (skippedFiles.length) console.warn("skipped theme files", skippedFiles);
    if (!themes.length) throw new Error(skippedFiles[0] || "data/manifest.json: no themes");
  } catch (err) {
    fill(
      app,
      h("h1", {}, "The exercises could not be loaded"),
      h("p", { id: "load-error" }, err.message),
      h("p", {}, "Reload the page (Ctrl+Shift+R or Cmd+Shift+R). If the error stays, open the address above directly: a warning or sign-in page means a network filter (for example at work) may be blocking JSON files."),
    );
    document.documentElement.dataset.ready = "error";
    return;
  }
  window.addEventListener("hashchange", route);
  document.documentElement.dataset.ready = route() ? "1" : "error";
}

boot();
