Glyph exists so that G2 apps can look like designed interfaces instead of collections of text containers and hand-placed polygons. You draw a complete screen into a 576×288 framebuffer using real primitives — paths, gradients, clipping, transforms, measured text — and Glyph slices it into image tiles and ships only the ones that changed.

![Six screens built with Glyph](img/splash.png)

```bash
npm install @gabrielevierti/glyph
```

The Even SDK is an *optional* peer dependency. Only `@gabrielevierti/glyph/runtime` touches it, so rendering to a canvas, a test, or a PNG needs nothing installed and no hardware attached.

## Why a framebuffer

The G2 exposes container primitives, not a graphics API. You can position text and blit images; you cannot draw an arc, clip a rotating horizon to a circle, or measure a string before you place it.

Glyph treats the display as what it is — a 576×288 surface with 16 levels of gray — and puts a full rasterizer in front of it. The SDK becomes transport. Nothing above `GlyphRuntime` knows it exists, which is also why the entire framework can be rendered and tested in a headless browser.

```ts
import { GlyphFrame } from "@gabrielevierti/glyph";

const frame = new GlyphFrame({ supersample: 2 });

frame.draw((g) => {
  g.roundRect({ x: 16, y: 16, width: 240, height: 80 }, 14, { fill: 2, stroke: 8 });
  g.gradient({ x: 16, y: 110, width: 240, height: 40 }, 0, 15);
  g.text("13.2", 32, 44, { size: 40, weight: 800 }, 15);
});

await runtime.render(frame.toFrame());
```

Levels are integers `0`–`15`, not CSS colors. `gray` in the theme names them by role — `surface`, `border`, `secondary`, `strong`, `max` — which is what keeps six screens looking like one product.

## The two numbers a see-through display cares about

A phone UI is judged on how it looks. A waveguide UI is judged on how much of the world it costs you, and whether what it costs you can be read. Both are measurable, so both are assertions rather than opinions.

### Ink

Every lit pixel is a pixel of the world you cannot see through, so a filled card that reads as "elevated" on a phone reads as "smudge on the lens" on a waveguide.

Glyph's default surface style is therefore `outline`: panels are a hairline border and the content inside them, list selection is an edge marker rather than a filled well, chart areas are hatched rather than flooded, progress tracks are outlines, and the speed roundel is a ring rather than a disc. Fills survive only where the element is small enough that solidity costs nothing and legibility needs it — badges, progress fills, the knockout behind the wind readout.

```ts
const frame = new GlyphFrame({ surface: "outline" });  // default — for wearing
const shot  = new GlyphFrame({ surface: "filled" });   // for screenshots
```

Measured across the six screens, switching to outline **more than halves the ink** and cuts lit pixels by about five times:

| | filled | outline |
|---|---|---|
| mean ink (fraction of full brightness) | 11.6% | **5.4%** |
| pixels lit at all | ~65% | ~12% |

`npm run ink` prints the table per screen, and the suite asserts every screen stays under `inkBudget` (18%).

The surface style lives **on the raster**, not in a module global. Two frames can disagree — the same screen rendered outline and filled side by side, in the same tick, is how the table above is produced, and a parallel test run cannot corrupt another test's setting.

### Contrast

Ink says how much of the world the UI is hiding. It says nothing about whether what hides it can be read. A screen can sit comfortably under the ink budget and still put level 7 text on a level 5 panel, which looks fine on a bright monitor and vanishes on glass.

```ts
const warnings = frame.raster.enableContrastLint(4);   // minimum level delta
screen.render(ctx);
// → [{ text: "SW 14 kt", gray: 7, background: 5, delta: 2, x: 118, y: 96 }]
```

The lint samples the darkest level in a small neighbourhood before each glyph is drawn — the surface actually showing through, not whichever stroke a single sample happened to land on — and records anything drawn too close to it. The suite asserts zero warnings per screen, and the preview has a checkbox.

## Install and run

```bash
git clone https://github.com/gabrielevierti/glyph
cd glyph
npm install
npm run font     # build the bitmap atlas (see "Text", below)
npm run dev
```

