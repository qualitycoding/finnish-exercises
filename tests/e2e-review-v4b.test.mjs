// FROZEN — DO NOT MODIFY (plan T-089; amendment D-019 after S-ADVERSARIAL B-05)
// A theme file that is valid JSON but broken inside must not leave the page on "Loading…".
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serve } from "./server.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "data/manifest.json"), "utf8"));
const file = manifest.themes[0];
const theme = JSON.parse(readFileSync(join(root, "data", file), "utf8"));

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

async function brokenPage(mutate) {
  const broken = JSON.parse(JSON.stringify(theme));
  mutate(broken);
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(`**/data/${file}`, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(broken) }));
  return { context, page, errors };
}

test("T-089 a theme with a broken exercise shows an error panel with a way out, and the other pages still work", async () => {
  // questions missing: the index renders, the broken exercise gets the panel
  let c = await brokenPage((t) => delete t.exercises.luku.questions);
  await c.page.goto(`${srv.url}#/`);
  await c.page.waitForSelector("html[data-ready='1']");
  await c.page.goto(`${srv.url}#/harjoitus/${theme.id}/luku`);
  await c.page.reload();
  await c.page.waitForSelector("html[data-ready='error']");
  assert.match(await c.page.locator("#route-error").textContent(), /could not be shown/);
  await c.page.locator("a[href='#/']").first().click();
  await c.page.waitForFunction(() => document.documentElement.dataset.route === "#/");
  assert.ok((await c.page.locator(".theme-card").count()) >= 1, "the index works after the panel");
  await c.context.close();
  // an unknown item type inside the exercise
  c = await brokenPage((t) => { t.exercises.kuuntelu.questions[0].type = "nonsense"; });
  await c.page.goto(`${srv.url}#/`);
  await c.page.waitForSelector("html[data-ready='1']");
  await c.page.evaluate((h) => (location.hash = h), `#/harjoitus/${theme.id}/kuuntelu`);
  await c.page.waitForSelector("#route-error");
  assert.equal(await c.page.locator("h1").textContent(), "Something went wrong");
  assert.deepEqual(c.errors, [], "the error is handled, not thrown");
  await c.context.close();
});
