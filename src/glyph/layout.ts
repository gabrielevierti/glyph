import type { Rect } from "./types";

export function inset(rect: Rect, amount: number): Rect {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: Math.max(0, rect.width - amount * 2),
    height: Math.max(0, rect.height - amount * 2)
  };
}

export function splitColumns(rect: Rect, widths: number[], gap = 0): Rect[] {
  const out: Rect[] = [];
  let x = rect.x;
  for (const width of widths) {
    out.push({ x, y: rect.y, width, height: rect.height });
    x += width + gap;
  }
  return out;
}

export function center(rect: Rect, width: number, height: number): Rect {
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height
  };
}
