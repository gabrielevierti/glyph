# Local enhancement patch

- Added 11 lightweight UI primitives in `src/glyph/extended.ts`.
- Preserved existing `toggle`, `tabBar`, and `toast` exports by using distinct names.
- Guarded `progressBar` against non-finite values.
- Guarded `segmentedBar` against zero, negative, or non-finite segment counts and excessive loops.
- Added usage examples to the README.

## Validation limitations

The local TypeScript check was blocked by an unavailable `@evenrealities/even_hub_sdk` dependency. `npm ci` did not finish within the available time. Full build, browser rendering, and physical G2 benchmarks have **not** been completed.

## UI showcase and hot-path improvements

- Added three animated, waveguide-oriented reference screens: UI Kit Controls, Dashboard and States. Available via the existing Vite preview screen navigation.
- All eleven new primitives from the previous enhancement pass are now demonstrated in the preview.
- Optimized Gray4-to-RGBA preview conversion with a precomputed 16-entry lookup table, avoiding per-pixel rounding and function calls. This only affects the preview path, not BLE transport.
- Preserved the existing tile limit, layout selection, public API and outline/filled rendering modes.
- Benchmark results on actual G2 hardware are not claimed; validate transport separately with `npm run bench`.