Open the Vite URL. You get the six screens above at 2× with nearest-neighbour scaling — real pixels, not an interpolation of them — plus a tile-layout switcher, a pixel/tile grid overlay, a brightness slider, the contrast lint, and a live readout of how many tiles the transport is actually sending.

`←` `→` or space to page, `↑` `↓` to scroll inside a screen, `1`–`6` to jump. Requires Node 20+.

## Architecture

```text
your screen                     plain object with a render(ctx) function
    │
    ▼
components · charts · icons     built entirely from the layer below
    │
    ▼
GlyphRaster                     every primitive, drawn supersampled
    │
    ▼
GlyphFrame                      resolve → 16 levels → tile → pack Gray4 → hash
    │
    ▼
GlyphRuntime                    diff against last frame, send only what changed
    │
    ▼
@evenrealities/even_hub_sdk → Even Hub → G2
```

`GlyphRuntime` is deliberately **not** in the main entry point. Import `@gabrielevierti/glyph/runtime` when you need transport. Keeping the SDK out of the core is what makes the whole framework testable without hardware, and what lets it be an optional dependency.

## The primitive layer

Everything takes a geometry and a single `Paint` (`fill`, `stroke`, `width`, `dash`, `cap`, `join`, `alpha`), so nothing has a bespoke signature.

| | |
|---|---|
| **Shapes** | `rect` `roundRect` (per-corner radii) `circle` `ellipse` `arc` `sector` `ring` `polygon` `regularPolygon` `star` `polyline` `line` `hline` `vline` `pixel` |
| **Curves** | `spline` (Catmull-Rom) `bezier` `quad` `path` — plus `GlyphPath` and `parsePath` for reusable path data |
| **State** | `save` `restore` `scoped` `translate` `rotate` `rotateAbout` `scaleBy` `clipRect` `clipRound` `clipCircle` `clipPath` |
| **Tone** | `gradient` `radialGradient` `ditherRect` `hatch` `dots` `gridLines` `blit` `layer` `drawRaster` |
| **Text** | `text` `textBox` (wrap, align, ellipsis) `measure` `capHeight` — and `wrap` `truncate` `fitStyle` standalone |

Components respect the surface style automatically, so a screen written once works in both modes without branching.

**On tone:** Canvas gradients band badly once you quantize to 16 levels. `gradient`, `radialGradient` and `ditherRect` compute the ramp per logical pixel and apply a 4×4 ordered dither, which is the difference between a ramp and a staircase. See the Primitives screen.

**On supersampling:** the raster draws at 2× (or 3×) and averages down. On a display this small that averaging is what turns edge coverage into gray levels — clean diagonals and curves for free, without a custom antialiaser.

**On resolving:** the average is a straight arithmetic mean, deliberately. Every value on the canvas is `level × 17`, a linear encoding of a level rather than an sRGB colour, and the panel's output is linear in level — so the plain mean is the physically correct one. Gamma-correcting here is a plausible-sounding way to make every antialiased edge slightly wrong.

**Brightness** is one scalar applied at resolve, so a whole design dims together without a component knowing about it:

```ts
app.brightness = 0.6;   // indoors, or a low-power mode
```

## Text

Text was the last thing in Glyph that the host machine could influence. Canvas measures and rasterizes with whatever fonts the browser happens to have, which is fine until you notice that the committed reference screens are supposed to be a regression suite — and a regression suite that renders differently on your laptop and on CI is a picture, not a test.

`npm run font` builds a **bitmap atlas** and commits it to `public/fonts/`. It runs in two passes:

1. Render every screen with a style observer attached, and collect the exact set of `(family, weight, size, italic)` the app asks for — including the one-off sizes screens spell inline, like `{ ...T.numeral, size: 13 }`. A hand-maintained list of faces always drifts; this one cannot.
2. Rasterize each of those faces glyph by glyph at *logical* resolution — the atlas is the final pixel grid, there is nothing to supersample down to — and pack the coverage as Gray4.

