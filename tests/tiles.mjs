/**
 * Which tile shape is cheapest for which screen — and what a search finds that
 * a person would not have drawn.
 *
 *   npm run tiles
 */
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({ server: { port: 5196 }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:5196/tests/tiles.html");
await page.waitForFunction("window.__done === true", null, { timeout: 180000 });
const report = await page.evaluate("window.__report");
const measured = await page.evaluate("window.__measured");
const source = await page.evaluate("window.__source");

const layouts = Object.keys(report);
const screens = Object.keys(report[layouts[0]]);

console.log("Gray4 KB sent per second of animation (10 paints), 4 containers each\n");
console.log("screen".padEnd(13) + layouts.map((l) => l.padStart(11)).join("") + "   measured");
for (const screen of screens) {
  const costs = layouts.map((l) => report[l][screen].kb);
  const best = Math.min(...costs);
  const cells = costs.map((c) => `${c.toFixed(0)}${c === best ? "*" : " "}`.padStart(11));
  const found = measured[screen].kb;
  const saving = best === 0 ? 0 : (1 - found / best) * 100;
  console.log(
    screen.padEnd(13) + cells.join("") +
    `   ${found.toFixed(0)} (${saving >= 0 ? "-" : "+"}${Math.abs(saving).toFixed(0)}%)`
  );
}
console.log("\n* cheapest hand-drawn shape   measured = found by searching every guillotine tiling\n");

for (const screen of screens) {
  console.log(`${screen}: ${measured[screen].note} — ${measured[screen].tiles.toFixed(2)} tiles/frame`);
}
console.log("\nPaste-ready source for the best of them:\n");
console.log(source[screens[0]]);

if (errors.length) {
  console.log("page errors:");
  for (const error of errors) console.log(`  ${error}`);
}

await browser.close();
await server.close();
process.exit(errors.length ? 1 : 0);
