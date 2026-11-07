// FROZEN — DO NOT MODIFY (plan T-030..T-047; change only through TEST_CHALLENGE.md, see HANDOFF.md)
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

test("T-030 index lists every theme with four exercise links", async () => {
  const { page, errors, context } = await newPage();
  await open(page, "/");
  for (const t of themes) {
    for (const k of KINDS) assert.equal(await page.locator(`a[data-ex='${t.id}-${k}']`).count(), 1, `${t.id}-${k} link`);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

for (const t of themes) {
  for (const kind of KINDS) {
    test(`T-031 ${t.id}/${kind}: correct answers score 10, wrong answers score ≤ 2`, async () => {
      const { page, errors, context } = await newPage();
      await open(page, `/harjoitus/${t.id}/${kind}`);
      assert.equal(await answerAll(page, t.exercises[kind], kind), 10);
      await page.click("#retry");
      assert.equal(await page.locator("#score").count(), 0, "retry clears the score");
      const low = await answerAll(page, t.exercises[kind], kind, { wrong: true });
      assert.ok(low <= 2, `wrong answers scored ${low}`);
      const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
      const s = stored.scores[`${t.id}-${kind}`];
      assert.equal(s.best, 10);
      assert.equal(s.attempts, 2);
      assert.equal(s.last, low);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
}

test("T-032 scores persist across visits and show on the index", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/luku`);
  await answerAll(page, t.exercises.luku, "luku");
  await page.goto(srv.url);
  await page.reload();
  await page.waitForSelector("html[data-ready='1']");
  await page.locator(`a[data-ex='${t.id}-luku'] .badge.done`, { hasText: "10/10" }).waitFor();
  assert.match(await page.locator("#total-best").textContent(), /^10 \//);
  await context.close();
});

test("T-033 next/previous links click through every exercise in order", async () => {
  const { page, context } = await newPage();
  await open(page, `/harjoitus/${themes[0].id}/luku`);
  const order = themes.flatMap((t) => KINDS.map((k) => `#/harjoitus/${t.id}/${k}`));
  for (const hash of order.slice(1)) {
    await page.locator("a[data-nav='next']").first().click();
    await page.waitForFunction((h) => document.documentElement.dataset.route === h, hash);
  }
  const t = themes.at(-1);
  assert.match(page.url(), new RegExp(`#/harjoitus/${t.id}/puhe$`));
  assert.equal(await page.locator("a[data-nav='next']").count(), 0);
  await page.locator("a[data-nav='prev']").first().click();
  await page.waitForFunction((h) => document.documentElement.dataset.route === h, `#/harjoitus/${t.id}/kirjoitus`);
  await context.close();
});

test("T-034 speaking without speech recognition falls back to self-assessment", async () => {
  const { page, context, errors } = await newPage(SPEECH_MOCK + NO_RECOGNITION);
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/puhe`);
  assert.equal(await page.locator("button.rec").count(), 0);
  const qs = page.locator("#app .q");
  for (let i = 0; i < 10; i += 1) await qs.nth(i).locator("input[value='1']").check();
  await page.click("#check");
  assert.equal(await page.locator("#score").getAttribute("data-score"), "10");
  assert.deepEqual(errors, []);
  await context.close();
});

test("T-035 an ä/ö slip earns half a point", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  const gaps = t.exercises.kirjoitus.tasks.map((q, i) => ({ q, i })).filter(({ q }) => q.type === "gap");
  const slip = gaps.find(({ q }) => /[äö]/.test(q.accept[0]));
  assert.ok(slip, "theme has a gap answer with ä/ö");
  await open(page, `/harjoitus/${t.id}/kirjoitus`);
  const folded = slip.q.accept[0].replace(/ä/g, "a").replace(/ö/g, "o");
  await page.locator("#app .q").nth(slip.i).locator("input").fill(folded);
  await page.click("#check");
  assert.equal(await page.locator("#app .q").nth(slip.i).locator(".feedback").getAttribute("data-points"), "0.5");
  await context.close();
});

test("T-036 listening plays the script through speech synthesis", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/kuuntelu`);
  await page.click("#play");
  const spoken = await page.evaluate(() => window.__spoken);
  assert.ok(spoken.length >= t.exercises.kuuntelu.script.length + t.exercises.kuuntelu.dialogue.length, "script split into sentence utterances");
  assert.ok(spoken.every((s) => !s.includes("[[")), "markup is not read aloud");
  await context.close();
});

test("T-037 a data file served as HTML gives a diagnostic naming the URL and status", async () => {
  const { page, context } = await newPage();
  await page.route("**/data/manifest.json", (r) => r.fulfill({ status: 404, contentType: "text/html", body: "<!DOCTYPE html><html>Not found</html>" }));
  await page.goto(srv.url);
  await page.waitForSelector("html[data-ready='error']");
  const msg = await page.locator("#load-error").textContent();
  assert.match(msg, /data\/manifest\.json: HTTP 404, text\/html/);
  await context.close();
});

test("T-038 word explanations close on a second tap, a tap elsewhere and Escape; only one is open", async () => {
  const { page, context } = await newPage();
  await open(page, `/harjoitus/${themes[0].id}/luku`);
  const terms = page.locator("article .term");
  const first = terms.nth(0);
  const second = terms.last();
  const pop = (t) => t.locator(".pop");
  await first.click();
  assert.ok(await pop(first).isVisible(), "opens on tap");
  await first.click();
  assert.ok(!(await pop(first).isVisible()), "second tap closes it although the term keeps focus");
  await first.click();
  await second.click();
  assert.ok(!(await pop(first).isVisible()) && (await pop(second).isVisible()), "only one open");
  await page.locator("h1").click();
  assert.ok(!(await pop(second).isVisible()), "tap elsewhere closes");
  await second.click();
  await page.keyboard.press("Escape");
  assert.ok(!(await pop(second).isVisible()), "Escape closes");
  await context.close();
});

test("T-039 on a touch phone a tapped explanation does not stay open after tapping elsewhere", async () => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 915 } });
  await context.addInitScript(SPEECH_MOCK);
  const page = await context.newPage();
  await open(page, `/harjoitus/${themes[0].id}/luku`);
  const term = page.locator("article .term").first();
  await term.tap();
  assert.ok(await term.locator(".pop").isVisible());
  await page.locator("h1").tap();
  assert.ok(!(await term.locator(".pop").isVisible()));
  await context.close();
});

