/**
 * Which tile shape is cheapest for which screen.
 *
 *   npm run tiles
 */
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({ server: { port: 5196 }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:5196/tests/tiles.html");
await page.waitForFunction("window.__done === true", null, { timeout: 90000 });
const report = await page.evaluate("window.__report");

const layouts = Object.keys(report);
const screens = Object.keys(report[layouts[0]]);

console.log("Gray4 KB sent per second of animation (10 paints), 4 containers each\n");
console.log("screen".padEnd(13) + layouts.map((l) => l.padStart(11)).join(""));
for (const screen of screens) {
  const costs = layouts.map((l) => report[l][screen].kb);
  const best = Math.min(...costs);
  const cells = costs.map((c) => `${c.toFixed(0)}${c === best ? "*" : " "}`.padStart(11));
  console.log(screen.padEnd(13) + cells.join(""));
}
console.log("\n* cheapest shape for that screen");

await browser.close();
await server.close();
