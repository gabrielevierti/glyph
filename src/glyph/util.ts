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
export function finite(value: number | undefined | null, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Clamp to 0..1, treating anything non-finite as 0. */
export function unit(value: number | undefined | null): number {
  const v = finite(value);
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** `value` if it is finite and greater than zero, otherwise `fallback`. */
export function positive(value: number | undefined | null, fallback: number): number {
  const v = finite(value, fallback);
  return v > 0 ? v : fallback;
}

/** A whole number within bounds, for counts that drive loops. */
export function count(value: number | undefined | null, fallback: number, min: number, max: number): number {
  const v = Math.round(finite(value, fallback));
  return v < min ? min : v > max ? max : v;
}

/** Wrap degrees into 0..360. */
export function norm360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Is `value` a whole multiple of `step`, allowing for float error? */
export function isMultiple(value: number, step: number): boolean {
  if (!(step > 0)) return false;
  const q = value / step;
  return Math.abs(q - Math.round(q)) < 1e-6;
}
