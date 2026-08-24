/**
 * Reports how much of the wearer's view each screen occludes, in both surface
 * styles. Run it after any visual change — it is the one metric that a
 * see-through display cares about more than a phone ever would.
 *
 *   npm run ink
 */
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({ server: { port: 5197 }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:5197/tests/ink.html");
await page.waitForFunction("window.__done === true", null, { timeout: 60000 });
const { filled, outline } = await page.evaluate("window.__ink");

console.log("screen         filled    outline   change    lit pixels");
for (let i = 0; i < filled.length; i++) {
  const f = filled[i];
  const o = outline[i];
  const change = f.ink === 0 ? 0 : ((o.ink - f.ink) / f.ink) * 100;
  console.log(
    `${f.name.padEnd(13)} ${(f.ink * 100).toFixed(1).padStart(6)}%  ${(o.ink * 100).toFixed(1).padStart(7)}%  ` +
    `${((change > 0 ? "+" : "") + change.toFixed(0)).padStart(6)}%    ` +
    `${(f.lit * 100).toFixed(0)}% → ${(o.lit * 100).toFixed(0)}%`
  );
}
const mean = (rows) => rows.reduce((sum, row) => sum + row.ink, 0) / rows.length;
console.log(`\nmean ink ${(mean(filled) * 100).toFixed(1)}% → ${(mean(outline) * 100).toFixed(1)}%`);

await browser.close();
await server.close();
