import { unpackGray4 } from "./gray.js";
import { prepare } from "./text.js";
import type { CanvasFactory, TextStyle } from "./types.js";

/**
 * Bitmap fonts.
 *
 * Canvas text is measured and rasterized by the host. That is fine until you
 * care that two machines produce the same pixels — and Glyph's regression suite
 * *is* a set of committed PNGs, so it cares a great deal. A font atlas moves
 * both metrics and coverage into the repository: same bytes in, same bytes out,
 * on any machine, in any browser, and in Node with no fonts installed at all.
 *
 * An atlas is rasterized once per (family, weight, size) — the type scale has
 * eleven entries, so eleven-ish faces — by `npm run font`. Glyph never scales a
 * bitmap face: if the exact size is missing it says so rather than quietly
 * producing something blurry.
 *
 * Atlases are fetched, not bundled. A full Inter set is a few hundred KB, which
 * is nothing over a LAN and would be absurd inside the core library.
 */

/** One glyph: [x, y, w, h, left, top, advance] in the atlas bitmap. */
export type GlyphBox = [number, number, number, number, number, number, number];

export interface GlyphFontFace {
  /** Lowercased primary family name, e.g. "inter". */
  family: string;
  weight: number;
  size: number;
  italic?: boolean;
  /** Baseline offset from the top of the em box, in logical pixels. */
  ascent: number;
  lineHeight: number;
  /** Cap height, for optical vertical centring. */
  capHeight: number;
  /** Atlas bitmap dimensions. Width is even — coverage is packed as Gray4. */
  width: number;
  height: number;
  /** Base64 of Gray4-packed coverage, two pixels per byte, high nibble first. */
  data: string;
  glyphs: Record<string, GlyphBox>;
  /** Advance used for characters with no glyph in the atlas. */
  fallbackAdvance: number;
}

export interface GlyphFontAtlas {
  version: 1;
  /** What produced it, for provenance in a diff. */
  generator?: string;
  faces: GlyphFontFace[];
}

function decodeBase64(value: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  // Node
  const buffer = (globalThis as { Buffer?: { from(s: string, enc: string): Uint8Array } }).Buffer;
  if (!buffer) throw new Error("Glyph: no base64 decoder available.");
  return buffer.from(value, "base64");
}

/** The primary family name of a style, lowercased — the atlas key. */
export function familyOf(style: TextStyle): string {
  const list = style.font ?? "Inter";
  const first = list.split(",")[0] ?? "";
  return first.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function faceKey(family: string, weight: number, size: number, italic: boolean): string {
  return `${family}|${weight}|${size}|${italic ? 1 : 0}`;
}

/** A single rasterized face: metrics plus a coverage bitmap. */
export class GlyphFont {
  readonly face: GlyphFontFace;
  /** One byte of coverage (0..15) per pixel of the atlas. */
  readonly coverage: Uint8Array;
  private tinted = new Map<number, HTMLCanvasElement>();

  constructor(face: GlyphFontFace) {
    this.face = face;
    this.coverage = unpackGray4(decodeBase64(face.data), face.width, face.height);
  }

  get lineHeight(): number { return this.face.lineHeight; }
  get ascent(): number { return this.face.ascent; }
  get capHeight(): number { return this.face.capHeight; }

  advanceOf(ch: string): number {
    return this.face.glyphs[ch]?.[6] ?? this.face.fallbackAdvance;
  }

  /** Width of a string, tracking included. Integer arithmetic, so exactly reproducible. */
  measure(text: string, tracking = 0): number {
    let w = 0;
    let n = 0;
    for (const ch of text) { w += this.advanceOf(ch); n++; }
    return w + (n > 1 ? tracking * (n - 1) : 0);
  }

  /**
   * An atlas tinted to one gray level, with coverage as alpha.
   *
   * Built once per level per face and cached: drawing text becomes a series of
   * `drawImage` calls out of a canvas the browser already has in VRAM, which is
   * both faster and more deterministic than re-rasterizing outlines.
   */
  tintedAtlas(level: number, makeCanvas: CanvasFactory): HTMLCanvasElement {
    const cached = this.tinted.get(level);
    if (cached) return cached;
    const { width, height } = this.face;
    const canvas = makeCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Glyph: Canvas 2D unavailable for font tinting.");
    const image = ctx.createImageData(width, height);
    const value = Math.round(Math.max(0, Math.min(15, level)) * 17);
    for (let i = 0; i < this.coverage.length; i++) {
      const j = i * 4;
      image.data[j] = value;
      image.data[j + 1] = value;
      image.data[j + 2] = value;
      image.data[j + 3] = this.coverage[i] * 17;
    }
    ctx.putImageData(image, 0, 0);
    this.tinted.set(level, canvas);
    return canvas;
  }

  dispose(): void { this.tinted.clear(); }
}

/**
 * A set of faces. Lookup is exact on (family, weight, size, italic) — Glyph
 * will not scale a bitmap face, because a blurry numeral on a 16-level display
 * is worse than an honest error.
 */
export class GlyphFontSet {
  private faces = new Map<string, GlyphFont>();

  constructor(atlas: GlyphFontAtlas) {
    for (const face of atlas.faces) {
      this.faces.set(faceKey(face.family, face.weight, face.size, face.italic ?? false), new GlyphFont(face));
    }
  }

  /** The face for a style, or null if this set was not built for that style. */
  find(style: TextStyle): GlyphFont | null {
    const weight = Number(style.weight ?? 500);
    const size = Math.round(style.size ?? 16);
    return this.faces.get(faceKey(familyOf(style), weight, size, style.italic ?? false)) ?? null;
  }

  has(style: TextStyle): boolean { return this.find(style) !== null; }

  /** Every (family, weight, size) this set covers. Used by the diagnostics screen. */
  keys(): string[] { return [...this.faces.keys()].sort(); }

  dispose(): void {
    for (const face of this.faces.values()) face.dispose();
    this.faces.clear();
  }
}

/** Fetch and decode an atlas produced by `npm run font`. */
export async function loadFontSet(url: string): Promise<GlyphFontSet> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Glyph: could not load font atlas ${url} (${response.status}).`);
  const atlas = (await response.json()) as GlyphFontAtlas;
  if (atlas.version !== 1) throw new Error(`Glyph: unsupported font atlas version ${atlas.version}.`);
  return new GlyphFontSet(atlas);
}

/**
 * The line box a string occupies, given a face. Kept here rather than on the
 * raster so layout code can size text without owning a canvas.
 */
export function fontMetrics(font: GlyphFont, style: TextStyle, text: string): { width: number; height: number } {
  return {
    width: font.measure(prepare(text, style), style.tracking ?? 0),
    height: style.leading ?? font.lineHeight
  };
}
