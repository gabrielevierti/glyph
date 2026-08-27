import type { Gray } from "./types.js";
/** Number of distinct display levels on the G2. */
export declare const LEVELS = 16;
/** Multiplier to take a 0..15 level to an 0..255 byte. */
export declare const LEVEL_STEP: number;
export declare function clampGray(g: number): Gray;
export declare function grayToByte(g: number): number;
export declare function byteToGray(b: number): Gray;
export declare function grayToCss(g: number): string;
/** Linear interpolation between two levels. Returns a float; quantize when you need a level. */
export declare function mixGray(a: number, b: number, t: number): number;
/**
 * 4x4 ordered (Bayer) dither matrix, normalized to 0..1.
 * Used to render sub-level tones on a display that only has 16 of them.
 */
export declare const BAYER4: number[][];
/**
 * Quantize a fractional gray level to a real one, using the dither matrix to
 * distribute the error spatially. Gives you smooth ramps out of 16 levels.
 */
export declare function ditherGray(x: number, y: number, value: number): Gray;
/** FNV-1a over a byte buffer. Cheap, good enough for dirty-tile detection. */
export declare function hashBytes(bytes: Uint8Array): number;
/** Pack one byte per pixel (0..15) into two pixels per byte, high nibble first. */
export declare function packGray4(pixels: Uint8Array, width: number, height: number): Uint8Array;
/** Inverse of `packGray4`. */
export declare function unpackGray4(packed: Uint8Array, width: number, height: number): Uint8Array;
/** Expand a level buffer to RGBA for canvas display. */
export declare function grayToRgba(pixels: Uint8Array): Uint8ClampedArray;
