**Glyph** is a graphics and UI framework built specifically for the **Even Realities G2**.

It exists to solve one problem: making G2 applications look like designed interfaces instead of collections of text containers and hand-written polygons.

Glyph gives you:

- A 576×288 logical framebuffer.
- 4-bit grayscale output.
- Supersampled rasterization for cleaner curves and diagonals.
- Rounded rectangles, circles, lines, arcs and polygons.
- A small icon system.
- Reusable UI components: cards, metrics, progress bars, dividers, sparklines and compass.
- A G2 runtime adapter that turns the framebuffer into image-container updates.
- A browser preview that renders the same logical framebuffer.
- G2 input normalization for tap, double-tap and scrolling.

## Examples

![examples](img/splash.png)

## Architecture

```text
Your G2 app
    │
    ▼
Glyph UI/components
    │
    ▼
GlyphFrame / GlyphRaster
    │
    ├── supersampled 2D rasterization
    ├── grayscale quantization
    └── Gray4 packing
    │
    ▼
GlyphRuntime
    │
    ▼
@evenrealities/even_hub_sdk
    │
    ▼
Even Hub → G2
```

The important design decision is that Glyph renders the complete interface into a framebuffer. The Even SDK remains the transport layer.

## Why a framebuffer renderer?

The G2 display is 576×288 with 16 grayscale levels. The SDK exposes container primitives, but those primitives are not a complete graphics API.

Glyph treats the G2 as a constrained graphical display:

```ts
const frame = new GlyphFrame({ supersample: 2 });

frame.draw((g) => {
  g.clear(0);
  g.roundRect(16, 16, 240, 80, 14, 2, 8);
  g.circle(420, 80, 32, undefined, 15, 2);
  g.line(20, 120, 540, 120, 5);
});
```

Then:

```ts
await runtime.render(frame.toFrame());
```

The application author does not need to think about the SDK's image-container transport.

## G2 transport

Glyph currently uses four image containers for the framebuffer, plus one full-screen text container as the event-capture layer.

The adapter uses four 288×144 tiles, matching the current official SDK reference. A runtime that rejects 288px-wide image containers cannot currently display a complete 576×288 framebuffer through only four image containers; in that case Glyph should be run in a hybrid/native-container mode rather than pretending the limitation does not exist.

The SDK currently documents raw 4-bit grayscale image data and LZ4 compression in version 0.0.12. Glyph therefore packs two Gray4 pixels into each byte, high nibble first.

## Install

```bash
npm install
```

## Browser preview

```bash
npm run dev
```

Open the Vite URL. The preview is a 576×288 framebuffer scaled up for development.

The demo contains three pages:

1. Sea State — metrics, sparkline, compass and battery.
2. Navigation — a composed navigation screen.
3. Components — cards, status, progress, icons and sparkline.

## Even simulator

Start the Vite server:

```bash
npm run dev
```

Then in another terminal:

```bash
npx evenhub-simulator http://localhost:5173
```

## Real G2

Start the app:

```bash
npm run dev
```

Find the computer's LAN IP and create a QR code:

```bash
npx evenhub qr --url http://YOUR_LAN_IP:5173
```

Scan it from the Even companion app while the G2 is paired.

## Package

```bash
npm run pack
```

This produces an `.ehpk` package for the Even Hub developer portal.

## Example

A small screen can be composed with the component layer:

```ts
const frame = new GlyphFrame({ supersample: 2 });

frame.draw((g) => {
  g.clear(0);

  card(g, { x: 16, y: 16, width: 544, height: 120 });

  title(g, "SEA STATE", 32, 44);
  metric(g, { x: 32, y: 58, width: 150, height: 64 }, "12.4", "SOG");
  metric(g, { x: 198, y: 58, width: 150, height: 64 }, "247°", "HDG");
  metric(g, { x: 364, y: 58, width: 150, height: 64 }, "14", "WIND");
});

await runtime.render(frame.toFrame());
```

## Design principles

Glyph intentionally does not try to reproduce HTML/CSS or React.

It is:

- pixel-aware;
- deterministic;
- G2-first;
- small;
- grayscale-native;
- optimized around a framebuffer;
- opinionated about visual hierarchy.

The component layer is convenience. The renderer is the foundation.

## Roadmap

### 0.1 — foundation

- [x] 576×288 logical framebuffer
- [x] supersampled rasterizer
- [x] Gray4 conversion
- [x] Gray4 packing
- [x] G2 image transport
- [x] input normalization
- [x] cards / metrics / progress / sparkline / compass
- [x] icon primitives
- [x] browser preview

### 0.2 — layout

- [ ] retained scene graph
- [ ] flex-like Row / Column layout
- [ ] intrinsic text measurement
- [ ] clipping regions
- [ ] scroll containers
- [ ] focus/navigation model

### 0.3 — visual system

- [ ] full icon pack
- [ ] bitmap font pipeline
- [ ] chart primitives
- [ ] animation/tweening
- [ ] transitions
- [ ] reusable G2 design tokens

### 0.4 — developer tooling

- [ ] framebuffer inspector
- [ ] pixel grid overlay
- [ ] bounds/debug overlay
- [ ] frame capture
- [ ] GIF recorder
- [ ] performance metrics

## License

MIT
