/**
 * Renders every screen to img/screens/*.png, and composes img/splash.png.
 * Run after a visual change and look at the diff — the reference screens make
 * a rendering regression something you see rather than something you hear about.
 *
 *   npm run snapshot
 */
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";

const server = await createServer({ server: { port: 5198 }, logLevel: "silent" });
await server.listen();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
await page.goto("http://localhost:5198/tests/snapshot.html");
await page.waitForFunction("window.__done === true", null, { timeout: 60000 });

const shots = await page.evaluate("window.__shots");
fs.mkdirSync("img/screens", { recursive: true });
for (const [name, dataUrl] of Object.entries(shots)) {
  fs.writeFileSync(`img/screens/${name}.png`, Buffer.from(dataUrl.split(",")[1], "base64"));
}
const sheet = await page.evaluate("window.__sheet");
fs.writeFileSync("img/splash.png", Buffer.from(sheet.split(",")[1], "base64"));
const faces = await page.evaluate("window.__font");
console.log(`wrote ${Object.keys(shots).length} screens + img/splash.png`);
console.log(faces
  ? `text rendered from ${faces} bitmap faces — these PNGs are reproducible anywhere`
  : "text rendered by this host's font stack — run `npm run font` to make these reproducible");

await browser.close();
await server.close();
