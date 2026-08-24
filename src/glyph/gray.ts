import type { Gray } from "./types.js";

/** Number of distinct display levels on the G2. */
export const LEVELS = 16;
/** Multiplier to take a 0..15 level to an 0..255 byte. */
export const LEVEL_STEP = 255 / (LEVELS - 1); // 17

export function clampGray(g: number): Gray {
  return g < 0 ? 0 : g > 15 ? 15 : Math.round(g);
}

export function grayToByte(g: number): number {
  return Math.round(clampGray(g) * LEVEL_STEP);
}

export function byteToGray(b: number): Gray {
  return clampGray(b / LEVEL_STEP);
}

export function grayToCss(g: number): string {
  const v = grayToByte(g);
  return `rgb(${v},${v},${v})`;
}

/** Linear interpolation between two levels. Returns a float; quantize when you need a level. */
export function mixGray(a: number, b: number, t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return a + (b - a) * k;
}

/**
 * 4x4 ordered (Bayer) dither matrix, normalized to 0..1.
 * Used to render sub-level tones on a display that only has 16 of them.
 */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map((row) => row.map((v) => (v + 0.5) / 16));

/**
 * Quantize a fractional gray level to a real one, using the dither matrix to
 * distribute the error spatially. Gives you smooth ramps out of 16 levels.
 */
export function ditherGray(x: number, y: number, value: number): Gray {
  const v = value < 0 ? 0 : value > 15 ? 15 : value;
  const floor = Math.floor(v);
  const frac = v - floor;
  const threshold = BAYER4[y & 3][x & 3];
  return clampGray(frac > threshold ? floor + 1 : floor);
}

/** FNV-1a over a byte buffer. Cheap, good enough for dirty-tile detection. */
export function hashBytes(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pack one byte per pixel (0..15) into two pixels per byte, high nibble first. */
export function packGray4(pixels: Uint8Array, width: number, height: number): Uint8Array {
  if (width % 2 !== 0) throw new Error("Glyph: Gray4 packing requires an even tile width.");
  const out = new Uint8Array((width * height) >> 1);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x += 2) {
      out[p++] = ((pixels[row + x] & 0x0f) << 4) | (pixels[row + x + 1] & 0x0f);
    }
  }
  return out;
}

/** Inverse of `packGray4`. */
export function unpackGray4(packed: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) {
    const b = packed[i >> 1];
    out[i] = (i & 1) === 0 ? (b >> 4) & 0x0f : b & 0x0f;
  }
  return out;
}

/** Expand a level buffer to RGBA for canvas display. */
export function grayToRgba(pixels: Uint8Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    const v = grayToByte(pixels[i]);
    const j = i * 4;
    out[j] = v; out[j + 1] = v; out[j + 2] = v; out[j + 3] = 255;
  }
  return out;
}
