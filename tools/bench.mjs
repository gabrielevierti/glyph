/**
 * Serves the preview in benchmark mode and prints the URL to scan.
 *
 *   npm run bench
 *
 * Everything else Glyph measures — ink, contrast, bytes per tile shape — can be
 * measured on a laptop. Transport latency cannot. This puts the Bench screen on
 * the glasses, drives every tile dirty on every paint, and reports the round
 * trip the SDK actually gives you, which is the number that decides what frame
 * rate is achievable at all.
 */
import { createServer } from "vite";
import os from "node:os";

function lanAddress() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

const server = await createServer({ server: { host: "0.0.0.0", port: 5173 } });
await server.listen();

const url = `http://${lanAddress()}:5173/?bench`;
console.log(`\nBenchmark harness: ${url}\n`);
console.log("  1. phone and laptop on the same network, G2 paired");
console.log("  2. npx evenhub qr --url \"" + url + "\"");
console.log("  3. scan from the Even companion app\n");
console.log("The Bench screen reports p50/p95 round trip per tile and the frame");
console.log("rate ceiling that falls out of it. Ctrl-C when you have the number.\n");
