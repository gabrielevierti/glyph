import { inset } from "./geometry.js";
import type { Insets, Rect } from "./types.js";

/**
 * A main-axis length: a fixed number of pixels, a share of the leftover space,
 * or `"auto"` — the item's own natural size, which it has to be able to report.
 */
export type Length = number | "auto" | { grow: number };

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

function intrinsicOf(item: FlexItem, crossSize: number, index: number): number {
  const source = item.intrinsic;
  if (typeof source === "number") return source;
  if (typeof source === "function") return source(crossSize);
  throw new Error(
    `Glyph: flex item ${index} has size "auto" but no \`intrinsic\`. ` +
    `Give it a number, or a (crossSize) => number, so it can report its own size.`
  );
}

function clampLength(value: number, item: FlexItem): number {
  let v = value;
  if (item.min !== undefined) v = Math.max(v, item.min);
  if (item.max !== undefined) v = Math.min(v, item.max);
  return Math.max(0, v);
}

function resolve(
  container: Rect, items: FlexItem[], opts: FlexOptions, horizontal: boolean
): Rect[] {
  const box = opts.padding !== undefined ? inset(container, opts.padding) : container;
  const gap = opts.gap ?? 0;
  const mainSize = horizontal ? box.width : box.height;
  const crossSize = horizontal ? box.height : box.width;
  const totalGap = gap * Math.max(0, items.length - 1);

  let fixed = 0;
  let growTotal = 0;
  const sizes = items.map((item, i) => {
    const s = item.size ?? { grow: 1 };
    if (typeof s === "number") { const v = clampLength(s, item); fixed += v; return v; }
    if (s === "auto") { const v = clampLength(intrinsicOf(item, crossSize, i), item); fixed += v; return v; }
    growTotal += s.grow;
    return null;
  });

  const free = Math.max(0, mainSize - fixed - totalGap);
  const resolved = sizes.map((s, i) => {
    if (s !== null) return s;
    const spec = items[i].size as { grow: number };
    return clampLength(growTotal > 0 ? (free * spec.grow) / growTotal : 0, items[i]);
  });

  const used = resolved.reduce((a, b) => a + b, 0) + totalGap;
  const slack = Math.max(0, mainSize - used);
  const justify = opts.justify ?? "start";
  let cursor = (horizontal ? box.x : box.y)
    + (justify === "center" ? slack / 2 : justify === "end" ? slack : 0);
  const between = justify === "between" && items.length > 1 ? slack / (items.length - 1)
    : justify === "around" && items.length > 0 ? slack / items.length : 0;
  if (justify === "around") cursor += between / 2;

  return items.map((item, i) => {
    const main = resolved[i];
    const cross = item.cross ?? crossSize;
    const alignment = item.align ?? opts.align ?? "stretch";
    const crossExtent = alignment === "stretch" && item.cross === undefined ? crossSize : cross;
    const crossOffset = alignment === "center" ? (crossSize - crossExtent) / 2
      : alignment === "end" ? crossSize - crossExtent : 0;

    const r: Rect = horizontal
      ? { x: cursor, y: box.y + crossOffset, width: main, height: crossExtent }
      : { x: box.x + crossOffset, y: cursor, width: crossExtent, height: main };
    cursor += main + gap + between;
    return r;
  });
}

/** Lay items out left to right. Returns one rect per item. */
export function row(container: Rect, items: FlexItem[], opts: FlexOptions = {}): Rect[] {
  return resolve(container, items, opts, true);
}

/** Lay items out top to bottom. Returns one rect per item. */
export function column(container: Rect, items: FlexItem[], opts: FlexOptions = {}): Rect[] {
  return resolve(container, items, opts, false);
}

/** Fixed sizes, shorthand for `row` with numeric sizes. */
export function rowOf(container: Rect, sizes: Length[], opts: FlexOptions = {}): Rect[] {
  return row(container, sizes.map((size) => ({ size })), opts);
}

export function columnOf(container: Rect, sizes: Length[], opts: FlexOptions = {}): Rect[] {
  return column(container, sizes.map((size) => ({ size })), opts);
}

/** Equal-weight children. */
export const grow = (n = 1): Length => ({ grow: n });

/** An item sized to its own content. `of` may be a number or a measuring function. */
export const auto = (of: number | ((crossSize: number) => number), extra: Omit<FlexItem, "size" | "intrinsic"> = {}): FlexItem =>
  ({ size: "auto", intrinsic: of, ...extra });

/**
 * A simple stack: every child gets the full container, minus padding.
 * Use with explicit z-ordering by draw order.
 */
export function stack(container: Rect, padding: number | Partial<Insets> = 0): Rect {
  return inset(container, padding);
}
