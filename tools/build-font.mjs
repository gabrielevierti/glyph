/**
 * Builds the bitmap font atlas and commits it to public/fonts/.
 *
 *   npm run font
 *
 * Text is the last thing in Glyph that the host machine can influence. An atlas
 * moves both metrics and coverage into the repository, which is what makes the
 * committed reference screens a regression suite rather than a screenshot of
 * one laptop. Run this whenever the type scale changes; commit the result.
 */
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = "public/fonts/inter.json";

const server = await createServer({ server: { port: 5195 }, logLevel: "silent" });
await server.listen();

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

await page.goto("http://localhost:5195/tools/font.html");
await page.waitForFunction("window.__done === true", null, { timeout: 180000 });

const atlas = await page.evaluate("window.__atlas");
const resolution = await page.evaluate("window.__resolution");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(atlas));

const bytes = fs.statSync(OUT).size;
console.log(`${atlas.faces.length} faces → ${OUT} (${(bytes / 1024).toFixed(0)} KB)\n`);
console.log("family        weight  size   resolved to");
for (const row of resolution) {
  const mismatch = row.resolved.toLowerCase() !== row.requested.toLowerCase();
  console.log(
    `${row.requested.padEnd(13)} ${String(row.weight).padStart(6)} ${String(row.size).padStart(5)}   ` +
    `${row.resolved}${mismatch ? "  ← substituted" : ""}`
  );
}
if (resolution.some((r) => r.resolved.toLowerCase() !== r.requested.toLowerCase())) {
  console.log(
    "\nSome families were substituted by the browser. The atlas is still fully\n" +
    "deterministic once committed — everyone downstream reads these bytes — but\n" +
    "regenerating it on a machine with different fonts will produce a diff."
  );
}
if (errors.length) {
  console.log("\npage errors:");
  for (const error of errors) console.log(`  ${error}`);
}

await browser.close();
await server.close();
process.exit(errors.length ? 1 : 0);
