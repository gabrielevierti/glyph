/**
 * Small numeric guards shared by the component modules.
 *
 * Components are fed live data — a sensor that has not reported yet, a division
 * that had nothing to divide — and canvas answers a NaN coordinate by drawing
 * nothing at all, silently. Every component takes its numbers through these so
 * a hole in the data is a sensible default rather than a missing widget.
 *
 * Internal: not re-exported from the package entry.
 */
/** `value` if it is a finite number, otherwise `fallback`. */
export declare function finite(value: number | undefined | null, fallback?: number): number;
/** Clamp to 0..1, treating anything non-finite as 0. */
export declare function unit(value: number | undefined | null): number;
/** `value` if it is finite and greater than zero, otherwise `fallback`. */
export declare function positive(value: number | undefined | null, fallback: number): number;
/** A whole number within bounds, for counts that drive loops. */
export declare function count(value: number | undefined | null, fallback: number, min: number, max: number): number;
/** Wrap degrees into 0..360. */
export declare function norm360(degrees: number): number;
/** Is `value` a whole multiple of `step`, allowing for float error? */
export declare function isMultiple(value: number, step: number): boolean;
