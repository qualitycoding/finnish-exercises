// Planning spike (R6): shows the frozen validator tests T-010..T-024 are satisfiable.
// S-004 may start from this file (copy to tools/validate.mjs and fix the import path).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkup, scoreKeywords, scoreOrder, scoreTyped, plain } from "./scoring.js";

export const GENERIC_SENTENCES = [
  "En tiedä.",
  "Se on totta.",
  "Tämä on hyvä kysymys.",
  "Minä asun Suomessa ja puhun vähän suomea.",
  "Kiitos, hyvää päivää!",
  "Ei kiitos, minulla on kiire.",
];
const LABELS = new Set(["", "slangi", "puhekieli", "idiomi"]);
const KINDS = ["luku", "kuuntelu", "kirjoitus", "puhe"];
const MIX = {
  luku: (c) => c.mc + c.tf === 10 && Object.keys(c).every((k) => k === "mc" || k === "tf"),
  kuuntelu: (c) => c.dictation === 2 && (c.mc || 0) + (c.tf || 0) === 8 && Object.keys(c).every((k) => ["mc", "tf", "dictation"].includes(k)),
  kirjoitus: (c) => c.gap === 4 && c.order === 3 && c.translate === 3 && Object.keys(c).length === 3,
  puhe: (c) => c.read === 6 && c.respond === 4 && Object.keys(c).length === 2,
};
const INVENTED = "(keksitty esimerkki)";
const countWords = (texts) => plain(texts.join(" ")).split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;

