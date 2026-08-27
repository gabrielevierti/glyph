import { GlyphRaster } from "./raster.js";
import type { Frame, RasterOptions, SurfaceStyle, Tile, TileLayout } from "./types.js";
/**
 * The G2 accepts a maximum of four image containers per page. This is a
 * hardware limit, not a firmware one — the Even Hub simulator will happily
 * accept twelve, which is a trap worth knowing about.
 */
export declare const MAX_IMAGE_CONTAINERS = 4;
/**
 * With only four containers you cannot buy diffing granularity by making tiles
 * smaller — four tiles always cover 165,888 pixels between them. What you *can*
 * choose is their shape, and shape decides how much of the screen a given
 * change drags along with it.
 *
 * Pick the layout whose seams fall between the parts of your screen that change
 * at different rates. A ticking clock in a top band dirties 25% of the surface;
 * the same clock in a quadrant layout dirties 25% too, but a full-width status
 * bar above it dirties 50%. The shape is the whole decision.
 */
export declare const TILE_QUADRANTS: TileLayout;
export declare const TILE_BANDS: TileLayout;
export declare const TILE_COLUMNS: TileLayout;
/**
 * Non-uniform: a thin full-width strip for chrome that rarely changes, and
 * three columns beneath it. Tiles do not have to be the same size, which is
 * the lever that survives the four-container cap.
 */
export declare const TILE_CHROME: TileLayout;
/** Split for a screen with one dominant panel and a narrow rail. */
export declare const TILE_HERO: TileLayout;
export declare const TILE_LAYOUTS: {
    readonly quadrants: TileLayout;
    readonly bands: TileLayout;
    readonly columns: TileLayout;
    readonly chrome: TileLayout;
    readonly hero: TileLayout;
};
export type TileLayoutName = keyof typeof TILE_LAYOUTS;
/**
 * Verify a layout covers the surface exactly once and fits the container cap.
 * Returns the problems rather than throwing, so tools can report them all.
 */
export declare function validateLayout(layout: TileLayout, width?: number, height?: number): string[];
/**
 * Which tiles changed since the last frame.
 *
 * Both the app shell and the transport need this answer, and for a while they
 * each kept their own copy of the bookkeeping — two places to get subtly out of
 * step. One object, two instances of it.
 */
export declare class TileDiff {
    private hashes;
    /** Tiles whose contents differ from the last call. Records them as seen. */
    changed(tiles: Tile[]): Tile[];
    /** Peek without recording — for a transport that may fail to deliver. */
    peek(tiles: Tile[]): Tile[];
    accept(tile: Tile): void;
    reject(tile: Tile): void;
    /** Forget everything, so the next comparison reports a full repaint. */
    reset(): void;
}
/**
 * A framebuffer plus its tiling.
 *
 * `toFrame()` reuses its buffers between calls, so a steady-state app allocates
 * nothing per frame. Tile hashes are kept so the runtime can skip tiles that
 * did not change — which on a typical screen is most of them.
 */
export declare class GlyphFrame {
    readonly raster: GlyphRaster;
    readonly tileLayout: TileLayout;
    private levels;
    private tileBuffers;
    constructor(options?: RasterOptions & {
        tileLayout?: TileLayout;
    });
    get width(): number;
    get height(): number;
    /** How panels and tracks draw themselves on this frame's surface. */
    get surface(): SurfaceStyle;
    set surface(style: SurfaceStyle);
    /** Release the underlying canvases. */
    dispose(): void;
    /** Paint into the framebuffer. */
    draw(fn: (g: GlyphRaster) => void): this;
    /** Resolve to levels only — for the browser preview, which needs no tiling. */
    toLevels(): Uint8Array;
    /** Resolve, slice and pack. Pass levels from `toLevels()` to avoid resolving twice. */
    toFrame(levels?: Uint8Array): Frame;
}
