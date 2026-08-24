/**
 * Renders the framework in a real browser and asserts on the result.
 *
 * Glyph's output is pixels, so the only test that means anything is one that
 * actually rasterizes. Vite serves the TypeScript directly; Playwright opens
 * the suite and reports back.
 *
 *   npm test
 */
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({ server: { port: 5199 }, logLevel: "silent" });
await server.listen();

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
});

await page.goto("http://localhost:5199/tests/suite.html");
await page.waitForFunction("window.__done === true", null, { timeout: 60000 });
const results = await page.evaluate("window.__results || []");

let failed = 0;
for (const test of results) {
  if (!test.pass) failed++;
  const mark = test.pass ? "  ok  " : "FAIL  ";
  console.log(`${mark}${test.name}${test.detail ? `  — ${test.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
if (pageErrors.length) {
  console.log("\npage errors:");
  for (const error of pageErrors) console.log(`  ${error}`);
}

await browser.close();
await server.close();
process.exit(failed > 0 || pageErrors.length > 0 ? 1 : 0);
