import { defineConfig } from "vite";

/**
 * Library build.
 *
 * Two entries, because `runtime` is the only module that touches the Even SDK.
 * Anyone rendering to a preview, a test, or a PNG should be able to install
 * Glyph without pulling in a bridge they will never call — which is why the SDK
 * is an optional peer dependency and is left external here.
 *
 * `public/` is copied in as well, deliberately: that is how the bitmap font
 * atlas ends up at `lib/fonts/inter.json`, importable by consumers as
 * `@gabrielevierti/glyph/fonts/inter.json`.
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
      // No content hash in chunk names. `lib/` is committed, and a hash turns
      // every one-line change into a renamed file plus two edited importers.
      output: { entryFileNames: "[name].js", chunkFileNames: "chunks/[name].js" }
    }
  }
});
