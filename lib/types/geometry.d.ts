import type { HAlign, Insets, Point, Rect, Size, VAlign } from "./types.js";
export declare function rect(x: number, y: number, width: number, height: number): Rect;
export declare function insets(top: number, right?: number, bottom?: number, left?: number): Insets;
export declare const left: (r: Rect) => number;
export declare const right: (r: Rect) => number;
export declare const top: (r: Rect) => number;
export declare const bottom: (r: Rect) => number;
export declare const centerX: (r: Rect) => number;
export declare const centerY: (r: Rect) => number;
export declare const center: (r: Rect) => Point;
/** Shrink a rect. Pass a number for a uniform inset, or per-side insets. */
export declare function inset(r: Rect, amount: number | Partial<Insets>): Rect;
/** Grow a rect. Inverse of `inset`. */
export declare function outset(r: Rect, amount: number): Rect;
export declare function offset(r: Rect, dx: number, dy: number): Rect;
export declare function contains(r: Rect, p: Point): boolean;
export declare function intersects(a: Rect, b: Rect): boolean;
export declare function intersection(a: Rect, b: Rect): Rect;
export declare function union(a: Rect, b: Rect): Rect;
/** Place a size inside a rect according to horizontal and vertical anchors. */
export declare function align(container: Rect, size: Size, h?: HAlign, v?: VAlign): Rect;
/** Largest rect of the given aspect ratio that fits inside `container`. */
export declare function aspectFit(container: Rect, aspect: number): Rect;
/** Split a rect into columns by proportional weights. */
export declare function splitH(r: Rect, weights: number[], gap?: number): Rect[];
/** Split a rect into rows by proportional weights. */
export declare function splitV(r: Rect, weights: number[], gap?: number): Rect[];
/** A uniform grid of cells, filled row-major. */
export declare function grid(r: Rect, cols: number, rows: number, gap?: number, rowGap?: number): Rect[];
/** Snap a rect to whole logical pixels. Useful for crisp 1px strokes. */
export declare function snap(r: Rect): Rect;
/** Point on a circle. Angle in radians, 0 = east, increasing clockwise on screen. */
export declare function polar(cx: number, cy: number, radius: number, angle: number): Point;
/** Convert a compass bearing (0 = north, clockwise) to a canvas angle. */
export declare function bearingToAngle(bearing: number): number;
export declare const deg: (radians: number) => number;
export declare const rad: (degrees: number) => number;
export declare function clamp(v: number, min: number, max: number): number;
export declare function lerp(a: number, b: number, t: number): number;
/** Map a value from one range to another, clamped. */
export declare function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
