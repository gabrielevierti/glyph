/**
 * Empties lib/ before a library build.
 *
 * The build has two halves writing into the same folder — Vite for the modules,
 * tsc for the declarations — so neither can be allowed to empty it for the
 * other. Without this, anything a previous build left behind (a chunk under an
 * old name, declarations for a module since deleted) is published as-is.
 */
import fs from "node:fs";

fs.rmSync("lib", { recursive: true, force: true });
fs.mkdirSync("lib", { recursive: true });
