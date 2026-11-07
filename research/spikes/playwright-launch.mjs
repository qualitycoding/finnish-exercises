import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent("<p>hei</p>"); console.log("ok", await p.textContent("p"), b.version()); await b.close();
