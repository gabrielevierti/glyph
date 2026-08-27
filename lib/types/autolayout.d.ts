import type { Rect, TileLayout } from "./types.js";
/**
 * Choosing a tile shape, automatically.
 *
 * Four image containers is a hardware limit, so tiles always cover the same
 * 165,888 pixels between them. The only remaining lever is *shape*: how much of
 * the screen a given change drags along with it. Measured across the reference
 * screens, the gap between the best and worst shape for the same screen is up
 * to 35% of transport — which is a lot of battery to leave on the table because
 * a layout looked tidy.
 *
 * The rule that falls out of the hand-measured table is "put the seams between
 * the regions that change at different rates". That is a rule a computer can
 * follow better than a person can. Record which pixels actually change while a
 * screen animates, then search the space of tilings for the one that costs the
 * fewest bytes on that evidence.
 *
 *   const recorder = new ChangeRecorder();
 *   for (const t of timestamps) recorder.observe(renderAt(t));
 *   const best = recorder.suggest();
 *
 * The search is exhaustive over guillotine tilings on a grid, not a heuristic —
 * at a 16px step there are only a few hundred thousand of them.
 */
export interface ChangeRecorderOptions {
    width?: number;
    height?: number;
    /** Resolution of the change map, in logical pixels. Must divide the surface. */
    cell?: number;
}
export interface LayoutCandidate {
    layout: TileLayout;
    /** Total Gray4 bytes sent across all recorded transitions. */
    bytes: number;
    /** Mean tiles dirtied per transition. */
    tilesPerFrame: number;
}
export interface SuggestOptions {
    /** Cut positions are multiples of this, in logical pixels. Smaller is slower. */
    step?: number;
    /** No tile narrower or shorter than this. */
    minTile?: number;
    /** Name for the produced layout. */
    name?: string;
    /** How many tiles to partition into. Never more than the hardware allows. */
    tiles?: number;
}
/**
 * Accumulates which parts of the surface actually change between frames.
 *
 * Storage is one integral image of changed cells per transition, so asking
 * "did anything inside this rectangle change on frame 7" is four array reads
 * rather than a scan. That is what makes an exhaustive search affordable.
 */
export declare class ChangeRecorder {
    readonly width: number;
    readonly height: number;
    readonly cell: number;
    readonly cols: number;
    readonly rows: number;
    private previous;
    /** One (cols+1)x(rows+1) integral image per observed transition. */
    private integrals;
    constructor(options?: ChangeRecorderOptions);
    get transitions(): number;
    /** Feed one resolved frame. The first call only establishes a baseline. */
    observe(levels: Uint8Array): void;
    reset(): void;
    /** How many recorded transitions touched this rectangle. */
    dirtyCount(r: Rect): number;
    /** Cost of one candidate tiling, in Gray4 bytes across every transition. */
    cost(layout: TileLayout): LayoutCandidate;
    /**
     * Search every guillotine tiling on the step grid and return the cheapest.
     *
     * Guillotine tilings are the ones you can describe as "cut the rectangle, then
     * cut the pieces" — which is every tiling the four-container model can express
     * and, conveniently, exactly the ones a person would think to draw.
     */
    suggest(options?: SuggestOptions): LayoutCandidate;
}
/** Emit a layout as TypeScript, ready to paste into a project. */
export declare function layoutToSource(layout: TileLayout, constName?: string): string;
