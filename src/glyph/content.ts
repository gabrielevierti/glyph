/**
 * Content: the pieces a screen is filled with once the instruments and the
 * chrome are in place — people, messages, tables, schedules, media.
 *
 * Phone components carry meaning in colour and in filled shapes. Neither
 * survives here, so each of these was redrawn around what does: weight of
 * stroke, level of gray, dashed against solid, hollow against filled.
 */
import { ringChart } from "./charts.js";
import { panel, progressBar, stat } from "./components.js";
import { chip } from "./extended.js";
import { bottom, centerX, centerY, clamp, right } from "./geometry.js";
import { icon, iconFilled } from "./icons.js";
import { leadingOf, pickStyle, truncate, wrap } from "./text.js";
import { gray as G, isOutline, radius as R, space as S, type as T } from "./theme.js";
import { count, finite, positive, unit } from "./util.js";
import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Corners, Gray, HAlign, Rect, TextStyle } from "./types.js";

const NUM: TextStyle = { ...T.numeral, size: 12, leading: 14 };
const MICRO8: TextStyle = { ...T.micro, size: 8 };
const PLAIN_MICRO: TextStyle = { ...T.micro, tracking: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// Headers and cards
// ─────────────────────────────────────────────────────────────────────────────

/** The title strip of a screen: where you are, optionally how to go back, and one accessory. */
export function screenHeader(
  g: GlyphRaster, r: Rect, title: string,
  opts: { back?: boolean; subtitle?: string; accessory?: string; icon?: GlyphIconName } = {}
): void {
  const cy = r.y + Math.min(r.height, 22) / 2;
  let x = r.x;
  if (opts.back) { icon(g, "chevron-left", x + 5, cy, 13, G.secondary); x += 16; }
  if (opts.icon) { icon(g, opts.icon, x + 8, cy, 15, G.strong); x += 22; }
  const accessoryW = opts.accessory ? g.measure(opts.accessory, T.micro) + 10 : 0;
  const room = right(r) - accessoryW - x;
  const shown = truncate(g.measure, title, T.title, room);
  g.text(shown, x, cy, T.title, G.max, "left", "middle");
  if (opts.subtitle) {
    const sx = x + g.measure(shown, T.title) + 9;
    if (right(r) - accessoryW - sx > 24) {
      g.text(truncate(g.measure, opts.subtitle, T.caption, right(r) - accessoryW - sx), sx, cy + 2, T.caption, G.tertiary, "left", "middle");
    }
  }
  if (opts.accessory) g.text(opts.accessory, right(r), cy, T.micro, G.secondary, "right", "middle");
  g.hline(r.x, right(r), bottom(r) - 1, G.hairline);
}

/** A panel with a heading. Returns the rect left over for its content. */
export function card(
  g: GlyphRaster, r: Rect,
  opts: { title?: string; subtitle?: string; icon?: GlyphIconName; accessory?: string; selected?: boolean } = {}
): Rect {
  panel(g, r, opts.selected ? { stroke: G.max, strokeWidth: 1.5 } : {});
  let top = r.y + S.md;
  if (opts.title || opts.icon || opts.accessory) {
    let x = r.x + S.md;
    const rowY = top + 8;
    if (opts.icon) { icon(g, opts.icon, x + 8, rowY + (opts.subtitle ? 7 : 0), 16, opts.selected ? G.max : G.strong); x += 24; }
    const accessoryW = opts.accessory ? g.measure(opts.accessory, T.micro) + 8 : 0;
    if (opts.title) {
      g.text(truncate(g.measure, opts.title, T.bodyStrong, right(r) - S.md - accessoryW - x), x, rowY, T.bodyStrong, G.max, "left", "middle");
    }
    if (opts.accessory) g.text(opts.accessory, right(r) - S.md, rowY, T.micro, G.tertiary, "right", "middle");
    if (opts.subtitle) {
      g.text(truncate(g.measure, opts.subtitle, T.caption, right(r) - S.md - x), x, rowY + 15, T.caption, G.tertiary, "left", "middle");
      top += 15;
    }
    top += 22;
  }
  return { x: r.x + S.md, y: top, width: Math.max(0, r.width - S.md * 2), height: Math.max(0, bottom(r) - S.md - top) };
}

/** A grid of labelled figures, ruled apart — a spec sheet. */
export function statGrid(
  g: GlyphRaster, r: Rect, items: ReadonlyArray<{ label: string; value: string }>,
  opts: { columns?: number } = {}
): void {
  if (items.length === 0) return;
  const cols = count(opts.columns, 2, 1, 6);
  const rows = Math.ceil(items.length / cols);
  const cellW = r.width / cols;
  const cellH = r.height / rows;
  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = r.x + col * cellW;
    const y = r.y + row * cellH;
    if (col > 0) g.vline(x, y + 3, y + cellH - 3, G.hairline);
    if (row > 0 && col === 0) g.hline(r.x, right(r), y, G.hairline);
    const pad = col > 0 ? 10 : 0;
    stat(g, { x: x + pad, y: y + Math.max(3, (cellH - 28) / 2), width: cellW - pad - 4, height: 28 }, item.label, item.value);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// People and messages
// ─────────────────────────────────────────────────────────────────────────────

export type Presence = "online" | "busy" | "away" | "offline";

/** Presence as a shape, since it cannot be a colour: solid, barred, ring, dim ring. */
export function statusDot(g: GlyphRaster, cx: number, cy: number, state: Presence, radius = 3.5): void {
  const rad = Math.max(1.5, finite(radius, 3.5));
  if (state === "online") g.circle(cx, cy, rad, { fill: G.max });
  else if (state === "busy") {
    g.circle(cx, cy, rad, { fill: G.max });
    g.rect({ x: cx - rad + 1.3, y: cy - 0.75, width: Math.max(0, rad * 2 - 2.6), height: 1.5 }, { fill: G.off });
  } else g.circle(cx, cy, rad - 0.6, { stroke: state === "away" ? G.strong : G.disabled, width: 1.3 });
}

/** A person as a circle with initials or an icon, and optionally whether they are around. */
export function avatar(
  g: GlyphRaster, cx: number, cy: number, radius: number,
  opts: { initials?: string; icon?: GlyphIconName; presence?: Presence; selected?: boolean } = {}
): void {
  const rad = Math.max(4, finite(radius, 12));
  if (!isOutline(g)) g.circle(cx, cy, rad, { fill: G.raised });
  g.circle(cx, cy, rad, { stroke: opts.selected ? G.max : G.border, width: opts.selected ? 1.5 : 1 });

  if (opts.icon) icon(g, opts.icon, cx, cy, rad * 1.1, G.strong);
  else {
    const text = (opts.initials ?? "?").trim().slice(0, 2).toUpperCase();
    const style = rad >= 13 ? T.bodyStrong : rad >= 9 ? { ...T.label, tracking: 0 } : { ...MICRO8, tracking: 0 };
    g.text(text, cx, cy + 0.5, style, opts.selected ? G.max : G.primary, "center", "middle");
  }
  if (opts.presence) {
    const px = cx + rad * 0.71;
    const py = cy + rad * 0.71;
    g.circle(px, py, 5, { fill: G.off });
    statusDot(g, px, py, opts.presence, 3.2);
  }
}

/** Several people, overlapping, with a "+N" for the ones that do not fit. Returns the width used. */
export function avatarGroup(
  g: GlyphRaster, x: number, cy: number, radius: number, initials: readonly string[],
  opts: { max?: number } = {}
): number {
  const max = count(opts.max, 3, 1, 12);
  const rad = Math.max(4, finite(radius, 10));
  const shown = initials.slice(0, max);
  const extra = initials.length - shown.length;
  const all = extra > 0 ? [...shown, `+${extra}`] : shown;
  // Far enough apart that the one in front does not cut into the initials behind it.
  const stepX = rad * 1.7 + 1;
  all.forEach((label, i) => {
    const cx = x + rad + i * stepX;
    g.circle(cx, cy, rad + 1.5, { fill: G.off });   // each one cuts into the one before it
    avatar(g, cx, cy, rad, { initials: label });
  });
  return all.length ? (all.length - 1) * stepX + rad * 2 : 0;
}

/**
 * One message in a conversation. Sized to its text, pushed to the side of
 * whoever said it. Returns the height used, so the next bubble knows where to go.
 */
export function chatBubble(
  g: GlyphRaster, r: Rect, text: string,
  opts: { from?: "me" | "them"; name?: string; time?: string; style?: TextStyle } = {}
): number {
  const mine = opts.from === "me";
  const style = opts.style ?? T.caption;
  const leading = leadingOf(style);
  const padX = 9;
  const padY = 5;
  const maxW = Math.max(40, r.width * 0.84);
  const lines = wrap(g.measure, text, style, maxW - padX * 2);
  const textW = lines.reduce((widest, line) => Math.max(widest, g.measure(line, style)), 0);
  const w = Math.min(maxW, Math.max(28, textW + padX * 2));
  const h = lines.length * leading + padY * 2;

  let y = r.y;
  if (opts.name) {
    g.text(opts.name, mine ? right(r) : r.x, y + 5, T.micro, G.tertiary, mine ? "right" : "left", "middle");
    y += 12;
  }
  const x = mine ? right(r) - w : r.x;
  // The corner nearest the speaker is squared off: that is the whole "tail".
  const corners: Corners = mine ? [9, 9, 2, 9] : [9, 9, 9, 2];
  const box = { x, y, width: w, height: h };
  if (isOutline(g)) g.roundRect(box, corners, { stroke: mine ? G.strong : G.border, width: 1 });
  else g.roundRect(box, corners, { fill: mine ? G.raised : G.surface });

  lines.forEach((line, i) => {
    g.text(line, x + padX, y + padY + i * leading + leading / 2, style, mine ? G.max : G.primary, "left", "middle");
  });
  if (opts.time) {
    g.text(opts.time, mine ? x - 6 : x + w + 6, y + h - 7, MICRO8, G.tertiary, mine ? "right" : "left", "middle");
  }
  return y + h - r.y;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tables, schedules, calendars
// ─────────────────────────────────────────────────────────────────────────────

export interface TableColumn {
  label: string;
  /** Fixed width in pixels. Columns without one share what is left. */
  width?: number;
  /** Share of the leftover width, for columns with no fixed width. Default 1. */
  weight?: number;
  align?: HAlign;
  /** Monospaced digits, right-aligned by default. */
  numeric?: boolean;
}

export interface TableOptions {
  rowHeight?: number;
  /** Draw the header row. Default true. */
  header?: boolean;
  selected?: number;
  /** Index of the first visible row. */
  offset?: number;
  dividers?: boolean;
}

/** Rows and columns. Returns how many rows fit. */
export function table(
  g: GlyphRaster, r: Rect, columns: readonly TableColumn[], rows: ReadonlyArray<readonly string[]>,
  opts: TableOptions = {}
): number {
  if (columns.length === 0) return 0;
  const rowH = Math.max(12, finite(opts.rowHeight, 20));
  const headH = opts.header === false ? 0 : 18;
  const pad = 6;

  const fixed = columns.reduce((sum, c) => sum + (c.width !== undefined ? Math.max(0, finite(c.width)) : 0), 0);
  const weights = columns.reduce((sum, c) => sum + (c.width === undefined ? positive(c.weight, 1) : 0), 0);
  const free = Math.max(0, r.width - fixed);
  const widths = columns.map((c) => (c.width !== undefined ? Math.max(0, finite(c.width)) : (free * positive(c.weight, 1)) / (weights || 1)));
  const xs: number[] = [];
  widths.reduce((x, w) => { xs.push(x); return x + w; }, r.x);

  const anchor = (i: number): { x: number; align: HAlign } => {
    const align = columns[i].align ?? (columns[i].numeric ? "right" : "left");
    const x = align === "left" ? xs[i] + pad : align === "right" ? xs[i] + widths[i] - pad : xs[i] + widths[i] / 2;
    return { x, align };
  };

  if (headH) {
    columns.forEach((c, i) => {
      const { x, align } = anchor(i);
      g.text(truncate(g.measure, c.label, T.micro, widths[i] - pad * 2), x, r.y + 7, T.micro, G.tertiary, align, "middle");
    });
    g.hline(r.x, right(r), r.y + headH - 3, G.hairline);
  }

  const visible = Math.max(0, Math.floor((r.height - headH) / rowH));
  const offset = count(opts.offset, 0, 0, Math.max(0, rows.length - visible));
  for (let i = 0; i < visible; i++) {
    const row = rows[offset + i];
    if (!row) break;
    const y = r.y + headH + i * rowH;
    const on = offset + i === opts.selected;
    if (on) {
      if (isOutline(g)) g.roundRect({ x: r.x, y: y + 3, width: 2.5, height: Math.max(0, rowH - 6) }, 1.2, { fill: G.max });
      else g.roundRect({ x: r.x, y, width: r.width, height: rowH }, R.xs, { fill: G.raised });
    } else if (opts.dividers && i > 0) {
      g.hline(r.x, right(r), y, G.hairline);
    }
    columns.forEach((c, ci) => {
      const { x, align } = anchor(ci);
      const style = c.numeric ? NUM : T.caption;
      const gray = on ? G.max : ci === 0 ? G.primary : G.secondary;
      g.text(truncate(g.measure, row[ci] ?? "", style, widths[ci] - pad * 2), x, y + rowH / 2, style, gray, align, "middle");
    });
  }
  return visible;
}

export interface TimelineEvent {
  title: string;
  time?: string;
  detail?: string;
  /** Default `upcoming`. */
  state?: "done" | "current" | "upcoming";
}

/**
 * A sequence down the page: what has happened, what is happening, what is
 * next. Solid behind you, dashed ahead. Returns how many events fit.
 */
export function timeline(g: GlyphRaster, r: Rect, events: readonly TimelineEvent[], opts: { rowHeight?: number } = {}): number {
  if (events.length === 0) return 0;
  const hasDetail = events.some((e) => e.detail);
  const rowH = Math.max(16, finite(opts.rowHeight, hasDetail ? 32 : 22));
  const timeW = events.reduce((widest, e) => Math.max(widest, e.time ? g.measure(e.time, NUM) : 0), 0);
  const axisX = Math.round(r.x + (timeW ? timeW + 10 : 5)) + 0.5;
  const textX = axisX + 12;
  const shown = Math.min(events.length, Math.max(1, Math.floor(r.height / rowH)));

  for (let i = 0; i < shown; i++) {
    const e = events[i];
    const state = e.state ?? "upcoming";
    const nodeY = r.y + i * rowH + 9;

    if (i < shown - 1) {
      const travelled = state === "done";
      g.line(axisX, nodeY + 6, axisX, nodeY + rowH - 6, {
        stroke: travelled ? G.secondary : G.border, width: 1, cap: "butt", dash: travelled ? undefined : [2, 3]
      });
    }
    if (state === "done") g.circle(axisX, nodeY, 3, { fill: G.strong });
    else if (state === "current") {
      g.circle(axisX, nodeY, 5, { stroke: G.max, width: 1.5 });
      g.circle(axisX, nodeY, 2, { fill: G.max });
    } else g.circle(axisX, nodeY, 3, { stroke: G.tertiary, width: 1 });

    if (e.time) g.text(e.time, axisX - 9, nodeY, NUM, state === "current" ? G.max : G.tertiary, "right", "middle");
    const style = state === "current" ? T.bodyStrong : T.body;
    const gray = state === "current" ? G.max : state === "done" ? G.tertiary : G.primary;
    g.text(truncate(g.measure, e.title, style, right(r) - textX), textX, nodeY, style, gray, "left", "middle");
    if (e.detail && rowH >= 28) {
      g.text(truncate(g.measure, e.detail, T.caption, right(r) - textX), textX, nodeY + 14, T.caption, G.tertiary, "left", "middle");
    }
  }
  return shown;
}

export interface CalendarOptions {
  /** Day of the month to outline. */
  selected?: number;
  /** Day of the month to invert. */
  today?: number;
  /** Days that carry a dot. */
  marked?: readonly number[];
  /** 0 for Sunday-first, 1 for Monday-first. Default 1. */
  weekStart?: 0 | 1;
  /** Seven weekday initials, in display order. */
  weekdays?: readonly string[];
  /** A heading, e.g. "November 2026". Formatting it is the caller's job, so it can be in any language. */
  title?: string;
}

/** One month as a grid. `month` is 1–12. */
export function calendarMonth(g: GlyphRaster, r: Rect, year: number, month: number, opts: CalendarOptions = {}): void {
  const y = Math.round(finite(year, 2000));
  const m = count(month, 1, 1, 12);
  const weekStart = opts.weekStart ?? 1;
  const labels = opts.weekdays ?? (weekStart === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"]);
  const lead = (new Date(y, m - 1, 1).getDay() - weekStart + 7) % 7;
  const days = new Date(y, m, 0).getDate();
  const weeks = Math.ceil((lead + days) / 7);

  let top = r.y;
  if (opts.title) {
    g.text(opts.title, r.x, top + 6, T.label, G.secondary, "left", "middle");
    top += 17;
  }
  const headH = 12;
  const cellW = r.width / 7;
  const cellH = (bottom(r) - top - headH) / weeks;
  if (!(cellH > 0)) return;

  labels.slice(0, 7).forEach((label, i) => {
    g.text(label, r.x + (i + 0.5) * cellW, top + 5, PLAIN_MICRO, G.tertiary, "center", "middle");
  });

  const marked = new Set(opts.marked ?? []);
  const boxW = Math.min(cellW - 2, 20);
  const boxH = Math.min(cellH - 1, 15);
  for (let d = 1; d <= days; d++) {
    const slot = lead + d - 1;
    const col = slot % 7;
    const cx = r.x + (col + 0.5) * cellW;
    const cy = top + headH + (Math.floor(slot / 7) + 0.5) * cellH;
    const dow = (col + weekStart) % 7;
    const weekend = dow === 0 || dow === 6;
    const box = { x: cx - boxW / 2, y: cy - boxH / 2, width: boxW, height: boxH };

    if (d === opts.today) {
      g.roundRect(box, 4, { fill: G.max });
      g.text(String(d), cx, cy, NUM, G.off, "center", "middle");
      continue;
    }
    if (d === opts.selected) g.roundRect(box, 4, { stroke: G.max, width: 1 });
    g.text(String(d), cx, cy, NUM, d === opts.selected ? G.max : weekend ? G.tertiary : G.primary, "center", "middle");
    if (marked.has(d)) g.circle(cx, cy + boxH / 2 - 0.5, 1.1, { fill: G.strong });
  }
}

export interface Stop { name: string; time?: string; }

/**
 * A route as a line of stops — a transit line, a delivery, the stages of a
 * trip. `current` may be fractional: 2.5 is halfway between the third stop and
 * the fourth.
 */
export function stopLine(
  g: GlyphRaster, r: Rect, stops: readonly Stop[],
  opts: { current?: number; labels?: "ends" | "all" } = {}
): void {
  const n = stops.length;
  if (n === 0) return;
  const x0 = r.x + 6;
  const x1 = right(r) - 6;
  const y = Math.round(r.y + 11) + 0.5;
  const pos = clamp(finite(opts.current), 0, n - 1);
  const X = (i: number): number => (n === 1 ? (x0 + x1) / 2 : x0 + (i / (n - 1)) * (x1 - x0));
  const atStop = Math.abs(pos - Math.round(pos)) < 0.001;

  g.line(x0, y, x1, y, { stroke: G.border, width: 1, dash: [2, 3], cap: "butt" });
  if (pos > 0) g.line(x0, y, X(pos), y, { stroke: G.strong, width: 2, cap: "butt" });

  stops.forEach((_, i) => {
    const x = X(i);
    if (atStop && i === Math.round(pos)) {
      g.circle(x, y, 5.5, { fill: G.off });
      g.circle(x, y, 5, { stroke: G.max, width: 1.5 });
      g.circle(x, y, 2, { fill: G.max });
    } else if (i < pos) g.circle(x, y, 3, { fill: G.strong });
    else { g.circle(x, y, 3, { fill: G.off }); g.circle(x, y, 3, { stroke: G.secondary, width: 1 }); }
  });
  if (!atStop) {
    const x = X(pos);
    g.polygon([{ x, y: y - 3 }, { x: x - 4.5, y: y - 10 }, { x: x + 4.5, y: y - 10 }], { fill: G.max });
  }

  const next = Math.min(n - 1, Math.ceil(pos - 0.001));
  const grayOf = (i: number): Gray => (i === next ? G.max : i < pos ? G.tertiary : G.secondary);
  const put = (i: number, x: number, align: HAlign, name: string): void => {
    g.text(name, x, y + 12, T.caption, grayOf(i), align, "top");
    const time = stops[i].time;
    if (time) g.text(time, x, y + 26, NUM, i === next ? G.primary : G.tertiary, align, "top");
  };

  if (opts.labels === "all") {
    const slot = n > 1 ? (x1 - x0) / (n - 1) - 4 : r.width;
    stops.forEach((stop, i) => {
      const name = truncate(g.measure, stop.name, T.caption, slot);
      if (i === 0) put(i, r.x, "left", name);
      else if (i === n - 1) put(i, right(r), "right", name);
      else put(i, X(i), "center", name);
    });
    return;
  }

  // Ends, plus the stop being approached — placed under its own dot when
  // there is room, and pushed clear of the end labels when there is not.
  const firstName = truncate(g.measure, stops[0].name, T.caption, r.width * 0.4);
  put(0, r.x, "left", firstName);
  const lastName = n > 1 ? truncate(g.measure, stops[n - 1].name, T.caption, r.width * 0.4) : "";
  if (n > 1) put(n - 1, right(r), "right", lastName);
  if (next > 0 && next < n - 1) {
    const from = r.x + g.measure(firstName, T.caption) + 10;
    const to = right(r) - g.measure(lastName, T.caption) - 10;
    if (to - from > 24) {
      const name = truncate(g.measure, stops[next].name, T.caption, to - from);
      const half = g.measure(name, T.caption) / 2;
      put(next, clamp(X(next), from + half, to - half), "center", name);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Small pieces
// ─────────────────────────────────────────────────────────────────────────────

/** Stars, with fractions. Returns the width used. */
export function rating(g: GlyphRaster, x: number, cy: number, value: number, opts: { max?: number; size?: number; gap?: number } = {}): number {
  const n = count(opts.max, 5, 1, 10);
  const size = positive(opts.size, 12);
  const gap = Math.max(0, finite(opts.gap, 3));
  const v = clamp(finite(value), 0, n);
  for (let i = 0; i < n; i++) {
    const cx = x + size / 2 + i * (size + gap);
    const y = cy + size * 0.04;
    const filled = clamp(v - i, 0, 1);
    if (filled > 0) {
      g.scoped((layer) => {
        layer.clipRect({ x: cx - size / 2, y: cy - size / 2 - 1, width: size * filled, height: size + 2 });
        layer.star(cx, y, size / 2, size * 0.21, 5, 0, { fill: G.max });
      });
    }
    g.star(cx, y, size / 2, size * 0.21, 5, 0, { stroke: filled >= 1 ? G.max : G.secondary, width: 1, join: "miter" });
  }
  return n * size + (n - 1) * gap;
}

/** Where you are in a hierarchy. When it does not fit, it drops from the front, never the end. */
export function breadcrumb(g: GlyphRaster, r: Rect, parts: readonly string[]): void {
  if (parts.length === 0) return;
  const style = T.caption;
  const sep = 14;
  const cy = centerY(r);
  const widths = parts.map((part) => g.measure(part, style));
  const ellipsis = g.measure("…", style) + sep;

  let start = parts.length - 1;
  let used = widths[start];
  while (start > 0) {
    const withPrev = used + sep + widths[start - 1];
    if (withPrev + (start - 1 > 0 ? ellipsis : 0) > r.width) break;
    used = withPrev;
    start--;
  }

  let x = r.x;
  if (start > 0) {
    g.text("…", x, cy, style, G.tertiary, "left", "middle");
    x += g.measure("…", style);
    icon(g, "chevron-right", x + sep / 2, cy, 9, G.disabled);
    x += sep;
  }
  for (let i = start; i < parts.length; i++) {
    const lastPart = i === parts.length - 1;
    const shown = lastPart ? truncate(g.measure, parts[i], style, Math.max(0, right(r) - x)) : parts[i];
    g.text(shown, x, cy, style, lastPart ? G.max : G.tertiary, "left", "middle");
    x += widths[i];
    if (!lastPart) { icon(g, "chevron-right", x + sep / 2, cy, 9, G.disabled); x += sep; }
  }
}

/** "3 / 12", with chevrons that go dim at either end. `page` counts from 1. */
export function pagination(g: GlyphRaster, r: Rect, page: number, total: number): void {
  const t = count(total, 1, 1, 99999);
  const p = count(page, 1, 1, t);
  const cx = centerX(r);
  const cy = centerY(r);
  const label = `${p} / ${t}`;
  const w = g.measure(label, T.numeral);
  g.text(label, cx, cy, T.numeral, G.primary, "center", "middle");
  icon(g, "chevron-left", cx - w / 2 - 12, cy, 12, p > 1 ? G.strong : G.border);
  icon(g, "chevron-right", cx + w / 2 + 12, cy, 12, p < t ? G.strong : G.border);
}

/** Chips that flow onto as many lines as they need. Returns the height used. */
export function chipRow(
  g: GlyphRaster, r: Rect, labels: readonly string[],
  opts: { selected?: number | readonly number[]; gap?: number; height?: number } = {}
): number {
  if (labels.length === 0) return 0;
  const h = positive(opts.height, 20);
  const gap = Math.max(0, finite(opts.gap, 6));
  const selected = new Set(typeof opts.selected === "number" ? [opts.selected] : opts.selected ?? []);
  let x = r.x;
  let y = r.y;
  let used = 0;
  labels.forEach((label, i) => {
    const w = Math.min(r.width, g.measure(label, T.caption) + 18);
    if (x > r.x && x + w > right(r) + 0.5) { x = r.x; y += h + gap; }
    if (y + h > bottom(r) + 0.5) return;
    chip(g, { x, y, width: w, height: h }, label, { selected: selected.has(i) });
    used = y + h - r.y;
    x += w + gap;
  });
  return used;
}

export interface LegendItem {
  label: string;
  gray?: Gray;
  dash?: number[];
  marker?: "line" | "dot" | "square";
}

/** What each mark on a chart means. */
export function legend(
  g: GlyphRaster, r: Rect, items: readonly LegendItem[],
  opts: { direction?: "row" | "column"; gap?: number } = {}
): void {
  const column = opts.direction === "column";
  const gap = Math.max(0, finite(opts.gap, column ? 13 : 12));
  let x = r.x;
  let y = column ? r.y + 5 : centerY(r);
  for (const item of items) {
    const gray = item.gray ?? G.max;
    const marker = item.marker ?? "line";
    if (marker === "dot") g.circle(x + 5, y, 2.5, { fill: gray });
    else if (marker === "square") g.rect({ x: x + 1.5, y: y - 3.5, width: 7, height: 7 }, { fill: gray });
    else g.line(x, y, x + 10, y, { stroke: gray, width: 1.5, dash: item.dash, cap: "butt" });
    g.text(item.label, x + 15, y, T.micro, G.tertiary, "left", "middle");
    if (column) y += gap;
    else x += 15 + g.measure(item.label, T.micro) + gap;
  }
}

/** A change, with its direction: up is bright, down is dim, flat is a dash. Returns the width used. */
export function trendBadge(
  g: GlyphRaster, x: number, cy: number, delta: number,
  opts: { text?: string; format?: (delta: number) => string } = {}
): number {
  const d = finite(delta);
  const text = opts.text ?? (opts.format ? opts.format(d) : `${Math.abs(d).toFixed(1)}%`);
  const gray = d > 0 ? G.max : d < 0 ? G.secondary : G.tertiary;
  if (d !== 0) iconFilled(g, d > 0 ? "caret-up" : "caret-down", x + 5, cy, 12, gray);
  else g.rect({ x: x + 2, y: cy - 0.75, width: 6, height: 1.5 }, { fill: gray });
  g.text(text, x + 13, cy, NUM, gray, "left", "middle");
  return 13 + g.measure(text, NUM);
}

/** A key, for writing "press this" — or, here, "say this". Returns the width used. */
export function keycap(g: GlyphRaster, x: number, cy: number, label: string, opts: { height?: number } = {}): number {
  const h = positive(opts.height, 16);
  const w = Math.max(h, g.measure(label, PLAIN_MICRO) + 10);
  const box = { x, y: cy - h / 2, width: w, height: h };
  if (!isOutline(g)) g.roundRect(box, 3, { fill: G.surface });
  g.roundRect(box, 3, { stroke: G.border, width: 1 });
  g.hline(x + 2, x + w - 2, cy + h / 2 + 1, G.hairline);
  g.text(label, x + w / 2, cy, PLAIN_MICRO, G.secondary, "center", "middle");
  return w;
}

// ─────────────────────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────────────────────

/** Seconds as "m:ss", or "h:mm:ss" once there are hours. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(finite(seconds)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export interface MediaOptions {
  title: string;
  artist?: string;
  /** Seconds played. */
  position: number;
  /** Total seconds. */
  duration: number;
  playing?: boolean;
}

/** Now playing: what, by whom, how far through, and the transport. */
export function mediaTransport(g: GlyphRaster, r: Rect, opts: MediaOptions): void {
  let y = r.y;
  g.text(truncate(g.measure, opts.title, T.bodyStrong, r.width), r.x, y + 8, T.bodyStrong, G.max, "left", "middle");
  y += 17;
  if (opts.artist) {
    g.text(truncate(g.measure, opts.artist, T.caption, r.width), r.x, y + 6, T.caption, G.tertiary, "left", "middle");
    y += 15;
  }

  const duration = Math.max(0, finite(opts.duration));
  const position = clamp(finite(opts.position), 0, duration);
  const elapsed = formatDuration(position);
  const remaining = duration > 0 ? `-${formatDuration(duration - position)}` : "--:--";
  const barY = y + 9;
  const lw = g.measure(elapsed, NUM);
  const rw = g.measure(remaining, NUM);
  g.text(elapsed, r.x, barY, NUM, G.secondary, "left", "middle");
  g.text(remaining, right(r), barY, NUM, G.tertiary, "right", "middle");
  const barW = r.width - lw - rw - 16;
  if (barW > 8) progressBar(g, { x: r.x + lw + 8, y: barY - 2, width: barW, height: 4 }, duration > 0 ? position / duration : 0);

  if (bottom(r) - barY >= 34) {
    const cx = centerX(r);
    const cy = barY + 24;
    icon(g, "skip-back", cx - 36, cy, 14, G.secondary);
    g.circle(cx, cy, 13, { stroke: G.border, width: 1 });
    icon(g, opts.playing ? "pause" : "play", cx + (opts.playing ? 0 : 1), cy, 14, G.max);
    icon(g, "skip-forward", cx + 36, cy, 14, G.secondary);
  }
}

/** An amplitude envelope as bars. Samples are 0..1; the played part is bright. */
export function waveform(
  g: GlyphRaster, r: Rect, samples: readonly number[],
  opts: { progress?: number; barWidth?: number; gap?: number; mirrored?: boolean } = {}
): void {
  if (samples.length === 0) return;
  const barW = positive(opts.barWidth, 2);
  const gap = Math.max(0, finite(opts.gap, 1));
  const n = Math.max(1, Math.floor((r.width + gap) / (barW + gap)));
  const played = opts.progress === undefined ? n : Math.round(unit(opts.progress) * n);
  const mirrored = opts.mirrored !== false;
  for (let i = 0; i < n; i++) {
    // Each bar shows the loudest sample in the stretch it stands for.
    const from = Math.floor((i * samples.length) / n);
    const to = Math.max(from + 1, Math.floor(((i + 1) * samples.length) / n));
    let peak = 0;
    for (let j = from; j < to && j < samples.length; j++) peak = Math.max(peak, unit(Math.abs(samples[j])));
    const h = Math.max(1, peak * r.height);
    g.rect(
      { x: r.x + i * (barW + gap), y: mirrored ? centerY(r) - h / 2 : bottom(r) - h, width: barW, height: h },
      { fill: i < played ? G.max : G.disabled }
    );
  }
}

/** Frequency bands as stacks of segments. Levels are 0..1. */
export function equalizer(
  g: GlyphRaster, r: Rect, levels: readonly number[],
  opts: { segments?: number; gap?: number; peaks?: readonly number[] } = {}
): void {
  const bands = levels.length;
  if (bands === 0) return;
  const segments = count(opts.segments, 8, 1, 32);
  const gap = Math.max(0, finite(opts.gap, 2));
  const bandW = (r.width - gap * (bands - 1)) / bands;
  const segH = (r.height - (segments - 1)) / segments;
  if (!(bandW > 0) || !(segH > 0)) return;

  levels.forEach((level, b) => {
    const x = r.x + b * (bandW + gap);
    const lit = Math.round(unit(level) * segments);
    for (let s = 0; s < segments; s++) {
      const y = bottom(r) - (s + 1) * segH - s;
      if (s < lit) g.rect({ x, y, width: bandW, height: segH }, { fill: s === lit - 1 ? G.max : G.secondary });
      else if (!isOutline(g)) g.rect({ x, y, width: bandW, height: segH }, { fill: G.sunken });
    }
    if (lit === 0) g.rect({ x, y: bottom(r) - 1, width: bandW, height: 1 }, { fill: G.border });
    const peak = opts.peaks?.[b];
    if (peak !== undefined && Number.isFinite(peak)) {
      g.rect({ x, y: bottom(r) - unit(peak) * r.height, width: bandW, height: 1 }, { fill: G.strong });
    }
  });
}

/** A timer as a ring that empties, with the time left written inside it. */
export function countdownRing(
  g: GlyphRaster, cx: number, cy: number, radius: number, remaining: number, total: number,
  opts: { label?: string; width?: number } = {}
): void {
  const all = Math.max(0, finite(total));
  const left = clamp(finite(remaining), 0, all);
  const w = positive(opts.width, 5);
  ringChart(g, cx, cy, radius, all > 0 ? left / all : 0, { width: w });
  const room = Math.max(0, (radius - w / 2 - 4) * 1.9);
  const text = formatDuration(left);
  g.text(text, cx, cy - (opts.label ? 5 : 0), pickStyle(g.measure, text, [T.numeralLg, T.numeral, NUM], room), G.max, "center", "middle");
  if (opts.label) g.text(truncate(g.measure, opts.label, MICRO8, room), cx, cy + 11, MICRO8, G.tertiary, "center", "middle");
}

// ─────────────────────────────────────────────────────────────────────────────
// Text in motion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One line that scrolls if — and only if — it does not fit. Pass the app clock
 * as `now`, and mark the screen `animated`. Returns whether it is scrolling.
 */
export function marquee(
  g: GlyphRaster, r: Rect, text: string, now: number,
  opts: { style?: TextStyle; gray?: Gray; speed?: number; gap?: number; pauseMs?: number } = {}
): boolean {
  const style = opts.style ?? T.body;
  const gray = opts.gray ?? G.primary;
  const cy = centerY(r);
  const w = g.measure(text, style);
  if (w <= r.width) {
    g.text(text, r.x, cy, style, gray, "left", "middle");
    return false;
  }
  const speed = positive(opts.speed, 40);              // logical pixels per second
  const gap = Math.max(8, finite(opts.gap, 32));
  const pause = Math.max(0, finite(opts.pauseMs, 1200));
  const cycle = w + gap;
  const lap = pause + (cycle / speed) * 1000;
  const t = ((finite(now) % lap) + lap) % lap;
  // Each lap starts at rest, so the beginning of the line can actually be read.
  const shift = t < pause ? 0 : ((t - pause) * speed) / 1000;
  g.scoped((layer) => {
    layer.clipRect(r);
    layer.text(text, r.x - shift, cy, style, gray, "left", "middle");
    layer.text(text, r.x - shift + cycle, cy, style, gray, "left", "middle");
  });
  return true;
}

/**
 * Text that appears a character at a time. `progress` is 0..1 of the whole
 * text. Line breaks are decided from the complete text, so words do not jump
 * to the next line halfway through being typed.
 */
export function typewriter(
  g: GlyphRaster, r: Rect, text: string, progress: number,
  opts: { style?: TextStyle; gray?: Gray; caret?: boolean } = {}
): void {
  const style = opts.style ?? T.body;
  const gray = opts.gray ?? G.primary;
  const leading = leadingOf(style);
  const lines = wrap(g.measure, text, style, r.width).slice(0, Math.max(1, Math.floor(r.height / leading)));
  const total = lines.reduce((sum, line) => sum + line.length, 0);
  let budget = Math.round(unit(progress) * total);
  let caretX = r.x;
  let caretY = r.y + leading / 2;

  for (let i = 0; i < lines.length; i++) {
    const cy = r.y + i * leading + leading / 2;
    const part = lines[i].slice(0, budget);
    budget -= part.length;
    if (part) g.text(part, r.x, cy, style, gray, "left", "middle");
    caretX = r.x + g.measure(part, style);
    caretY = cy;
    if (part.length < lines[i].length || budget <= 0) break;
  }
  if (opts.caret !== false) {
    const size = style.size ?? 16;
    g.rect({ x: caretX + 1, y: caretY - size * 0.45, width: Math.max(2, size * 0.45), height: size * 0.9 }, { fill: G.max });
  }
}
