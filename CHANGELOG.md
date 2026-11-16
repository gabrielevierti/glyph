# Changelog

## 0.5.0

The component library. 49 components become 123, 140 icons become 279, and
there is a reference screen for every one of them.

### Added

- **HUD instruments** (`hud.ts`): `headingTape`, `valueTape`, `pitchLadder`,
  `reticle`, `targetBox`, `deviationBar`, `radarScope`, `clockFace`,
  `levelMeter`, `linearGauge`, `barGauge`, `scaleBar`. All strokes: the
  HUD · Flight reference screen is 2.1% ink.
- **Overlays and feedback** (`overlays.ts`): `dialog`, `buttonRow`,
  `bottomSheet`, `menu`, `callout`, `banner`, `notificationCard`, `hintBar`,
  `gestureGlyph`, `captions`, `teleprompter`, `loadingState`,
  `indeterminateBar`, `listeningIndicator`. Overlays clear the area under
  themselves instead of relying on a scrim.
- **Content** (`content.ts`): `screenHeader`, `card`, `statGrid`, `avatar`,
  `avatarGroup`, `statusDot`, `chatBubble`, `table`, `timeline`,
  `calendarMonth`, `stopLine`, `rating`, `breadcrumb`, `pagination`, `chipRow`,
  `legend`, `trendBadge`, `keycap`, `mediaTransport`, `waveform`, `equalizer`,
  `countdownRing`, `marquee`, `typewriter`, and `formatDuration`.
- **Inputs** (`inputs.ts`): `segmentedControl`, `pickerWheel`, `radioGroup`,
  `checkGroup`, `numberStepper`, `rangeSlider`, `dial`, `textField`, `pinDots`,
  `keypad`, `switchRow`, `sliderRow`, `focusRing`. Every control has a
  `focused` state, drawn the same way.
- **More charts**: `donutChart`, `stackedBar`, `dotMatrix`, `activityRings`,
  `histogram`, `rangeChart`, `candlestickChart`, `sparkBars`, `radarChart`,
  `polarChart`.
- **`raster.image()`** — any `CanvasImageSource` reduced to 16 levels with
  ordered or Floyd–Steinberg dithering, with `fit`, `brightness`, `contrast`,
  `gamma`, `invert`, `maxLevel` and rounded corners.
- **`raster.arrow()`** — a line with a head.
- **`pickStyle()`** — the largest of several styles that fits a width. Unlike
  `fitStyle` it only ever returns a size that exists, so fitted text still
  comes from the bitmap atlas.
- **139 icons**: direction and manoeuvres, status, weather, places and travel,
  health, media, communication, devices, objects, and interface.
- **Ten reference screens**: HUD · Flight, HUD · Instruments, Overlays,
  Sheets · Waiting, Reading, Data, Charts · More, Inputs, Media · Transit, and
  Icons. `img/splash.png` shows all nineteen.
- **`docs/COMPONENTS.md`**, generated from the source by `npm run catalog`. CI
  fails if it is stale, or if a component has no doc comment.

### Fixed

- The UI Kit screens' page dots ran off the right edge once there were more
  than a dozen screens. They are right-aligned to however many there are.
- Eight core components (`button`, `toggle`, `badge`, `battery`, `signalBars`,
  `pageDots`, `tabBar`, `progressBar`) had no doc comment.

### Tests

- 178 assertions, up from 117. Every component is called with empty, `NaN`,
  infinite, negative and zero-sized input in both surface styles, and a
  component that is added without being added to that test fails it. New
  checks cover image dithering (average tone, bounds, `maxLevel`), icon paths,
  calendar weekday placement, tapes staying inside their rects, overlays
  clearing their area, and the values components return.
- The new screens are held to the same ink budget, contrast lint and
  bitmap-atlas coverage as the old ones.

### Notes

- All of this has been verified in a browser. None of it has been on glasses.
- Components use only type sizes already in the shipped atlas, so
  `public/fonts/inter.json` did not need regenerating.

## 0.4.0

### Fixed