At runtime, glyphs are blitted from a pre-tinted atlas at whole logical pixels. Same bytes in, same bytes out, on any machine.

```ts
const font = await loadFontSet("/fonts/inter.json");
app.useFont(font);
```

Lookup is exact on `(family, weight, size, italic)`; Glyph will not scale a bitmap face, because a blurry numeral on a 16-level display is worse than an honest error. Three modes:

| `fontMode` | behaviour |
|---|---|
| `auto` | bitmap when the atlas has the face, canvas otherwise. The default. |
| `bitmap` | bitmap only — a missing face throws. Use this in CI. |
| `canvas` | always the host. Used while generating an atlas. |

Atlases are fetched, not bundled: a full set is a few hundred KB, which is nothing over a LAN and absurd inside a library.

Measurement is memoized. Wrapping, truncation and `fitStyle` re-measure the same unchanged labels on every paint, and at 20fps that was thousands of `measureText` calls a second for strings that had not moved.

## Layout, type and icons

`row` and `column` are a real flex solver — fixed sizes, `grow(n)` weights, `auto` intrinsic sizes, `min`/`max` clamps, gaps, padding, `justify`, `align` — returning plain rects. There is no retained tree; on a screen this size a full repaint is cheaper than reconciling one.

```ts
const [left, centre, right] = row(safe, [{ size: 166 }, { size: grow(1) }, { size: 166 }], { gap: 8 });
const [icon, label] = row(bar, [auto(20), { size: grow(1) }], { gap: 6 });
const [tag] = row(bar, [auto((h) => g.measure(text, T.label) + h)]);
```

`auto` items must be able to report their own size, as a number or a `(crossSize) => number`. An `"auto"` with no way to measure itself is an error rather than a silently zero-width rect.

Also `splitH` `splitV` `grid` `inset` `align` `aspectFit` `snap` `polar` `bearingToAngle` `remap`.

The type scale steps aggressively, because on a waveguide there is no useful middle ground between "read this" and "see this": `hero` `display` `headline` `title` `body` `caption` `label` `micro` `numeral` `numeralLg` `numeralXl`.

**140 icons**, authored as stroked path data on a 24×24 grid and parsed once. Stroked rather than filled — a filled silhouette turns to mush at 10px on this display, strokes stay separable. Add your own with `registerIcon(name, pathData)`.

## Components and charts

The convenience layer, all built from primitives: `panel` `section` `divider` `metric` `stat` `keyValue` `listRow` `progressBar` `segmentedBar` `battery` `signalBars` `statusBar` `pageDots` `tabBar` `scrollbar` `pill` `tag` `badge` `button` `toggle` `toast` `emptyState` `scrim`.

Instruments, because a marine or navigation app needs them and nothing else provides them: `compassRose` (rotating card, fixed lubber line, secondary pointer), `attitudeIndicator`, `windIndicator`, `speedLimit`, `maneuverArrow`.

Charts: `lineChart` `barChart` `rankChart` `scatterChart` `sparkline` `ringChart` `gaugeChart` `heatStrip` `bulletChart`, plus `chartFrame` if you want the grid and gutter but your own marks.

One rule the components follow: **the type scale yields to the box, not the other way round.** `metric` and `ringChart` shrink their value via `fitStyle` until it fits, because a readout is the one thing a design cannot control the length of — `9.1` and `247.8` want the same slot. `fitStyle` binary-searches the same candidate sizes a walk would have stepped through, so a 64px hero falling to 12px costs six measurements instead of fifty-two.

## The app shell

```ts
import { GlyphApp } from "@gabrielevierti/glyph";
import { GlyphRuntime } from "@gabrielevierti/glyph/runtime";

const app = new GlyphApp({
  screens,
  tileLayout: TILE_CHROME,
  fps: 20,
  font,
  onSlowFrame: ({ screen, ms }) => console.warn(`${screen} painted in ${ms.toFixed(1)}ms`)
});
app.start();

const runtime = new GlyphRuntime({ tileLayout: TILE_CHROME });
await runtime.start();
app.attachRuntime(runtime);
runtime.onInput((event) => app.handleInput(event));
```

