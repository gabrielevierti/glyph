# Changelog

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
