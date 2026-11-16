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
import { launchBrowser } from "../tools/browser.mjs";

const server = await createServer({ server: { port: 5199 }, logLevel: "silent" });
await server.listen();

let browser = null;
let exitCode = 1;
try {
  browser = await launchBrowser();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
  });

  await page.goto("http://localhost:5199/tests/suite.html");

  // The suite is one module: an exception anywhere stops it before it can say
  // it is done. Waiting out the full timeout for that would hide the actual
  // error behind "Timeout exceeded", so a page error ends the wait at once.
  const finished = await Promise.race([
    page.waitForFunction("window.__done === true", null, { timeout: 120000 }).then(() => true, () => false),
    new Promise((resolve) => page.once("pageerror", () => setTimeout(() => resolve(false), 250)))
  ]);
  const results = await page.evaluate("window.__results || []");

  // The preview is the front door of the repository, and nothing else loads
  // it: it once shipped with its stylesheet never imported and nobody noticed.
  if (finished) {
    const preview = await browser.newPage();
    const previewErrors = [];
    preview.on("pageerror", (error) => previewErrors.push(String(error)));
    await preview.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());   // no network needed
    await preview.goto("http://localhost:5199/");
    await preview.waitForFunction("document.querySelector('#stats')?.textContent?.includes('fps')", null, { timeout: 15000 })
      .catch(() => undefined);
    const state = await preview.evaluate(`({
      styled: getComputedStyle(document.querySelector(".shell") ?? document.body).display === "flex",
      painting: /fps/.test(document.querySelector("#stats")?.textContent ?? "")
    })`);
    results.push({ name: "preview loads and paints", pass: state.painting && previewErrors.length === 0, detail: previewErrors[0] ?? "" });
    results.push({ name: "preview stylesheet is applied", pass: state.styled, detail: "" });
    await preview.close();
  }

  let failed = 0;
  for (const test of results) {
    if (!test.pass) failed++;
    const mark = test.pass ? "  ok  " : "FAIL  ";
    console.log(`${mark}${test.name}${test.detail ? `  — ${test.detail}` : ""}`);
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (!finished) console.log("\nThe suite did not run to completion.");
  if (pageErrors.length) {
    console.log("\npage errors:");
    for (const error of pageErrors) console.log(`  ${error}`);
  }
  exitCode = failed > 0 || pageErrors.length > 0 || !finished ? 1 : 0;
} catch (error) {
  console.error(String(error?.message ?? error));
} finally {
  await browser?.close();
  await server.close();
}
process.exit(exitCode);
