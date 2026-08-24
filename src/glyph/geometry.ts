import type { HAlign, Insets, Point, Rect, Size, VAlign } from "./types.js";

export function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

export function insets(top: number, right = top, bottom = top, left = right): Insets {
  return { top, right, bottom, left };
}

export const left = (r: Rect) => r.x;
export const right = (r: Rect) => r.x + r.width;
export const top = (r: Rect) => r.y;
export const bottom = (r: Rect) => r.y + r.height;
export const centerX = (r: Rect) => r.x + r.width / 2;
export const centerY = (r: Rect) => r.y + r.height / 2;
export const center = (r: Rect): Point => ({ x: centerX(r), y: centerY(r) });

/** Shrink a rect. Pass a number for a uniform inset, or per-side insets. */
export function inset(r: Rect, amount: number | Partial<Insets>): Rect {
  const i = typeof amount === "number"
    ? { top: amount, right: amount, bottom: amount, left: amount }
    : { top: 0, right: 0, bottom: 0, left: 0, ...amount };
  return {
    x: r.x + i.left,
    y: r.y + i.top,
    width: Math.max(0, r.width - i.left - i.right),
    height: Math.max(0, r.height - i.top - i.bottom)
  };
}

/** Grow a rect. Inverse of `inset`. */
export function outset(r: Rect, amount: number): Rect {
  return inset(r, -amount);
}

export function offset(r: Rect, dx: number, dy: number): Rect {
  return { x: r.x + dx, y: r.y + dy, width: r.width, height: r.height };
}

export function contains(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x <= right(r) && p.y >= r.y && p.y <= bottom(r);
}

export function intersects(a: Rect, b: Rect): boolean {
  return !(right(a) <= b.x || right(b) <= a.x || bottom(a) <= b.y || bottom(b) <= a.y);
}

export function intersection(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return {
    x, y,
    width: Math.max(0, Math.min(right(a), right(b)) - x),
    height: Math.max(0, Math.min(bottom(a), bottom(b)) - y)
  };
}

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(right(a), right(b)) - x, height: Math.max(bottom(a), bottom(b)) - y };
}

/** Place a size inside a rect according to horizontal and vertical anchors. */
export function align(container: Rect, size: Size, h: HAlign = "center", v: VAlign = "middle"): Rect {
  const x = h === "left" ? container.x
    : h === "right" ? right(container) - size.width
      : container.x + (container.width - size.width) / 2;
  const y = v === "top" ? container.y
    : v === "bottom" ? bottom(container) - size.height
      : container.y + (container.height - size.height) / 2;
  return { x, y, width: size.width, height: size.height };
}

/** Largest rect of the given aspect ratio that fits inside `container`. */
export function aspectFit(container: Rect, aspect: number): Rect {
  const w = Math.min(container.width, container.height * aspect);
  const h = w / aspect;
  return align(container, { width: w, height: h });
}

/** Split a rect into columns by proportional weights. */
export function splitH(r: Rect, weights: number[], gap = 0): Rect[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const usable = r.width - gap * (weights.length - 1);
  const out: Rect[] = [];
  let x = r.x;
  for (const w of weights) {
    const width = (usable * w) / total;
    out.push({ x, y: r.y, width, height: r.height });
    x += width + gap;
  }
  return out;
}

/** Split a rect into rows by proportional weights. */
export function splitV(r: Rect, weights: number[], gap = 0): Rect[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const usable = r.height - gap * (weights.length - 1);
  const out: Rect[] = [];
  let y = r.y;
  for (const w of weights) {
    const height = (usable * w) / total;
    out.push({ x: r.x, y, width: r.width, height });
    y += height + gap;
  }
  return out;
}

/** A uniform grid of cells, filled row-major. */
export function grid(r: Rect, cols: number, rows: number, gap = 0, rowGap = gap): Rect[] {
  const cellW = (r.width - gap * (cols - 1)) / cols;
  const cellH = (r.height - rowGap * (rows - 1)) / rows;
  const out: Rect[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      out.push({ x: r.x + col * (cellW + gap), y: r.y + row * (cellH + rowGap), width: cellW, height: cellH });
    }
  }
  return out;
}

/** Snap a rect to whole logical pixels. Useful for crisp 1px strokes. */
export function snap(r: Rect): Rect {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  return { x, y, width: Math.round(r.x + r.width) - x, height: Math.round(r.y + r.height) - y };
}

/** Point on a circle. Angle in radians, 0 = east, increasing clockwise on screen. */
export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

/** Convert a compass bearing (0 = north, clockwise) to a canvas angle. */
export function bearingToAngle(bearing: number): number {
  return ((bearing - 90) * Math.PI) / 180;
}

export const deg = (radians: number) => (radians * 180) / Math.PI;
export const rad = (degrees: number) => (degrees * Math.PI) / 180;

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Map a value from one range to another, clamped. */
export function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return clamp(outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin), Math.min(outMin, outMax), Math.max(outMin, outMax));
}
