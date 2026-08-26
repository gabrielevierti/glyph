import { defineConfig } from "vite";

/**
 * Library build.
 *
 * Two entries, because `runtime` is the only module that touches the Even SDK.
 * Anyone rendering to a preview, a test, or a PNG should be able to install
 * Glyph without pulling in a bridge they will never call — which is why the SDK
 * is an optional peer dependency and is left external here.
 */
export default defineConfig({
  build: {
    target: "es2022",
    outDir: "lib",
    emptyOutDir: false,
    lib: {
      entry: {
        glyph: "src/glyph/index.ts",
        runtime: "src/glyph/runtime.ts"
      },
      formats: ["es"]
    },
    rollupOptions: {
      external: ["@evenrealities/even_hub_sdk"],
      output: { entryFileNames: "[name].js", chunkFileNames: "[name]-[hash].js" }
    }
  }
});