- **System events are no longer taps.** The runtime mapped every bridge event it
  did not recognise to a tap, so returning to the app, leaving it, an exit
  notice or an IMU sample each advanced the screen. Only the four gestures are
  input now. A click whose code is omitted on the wire (it is the protobuf
  default, 0) is still a tap, and taps reported through a text or list container
  are picked up too.
- **A tile that changes and changes back is no longer left stale.** Dirtiness
  was judged against the last *acknowledged* tile. If paint A changed a tile and
  paint B reverted it while A was still on the wire, B looked clean and was
  skipped — and the glasses kept showing A until something else repainted that
  tile, which on a static screen is never. A tile with a write in flight is now
  always re-queued and re-checked at send time.
- **`stop()` during a write ends that session.** A drain loop from before the
  stop could carry on writing after a restart, alongside the new one. Concurrent
  `start()` calls also share one connection attempt instead of creating two pages.
- **`wrap` breaks an over-long word wherever it falls.** It was only broken when
  it was the first word on its line; anywhere else it was placed whole and ran
  out of the box.
- **`fitStyle` scales `leading` with `size`.** A 42px line box kept on a face
  fitted down to 24px left the text floating above its own bottom edge, so a
  `metric` value and its unit stopped sharing a baseline (the SeaState depth
  readout). The demo no longer nudges that panel by hand to compensate.
- **`progressBar` ticks are visible.** They were drawn under the fill, and in
  outline mode were dark lines on an empty track. They are cut out of the fill
  and drawn as faint marks beyond it.
- **Charts tolerate real data.** Empty series, a single sample, a flat line and
  `NaN` gaps no longer produce a chart with no scale or a thrown error;
  `gaugeChart` no longer divides by zero with one tick or `min === max`; very
  long series no longer overflow the stack through `Math.min(...values)`.
- **Degenerate primitives are no-ops, not exceptions**: a zero-radius
  `radialGradient`, a zero-size `gradient`/`ditherRect`/`blit`, a negative
  `sector`/`ring` radius, and `hatch`/`dots`/`gridLines` with a zero step (which
  never returned).
- `quad` and `bezier` honour `alpha`, like every other stroke.
- The layout search's memo key is unique for any surface size, not only 576×288.
- **The preview is styled.** `src/style.css` was never imported, so the dev
  harness and the built demo rendered as bare HTML controls.
- **`lib/` matches the source again.** The committed build predated the
  extended controls (their types were missing) and carried an old font atlas.

### Added

- **Lifecycle input**: `foreground-enter` and `foreground-exit` events. On
  `foreground-enter` the runtime and `GlyphApp` forget what was sent and repaint
  every tile, since a page that was away may not be showing what it showed when
  it left. Neither navigates.
- **A hidden page keeps painting.** `requestAnimationFrame` stops when the page
  is hidden, and an Even Hub app lives in a WebView on a phone that is usually
  locked. `GlyphApp` falls back to a timer while hidden and returns to rAF when
  visible. Background timers are throttled by the host, so expect a low frame
  rate rather than none — this has been tested in a browser, not yet on a phone.
- **`GlyphRuntimeOptions.bridge`** — pass a bridge you already hold instead of
  waiting for a second one. Also what makes the transport testable.
- **`TransportStats.encodedBytes`** — PNG bytes actually handed to the bridge,
  next to the Gray4 cost-model `bytes`.
- **`inputFromEventType`** and **`TileDiff.differs`** are exported.
- **The font atlas is importable**: `@gabrielevierti/glyph/fonts/inter.json`.
- **Extended controls** (`extended.ts`, experimental): `chip`, `compactToggle`,
  `checkBox`, `radioButton`, `sliderTrack`, `stepper`, `compactTabs`,
  `notificationToast`, `spinner`, `skeleton`, `countBadge`, with three UI Kit
  reference screens.
- CI workflow (`.github/workflows/ci.yml`): typecheck, suite, ink report,
  library build, and a check that the committed `lib/` is current. The 0.3.0
  notes announced CI; the workflow file was never in the repository.
- `npm run check` runs everything CI runs. `GLYPH_BROWSER_CHANNEL` /
  `GLYPH_BROWSER_PATH` point the scripts at a browser you already have.

