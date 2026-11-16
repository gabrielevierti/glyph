import type { TextStyle } from "./types.js";

export type Measurer = (text: string, style: TextStyle) => number;

export function fontString(style: TextStyle): string {
  const size = style.size ?? 16;
  const weight = style.weight ?? 500;
  const family = style.font ?? "Inter, Helvetica, Arial, sans-serif";
  return `${style.italic ? "italic " : ""}${weight} ${size}px ${family}`;
}

export function leadingOf(style: TextStyle): number {
  return style.leading ?? Math.round((style.size ?? 16) * 1.25);
}

export function prepare(text: string, style: TextStyle): string {
  return style.uppercase ? text.toUpperCase() : text;
}

/** Everything about a style that changes its metrics. The cache key. */
export function styleKey(style: TextStyle): string {
  return `${fontString(style)}|${style.tracking ?? 0}|${style.uppercase ? 1 : 0}`;
}

/**
 * Memoize a measurer.
 *
 * Wrapping, truncation and `fitStyle` all measure the same unchanged labels on
 * every single paint. At 20fps that is thousands of `measureText` calls a
 * second for strings that have not moved. The cache is bounded so a screen
 * showing live numerals cannot grow it without limit.
 */
export function cachedMeasurer(measure: Measurer, limit = 4096): Measurer {
  const cache = new Map<string, number>();
  return (text: string, style: TextStyle): number => {
    const key = `${styleKey(style)}\u0000${text}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const value = measure(text, style);
    if (cache.size >= limit) cache.clear();
    cache.set(key, value);
    return value;
  };
}

/**
 * Greedy word wrap. A word wider than the line is broken at character level,
 * wherever in the paragraph it falls — not only when it happens to come first.
 */
export function wrap(measure: Measurer, text: string, style: TextStyle, maxWidth: number): string[] {
  const source = prepare(text, style);
  const lines: string[] = [];
  for (const paragraph of source.split("\n")) {
    if (paragraph === "") { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, style) <= maxWidth) { line = candidate; continue; }

      // Does not fit after what is already on the line: start a new one.
      if (line) { lines.push(line); line = ""; }
      if (measure(word, style) <= maxWidth) { line = word; continue; }

      // The word alone is wider than a line: break it. Every chunk keeps at
      // least one character, so a box narrower than a glyph still terminates.
      let chunk = "";
      for (const ch of word) {
        if (chunk && measure(chunk + ch, style) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines;
}

/** Truncate to a width, appending an ellipsis if anything was cut. */
export function truncate(measure: Measurer, text: string, style: TextStyle, maxWidth: number, ellipsis = "…"): string {
  const source = prepare(text, style);
  if (measure(source, style) <= maxWidth) return source;
  const dots = measure(ellipsis, style);
  let out = "";
  for (const ch of source) {
    if (measure(out + ch, style) + dots > maxWidth) break;
    out += ch;
  }
  return out.trimEnd() + ellipsis;
}

/**
 * Wrap, then clamp to a line count, ellipsizing the final line.
 *
 * The last line is truncated *raw* — appending the ellipsis first and then
 * truncating can leave the appended mark inside the budget and produce "text……".
 */
export function wrapClamped(
  measure: Measurer, text: string, style: TextStyle, maxWidth: number, maxLines: number
): string[] {
  const lines = wrap(measure, text, style, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  // Force the ellipsis even when the line already fits: content was dropped.
  const dots = measure("…", style);
  let out = "";
  for (const ch of last) {
    if (measure(out + ch, style) + dots > maxWidth) break;
    out += ch;
  }
  kept[maxLines - 1] = out.trimEnd() + "…";
  return kept;
}

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
export function fitStyle(
  measure: Measurer, text: string, style: TextStyle,
  maxWidth: number, maxHeight = Infinity, minSize = 9
): TextStyle {
  const original = style.size ?? 16;
  const ceiling = Math.min(original, maxHeight);
  // The line box shrinks with the glyphs. Keeping a 42px leading on a face that
  // has been fitted down to 24px leaves the text floating in a box nearly twice
  // its height, so anything aligned to that box's top or bottom lands well away
  // from the ink — a value and its unit stop sharing a baseline.
  const at = (steps: number): TextStyle => {
    const size = ceiling - steps;
    return style.leading === undefined || size === original
      ? { ...style, size }
      : { ...style, size, leading: Math.max(1, Math.round((style.leading * size) / original)) };
  };
  if (measure(text, at(0)) <= maxWidth) return at(0);

  // The walk stopped as soon as the size dropped to or below `minSize`, so the
  // candidate list is finite: ceiling, ceiling-1, … down to the first value at
  // or below minSize.
  const limit = Math.max(0, Math.ceil(ceiling - minSize));
  if (measure(text, at(limit)) > maxWidth) return at(limit);

  let lo = 0;        // known not to fit
  let hi = limit;    // known to fit
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (measure(text, at(mid)) <= maxWidth) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/**
 * The first of several styles that fits a width; the last one if none does.
 *
 * `fitStyle` shrinks a face one pixel at a time, which is right for a hero
 * numeral and wrong for anything drawn from a bitmap atlas: 17px is not a size
 * the atlas has. This steps through sizes that exist — the type scale — so a
 * fitted label is still a face that was actually built.
 */
export function pickStyle(measure: Measurer, text: string, styles: TextStyle[], maxWidth: number): TextStyle {
  for (const style of styles) {
    if (measure(text, style) <= maxWidth) return style;
  }
  return styles[styles.length - 1] ?? {};
}
