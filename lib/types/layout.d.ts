import type { Insets, Rect } from "./types.js";
/**
 * A main-axis length: a fixed number of pixels, a share of the leftover space,
 * or `"auto"` — the item's own natural size, which it has to be able to report.
 */
export type Length = number | "auto" | {
    grow: number;
};
export interface FlexItem {
    /** Fixed size along the main axis, a share of the leftover space, or "auto". */
    size?: Length;
    /**
     * Natural main-axis size, used when `size` is `"auto"`. Give a number if you
     * already know it, or a function if measuring is expensive — it is called at
     * most once, and receives the cross-axis extent so text can measure to a wrap
     * width.
     */
    intrinsic?: number | ((crossSize: number) => number);
    /** Size along the cross axis. Defaults to filling. */
    cross?: number;
    /** Cross-axis alignment for this item. */
    align?: "start" | "center" | "end" | "stretch";
    /** Never shrink below this, even when auto/grow arithmetic says otherwise. */
    min?: number;
    /** Never exceed this. */
    max?: number;
}
export interface FlexOptions {
    gap?: number;
    padding?: number | Partial<Insets>;
    /** Main-axis distribution when there is leftover space and nothing grows. */
    justify?: "start" | "center" | "end" | "between" | "around";
    align?: "start" | "center" | "end" | "stretch";
}
/** Lay items out left to right. Returns one rect per item. */
export declare function row(container: Rect, items: FlexItem[], opts?: FlexOptions): Rect[];
/** Lay items out top to bottom. Returns one rect per item. */
export declare function column(container: Rect, items: FlexItem[], opts?: FlexOptions): Rect[];
/** Fixed sizes, shorthand for `row` with numeric sizes. */
export declare function rowOf(container: Rect, sizes: Length[], opts?: FlexOptions): Rect[];
export declare function columnOf(container: Rect, sizes: Length[], opts?: FlexOptions): Rect[];
/** Equal-weight children. */
export declare const grow: (n?: number) => Length;
/** An item sized to its own content. `of` may be a number or a measuring function. */
export declare const auto: (of: number | ((crossSize: number) => number), extra?: Omit<FlexItem, "size" | "intrinsic">) => FlexItem;
/**
 * A simple stack: every child gets the full container, minus padding.
 * Use with explicit z-ordering by draw order.
 */
export declare function stack(container: Rect, padding?: number | Partial<Insets>): Rect;
