import type { TextStyle } from "./types.js";
export type Measurer = (text: string, style: TextStyle) => number;
export declare function fontString(style: TextStyle): string;
export declare function leadingOf(style: TextStyle): number;
export declare function prepare(text: string, style: TextStyle): string;
/** Everything about a style that changes its metrics. The cache key. */
export declare function styleKey(style: TextStyle): string;
/**
 * Memoize a measurer.
 *
 * Wrapping, truncation and `fitStyle` all measure the same unchanged labels on
 * every single paint. At 20fps that is thousands of `measureText` calls a
 * second for strings that have not moved. The cache is bounded so a screen
 * showing live numerals cannot grow it without limit.
 */
export declare function cachedMeasurer(measure: Measurer, limit?: number): Measurer;
/** Greedy word wrap. Words longer than the line are broken at character level. */
export declare function wrap(measure: Measurer, text: string, style: TextStyle, maxWidth: number): string[];
/** Truncate to a width, appending an ellipsis if anything was cut. */
export declare function truncate(measure: Measurer, text: string, style: TextStyle, maxWidth: number, ellipsis?: string): string;
/**
 * Wrap, then clamp to a line count, ellipsizing the final line.
 *
 * The last line is truncated *raw* — appending the ellipsis first and then
 * truncating can leave the appended mark inside the budget and produce "text……".
 */
export declare function wrapClamped(measure: Measurer, text: string, style: TextStyle, maxWidth: number, maxLines: number): string[];
/**
 * Shrink a style until the text fits the given box.
 *
 * Numeric readouts are the one place a design cannot control its own content —
 * "9.1" and "247.8" want the same slot — so the type scale has to yield rather
 * than the layout break.
 *
 * The search is binary rather than a walk down one pixel at a time: a 64px hero
 * falling to 12px is six measurements instead of fifty-two, on every paint, for
 * every readout on the screen. It steps through exactly the same candidate
 * sizes the walk did, so it returns exactly the same answer.
 */
export declare function fitStyle(measure: Measurer, text: string, style: TextStyle, maxWidth: number, maxHeight?: number, minSize?: number): TextStyle;
