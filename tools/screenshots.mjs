// Phone-sized screenshots of the start page, a reading page with an open slang gloss, a writing page and a speaking page.
// Usage: node tools/screenshots.mjs   (writes docs/screenshots/*.png)
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";
import { serve } from "../tests/server.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs", "screenshots");
await mkdir(out, { recursive: true });

const manifest = JSON.parse(await readFile(join(root, "data", "manifest.json"), "utf8"));
const firstId = manifest.themes[0].replace(/^themes\//, "").replace(/\.json$/, "");

const { server, url } = await serve(root);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await context.newPage();
  const open = async (hash) => {
    await page.goto(`${url}${hash}`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true" || document.documentElement.dataset.ready === "1" || document.documentElement.dataset.route);
    await page.waitForFunction((h) => document.documentElement.dataset.route === h, hash.replace(/^[^#]*/, ""));
  };

  await open("#/");
  await page.screenshot({ path: join(out, "index.png"), fullPage: true });

  await open(`#/harjoitus/${firstId}/luku`);
  await page.locator(".term:has(.tag.slangi)").first().click();
  await page.screenshot({ path: join(out, "reading-slang.png"), fullPage: true });

  await open(`#/harjoitus/${firstId}/kirjoitus`);
  await page.screenshot({ path: join(out, "writing.png"), fullPage: true });

  await open(`#/harjoitus/${firstId}/puhe`);
  await page.screenshot({ path: join(out, "speaking.png"), fullPage: true });
} finally {
  await browser.close();
  server.close();
}
console.log("screenshots written to docs/screenshots");
