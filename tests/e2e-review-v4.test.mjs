// FROZEN — DO NOT MODIFY (plan T-068…T-080; amendment D-019 after S-REVIEW and S-ADVERSARIAL)
// Browser tests for the review fixes: double taps on the sticky bar, damaged storage, a missing theme file,
// recognition release, speech failures, route names, speaking attempts, import limits, backup reminder,
// late voices, CSP violations, About wording and drafts.
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
const T = themes[0];

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
      this.onresult && this.onresult({ results: [[{ transcript: say, confidence: 0.9 }]] });
      this.onend && this.onend();
    }, 5); }
    stop() {}
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
`;
// A recogniser that never answers; it records how it was released.
const STUCK_RECOGNITION = `
  window.__recs = [];
  class Stuck { constructor() { this.stops = 0; this.aborts = 0; window.__recs.push(this); } start() {} stop() { this.stops += 1; } abort() { this.aborts += 1; } }
  window.SpeechRecognition = Stuck; window.webkitSpeechRecognition = Stuck;
`;
const ERROR_RECOGNITION = `
  class Err { start() { setTimeout(() => { this.onerror && this.onerror({ error: window.__err }); this.onend && this.onend(); }, 5); } stop() {} }
  window.SpeechRecognition = Err; window.webkitSpeechRecognition = Err;