A screen is a plain object:

```ts
export const myScreen: Screen = {
  name: "Depth",
  animated: true,                       // repaint every tick, not just on invalidate()
  onInput(event, app) { /* return true to consume */ },
  render({ g, now, safe, app }) { /* draw */ }
};
```

The paint loop does nothing when nothing changed. Screen changes slide via two pooled offscreen layers — a full-screen layer at 2× is a 1152×576 canvas, and allocating two of them per screen change is a lot of garbage for an animation the wearer sees for a fifth of a second. `Cursor` handles selection and scrolling for list screens.

Without `onSlowFrame`, a screen that overruns its budget just quietly runs at a lower frame rate and nobody finds out until it is on someone's face.

## Tile layouts

**The G2 accepts four image containers per page.** This is a hardware limit. The Even Hub simulator will happily accept twelve, which means a layout can pass every test you run locally and fail on the glasses — worth knowing before you design around it (btw thanks to @lousisx over on Discord for pointing this out to me!)

Four containers always cover 165,888 pixels between them, so you cannot buy diffing granularity by making tiles smaller. What you *can* choose is their **shape**, and shape decides how much of the screen a given change drags along with it. Tiles do not have to be the same size.

| Layout | Shape | Good for |
|---|---|---|
| `TILE_QUADRANTS` | 288×144 ×4 | The SDK reference layout. Sane default. |
| `TILE_BANDS` | 576×72 ×4 | Screens that change in horizontal strips. |
| `TILE_COLUMNS` | 144×288 ×4 | Side-by-side panels updating independently. |
| `TILE_CHROME` | 576×32 strip + 192×256 ×3 | Isolates rarely-changing chrome from content. |
| `TILE_HERO` | 426×288 + 150×96 ×3 | One dominant panel plus a rail. |

`npm run tiles` measures the real cost — Gray4 KB sent per second of animation, per screen, per shape:

```
screen         quadrants      bands    columns     chrome       hero
SeaState            810        628        648        528*       740
Navigator           263        284        243*       309        282
Dashboard            20*        41         20*        24         60
Charts              405*       608        405*       480        796
```

Up to 35% between the best and worst shape for the same screen. The rule that falls out: **put the seams between the regions that change at different rates.**

`validateLayout()` checks coverage, overlap, bounds, even widths and the container cap, and both `GlyphFrame` and `GlyphRuntime` throw on an invalid layout rather than corrupting rows or failing opaquely on device.

### Letting it choose

That rule is one a computer follows better than a person does. Record which pixels actually change while a screen animates, then search the space of tilings for the one that costs the fewest bytes on that evidence:

```ts
const recorder = new ChangeRecorder();
for (const t of timestamps) { paint(t); recorder.observe(frame.toLevels()); }

const best = recorder.suggest({ step: 16 });
console.log(best.layout.note);        // "measured — 576×48 + 192×240 + 208×240 + 176×240"
console.log(layoutToSource(best.layout));
```

The search is **exhaustive over guillotine tilings on a grid**, not a heuristic. Change is stored as one integral image per observed transition, so "did anything inside this rectangle change on frame 7" is four array reads; rectangle costs are memoized across candidates, and a partial-cost bound prunes whole subtrees. At a 16px step that is a few hundred thousand tilings in about a second.

`npm run tiles` now prints a `measured` column next to the hand-drawn shapes, and the preview has an **optimise** button that measures whatever is currently on screen, switches to the result, and prints paste-ready source to the console.

## Transport and dirty tiles

Each tile is packed to Gray4 (two pixels per byte, high nibble first) and hashed with FNV-1a. `GlyphRuntime` compares against the previous frame and sends only tiles that changed. Measured on the ticking Dashboard: **one tile of four per second.** Identical renders provably hash identically, which is what makes the optimization safe.