### Changed

- **Tile buffers are reused.** `GlyphFrame.toFrame()` now packs straight from
  the level buffer into storage the frame owns, so a paint allocates no pixel
  data. The `pixels` of a returned frame and of its tiles are valid until the
  next `toFrame()` — copy them if you keep a frame. `GlyphRuntime` already does.
- `GlyphInputEvent` has two new members. A `switch` over it that is checked for
  exhaustiveness needs two more cases (or a default).
- Library chunks have stable names (`lib/chunks/frame.js`), and `lib/` is
  emptied before each build so nothing stale is published.
- `prepublishOnly` runs the suite.

### Performance

- Tile PNG encoding writes Gray4 straight into a cached `ImageData` instead of
  unpacking to an intermediate buffer and allocating a new one per tile.
- Preview conversion uses a 16-entry lookup table.

### Tests

- 117 assertions, up from 77. New: the transport against a recording bridge
  (diffing, revert-in-flight, newest-frame-wins, refused writes, stop/restart,
  input), tile packing for every layout, wrapping, degenerate chart input, the
  hidden-page clock, a check that the committed atlas covers every face the
  reference screens draw, and a load of the preview itself.
- The runner reports a suite that dies midway instead of timing out.

## 0.3.0

### Fixed

- **Tracked text no longer drifts.** `measure` totalled the whole string while
  drawing advanced glyph by glyph, so every centred or right-aligned tracked
  label — which is every `label` and `micro` style — landed slightly off. Both
  paths now sum per-character advances.
- **`wrapClamped` no longer emits a doubled ellipsis.** It appended `"…"` and
  then truncated, which could leave the appended mark inside the width budget
  and produce `text……`. The last line is now truncated raw.
- **`Length = "auto"` is implemented.** It was in the public type and silently
  resolved to a zero-width rect. Items now report an intrinsic size, as a number
  or a `(crossSize) => number`; `"auto"` with no way to measure itself is an
  error. `min` and `max` clamps added.
- **The transport can no longer fall behind forever.** Every render was queued
  behind its predecessor, so once the bridge was slower than the paint loop the
  queue grew without bound. At most one frame now waits; superseded frames are
  counted in `stats.dropped`.
- **Surface style is no longer a module global.** It lives on the raster, so
  layers, screenshot passes and parallel tests cannot corrupt each other.

### Added

- **Bitmap font atlases** (`npm run font`). Metrics and coverage move into the
  repository, which is what makes the committed reference screens reproducible
  on a machine other than the one that made them. The builder discovers the
  faces an app actually uses rather than reading a hand-maintained list.
- **Automatic tile-layout selection.** `ChangeRecorder` records what actually
  changes while a screen animates; `suggest()` searches every guillotine tiling
  on a grid for the cheapest one. Wired into `npm run tiles` and an *optimise*
  button in the preview.
- **Contrast lint.** Ink says how much of the world the UI hides; this says
  whether what hides it can be read. Asserted per screen.
- **On-device transport benchmark** (`npm run bench`): p50/p95 round trip per
  tile and the frame-rate ceiling that falls out of it.
- **Global brightness**, one scalar applied at resolve.
- **`onSlowFrame`**, so a screen that overruns its budget says so.
- Published as a library: `exports` map, separate `runtime` entry, emitted
  types, and the Even SDK demoted to an optional peer dependency.
- CI: typecheck, suite, ink report and library build on every push.

### Performance

- Text measurement is memoized; `fitStyle` binary-searches instead of walking
  down one pixel at a time.
- Transition layers are pooled instead of allocating two full-screen canvases
  per screen change.
- Tile encoding canvases are cached per tile size instead of per tile per frame.
- `toLevels` reads one channel instead of computing luma over three, which is
  identical output for a surface that is gray by construction.

### Notes

- Snapshots need regenerating (`npm run snapshot`): the tracked-text fix moves
  some labels by up to a pixel.

## 0.2.0

Initial public framework: rasterizer, tiling, dirty-tile transport, components,
charts, icons, six reference screens.
