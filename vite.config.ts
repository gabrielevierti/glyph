import { defineConfig } from "vite";

/**
 * Demo and preview build. The library is built separately — see
 * vite.lib.config.ts.
 */
export default defineConfig({
  server: { host: true, port: 5173, cors: true },
  build: { target: "es2022", outDir: "dist" }
});