`;

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

async function newPage(init = SPEECH_MOCK, options = {}) {
  const context = await browser.newContext(options);
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

const store = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), STORE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("T-068 a double tap on Check, and on Try again, never triggers the other button", async () => {
  const { page, errors, context } = await newPage(SPEECH_MOCK, { viewport: { width: 412, height: 800 } });
  await open(page, `/harjoitus/${T.id}/luku`);
  await page.locator("#app .q").first().locator("label.option[data-correct='1']").click();
  await page.dblclick("#check");
  await sleep(1000);
  assert.equal(await page.locator("#score").count(), 1, "the score is still on screen: the second tap did not hit Try again");
  assert.equal(await page.locator("#app .q .feedback").count(), 10, "feedback is still shown for every item");
  let s = (await store(page)).scores[`${T.id}-luku`];
  assert.equal(s.attempts, 1);
  assert.equal(s.last, 1);
  await page.dblclick("#retry");
  await sleep(1000);
  s = (await store(page)).scores[`${T.id}-luku`];
  assert.equal(s.attempts, 1, "the second tap did not press Check on the fresh exercise");
  assert.equal(s.last, 1, "no empty 0 was recorded");
  assert.equal(s.history.length, 1);
  assert.equal(await page.locator("#score").count(), 0, "the new exercise is untouched");
  assert.equal(await page.locator("#app .q .feedback").count(), 0);
  assert.ok(await page.locator("#check").isEnabled(), "Check works again after the pause");
  assert.deepEqual(errors, []);
  await context.close();
});

test("T-069 damaged saved scores never stop the app from showing", async () => {
  const id = `${T.id}-luku`;
  const cases = [
    { [id]: { best: "7", last: 3, attempts: 1, history: [] } },
    { [id]: { best: null } },
    { [id]: { best: 5 } },
    { [id]: "x" },
    { [id]: {} },
    { [id]: { best: -5, last: 99, attempts: "y", history: "z" } },
    { [id]: { best: 3, last: null, attempts: 1, history: [null, 1, "a", { score: "q", at: 5 }] } },
  ];
  for (const scores of cases) {
    const { page, errors, context } = await newPage(SPEECH_MOCK);
    await context.addInitScript((v) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("seeded", "1"); localStorage.setItem("suomi-harjoitukset:v1", v); } }, JSON.stringify({ version: 1, scores, drafts: {} }));
    const label = JSON.stringify(scores);
    await page.goto(srv.url);
    await page.waitForSelector("html[data-ready='1']", { timeout: 5000 });
    assert.equal(await page.locator(`a[data-ex='${id}']`).count(), 1, `index renders for ${label}`);
    const text = await page.locator(`a[data-ex='${id}']`).textContent();
    assert.ok(!/NaN|undefined|null/.test(text), `badge text for ${label}: ${text}`);
    await open(page, `/harjoitus/${T.id}/luku`);
    assert.equal(await page.locator("#check").count(), 1, `exercise renders for ${label}`);
    assert.ok(!/NaN|undefined|null/.test(await page.locator("#result").textContent()));
    await open(page, "/tietoja");
    assert.equal(await page.locator("h1").textContent(), "About");
    assert.deepEqual(errors, [], label);
    await context.close();
  }
});

test("T-070 one missing theme file is skipped and reported; the other themes still work", async () => {
  const missing = manifest.themes[2];
  const { page, errors, context } = await newPage();
  await page.route(`**/data/${missing}`, (r) => r.fulfill({ status: 404, contentType: "text/html", body: "<!DOCTYPE html><html>Not found</html>" }));
  await page.goto(srv.url);
  await page.waitForSelector("html[data-ready='1']");
  assert.equal(await page.locator(".theme-card").count(), themes.length - 1);
  const warning = await page.locator("#theme-warning").textContent();
  assert.ok(warning.includes(missing) && /HTTP 404/.test(warning), warning);
  assert.equal(await page.locator(`a[data-ex='${themes[2].id}-luku']`).count(), 0);
  assert.equal(await page.locator(`a[data-ex='${themes[0].id}-luku']`).count(), 1);
  await open(page, `/harjoitus/${themes[0].id}/luku`);
  assert.equal(await page.locator("#check").count(), 1);
  assert.deepEqual(errors.filter((e) => !/404/.test(e)), []);
  await context.close();
  // When no theme can be loaded the site reports the error as before.
  const all = await newPage();
  await all.page.route("**/data/themes/*.json", (r) => r.fulfill({ status: 500, contentType: "text/plain", body: "boom" }));
  await all.page.goto(srv.url);
  await all.page.waitForSelector("html[data-ready='error']");
  assert.match(await all.page.locator("#load-error").textContent(), /HTTP 500/);
  await all.context.close();
});

test("T-071 recognition is released when the learner leaves, presses Check or retries, and late results are ignored", async () => {
  const { page, context } = await newPage(SPEECH_MOCK + STUCK_RECOGNITION);
  await open(page, `/harjoitus/${T.id}/puhe`);
  await page.locator("#app .q").first().locator("button.rec").click();
  await page.waitForFunction(() => window.__recs.length === 1);
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForFunction(() => document.documentElement.dataset.route === "#/");
  const released = await page.evaluate(() => window.__recs[0].aborts + window.__recs[0].stops);
  assert.ok(released >= 1, "navigating away releases the recogniser");
  // Check while listening
  await open(page, `/harjoitus/${T.id}/puhe`);
  const q = page.locator("#app .q").first();
  await q.locator("button.rec").click();
  await page.waitForFunction(() => window.__recs.length === 2);
  await page.click("#check");
  await page.waitForSelector("#score");
  assert.ok(await page.evaluate(() => window.__recs[1].aborts + window.__recs[1].stops) >= 1, "Check releases the recogniser");
  await page.evaluate(() => window.__recs[1].onresult && window.__recs[1].onresult({ results: [[{ transcript: "myöhästynyt tulos" }]] }));
  await sleep(100);
  assert.ok(!/myöhästynyt|I heard:/.test(await q.locator(".transcript").textContent()), "a late result does not change the page");
  await page.click("#retry");
  assert.equal(await page.locator("#score").count(), 0);
  assert.equal(await page.evaluate(() => window.__recs.length), 2, "retry does not start another recording");
  await context.close();
});

test("T-072 audio failures are shown to the learner instead of failing silently", async () => {
  // speak() throws
  let c = await newPage(SPEECH_MOCK + `window.speechSynthesis.speak = () => { throw new Error("boom"); };`);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.click("#play");
  await c.page.locator(".speech-problem").waitFor();
  assert.match(await c.page.locator(".speech-problem").textContent(), /could not play the audio/);
  assert.deepEqual(c.errors, []);
  await c.context.close();
  // no speech synthesis at all: the dictation and speaking buttons say so too
  c = await newPage(SPEECH_MOCK + `delete window.speechSynthesis;`);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.click("#play");
  assert.match(await c.page.locator(".speech-problem").first().textContent(), /no speech synthesis/);
  await c.page.locator("#app .q[data-type='dictation'] button", { hasText: "Listen" }).first().click();
  assert.equal(await c.page.locator("#app .q[data-type='dictation'] .speech-problem").count(), 1);
  await open(c.page, `/harjoitus/${T.id}/puhe`);
  await c.page.locator("#app .q").first().locator("button", { hasText: "Hear the model" }).click();
  assert.match(await c.page.locator("#app .q .speech-problem").first().textContent(), /no speech synthesis/);
  assert.deepEqual(c.errors, []);
  await c.context.close();
  // the engine reports an error after speak(); 'interrupted' is not an error
  c = await newPage(SPEECH_MOCK + `window.speechSynthesis.speak = (u) => setTimeout(() => u.onerror && u.onerror({ error: window.__why }), 0);`);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.evaluate(() => (window.__why = "interrupted"));
  await c.page.click("#play");
  await sleep(100);
  assert.equal(await c.page.locator(".speech-problem").count(), 0, "interrupted is how cancel() ends an utterance");
  await c.page.evaluate(() => (window.__why = "synthesis-failed"));
  await c.page.click("#play");
  await c.page.locator(".speech-problem[data-problem='synthesis-failed']").waitFor();
  await c.context.close();
});

test("T-073 prototype names and unknown kinds in the address give the 'does not exist' page", async () => {
  const { page, errors, context } = await newPage();
  for (const kind of ["__proto__", "constructor", "toString", "hasOwnProperty", "nonsense"]) {
    await open(page, `/harjoitus/${T.id}/${kind}`);
    assert.equal(await page.locator("h1").textContent(), "That exercise does not exist", kind);
  }
  await open(page, `/harjoitus/__proto__/luku`);
  assert.equal(await page.locator("h1").textContent(), "That exercise does not exist");
  assert.deepEqual(errors, []);
  await context.close();
});

test("T-074 speaking: three attempts, a fourth is ignored, Try again restores them; 'no speech' counts, a blocked microphone falls back", async () => {
  let c = await newPage(SPEECH_MOCK);
  await open(c.page, `/harjoitus/${T.id}/puhe`);
  const q = c.page.locator("#app .q").first();
  await c.page.evaluate(() => (window.__say = "banaani"));
  for (let i = 1; i <= 3; i += 1) {
    await q.locator("button.rec").click();
    await q.locator(`.transcript:has-text("attempt ${i}/3")`).waitFor();
  }
  assert.ok(await q.locator("button.rec").isDisabled(), "disabled after three attempts");
  await q.locator("button.rec").dispatchEvent("click");
  await sleep(100);
  assert.match(await q.locator(".transcript").textContent(), /attempt 3\/3/, "a fourth tap is ignored");
  await c.page.click("#check");
  await c.page.waitForSelector("#score");
  await c.page.click("#retry");
  assert.ok(await c.page.locator("#app .q").first().locator("button.rec").isEnabled(), "Try again restores the attempts");
  await c.context.close();

  c = await newPage(ERROR_RECOGNITION);
  await open(c.page, `/harjoitus/${T.id}/puhe`);
  const q2 = c.page.locator("#app .q").first();
  await c.page.evaluate(() => (window.__err = "no-speech"));
  for (let i = 1; i <= 3; i += 1) {
    await q2.locator("button.rec").click();
    await q2.locator(`.transcript:has-text("attempt ${i}/3")`).waitFor();
  }
  assert.match(await q2.locator(".transcript").textContent(), /heard nothing/);
  assert.ok(await q2.locator(".selfscore").isHidden(), "staying quiet does not open self-assessment");
  assert.ok(await q2.locator("button.rec").isDisabled(), "silent attempts count towards the three");
  await c.page.reload();
  await c.page.waitForSelector("html[data-ready='1']");
  await c.page.evaluate(() => (window.__err = "not-allowed"));
  const q3 = c.page.locator("#app .q").first();
  await q3.locator("button.rec").click();
  await q3.locator(".selfscore").waitFor({ state: "visible" });
  assert.match(await q3.locator(".transcript").textContent(), /microphone/);
  await c.context.close();
});

test("T-075 import keeps its limits: 1 MB, known exercises, ISO times, ranges, history length, empty files", async () => {
  const { page, context } = await newPage();
  await open(page, "/tietoja");
  const id = `${T.id}-luku`;
  const imp = async (obj, name = "x.json") => {
    const buffer = Buffer.isBuffer(obj) ? obj : Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj));
    await page.locator("input#import").setInputFiles({ name, mimeType: "application/json", buffer });
    await page.waitForFunction(() => document.querySelector("#import-status")?.dataset.ok !== undefined);
    const ok = await page.locator("#import-status").getAttribute("data-ok");
    const text = await page.locator("#import-status").textContent();
    await page.evaluate(() => delete document.querySelector("#import-status").dataset.ok);
    return { ok, text };
  };
  const big = await imp(Buffer.alloc(1100 * 1024, "a"));
  assert.equal(big.ok, "0");
  assert.match(big.text, /1 MB/);
  const history = Array.from({ length: 250 }, (_, i) => ({ score: 5, at: `2026-10-${String((i % 28) + 1).padStart(2, "0")}T10:${String(Math.floor(i / 28)).padStart(2, "0")}:00Z` }));
  const entry = (extra = {}) => ({ best: 5, last: 5, attempts: 2, history: [], ...extra });
  const r = await imp({
    version: 1,
    scores: {
      [id]: entry({ best: 2, last: 9, history }),
      [`${T.id}-kuuntelu`]: entry({ attempts: 100001 }),
      [`${T.id}-kirjoitus`]: entry({ best: 10.5 }),
      [`${T.id}-puhe`]: entry({ history: [{ score: 5, at: "zzzz" }, { score: 6, at: "2026-10-01T10:00:00Z" }] }),
      "madeup-theme-20261107-luku": entry(),
    },
  });
  assert.equal(r.ok, "1");
  const s = (await store(page)).scores;
  assert.equal(s[id].best, 9, "best is never lower than last");
  assert.ok(s[id].history.length <= 20, "history is capped at 20");
  assert.equal(s[`${T.id}-kuuntelu`], undefined, "attempts above 100000");
  assert.equal(s[`${T.id}-kirjoitus`], undefined, "scores above 10");
  assert.deepEqual(s[`${T.id}-puhe`].history, [{ score: 6, at: "2026-10-01T10:00:00Z" }], "a history time that is not an ISO date is dropped");
  assert.equal(s["madeup-theme-20261107-luku"], undefined, "exercises that do not exist are not imported");
  assert.equal(await page.locator("#saved-count").textContent(), String(Object.keys(s).length), "the count on the page is refreshed");
  const before = JSON.stringify(await store(page));
  const none = await imp({ version: 1, scores: { "madeup-theme-20261107-luku": entry(), "bad key": entry() } });
  assert.equal(none.ok, "0", "a file without a single usable entry is not a success");
  assert.equal(JSON.stringify(await store(page)), before);
  assert.equal((await imp("not json")).ok, "0");
  assert.equal((await imp({ version: 2, scores: {} })).ok, "0");
  await context.close();
});

test("T-076 the 'Back up your scores' reminder appears only for scores older than a week without a recent export", async () => {
  const id = `${T.id}-luku`;
  const old = { version: 1, scores: { [id]: { best: 5, last: 5, attempts: 1, history: [{ score: 5, at: "2020-01-01T10:00:00Z" }] } }, drafts: {} };
  const seed = async (value) => {
    const c = await newPage();
    await c.context.addInitScript((v) => { if (v && !localStorage.getItem("seeded")) { localStorage.setItem("seeded", "1"); localStorage.setItem("suomi-harjoitukset:v1", v); } }, value && JSON.stringify(value));
    await c.page.goto(srv.url);
    await c.page.waitForSelector("html[data-ready='1']");
    return c;
  };
  let c = await seed(old);
  assert.equal(await c.page.locator(".backup-reminder a[href='#/tietoja']").count(), 1);
  await c.context.close();
  c = await seed({ ...old, lastExport: new Date().toISOString() });
  assert.equal(await c.page.locator(".backup-reminder").count(), 0, "a fresh export silences it");
  await c.context.close();
  c = await seed(null);
  assert.equal(await c.page.locator(".backup-reminder").count(), 0, "nothing saved, nothing to back up");
  await c.context.close();
});

test("T-077 voices that arrive late are picked up, and a missing speech engine is reported on the listening page", async () => {
  const late = `window.__vc = []; window.__voices = [];
    const s = window.speechSynthesis; s.addEventListener = (n, f) => { if (n === "voiceschanged") window.__vc.push(f); };`;
  let c = await newPage(SPEECH_MOCK + late);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.evaluate(() => { window.__voices = [{ name: "Satu", lang: "fi_FI" }]; window.__vc.forEach((f) => f()); });
  await c.page.waitForSelector("#voice-status[data-voice='fi']", { timeout: 1500 });
  await c.context.close();
  // after the 2 s wait has given up, a later voiceschanged still corrects the notice
  c = await newPage(SPEECH_MOCK + late);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.waitForSelector("#voice-status[data-voice='none']", { timeout: 4000 });
  await c.page.evaluate(() => { window.__voices = [{ name: "Satu", lang: "fi_FI" }]; window.__vc.forEach((f) => f()); });
  await c.page.waitForSelector("#voice-status[data-voice='fi']", { timeout: 1500 });
  await c.context.close();
  c = await newPage(SPEECH_MOCK + `delete window.speechSynthesis;`);
  await open(c.page, `/harjoitus/${T.id}/kuuntelu`);
  await c.page.waitForSelector("#voice-status[data-voice='none']");
  assert.match(await c.page.locator("#voice-status").textContent(), /no speech synthesis/i);
  await c.context.close();
});

test("T-078 no page type logs a console error or a CSP violation", async () => {
  const { page, errors, context } = await newPage(SPEECH_MOCK + `window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));`);
  const hashes = ["/", "/tietoja", ...KINDS.map((k) => `/harjoitus/${T.id}/${k}`)];
  for (const h of hashes) {
    await open(page, h);
    await page.click("h1");
    assert.deepEqual(await page.evaluate(() => window.__csp), [], `CSP violations on ${h}`);
  }
  assert.deepEqual(errors, []);
  assert.match(await page.locator("meta[http-equiv='Content-Security-Policy']").getAttribute("content"), /default-src 'self'/);
  await context.close();
});

test("T-079 About says how labels were checked, and screen readers get a route announcement without a live main", async () => {
  const { page, context } = await newPage();
  await open(page, "/tietoja");
  const about = await page.locator("#app").textContent();
  assert.ok(!/Labels follow Kielitoimiston sanakirja/.test(about), "no claim that the dictionary was followed");
  assert.match(about, /could not be consulted/);
  assert.match(about, /two independent/);
  assert.equal(await page.locator("main[aria-live]").count(), 0);
  assert.equal(await page.locator("#route-status[role='status']").count(), 1);
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForFunction(() => document.documentElement.dataset.route === "#/");
  assert.match(await page.locator("#route-status").textContent(), /Suomea uutisista/);
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1", "focus moves to the page heading");
  await context.close();
});

test("T-080 a draft that cannot be stored says so", async () => {
  const kirjoitus = themes[0].exercises.kirjoitus;
  assert.ok(kirjoitus.free);
  const { page, context } = await newPage(SPEECH_MOCK + `Storage.prototype.setItem = function () { throw new Error("QuotaExceededError"); };`);
  await open(page, `/harjoitus/${T.id}/kirjoitus`);
  await page.locator("textarea[aria-label='Free writing']").fill("Tämä on luonnos.");
  await page.locator("#draft-error", { hasText: "not saved" }).waitFor();
  assert.equal(await page.locator("textarea[aria-label='Free writing']").getAttribute("maxlength"), "10000");
  await context.close();
});