**The newest frame wins.** An earlier version queued every render behind its predecessor, which is correct right up until the transport is slower than the paint loop: then the queue grows without bound and the glasses fall further and further behind, displaying frames from ten seconds ago. A display has no use for a stale frame. At most one frame is ever waiting; a superseded one is counted in `stats.dropped` rather than sent.

Tiles go over the wire as PNG, because that is what the image containers accept today. The Gray4 packing is not wasted work — it is the diffing key and the wire format the moment raw uploads are exposed. `GlyphRuntime.encodeTile` is the single place that would change; its canvases are cached per tile size rather than allocated per tile per frame.

### Measuring what it actually costs

Bytes per second is a proxy. What caps your frame rate is the round trip for one image-container update over BLE, and that number is not in any datasheet.

```bash
npm run bench     # prints a LAN URL; scan it with the G2 paired
```

The Bench screen drives every tile dirty on every paint — the worst case, deliberately — and reports `p50` / `p95` per-tile round trip, tiles per second, dropped frames, and the frame-rate ceiling that falls out of the latency. It is not in the default screen set; it is an instrument, not a design.

```ts
app.transportStats  // { sent, dropped, bytes, p50, p95, last, rate }
```

## Testing

```bash
npm test           # the suite, rendered in real Chromium
npm run ink        # occlusion report, filled vs outline, per screen
npm run tiles      # transport cost per tile shape, per screen, plus the search
npm run snapshot   # re-render img/screens/*.png and img/splash.png
npm run font       # rebuild the bitmap atlas
npm run bench      # transport latency, on device
```

Glyph's output is pixels, so the only test worth writing is one that rasterizes. Vite serves the TypeScript, Playwright opens the suite. It covers Gray4 round-tripping, tile-layout coverage and rejection, hash stability, dirty-tile counts, text wrap and truncation bounds (swept across every column width, because the double-ellipsis bug hid in the one width someone happened to try), tracked-text centring, `fitStyle` against a linear search, flex arithmetic including intrinsic sizing, per-raster surface style, brightness, the shared tile diff, the layout search against the reference layout, every screen rendering clean at four timestamps in both surface styles, safe-area edge bleed, per-screen ink budget, per-screen contrast, and the app shell's paint loop, transitions and input routing.

The three reference screens double as the visual regression suite — and with the bitmap atlas committed, they are reproducible on a machine other than the one that made them.

CI runs typecheck, the suite, the ink report and the library build on every push.

## On device

```bash
npm run host                              # vite on 0.0.0.0
npx evenhub qr --url http://YOUR_LAN_IP:5173
```

Scan from the Even companion app with the G2 paired; laptop and phone on the same network. Or use the simulator: `npm run dev` in one terminal, `npm run sim` in another.

```bash
npm run pack     # .ehpk for the Even Hub developer portal
```

## Known limitations

- **`runtime.ts` is the one file never executed in CI** — it needs the SDK and real hardware. Test it first on device.
- **Bitmap coverage is only as reproducible as the machine that built the atlas.** Once committed the bytes are fixed for everyone, but regenerating on a host with different fonts installed will produce a diff. `npm run font` prints which family the browser actually resolved for each face so a substitution is visible rather than silent.
- **`statusBar` assumes a 576-wide surface.** It is chrome, not a component.
- **No headless rendering outside a browser.** `GlyphRaster` takes an injected `createCanvas`, and with a bitmap atlas installed nothing else needs a font stack — so a node-canvas backend is now a small change, but it is not written.
- **Dirty tracking is per tile, not per region.** With only four containers, a one-pixel change repaints at least a quarter of the screen.
- **The layout is fixed at page creation**, so a screen cannot pick its own tile shape without tearing down and rebuilding the page. The search will happily find a different optimum per screen; you can only use one of them at a time.
- **Ink and contrast are measured, not enforced at draw time.** Nothing stops a screen flooding the surface; the budget is a test, not a runtime guard.
- **The contrast lint samples, it does not integrate.** It checks the backdrop at the glyph's anchor, not under every stroke, so it catches flat-on-flat clashes reliably and text over fine texture only sometimes.

## License

MIT
