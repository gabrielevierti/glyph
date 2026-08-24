# Glyph

**Glyph** is a graphics and UI framework for the **Even Realities G2**.

It exists to solve one problem: making G2 applications look like designed interfaces instead of collections of text containers and hand-written polygons.

Glyph renders your entire screen into a 576×288 grayscale framebuffer, slices it into image tiles, and pushes those tiles through the Even Hub SDK. Your app draws; the SDK stays a transport layer.

![examples](img/splash.png)

## What you get

- A 576×288 logical framebuffer with 16 grayscale levels.
- Supersampled rasterization for cleaner curves and diagonals.
- Drawing primitives: rounded rectangles, circles, ellipses, arcs, lines, polygons and text.
- An icon set of ~70 vector glyphs.
- A component layer: cards, metrics, clock and weather widgets, list items, progress bars, segmented bars, activity rings, sparklines, pills, badges, status bar, tab bar, page dots and toasts.
- A G2 runtime adapter that turns the framebuffer into image-container updates.
- A browser preview that renders the exact same framebuffer.
- G2 input normalization for tap, double-tap and scroll.

> **Status: 0.1, experimental.** The SDK surface Glyph targets (`@evenrealities/even_hub_sdk` 0.0.13) is itself early and changing. Expect breakage.

## Requirements

- Node 20+
- An Even Hub developer account for on-device testing
- A paired G2 (or the Even Hub simulator)

## Quick start

```bash
git clone https://github.com/gabrielevierti/glyph
cd glyph
npm install
npm run dev
```

Open the Vite URL. You get a scaled-up 576×288 preview with four demo pages — **Navigation**, **Markets**, **Weather** and **Flight** — plus a tile-layout selector.

Navigate with `←` / `→`, the space bar, the arrows in the toolbar, or by clicking the preview.

## Architecture

```text
Your G2 app
    │
    ▼
Glyph components  (card, metricWidget, sparkline, …)
    │
    ▼
GlyphRaster       (supersampled Canvas 2D drawing)
    │
    ▼
GlyphFrame        (resolve → Gray4 → tile → pack)
    │
    ▼
GlyphRuntime      (tile → PNG → image container update)
    │
    ▼
@evenrealities/even_hub_sdk → Even Hub → G2
```

The key design decision: Glyph renders the complete interface into one framebuffer. Nothing above `GlyphRuntime` knows the SDK exists.

## Drawing

```ts
import { GlyphFrame } from "./glyph";

const frame = new GlyphFrame({ supersample: 2 });

frame.draw((g) => {
  g.clear(0);
  g.roundRect(16, 16, 240, 80, 14, 2, 8);   // x, y, w, h, radius, fill, stroke
  g.circle(420, 80, 32, undefined, 15, 2);  // cx, cy, r, fill, stroke, width
  g.line(20, 120, 540, 120, 5);
});

await runtime.render(frame.toFrame());
```

Colors are integers `0`–`15`, not CSS strings — `0` is off, `15` is full brightness. `glyphTheme.colors` gives them names (`surface`, `border`, `secondary`, `bright`, `white`, …).

## Composing with components

```ts
import { GlyphFrame, card, title, metricWidget } from "./glyph";

const frame = new GlyphFrame({ supersample: 2 });

frame.draw((g) => {
  g.clear(0);

  card(g, { x: 16, y: 16, width: 544, height: 120 }, { fill: 2, radius: 12 });

  title(g, "SEA STATE", 32, 44);
  metricWidget(g, { x: 32,  y: 58, width: 150, height: 64 }, "12.4", "SOG");
  metricWidget(g, { x: 198, y: 58, width: 150, height: 64 }, "247°", "HDG");
  metricWidget(g, { x: 364, y: 58, width: 150, height: 64 }, "14",   "WIND");
});

await runtime.render(frame.toFrame());
```

Every component takes `(raster, rect, …)` and draws immediately. There is no retained tree, no diffing, no reconciliation — you redraw the frame.

## Runtime

```ts
import { GlyphRuntime, TILE_LAYOUT_288 } from "./glyph";

const runtime = new GlyphRuntime({ tileLayout: TILE_LAYOUT_288, debug: true });

runtime.setOnStateChange(({ connected, message }) => console.log(message));

await runtime.start();
await runtime.render(frame.toFrame());

runtime.onInput((e) => {
  if (e.type === "tap") next();
  if (e.type === "scroll-up") prev();
});
```

`render()` is serialized internally, so overlapping calls queue instead of interleaving tile writes. A failed tile update rejects that call only; the queue recovers.

## Tile layouts

The G2 has a per-container size limit that varies by firmware, so Glyph ships three tilings of the same 576×288 surface:

| Layout | Tile size | Tiles | Notes |
|---|---|---|---|
| `TILE_LAYOUT_288` | 288×144 | 4 | Matches the official SDK reference. Fewest updates per frame. |
| `TILE_LAYOUT_192_96` | 192×96 | 9 | Default in the demo — the safest bet on current firmware. |
| `TILE_LAYOUT_144` | 144×144 | 8 | Middle ground. |

If `createStartUpPageContainer` fails, try a smaller tile layout first — that is almost always the cause.

## Pixel format

Internally Glyph resolves the supersampled canvas to one byte per pixel (values `0`–`15`), then packs two pixels per byte, high nibble first. `Frame.tiles[].pixels` is that packed Gray4 data.

**The runtime does not send raw nibbles.** `GlyphRuntime` currently unpacks each tile and re-encodes it as a PNG, because that is what the SDK's image containers accept today. If a future SDK version exposes raw Gray4 or LZ4 uploads, that unpack/encode step is the one place to change — the packing is already there.

## Even simulator

```bash
npm run dev
```

Then in another terminal:

```bash
npx evenhub-simulator http://localhost:5173
```

## Real G2

```bash
npm run sim          # vite bound to 0.0.0.0
npx evenhub qr --url http://YOUR_LAN_IP:5173
```

Scan the QR from the Even companion app with the G2 paired. Your laptop and phone must be on the same network.

## Packaging

```bash
npm run pack
```

Produces an `.ehpk` for the Even Hub developer portal. Metadata lives in `app.json`.

## Design principles

Glyph is not trying to be HTML/CSS or React. It is:

- pixel-aware and deterministic;
- G2-first;
- grayscale-native;
- small;
- opinionated about visual hierarchy.

The component layer is convenience. The renderer is the foundation.

## Known limitations

- Text is measured and rasterized by the browser's Canvas, so glyph metrics depend on which fonts the host has. There is no bundled bitmap font yet.
- `statusBar`, `tabBar` and `pageDots` hard-code coordinates for a 576×288 surface.
- Every `render()` pushes every tile. There is no dirty-region tracking, so a full-screen update is the only update.
- `GlyphFrame` requires an even tile width (Gray4 packs two pixels per byte).
- Requires a DOM — `GlyphRaster` uses `document.createElement("canvas")`. No headless/Node rendering yet.

## Roadmap

**0.2 — layout**
- [ ] retained scene graph
- [ ] flex-like Row / Column layout
- [ ] clipping regions
- [ ] scroll containers
- [ ] focus/navigation model

**0.3 — visual system**
- [ ] bitmap font pipeline
- [ ] chart primitives
- [ ] animation/tweening
- [ ] design tokens as a shareable package

**0.4 — tooling**
- [ ] framebuffer inspector and pixel grid overlay
- [ ] dirty-tile diffing
- [ ] frame capture / GIF recorder
- [ ] performance metrics

## License

MIT © 2026
