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

/** Greedy word wrap. Words longer than the line are broken at character level. */
export function wrap(measure: Measurer, text: string, style: TextStyle, maxWidth: number): string[] {
  const source = prepare(text, style);
  const lines: string[] = [];
  for (const paragraph of source.split("\n")) {
    if (paragraph === "") { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, style) <= maxWidth || line === "") {
        if (measure(candidate, style) > maxWidth && line === "") {
          // A single word too wide for the line: break it.
          let chunk = "";
          for (const ch of word) {
            if (measure(chunk + ch, style) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          line = chunk;
        } else {
          line = candidate;
        }
      } else {
        lines.push(line);
        line = word;
      }
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

/** Wrap, then clamp to a line count, ellipsizing the final line. */
export function wrapClamped(
  measure: Measurer, text: string, style: TextStyle, maxWidth: number, maxLines: number
): string[] {
  const lines = wrap(measure, text, style, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(measure, kept[maxLines - 1] + "…", style, maxWidth);
  return kept;
}

/**
 * Shrink a style until the text fits the given box.
 *
 * Numeric readouts are the one place a design cannot control its own content —
 * "9.1" and "247.8" want the same slot — so the type scale has to yield rather
 * than the layout break.
 */
export function fitStyle(
  measure: Measurer, text: string, style: TextStyle,
  maxWidth: number, maxHeight = Infinity, minSize = 9
): TextStyle {
  let size = Math.min(style.size ?? 16, maxHeight === Infinity ? Infinity : maxHeight);
  let candidate: TextStyle = { ...style, size };
  while (size > minSize && measure(text, candidate) > maxWidth) {
    size -= 1;
    candidate = { ...style, size };
  }
  return candidate;
}
