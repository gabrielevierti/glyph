/**
 * Glyph — a graphics and UI framework for the Even Realities G2.
 *
 * The layering, bottom up:
 *   gray/geometry/path   value types and maths, no drawing
 *   font                 bitmap atlases: host-independent metrics and coverage
 *   raster               every drawing primitive, supersampled
 *   text/layout          measurement, wrapping, flex-style boxes
 *   theme/icons          the design system
 *   charts/components    things built out of primitives
 *   frame                framebuffer, tiling, Gray4 packing
 *   autolayout           choosing a tiling from measured change
 *   runtime              transport to the G2
 *   app                  screens, input, paint loop
 *
 * `runtime` is deliberately absent from this barrel: it is the only module that
 * imports the Even SDK, and keeping it out is what lets everything above be
 * rendered and tested with no hardware and no bridge. Import it by path.
 */
export * from "./types.js";
export * from "./gray.js";
export * from "./font.js";
export * from "./geometry.js";
export * from "./path.js";
export * from "./text.js";
export * from "./raster.js";
export * from "./theme.js";
export * from "./layout.js";
export * from "./animate.js";
export * from "./icons.js";
export * from "./charts.js";
export * from "./components.js";
export * from "./frame.js";
export * from "./autolayout.js";
export * from "./app.js";
