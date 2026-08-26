/**
 * Core value types for Glyph.
 *
 * Everything in Glyph is expressed in *logical* pixels on a 576x288 surface
 * with 16 levels of gray (0 = off, 15 = full). Nothing here knows about the
 * Even SDK, canvases, or transport.
 */

/** A display level, 0..15. */
export type Gray = number;

export interface Point { x: number; y: number; }
export interface Size { width: number; height: number; }
export interface Rect { x: number; y: number; width: number; height: number; }

/** Per-side insets, in logical pixels. */
export interface Insets { top: number; right: number; bottom: number; left: number; }

/** Per-corner radii, clockwise from top-left. */
export type Corners = number | [number, number, number, number];

export type LineCap = "butt" | "round" | "square";
export type LineJoin = "miter" | "round" | "bevel";

/**
 * How a shape is painted. Every drawing call takes one of these.
 * `fill` and `stroke` are gray levels; omit one to skip that pass.
 */
export interface Paint {
  fill?: Gray;
  stroke?: Gray;
  /** Stroke width in logical pixels. Fractional widths are fine — we supersample. */
  width?: number;
  /** Dash pattern in logical pixels, e.g. [4, 3]. */
  dash?: number[];
  dashOffset?: number;
  cap?: LineCap;
  join?: LineJoin;
  /** 0..1. Composited against what is already on the surface. */
  alpha?: number;
}

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

export interface TextStyle {
  font?: string;
  size?: number;
  weight?: string | number;
  italic?: boolean;
  /** Extra tracking in logical pixels, applied per character. */
  tracking?: number;
  /** Line height in logical pixels. Defaults to size * 1.25. */
  leading?: number;
  uppercase?: boolean;
}

/**
 * How surfaces are drawn.
 *
 * The G2 is see-through: every lit pixel is a pixel of the world you cannot
 * see through. A filled card that would read as "elevated" on a phone reads as
 * "smudge on the lens" on a waveguide, so `outline` is the default. `filled`
 * is kept for the browser preview and for screenshots, where a solid surface
 * photographs better and nothing is being occluded.
 *
 * This lives on the raster, not in a module global — two rasters (a screen and
 * an offscreen layer, a test and the app it is testing) can disagree, and a
 * parallel test run cannot corrupt another test's setting.
 */
export type SurfaceStyle = "outline" | "filled";

/** Anything carrying a surface style. Components take a raster; this is all they need. */
export interface SurfaceStyled { surface: SurfaceStyle; }

/** A tile of packed Gray4 data destined for one G2 image container. */
export interface Tile {
  id: number;
  name: string;
  rect: Rect;
  /** Packed 4-bit gray, two pixels per byte, high nibble first. */
  pixels: Uint8Array;
  /** FNV-1a hash of `pixels`, used for dirty-tile diffing. */
  hash: number;
}

export interface TileSlot {
  id: number;
  name: string;
  x: number;
  y: number;
  /** Tile width. Must be even — Gray4 packs two pixels per byte. */
  width: number;
  height: number;
  zOrder: number;
}

export interface TileLayout {
  name: string;
  /** What this shape is good at, shown in the dev preview. */
  note?: string;
  tiles: TileSlot[];
}

/** One resolved screen: the whole framebuffer plus its tiling. */
export interface Frame {
  width: number;
  height: number;
  /** One byte per pixel, values 0..15, row-major. */
  pixels: Uint8Array;
  tiles: Tile[];
}

/** A canvas factory. Injected so the raster can run outside a browser. */
export type CanvasFactory = (w: number, h: number) => HTMLCanvasElement;

export interface RasterOptions {
  width?: number;
  height?: number;
  /** Device pixels per logical pixel. 2 is a good default; 3 for print-quality stills. */
  supersample?: number;
  background?: Gray;
  /** Injected for headless use. Defaults to `document.createElement("canvas")`. */
  createCanvas?: CanvasFactory;
  /** How panels and tracks are drawn. Defaults to `outline`. */
  surface?: SurfaceStyle;
  /**
   * Global output scale, 0..1, applied once at resolve. The whole design dims
   * together — useful indoors, or for a low-power mode, without touching a
   * single component.
   */
  brightness?: number;
  /** Collect contrast warnings while drawing. Development and tests only. */
  lint?: boolean | { minDelta: number };
}
