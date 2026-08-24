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
  zOrder: number;
}

export interface TileLayout {
  /** Tile dimensions. Width must be even (Gray4 packs two pixels per byte). */
  width: number;
  height: number;
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

export interface RasterOptions {
  width?: number;
  height?: number;
  /** Device pixels per logical pixel. 2 is a good default; 3 for print-quality stills. */
  supersample?: number;
  background?: Gray;
  /** Injected for headless use. Defaults to `document.createElement("canvas")`. */
  createCanvas?: (w: number, h: number) => HTMLCanvasElement;
}
