// FROZEN — DO NOT MODIFY (plan T-048…T-050, T-059; amendment D-017 after pre-mortem round 1)
// End-to-end tests in headless Chromium: every exercise reaches 10/10 with correct answers,
// wrong answers score low, scores persist across reloads, retry works, and navigation clicks through.
// Run: node --test tests/*.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serve } from "./server.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "data/manifest.json"), "utf8"));
const themes = manifest.themes.map((f) => JSON.parse(readFileSync(join(root, "data", f), "utf8")));
const KINDS = ["luku", "kuuntelu", "kirjoitus", "puhe"];
const STORE_KEY = "suomi-harjoitukset:v1";

// Fake Web Speech API: synthesis is a no-op; recognition "hears" whatever window.__say holds.
const SPEECH_MOCK = `
  window.__spoken = [];
  class FakeUtterance { constructor(t){ this.text = t; } }
  window.SpeechSynthesisUtterance = FakeUtterance;
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    getVoices: () => window.__voices || [{ name: "Testiääni", lang: "fi-FI" }],
    speak: (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 0); },
    cancel: () => {}, addEventListener: () => {},
  }});
  class FakeRecognition {
    start() { setTimeout(() => {
      const say = window.__say || "";
      const alt = [{ transcript: say, confidence: 0.9 }];
      this.onresult && this.onresult({ results: [alt] });
      this.onend && this.onend();
    }, 5); }
    stop() {}
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
`;
const NO_RECOGNITION = `delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
  Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true });
  Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true });`;

let browser;
let srv;
before(async () => {
  srv = await serve(root);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  srv?.server.close();
});

async function newPage(init = SPEECH_MOCK) {
  const context = await browser.newContext();
  await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { context, page, errors };
}

async function open(page, hash) {
  await page.goto(`${srv.url}#${hash}`);
  await page.waitForSelector("html[data-ready='1']");
}

/** Answer every item of the current exercise correctly (or deliberately wrong). */
async function answerAll(page, ex, kind, { wrong = false } = {}) {
  const items = kind === "kirjoitus" || kind === "puhe" ? ex.tasks : ex.questions;
  const qs = page.locator("#app .q");
  assert.equal(await qs.count(), items.length, "rendered item count");
  for (let i = 0; i < items.length; i += 1) {
    const q = items[i];
    const el = qs.nth(i);
    switch (q.type) {
      case "mc":
      case "tf":
        await el.locator(`label.option[data-correct='${wrong ? "0" : "1"}']`).first().click();
        break;
      case "gap":
        await el.locator("input").fill(wrong ? "xyz" : q.accept[0]);
        break;
      case "dictation":
        await el.locator("input").fill(wrong ? "aivan väärä lause tässä" : q.text);
        break;
      case "translate":
        await el.locator("textarea").fill(wrong ? "en tiedä" : q.model);
        break;
      case "order": {
        const words = q.accept[0].replace(/[.!?]$/, "").split(" ");
        const seq = wrong ? words.slice().reverse() : words;
        for (const w of seq) await el.locator(".chips:not(.built) .chip:not([disabled])", { hasText: w }).filter({ hasText: new RegExp(`^${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click();
        break;
      }
      case "read":
      case "respond": {
        const say = wrong ? "banaani" : q.type === "read" ? q.text.replace(/\[\[([^|\]]+)\|[^\]]*\]\]/g, "$1") : q.model;
        await page.evaluate((s) => (window.__say = s), say);
        await el.locator("button.rec").click();
        await el.locator(".transcript[data-heard]").waitFor();
        break;
      }
      default:
        throw new Error(q.type);
    }
  }
  await page.click("#check");
  return Number(await page.locator("#score").getAttribute("data-score"));
}


test("T-048 importing an older export merges per exercise, keeps the better score and ignores hostile or invalid entries", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  const kx = `${t.id}-luku`;
  const ky = `${t.id}-kuuntelu`;
  await open(page, "/tietoja");
  await page.evaluate(([k, kx]) => localStorage.setItem(k, JSON.stringify({ version: 1, scores: { [kx]: { best: 10, last: 10, attempts: 3, history: [{ score: 10, at: "2026-11-07T10:00:00Z" }] } }, drafts: {} })), [STORE_KEY, kx]);
  const file = `{"version":1,"scores":{"${kx}":{"best":5,"last":5,"attempts":1,"history":[{"score":5,"at":"2026-11-01T10:00:00Z"}]},"${ky}":{"best":8,"last":8,"attempts":1,"history":[]},"__proto__":{"polluted":true},"evil-20261107-luku":{"best":"abc","last":99,"attempts":1,"history":[]},"not a key":{"best":3,"last":3,"attempts":1,"history":[]}},"drafts":{}}`;
  await page.locator("input#import").setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from(file) });
  await page.waitForSelector("#import-status[data-ok='1']");
  const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
  assert.equal(s.scores[kx].best, 10, "the better local score is kept");
  assert.ok(s.scores[kx].attempts >= 3);
  assert.equal(s.scores[ky].best, 8, "a new exercise is added");
  assert.equal(s.scores["evil-20261107-luku"], undefined, "invalid scores are dropped");
  assert.equal(s.scores["not a key"], undefined, "keys must look like <themeId>-<kind>");
  assert.equal(await page.evaluate(() => ({}).polluted), undefined, "no prototype pollution");
  await context.close();
});

test("T-049 Play is never disabled: with no Finnish voice it still speaks with lang fi-FI", async () => {
  const { page, context } = await newPage(SPEECH_MOCK + `window.__voices = [];
    const sp = window.speechSynthesis.speak; window.speechSynthesis.speak = (u) => { window.__langs = (window.__langs || []).concat(u.lang); sp(u); };`);
  await open(page, `/harjoitus/${themes[0].id}/kuuntelu`);
  await page.waitForSelector("#voice-status[data-voice='none']");
  assert.ok(await page.locator("#play").isEnabled());
  await page.click("#play");
  const langs = await page.evaluate(() => window.__langs || []);
  assert.ok(langs.length > 0 && langs.every((l) => l === "fi-FI"), JSON.stringify(langs));
  await context.close();
});

test("T-050 the '(keksitty esimerkki)' marker is shown but never spoken", async () => {
  const { page, context } = await newPage();
  await open(page, `/harjoitus/${themes[0].id}/kuuntelu`);
  await page.click("#play");
  const spoken = await page.evaluate(() => window.__spoken.join(" "));
  assert.ok(!/keksitty esimerkki/i.test(spoken), spoken.slice(0, 200));
  await context.close();
});

test("T-059 the About page offers export and asks the browser to keep storage", async () => {
  const { page, context } = await newPage(SPEECH_MOCK + `window.__persistAsked = false;
    Object.defineProperty(navigator, "storage", { configurable: true, value: { persist: async () => { window.__persistAsked = true; return true; }, persisted: async () => false } });`);
  await open(page, "/tietoja");
  assert.equal(await page.locator("#export").count(), 1);
  await page.waitForFunction(() => window.__persistAsked === true);
  await context.close();
});