test("T-040 register labels render as tags and the legend names all four on the index and every exercise", async () => {
  const { page, context } = await newPage();
  await open(page, "/");
  for (const l of ["slangi", "puhekieli", "idiomi", "sana"]) assert.equal(await page.locator(`.legend .tag.${l}`).count(), 1, `index legend ${l}`);
  for (const kind of KINDS) {
    await open(page, `/harjoitus/${themes[0].id}/${kind}`);
    assert.equal(await page.locator(".legend .tag").count(), 4, `legend on ${kind}`);
  }
  await open(page, `/harjoitus/${themes[0].id}/luku`);
  assert.ok((await page.locator("article .term .tag.slangi").count()) >= 1, "a slangi tag is rendered in the text");
  assert.ok((await page.locator("article .term .tag.puhekieli").count()) >= 1, "a puhekieli tag is rendered in the text");
  assert.match(await page.locator("article").textContent(), /keksitty esimerkki/);
  await context.close();
});

test("T-041 the listening page reports when no Finnish voice is installed", async () => {
  const { page, context } = await newPage(SPEECH_MOCK + `window.__voices = [{ name: "English", lang: "en-GB" }];`);
  await open(page, `/harjoitus/${themes[0].id}/kuuntelu`);
  await page.waitForSelector("#voice-status[data-voice='none']");
  await context.close();
  const ok = await newPage();
  await open(ok.page, `/harjoitus/${themes[0].id}/kuuntelu`);
  await ok.page.waitForSelector("#voice-status[data-voice='fi']");
  await ok.context.close();
});

test("T-042 export and import of saved scores round-trips through JSON", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/luku`);
  await answerAll(page, t.exercises.luku, "luku");
  const saved = await page.evaluate((k) => localStorage.getItem(k), STORE_KEY);
  await page.evaluate((k) => localStorage.removeItem(k), STORE_KEY);
  await open(page, "/tietoja");
  await page.locator("input#import").setInputFiles({ name: "scores.json", mimeType: "application/json", buffer: Buffer.from(saved) });
  await page.waitForSelector("#import-status[data-ok='1']");
  const restored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
  assert.equal(restored.scores[`${t.id}-luku`].best, 10);
  await page.locator("input#import").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("not json") });
  await page.waitForSelector("#import-status[data-ok='0']");
  const still = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
  assert.equal(still.scores[`${t.id}-luku`].best, 10, "a bad import leaves scores untouched");
  await context.close();
});

test("T-043 when saving fails the learner is told", async () => {
  const { page, context } = await newPage(SPEECH_MOCK + `Storage.prototype.setItem = function () { throw new Error("QuotaExceededError"); };`);
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/luku`);
  await answerAll(page, t.exercises.luku, "luku");
  await page.waitForSelector("#save-error");
  await context.close();
});

test("T-044 every theme shows its news date and links at least two sources", async () => {
  const { page, context } = await newPage();
  for (const t of themes) {
    await open(page, `/harjoitus/${t.id}/luku`);
    assert.match(await page.locator(".news-date").textContent(), new RegExp(t.dateLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok((await page.locator(".sources a[href^='https://']").count()) >= 2, `${t.id} sources`);
  }
  await context.close();
});

test("T-045 'Continue' on the index jumps to the first exercise below full marks", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/luku`);
  await answerAll(page, t.exercises.luku, "luku");
  await open(page, "/");
  await page.locator("a#continue").click();
  await page.waitForFunction((h) => document.documentElement.dataset.route === h, `#/harjoitus/${t.id}/kuuntelu`);
  await context.close();
});

test("T-046 speech recognition is asked for Finnish (fi-FI) and synthesis speaks Finnish", async () => {
  const init = SPEECH_MOCK + `
    const R = window.SpeechRecognition;
    window.SpeechRecognition = window.webkitSpeechRecognition = class extends R { start() { window.__recLang = this.lang; super.start(); } };
    const speak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = (u) => { window.__synthLang = u.lang; speak(u); };`;
  const { page, context } = await newPage(init);
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/puhe`);
  await page.evaluate(() => (window.__say = "testi"));
  await page.locator("#app .q").first().locator("button.rec").click();
  await page.locator("#app .q").first().locator(".transcript[data-heard]").waitFor();
  assert.equal(await page.evaluate(() => window.__recLang), "fi-FI");
  await open(page, `/harjoitus/${t.id}/kuuntelu`);
  await page.click("#play");
  assert.equal(await page.evaluate(() => window.__synthLang), "fi-FI");
  await context.close();
});

test("T-047 a reshuffled retry still scores 10 with correct answers (options are matched by content, not position)", async () => {
  const { page, context } = await newPage();
  const t = themes[0];
  await open(page, `/harjoitus/${t.id}/luku`);
  assert.equal(await answerAll(page, t.exercises.luku, "luku"), 10);
  await page.click("#retry");
  assert.equal(await answerAll(page, t.exercises.luku, "luku"), 10);
  await context.close();
});
