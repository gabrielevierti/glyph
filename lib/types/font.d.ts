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
/** The primary family name of a style, lowercased — the atlas key. */
export declare function familyOf(style: TextStyle): string;
/** A single rasterized face: metrics plus a coverage bitmap. */
export declare class GlyphFont {
    readonly face: GlyphFontFace;
    /** One byte of coverage (0..15) per pixel of the atlas. */
    readonly coverage: Uint8Array;
    private tinted;
    constructor(face: GlyphFontFace);
    get lineHeight(): number;
    get ascent(): number;
    get capHeight(): number;
    advanceOf(ch: string): number;
    /** Width of a string, tracking included. Integer arithmetic, so exactly reproducible. */
    measure(text: string, tracking?: number): number;
    /**
     * An atlas tinted to one gray level, with coverage as alpha.
     *
     * Built once per level per face and cached: drawing text becomes a series of
     * `drawImage` calls out of a canvas the browser already has in VRAM, which is
     * both faster and more deterministic than re-rasterizing outlines.
     */
    tintedAtlas(level: number, makeCanvas: CanvasFactory): HTMLCanvasElement;
    dispose(): void;
}
/**
 * A set of faces. Lookup is exact on (family, weight, size, italic) — Glyph
 * will not scale a bitmap face, because a blurry numeral on a 16-level display
 * is worse than an honest error.
 */
export declare class GlyphFontSet {
    private faces;
    constructor(atlas: GlyphFontAtlas);
    /** The face for a style, or null if this set was not built for that style. */
    find(style: TextStyle): GlyphFont | null;
    has(style: TextStyle): boolean;
    /** Every (family, weight, size) this set covers. Used by the diagnostics screen. */
    keys(): string[];
    dispose(): void;
}
/** Fetch and decode an atlas produced by `npm run font`. */
export declare function loadFontSet(url: string): Promise<GlyphFontSet>;
/**
 * The line box a string occupies, given a face. Kept here rather than on the
 * raster so layout code can size text without owning a canvas.
 */
export declare function fontMetrics(font: GlyphFont, style: TextStyle, text: string): {
    width: number;
    height: number;
};
