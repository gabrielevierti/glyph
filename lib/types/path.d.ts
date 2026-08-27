import type { Point } from "./types.js";
type Cmd = {
    op: "M";
    x: number;
    y: number;
} | {
    op: "L";
    x: number;
    y: number;
} | {
    op: "Q";
    cx: number;
    cy: number;
    x: number;
    y: number;
} | {
    op: "C";
    c1x: number;
    c1y: number;
    c2x: number;
    c2y: number;
    x: number;
    y: number;
} | {
    op: "A";
    cx: number;
    cy: number;
    r: number;
    start: number;
    end: number;
    ccw: boolean;
} | {
    op: "Z";
};
/**
 * A resolution-independent path. Built once, replayed into any raster at any
 * scale — which is how icons stay sharp at 10px and 64px from one definition.
 */
export declare class GlyphPath {
    readonly commands: Cmd[];
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadTo(cx: number, cy: number, x: number, y: number): this;
    curveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this;
    arc(cx: number, cy: number, r: number, start: number, end: number, ccw?: boolean): this;
    close(): this;
    /** Append a run of points as a polyline. */
    polyline(points: Point[]): this;
    /** Replay into a 2D context, optionally translated and scaled. */
    apply(ctx: CanvasRenderingContext2D, x?: number, y?: number, scale?: number): void;
    /** Axis-aligned bounds of the control points. Approximate for curves. */
    bounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/**
 * Parse a compact path string. Supports a useful subset of SVG path data —
 * absolute M, L, H, V, C, Q, Z — plus `O cx cy r` for a full circle.
 * Icons are authored in this syntax on a 24x24 grid.
 */
export declare function parsePath(d: string): GlyphPath;
export {};
