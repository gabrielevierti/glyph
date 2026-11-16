/**
 * Overlays and feedback: the things that arrive on top of a screen, say
 * something, and leave.
 *
 * On a phone an overlay dims what is behind it. Here "behind" is partly the
 * screen you drew and partly the street, and you can only dim one of them — so
 * an overlay *knocks out* its own area instead: it clears the pixels under
 * itself and draws a border. Off is the only truly opaque colour this display
 * has.
 */
import { button, scrollbar } from "./components.js";
import { spinner } from "./extended.js";
import { bottom, centerX, centerY, clamp, right } from "./geometry.js";
import { icon } from "./icons.js";
import { leadingOf, truncate, wrap } from "./text.js";
import { gray as G, isOutline, radius as R, type as T } from "./theme.js";
import { count, finite, positive, unit } from "./util.js";
import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Corners, Gray, HAlign, Point, Rect, TextStyle } from "./types.js";

/** Clear an area and outline it — the base of every overlay. */
function knockout(g: GlyphRaster, r: Rect, radius: Corners, stroke: Gray, width = 1): void {
  g.roundRect(r, radius, { fill: isOutline(g) ? G.off : G.surface });
  g.roundRect(r, radius, { stroke, width });
}

/** The selection marker rows share: an edge bar in outline mode, a well in filled mode. */
function rowHighlight(g: GlyphRaster, r: Rect): void {
  if (isOutline(g)) {
    g.roundRect({ x: r.x, y: r.y + 2, width: 2.5, height: Math.max(0, r.height - 4) }, 1.5, { fill: G.max });
    g.roundRect(r, R.md, { stroke: G.hairline, width: 1 });
  } else {
    g.roundRect(r, R.md, { fill: G.raised });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialogs and sheets
// ─────────────────────────────────────────────────────────────────────────────

/** A row of equal-width buttons. The last one is primary unless told otherwise. */
export function buttonRow(
  g: GlyphRaster, r: Rect, labels: readonly string[],
  opts: { focused?: number; primary?: number; gap?: number } = {}
): void {
  if (labels.length === 0) return;
  const gap = Math.max(0, finite(opts.gap, 8));
  const w = (r.width - gap * (labels.length - 1)) / labels.length;
  const primary = opts.primary ?? labels.length - 1;
  labels.forEach((label, i) => {
    button(g, { x: r.x + i * (w + gap), y: r.y, width: w, height: r.height }, label, {
      primary: i === primary, focused: i === opts.focused
    });
  });
}

export interface DialogOptions {
  title: string;
  message?: string;
  icon?: GlyphIconName;
  /** Button labels, left to right. */
  actions?: readonly string[];
  /** Index of the action that has focus. */
  focused?: number;
  /** Index of the emphasised action. Defaults to the last. */
  primary?: number;
}

/** A modal question: title, a sentence or two, and the choices. */
export function dialog(g: GlyphRaster, r: Rect, opts: DialogOptions): void {
  knockout(g, r, R.lg, G.secondary, 1.5);
  const pad = 14;
  const actionsH = opts.actions?.length ? 26 : 0;
  let x = r.x + pad;
  let y = r.y + pad;

  if (opts.icon) { icon(g, opts.icon, x + 9, y + 9, 18, G.max); x += 26; }
  g.text(truncate(g.measure, opts.title, T.title, right(r) - pad - x), x, y + 9, T.title, G.max, "left", "middle");
  y += 24;

  if (opts.message) {
    const room = bottom(r) - pad - (actionsH ? actionsH + 8 : 0) - y;
    if (room >= leadingOf(T.body)) {
      g.textBox(opts.message, { x: r.x + pad, y, width: r.width - pad * 2, height: room }, T.body, G.secondary);
    }
  }
  if (opts.actions?.length) {
    buttonRow(
      g, { x: r.x + pad, y: bottom(r) - pad - actionsH, width: r.width - pad * 2, height: actionsH },
      opts.actions, { focused: opts.focused, primary: opts.primary }
    );
  }
}

/**
 * A sheet rising from the bottom of an area. Returns the rect to draw its
 * content in — put a `menu` there, or anything else.
 */
export function bottomSheet(
  g: GlyphRaster, area: Rect,
  opts: { height?: number; title?: string; handle?: boolean } = {}
): Rect {
  const h = clamp(finite(opts.height, area.height / 2), 24, area.height);
  // Taller than it looks: the bottom corners fall outside the area and are clipped away.
  const sheet = { x: area.x + 0.5, y: bottom(area) - h, width: Math.max(0, area.width - 1), height: h + R.lg + 2 };
  g.scoped((layer) => {
    layer.clipRect(area);
    layer.roundRect(sheet, R.lg, { fill: isOutline(g) ? G.off : G.surface });
    layer.roundRect(sheet, R.lg, { stroke: G.secondary, width: 1 });
  });

  let y = sheet.y + 6;
  if (opts.handle !== false) {
    g.roundRect({ x: centerX(area) - 14, y, width: 28, height: 3 }, 1.5, { fill: G.disabled });
    y += 9;
  }
  if (opts.title) {
    g.text(opts.title, area.x + 14, y + 7, T.label, G.secondary, "left", "middle");
    g.hline(area.x + 14, right(area) - 14, y + 17, G.hairline);
    y += 22;
  }
  return { x: area.x + 14, y, width: Math.max(0, area.width - 28), height: Math.max(0, bottom(area) - 8 - y) };
}

export interface MenuItem {
  label: string;
  icon?: GlyphIconName;
  /** Current value or shortcut, shown at the right. */
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  /** Draw a chevron: this row opens something. */
  chevron?: boolean;
}

export interface MenuOptions {
  /** Index of the highlighted row. */
  selected?: number;
  /** Index of the first visible row. Defaults to keeping `selected` in view. */
  offset?: number;
  rowHeight?: number;
  /** A `Cursor` (or anything with `index` and `offset`) to take both from. */
  cursor?: { index: number; offset: number };
}

/**
 * A scrolling list of choices. Returns how many rows fit, which is the number a
 * `Cursor` needs as its `visible`.
 */
export function menu(g: GlyphRaster, r: Rect, items: readonly MenuItem[], opts: MenuOptions = {}): number {
  const rowH = Math.max(14, finite(opts.rowHeight, 26));
  const visible = Math.max(1, Math.floor(r.height / rowH));
  const selected = opts.cursor ? opts.cursor.index : opts.selected ?? -1;
  const maxOffset = Math.max(0, items.length - visible);
  const offset = clamp(
    Math.round(finite(opts.cursor ? opts.cursor.offset : opts.offset, selected - Math.floor(visible / 2))),
    0, maxOffset
  );
  const overflow = items.length > visible;
  const w = r.width - (overflow ? 8 : 0);

  for (let i = 0; i < visible; i++) {
    const item = items[offset + i];
    if (!item) break;
    const row = { x: r.x, y: r.y + i * rowH, width: w, height: rowH - 2 };
    const on = offset + i === selected;
    if (on) rowHighlight(g, row);

    const cy = centerY(row);
    const fg = item.disabled ? G.disabled : on ? G.max : G.primary;
    let x = row.x + 10;
    if (item.icon) { icon(g, item.icon, x + 7, cy, 14, item.disabled ? G.disabled : on ? G.max : G.strong); x += 22; }

    let edge = right(row) - 10;
    if (item.chevron) { icon(g, "chevron-right", edge - 4, cy, 11, G.disabled); edge -= 14; }
    if (item.checked) { icon(g, "check", edge - 6, cy, 13, G.max); edge -= 18; }
    if (item.value) {
      g.text(item.value, edge, cy, T.caption, on ? G.primary : G.tertiary, "right", "middle");
      edge -= g.measure(item.value, T.caption) + 8;
    }
    g.text(truncate(g.measure, item.label, T.body, edge - x), x, cy, T.body, fg, "left", "middle");
  }
  if (overflow) {
    scrollbar(g, { x: right(r) - 3, y: r.y, width: 3, height: visible * rowH - 2 }, offset, visible, items.length);
  }
  return visible;
}

// ─────────────────────────────────────────────────────────────────────────────
// Callouts, banners, notifications
// ─────────────────────────────────────────────────────────────────────────────

export interface CalloutOptions {
  /** Which edge the tail leaves from. `none` for a plain bubble. */
  pointer?: "top" | "bottom" | "left" | "right" | "none";
  /** Where along that edge, 0..1. Default 0.5. */
  at?: number;
  title?: string;
  gray?: Gray;
}

/** A bubble with a tail — a tooltip, a label pointing at something on screen. */
export function callout(g: GlyphRaster, r: Rect, text: string, opts: CalloutOptions = {}): void {
  const side = opts.pointer ?? "bottom";
  const at = unit(opts.at ?? 0.5);
  const tail = 6;
  const rad = Math.min(R.md, r.width / 2, r.height / 2);
  const stroke = opts.gray ?? G.secondary;
  const fill = isOutline(g) ? G.off : G.surface;

  g.roundRect(r, rad, { fill });
  g.roundRect(r, rad, { stroke, width: 1 });

  if (side !== "none") {
    // The tail's base stays clear of the rounded corners.
    const along = (length: number, start: number): number =>
      start + clamp(length * at, rad + tail, Math.max(rad + tail, length - rad - tail));
    let a: Point, b: Point, tip: Point, ai: Point, bi: Point;
    if (side === "top" || side === "bottom") {
      const bx = along(r.width, r.x);
      const edge = side === "top" ? r.y : bottom(r);
      const out = side === "top" ? -1 : 1;
      a = { x: bx - tail, y: edge }; b = { x: bx + tail, y: edge }; tip = { x: bx, y: edge + out * tail };
      ai = { x: a.x, y: edge - out * 1.5 }; bi = { x: b.x, y: edge - out * 1.5 };
    } else {
      const by = along(r.height, r.y);
      const edge = side === "left" ? r.x : right(r);
      const out = side === "left" ? -1 : 1;
      a = { x: edge, y: by - tail }; b = { x: edge, y: by + tail }; tip = { x: edge + out * tail, y: by };
      ai = { x: edge - out * 1.5, y: a.y }; bi = { x: edge - out * 1.5, y: b.y };
    }
    // Erase the stretch of border under the tail, then draw the tail's two sides.
    g.polygon([ai, a, tip, b, bi], { fill });
    g.polyline([a, tip, b], { stroke, width: 1, join: "miter" });
  }

  const box = { x: r.x + 9, y: r.y + 4, width: Math.max(0, r.width - 18), height: Math.max(0, r.height - 8) };
  if (opts.title) {
    g.text(truncate(g.measure, opts.title, T.bodyStrong, box.width), box.x, box.y + 9, T.bodyStrong, G.max, "left", "middle");
    g.textBox(text, { ...box, y: box.y + 19, height: Math.max(0, box.height - 19) }, T.caption, G.secondary);
  } else {
    g.textBox(text, box, T.caption, G.primary, { vAlign: "middle" });
  }
}

export type BannerKind = "info" | "success" | "warning" | "error";

const BANNER: Record<BannerKind, { icon: GlyphIconName; stroke: Gray; accent: Gray; width: number }> = {
  info: { icon: "info", stroke: G.border, accent: G.secondary, width: 1 },
  success: { icon: "check-circle", stroke: G.border, accent: G.strong, width: 1 },
  warning: { icon: "alert-triangle", stroke: G.secondary, accent: G.max, width: 1 },
  error: { icon: "x-circle", stroke: G.max, accent: G.max, width: 1.5 }
};

/**
 * An inline alert strip. Severity is carried by the icon and the weight of the
 * border — there is no red to reach for.
 */
export function banner(
  g: GlyphRaster, r: Rect, text: string,
  opts: { kind?: BannerKind; detail?: string; icon?: GlyphIconName } = {}
): void {
  const kind = BANNER[opts.kind ?? "info"];
  if (!isOutline(g)) g.roundRect(r, R.sm, { fill: G.surface });
  g.roundRect(r, R.sm, { stroke: kind.stroke, width: kind.width });
  g.roundRect({ x: r.x + 3, y: r.y + 3, width: 2.5, height: Math.max(0, r.height - 6) }, 1.2, { fill: kind.accent });

  const cy = centerY(r);
  icon(g, opts.icon ?? kind.icon, r.x + 19, cy, 15, kind.accent);
  const x = r.x + 33;
  const width = right(r) - 10 - x;

  if (opts.detail && r.height >= 34) {
    g.text(truncate(g.measure, text, T.bodyStrong, width), x, cy - 8, T.bodyStrong, G.max, "left", "middle");
    g.text(truncate(g.measure, opts.detail, T.caption, width), x, cy + 8, T.caption, G.secondary, "left", "middle");
    return;
  }
  const detailW = opts.detail ? g.measure(opts.detail, T.caption) + 10 : 0;
  const showDetail = !!opts.detail && detailW < width * 0.5;
  g.text(truncate(g.measure, text, T.bodyStrong, width - (showDetail ? detailW : 0)), x, cy, T.bodyStrong, G.max, "left", "middle");
  if (showDetail) g.text(opts.detail!, right(r) - 10, cy, T.caption, G.tertiary, "right", "middle");
}

export interface NotificationOptions {
  /** Name of the app or sender category, shown small above the title. */
  app?: string;
  icon?: GlyphIconName;
  title: string;
  body?: string;
  time?: string;
}

/** An incoming notification: who it is from, one bold line, and as much of the body as fits. */
export function notificationCard(g: GlyphRaster, r: Rect, opts: NotificationOptions): void {
  knockout(g, r, R.lg, G.secondary);
  const pad = 12;
  const x = r.x + pad;
  const width = Math.max(0, r.width - pad * 2);
  let y = r.y + 9;

  if (opts.app || opts.icon || opts.time) {
    let hx = x;
    if (opts.icon) { icon(g, opts.icon, hx + 6, y + 6, 13, G.secondary); hx += 18; }
    if (opts.app) g.text(opts.app, hx, y + 6, T.label, G.secondary, "left", "middle");
    if (opts.time) g.text(opts.time, right(r) - pad, y + 6, T.micro, G.tertiary, "right", "middle");
    y += 17;
  }
  g.text(truncate(g.measure, opts.title, T.bodyStrong, width), x, y + 9, T.bodyStrong, G.max, "left", "middle");
  y += 20;

  const room = bottom(r) - 8 - y;
  if (opts.body && room >= leadingOf(T.caption)) {
    g.textBox(opts.body, { x, y, width, height: room }, T.caption, G.secondary);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gesture hints
// ─────────────────────────────────────────────────────────────────────────────

/** The four things a G2 temple, or an R1 ring, can tell you. */
export type Gesture = "tap" | "double-tap" | "scroll-up" | "scroll-down";

/** A small pictogram for one gesture. */
export function gestureGlyph(g: GlyphRaster, cx: number, cy: number, gesture: Gesture, gray: Gray = G.secondary, size = 12): void {
  const half = size / 2;
  if (gesture === "tap" || gesture === "double-tap") {
    g.circle(cx, cy, half - 1, { stroke: gray, width: 1 });
    if (gesture === "tap") g.circle(cx, cy, 1.6, { fill: gray });
    else { g.circle(cx - 2.2, cy, 1.3, { fill: gray }); g.circle(cx + 2.2, cy, 1.3, { fill: gray }); }
    return;
  }
  const up = gesture === "scroll-up" ? -1 : 1;
  const tip = cy + up * (half - 1);
  g.line(cx, cy - up * (half - 1), cx, tip, { stroke: gray, width: 1.4 });
  g.polyline(
    [{ x: cx - 3.5, y: tip - up * 3.5 }, { x: cx, y: tip }, { x: cx + 3.5, y: tip - up * 3.5 }],
    { stroke: gray, width: 1.4 }
  );
}

/**
 * A legend of what each gesture does on this screen.
 *
 * Four gestures is the whole input vocabulary, and nothing on the glasses says
 * what they mean here — so a screen that does anything unusual should say so.
 */
export function hintBar(
  g: GlyphRaster, r: Rect, hints: ReadonlyArray<{ gesture: Gesture; label: string }>,
  opts: { align?: HAlign; gap?: number; gray?: Gray } = {}
): void {
  if (hints.length === 0) return;
  const gap = Math.max(0, finite(opts.gap, 14));
  const widths = hints.map((hint) => 17 + g.measure(hint.label, T.micro));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (hints.length - 1);
  const align = opts.align ?? "left";
  let x = align === "left" ? r.x : align === "right" ? right(r) - total : centerX(r) - total / 2;
  const cy = centerY(r);
  hints.forEach((hint, i) => {
    gestureGlyph(g, x + 6, cy, hint.gesture, G.secondary);
    g.text(hint.label, x + 17, cy, T.micro, opts.gray ?? G.tertiary, "left", "middle");
    x += widths[i] + gap;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading: captions and prompting
// ─────────────────────────────────────────────────────────────────────────────

const inkCount = (text: string): number => text.replace(/\s+/g, "").length;

/** Index in `line` just after its n-th non-space character. */
function indexAfterInk(line: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < line.length; i++) {
    if (!/\s/.test(line[i])) seen++;
    if (seen >= n) return i + 1;
  }
  return line.length;
}

export interface CaptionOptions {
  /** Who is speaking, shown above the text. */
  speaker?: string;
  maxLines?: number;
  style?: TextStyle;
  align?: "left" | "center";
  /** Words still being recognised: shown dimmer, after the settled text. */
  interim?: string;
}

/**
 * Live captions. The newest words are at the bottom and brightest; earlier
 * lines fade and then scroll away, so the eye always knows where "now" is.
 */
export function captions(g: GlyphRaster, r: Rect, text: string, opts: CaptionOptions = {}): void {
  const style = opts.style ?? T.title;
  const leading = leadingOf(style);
  const head = opts.speaker ? 15 : 0;
  const maxLines = Math.max(1, Math.min(count(opts.maxLines, 99, 1, 99), Math.floor((r.height - head) / leading)));
  const align = opts.align ?? "left";

  const settled = text.trim();
  const full = opts.interim ? `${settled} ${opts.interim}`.trim() : settled;
  if (full === "") return;
  const lines = wrap(g.measure, full, style, r.width);
  const shown = lines.slice(-maxLines);
  const settledInk = inkCount(settled);
  let consumed = inkCount(lines.slice(0, lines.length - shown.length).join(""));

  const top = bottom(r) - shown.length * leading;
  if (opts.speaker) {
    g.text(opts.speaker, align === "center" ? centerX(r) : r.x, top - 4, T.label, G.secondary, align, "bottom");
  }
  shown.forEach((line, i) => {
    const age = shown.length - 1 - i;
    const gray = age === 0 ? G.max : age === 1 ? G.primary : G.secondary;
    const ink = inkCount(line);
    const settledHere = clamp(settledInk - consumed, 0, ink);
    consumed += ink;

    const x = align === "center" ? centerX(r) - g.measure(line, style) / 2 : r.x;
    const cy = top + i * leading + leading / 2;
    if (settledHere >= ink) { g.text(line, x, cy, style, gray, "left", "middle"); return; }
    const cut = indexAfterInk(line, settledHere);
    const first = line.slice(0, cut);
    if (first) g.text(first, x, cy, style, gray, "left", "middle");
    g.text(line.slice(cut), x + g.measure(first, style), cy, style, G.tertiary, "left", "middle");
  });
}

/**
 * A script that scrolls under a fixed reading line. `position` is the line
 * being read, and may be fractional for smooth scrolling. Returns the number of
 * lines, so the caller knows where the end is.
 */
export function teleprompter(
  g: GlyphRaster, r: Rect, text: string, position: number,
  opts: { style?: TextStyle; anchor?: number; align?: "left" | "center" } = {}
): number {
  const style = opts.style ?? T.title;
  const leading = leadingOf(style);
  const lines = wrap(g.measure, text, style, r.width);
  const pos = clamp(finite(position), 0, Math.max(0, lines.length - 1));
  const active = Math.round(pos);
  const anchorY = r.y + r.height * unit(opts.anchor ?? 0.4);
  const align = opts.align ?? "left";

  g.scoped((layer) => {
    layer.clipRect(r);
    lines.forEach((line, i) => {
      const cy = anchorY + (i - pos) * leading;
      if (cy < r.y - leading || cy > bottom(r) + leading) return;
      const gray = i === active ? G.max : i < active ? G.disabled : i - active === 1 ? G.primary : G.secondary;
      layer.text(line, align === "center" ? centerX(r) : r.x, cy, style, gray, align, "middle");
    });
  });
  return lines.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Waiting and listening
// ─────────────────────────────────────────────────────────────────────────────

/** A spinner with a caption, for a screen that has nothing to show yet. Pass the app clock as `now`. */
export function loadingState(g: GlyphRaster, r: Rect, label: string, now: number, opts: { detail?: string } = {}): void {
  const cx = centerX(r);
  const cy = centerY(r) - (opts.detail ? 16 : 9);
  const phase = (((finite(now) / 900) % 1) + 1) % 1;
  spinner(g, { x: cx - 13, y: cy - 13, width: 26, height: 26 }, phase);
  g.text(truncate(g.measure, label, T.bodyStrong, r.width), cx, cy + 27, T.bodyStrong, G.primary, "center", "middle");
  if (opts.detail) {
    g.text(truncate(g.measure, opts.detail, T.caption, r.width), cx, cy + 44, T.caption, G.tertiary, "center", "middle");
  }
}

/** Progress of unknown length: a segment that keeps crossing the track. */
export function indeterminateBar(g: GlyphRaster, r: Rect, now: number, opts: { period?: number; gray?: Gray } = {}): void {
  const rad = r.height / 2;
  if (isOutline(g)) g.roundRect(r, rad, { stroke: G.hairline, width: 1 });
  else g.roundRect(r, rad, { fill: G.sunken });
  const period = positive(opts.period, 1400);
  const t = (((finite(now) % period) + period) % period) / period;
  const w = r.width * 0.3;
  g.scoped((layer) => {
    layer.clipRound(r, rad);
    layer.roundRect({ x: r.x - w + (r.width + w) * t, y: r.y, width: w, height: r.height }, rad, { fill: opts.gray ?? G.max });
  });
}

/**
 * The microphone is open. Rings leave the icon at a pace set by the clock and a
 * brightness set by `level`, so silence and speech look different at a glance.
 */
export function listeningIndicator(
  g: GlyphRaster, cx: number, cy: number, radius: number, level: number, now: number,
  opts: { state?: "listening" | "processing" | "idle" } = {}
): void {
  const rad = Math.max(8, finite(radius, 20));
  const state = opts.state ?? "listening";
  const core = rad * 0.5;
  const t = finite(now);

  if (state === "listening") {
    const v = unit(level);
    for (let i = 0; i < 3; i++) {
      const phase = (((t / 1300 + i / 3) % 1) + 1) % 1;
      const gray = Math.round((10 - 7 * phase) * (0.45 + 0.55 * v));
      if (gray >= 3) g.circle(cx, cy, core + (rad - core) * phase, { stroke: gray, width: 1 });
    }
  } else if (state === "processing") {
    const a = (t / 500) % (Math.PI * 2);
    g.arc(cx, cy, rad * 0.78, a, a + 1.7, { stroke: G.strong, width: 1.5 });
  }

  g.circle(cx, cy, core, { fill: G.off });
  g.circle(cx, cy, core, { stroke: state === "idle" ? G.border : G.max, width: 1.5 });
  icon(g, "mic", cx, cy, core * 1.25, state === "idle" ? G.disabled : G.max);
}