export function validateTheme(theme, file = "theme") {
  const problems = [];
  const fail = (rule, where, msg) => problems.push(`${where}: [${rule}] ${msg}`);
  const markup = (where, text) => {
    if (typeof text !== "string") {
      fail("V4", where, "text is not a string");
      return [];
    }
    const opens = (text.match(/\[\[/g) || []).length;
    const closes = (text.match(/\]\]/g) || []).length;
    const terms = parseMarkup(text).filter((p) => p.type === "term");
    if (opens !== closes || opens !== terms.length) fail("V4", where, `malformed [[…]] markup (${opens} open, ${closes} close, ${terms.length} parsed)`);
    for (const t of terms) {
      if (!LABELS.has(t.label)) fail("V4", where, `unknown label '${t.label}' on '${t.text}'`);
      if (!t.gloss.includes(" · ")) fail("V4", where, `gloss of '${t.text}' lacks ' · ' before the English`);
    }
    return terms;
  };

  for (const f of ["id", "title", "short", "dateLabel", "level", "summary", "sources", "exercises"]) if (!(f in theme)) fail("V1", file, `missing field ${f}`);
  if (typeof theme.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*-\d{8}$/.test(theme.id)) fail("V1", file, `id '${theme.id}' is not <ascii-slug>-<yyyymmdd>`);

  const srcs = Array.isArray(theme.sources) ? theme.sources : [];
  const hosts = new Set();
  for (const s of srcs) {
    if (!/^https:\/\//.test(s?.url || "")) fail("V2", file, `source url not https: ${s?.url}`);
    else hosts.add(new URL(s.url).hostname.replace(/^www\./, ""));
  }
  if (hosts.size < 2) fail("V2", file, `needs sources from at least two distinct hosts (found ${hosts.size})`);

  for (const kind of KINDS) {
    const ex = theme.exercises?.[kind];
    const where = `${file}#${kind}`;
    if (!ex) {
      fail("V3", where, "missing exercise");
      continue;
    }
    if (!ex.title) fail("V1", where, "missing title");
    const items = kind === "kirjoitus" || kind === "puhe" ? ex.tasks : ex.questions;
    if (!Array.isArray(items) || items.length !== 10) fail("V3", where, `expected 10 scored items, found ${items?.length}`);
    const counts = {};
    for (const q of items || []) counts[q.type] = (counts[q.type] || 0) + 1;
    if (!MIX[kind](counts)) fail("V3", where, `item-type mix ${JSON.stringify(counts)} is not the frozen mix`);

    const textTerms = (ex.text || []).flatMap((t, i) => markup(`${where} text[${i}]`, t));
    const dialogueTerms = (ex.dialogue || []).flatMap((t, i) => markup(`${where} dialogue[${i}]`, t));
    (ex.script || []).forEach((t, i) => markup(`${where} script[${i}]`, t));
    (ex.vocab || []).forEach((t, i) => markup(`${where} vocab[${i}]`, t));
    if (kind === "luku") {
      const n = countWords([...(ex.text || []), ...(ex.dialogue || [])]);
      if (n < 200 || n > 450) fail("V5", where, `reading is ${n} words (expected 200–450)`);
      const all = [...textTerms, ...dialogueTerms];
      if (!all.some((t) => t.label === "slangi")) fail("V5", where, "no term labelled slangi");
      if (!all.some((t) => t.label === "puhekieli")) fail("V5", where, "no term labelled puhekieli");
      if (!ex.dialogue?.length || !String(ex.dialogue[0]).startsWith(INVENTED)) fail("V5", where, `dialogue must start with '${INVENTED}'`);
    }
    if (kind === "kuuntelu") {
      const n = countWords([...(ex.script || []), ...(ex.dialogue || [])]);
      if (n < 120 || n > 320) fail("V6", where, `listening is ${n} words (expected 120–320)`);
      if (!dialogueTerms.some((t) => t.label === "puhekieli")) fail("V6", where, "dialogue has no term labelled puhekieli");
      if (!ex.dialogue?.length || !String(ex.dialogue[0]).startsWith(INVENTED)) fail("V6", where, `dialogue must start with '${INVENTED}'`);
    }

    (items || []).forEach((q, i) => {
      const at = `${where} item ${i + 1}`;
      for (const k of ["q", "text", "en"]) if (q[k]) markup(at, q[k]);
      if (q.type === "mc") {
        if (!Array.isArray(q.options) || q.options.length < 3) fail("V7", at, "mc needs ≥3 options");
        else if (new Set(q.options).size !== q.options.length) fail("V7", at, "duplicate mc options");
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) fail("V7", at, "mc answer index out of range");
      }
      if (q.type === "tf" && typeof q.answer !== "boolean") fail("V7", at, "tf answer must be boolean");
      if (q.type === "gap") {
        if (!String(q.q || "").includes("___")) fail("V8", at, "gap question has no ___");
        if (!q.accept?.length) fail("V8", at, "gap needs an accept list");
        else if (scoreTyped(q.accept[0], q.accept).points !== 1) fail("V8", at, "first accepted answer does not score 1");
      }
      if (q.type === "order") {
        if (!q.accept?.length || !q.en) fail("V9", at, "order needs accept and en");
        else {
          if (q.accept.some((a) => a.includes(","))) fail("V9", at, "comma inside a word-order sentence");
          const words = q.accept[0].replace(/[.!?]$/, "").split(" ");
          if (words.length > 8) fail("V9", at, `${words.length} chips (max 8)`);
          if (scoreOrder(words, q.accept).points !== 1) fail("V9", at, "canonical sentence does not rebuild");
          const bag = words.map((w) => w.toLowerCase()).sort().join(" ");
          for (const alt of q.accept.slice(1)) {
            const b = alt.replace(/[.!?]$/, "").split(" ").map((w) => w.toLowerCase()).sort().join(" ");
            if (b !== bag) fail("V9", at, `alternative '${alt}' uses other words than the chips`);
          }
        }
      }
      if (q.type === "translate" || q.type === "respond") {
        if (!q.keywords?.length || !q.model) fail("V10", at, "needs keywords and model");
        else {
          if (q.keywords.some((g) => !g.length || g.some((s) => !String(s).trim()))) fail("V10", at, "empty keyword stem");
          else {
            if (scoreKeywords(q.model, q.keywords).points !== 1) fail("V10", at, `model '${q.model}' does not hit every keyword group`);
            for (const g of GENERIC_SENTENCES) if (scoreKeywords(g, q.keywords).points > 0) fail("V10", at, `generic sentence '${g}' scores above 0: keywords too broad`);
          }
        }
        if (q.type === "respond" && !q.q) fail("V10", at, "respond needs q");
      }
      if ((q.type === "dictation" || q.type === "read") && /\d/.test(String(q.text))) fail("V11", at, "digits in a spoken target");
    });
    if (kind === "kirjoitus") {
      const fr = ex.free;
      if (!fr) fail("V12", where, "missing free writing");
      else {
        for (const f of ["prompt", "words", "checklist", "model"]) if (!fr[f]) fail("V12", where, `free writing missing ${f}`);
        if (fr.prompt) markup(`${where} free`, fr.prompt);
        if (fr.model) markup(`${where} free model`, fr.model);
      }
    }
  }
  return problems;
}

export function validateAll(root) {
  const manifest = JSON.parse(readFileSync(join(root, "data/manifest.json"), "utf8"));
  const problems = [];
  const ids = new Set();
  for (const file of manifest.themes) {
    const theme = JSON.parse(readFileSync(join(root, "data", file), "utf8"));
    if (ids.has(theme.id)) problems.push(`${file}: [V1] duplicate theme id ${theme.id}`);
    ids.add(theme.id);
    if (`themes/${theme.id}.json` !== file) problems.push(`${file}: [V1] file name does not match id ${theme.id}`);
    problems.push(...validateTheme(theme, file));
  }
  return { problems, summary: `${manifest.themes.length} themes, ${manifest.themes.length * 4} exercises` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "..");
  const { problems, summary } = validateAll(root);
  console.log(problems.join("\n") || `all valid: ${summary}`);
  process.exit(problems.length ? 1 : 0);
}
