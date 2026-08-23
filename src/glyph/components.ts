import { GlyphRaster } from "./raster";
import { glyphTheme as T } from "./theme";
import { icon, type GlyphIconName } from "./icons";
import type { Rect } from "./types";

// ═══════════════════════════════════════════════════════════════
// LAYOUT PRIMITIVES
// ═══════════════════════════════════════════════════════════════

/** A rounded card container — the foundation of every widget */
export function card(r: GlyphRaster, rect: Rect, opts: { fill?: number; stroke?: number; radius?: number; strokeWidth?: number } = {}) {
  const rad = opts.radius ?? T.radius.md;
  if (opts.fill !== undefined) r.roundRect(rect.x, rect.y, rect.width, rect.height, rad, opts.fill);
  if (opts.stroke !== undefined) r.roundRect(rect.x, rect.y, rect.width, rect.height, rad, undefined, opts.stroke, opts.strokeWidth ?? 1);
}

/** Horizontal divider line */
export function divider(r: GlyphRaster, x1: number, y: number, x2: number, g = T.colors.divider) {
  r.line(x1, y, x2, y, g, 1);
}

/** Vertical divider line */
export function vdivider(r: GlyphRaster, x: number, y1: number, y2: number, g = T.colors.divider) {
  r.line(x, y1, x, y2, g, 1);
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

/** All-caps label — for section headers, units, metadata */
export function label(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.secondary) {
  r.text(v.toUpperCase(), x, y, T.typography.label, g);
}

/** Small caption text */
export function caption(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.muted) {
  r.text(v, x, y, T.typography.caption, g);
}

/** Body text — readable at glance distance */
export function body(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.primary) {
  r.text(v, x, y, T.typography.body, g);
}

/** Section title */
export function title(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.white) {
  r.text(v, x, y, T.typography.title, g);
}

/** Headline — for widget headers */
export function headline(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.white) {
  r.text(v, x, y, T.typography.headline, g);
}

/** Mono number — for data, time, counts */
export function mono(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.white, size?: number) {
  r.text(v, x, y, size ? { ...T.typography.mono, size } : T.typography.mono, g);
}

/** Mono large — for primary numbers */
export function monoLg(r: GlyphRaster, v: string, x: number, y: number, g = T.colors.white) {
  r.text(v, x, y, T.typography.monoLg, g);
}

// ═══════════════════════════════════════════════════════════════
// WIDGETS
// ═══════════════════════════════════════════════════════════════

/**
 * Clock widget — the centerpiece of the Even Realities dashboard.
 * Shows large time with optional date and secondary info.
 */
export function clockWidget(
  r: GlyphRaster, rect: Rect,
  time: string, opts: { date?: string; ampm?: string; seconds?: string; icon?: GlyphIconName } = {}
) {
  card(r, rect, { fill: T.colors.surface, radius: T.radius.lg });
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  // Big time
  r.text(time, cx, cy - 4, { ...T.typography.display, size: Math.min(48, rect.width * 0.22), align: "center", weight: 800 }, T.colors.white);

  // Date below
  if (opts.date) {
    caption(r, opts.date, cx, cy + 18, T.colors.secondary);
  }

  // AM/PM or seconds
  if (opts.ampm) {
    caption(r, opts.ampm, rect.x + rect.width - 12, rect.y + 20, T.colors.muted);
  }
  if (opts.seconds) {
    mono(r, opts.seconds, rect.x + rect.width - 12, rect.y + rect.height - 10, T.colors.muted, 10);
  }
}

/**
 * Weather widget — temperature + condition + details.
 * Optimized for a quick glance while walking.
 */
export function weatherWidget(
  r: GlyphRaster, rect: Rect,
  temp: string, condition: string,
  opts: { icon?: GlyphIconName; high?: string; low?: string; wind?: string; humidity?: string } = {}
) {
  card(r, rect, { fill: T.colors.surface, radius: T.radius.lg });

  const pad = 14;
  const tx = rect.x + pad;

  // Temperature (big)
  r.text(temp, tx, rect.y + 38, { ...T.typography.displayMd, size: 32, weight: 800 }, T.colors.white);

  // Condition
  caption(r, condition, tx, rect.y + 54, T.colors.secondary);

  // Icon (right side)
  if (opts.icon) {
    icon(r, opts.icon, rect.x + rect.width - 28, rect.y + 32, 28, T.colors.bright);
  }

  // Details row at bottom
  if (opts.high || opts.low || opts.wind || opts.humidity) {
    const detailY = rect.y + rect.height - 10;
    let dx = tx;
    if (opts.high) { caption(r, `H:${opts.high}`, dx, detailY, T.colors.muted); dx += 40; }
    if (opts.low) { caption(r, `L:${opts.low}`, dx, detailY, T.colors.muted); dx += 40; }
    if (opts.wind) { caption(r, opts.wind, dx, detailY, T.colors.muted); dx += 44; }
    if (opts.humidity) { caption(r, opts.humidity, dx, detailY, T.colors.muted); }
  }
}

/**
 * Metric widget — a single number with label and optional icon.
 * Perfect for steps, heart rate, battery, etc.
 */
export function metricWidget(
  r: GlyphRaster, rect: Rect,
  value: string, unit: string,
  opts: { icon?: GlyphIconName; accent?: number; fill?: number } = {}
) {
  card(r, rect, { fill: opts.fill ?? T.colors.surface, radius: T.radius.lg });
  const hasIcon = !!opts.icon;
  if (hasIcon) icon(r, opts.icon!, rect.x + 12, rect.y + 18, 18, opts.accent ?? T.colors.bright);
  const tx = rect.x + (hasIcon ? 34 : 12);
  const size = Math.min(26, rect.width * 0.4, rect.height * 0.45);
  r.text(value, tx, rect.y + rect.height / 2 + 6, { ...T.typography.displaySm, size, weight: 800 }, opts.accent ?? T.colors.white);
  label(r, unit, tx, rect.y + rect.height - 8, T.colors.secondary);
}

/**
 * List widget — scrollable list of items with icon, title, value, and chevron.
 * Optimized for glanceable reading.
 */
export function listItem(
  r: GlyphRaster, rect: Rect,
  opts: { icon?: GlyphIconName; title: string; value?: string; checked?: boolean; chevron?: boolean }
) {
  const cy = rect.y + rect.height / 2;
  let tx = rect.x + 12;

  if (opts.icon) {
    icon(r, opts.icon, tx + 8, cy, 16, T.colors.bright);
    tx += 28;
  }

  if (opts.checked !== undefined) {
    icon(r, opts.checked ? "check-square" : "square", tx + 6, cy, 14, opts.checked ? T.colors.bright : T.colors.muted);
    tx += 24;
  }

  r.text(opts.title, tx, cy + 4, { ...T.typography.body, size: 13 }, T.colors.white);

  if (opts.value) {
    r.text(opts.value, rect.x + rect.width - 12, cy + 4, { ...T.typography.caption, size: 10, align: "right" }, T.colors.secondary);
  }
  if (opts.chevron) {
    icon(r, "chevron-right", rect.x + rect.width - 14, cy, 10, T.colors.muted);
  }
}

/**
 * Progress bar — horizontal fill with track.
 */
export function progressBar(r: GlyphRaster, rect: Rect, v: number, opts: { fill?: number; track?: number; radius?: number } = {}) {
  const val = Math.max(0, Math.min(1, v));
  const rad = opts.radius ?? rect.height / 2;
  r.roundRect(rect.x, rect.y, rect.width, rect.height, rad, opts.track ?? T.colors.border);
  if (val > 0.01) r.roundRect(rect.x, rect.y, Math.max(rect.height, rect.width * val), rect.height, rad, opts.fill ?? T.colors.bright);
}

/**
 * Segmented bar — discrete steps, good for goals/battery/levels.
 */
export function segmentedBar(r: GlyphRaster, rect: Rect, segs: number, filled: number, opts: { fill?: number; track?: number } = {}) {
  const gap = 3;
  const segW = (rect.width - gap * (segs - 1)) / segs;
  for (let i = 0; i < segs; i++) {
    r.roundRect(rect.x + i * (segW + gap), rect.y, segW, rect.height, 2, i < filled ? (opts.fill ?? T.colors.bright) : (opts.track ?? T.colors.border));
  }
}

/**
 * Activity ring — circular progress indicator.
 */
export function activityRing(r: GlyphRaster, cx: number, cy: number, radius: number, p: number, opts: { gray?: number; bgGray?: number; width?: number } = {}) {
  r.circle(cx, cy, radius, undefined, opts.bgGray ?? T.colors.border, opts.width ?? 4);
  if (p > 0) r.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, opts.gray ?? T.colors.bright, opts.width ?? 4);
}

/**
 * Sparkline — mini chart for trends.
 */
export function sparkline(r: GlyphRaster, rect: Rect, values: number[], opts: { gray?: number; fillGray?: number; min?: number; max?: number } = {}) {
  if (values.length < 2) return;
  const min = opts.min ?? Math.min(...values);
  const max = opts.max ?? Math.max(...values);
  const range = Math.max(0.0001, max - min);
  const pts = values.map((v, i) => ({
    x: rect.x + (i / (values.length - 1)) * rect.width,
    y: rect.y + rect.height - ((v - min) / range) * rect.height
  }));
  if (opts.fillGray !== undefined) {
    r.polygon([{ x: rect.x, y: rect.y + rect.height }, ...pts, { x: rect.x + rect.width, y: rect.y + rect.height }], opts.fillGray);
  }
  for (let i = 1; i < pts.length; i++) {
    r.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, opts.gray ?? T.colors.bright, 1.5);
  }
}

/**
 * Pill / tag — small rounded label for categories, status.
 */
export function pill(r: GlyphRaster, x: number, y: number, text: string, g = T.colors.surface) {
  const w = text.length * 6 + 16;
  const h = 18;
  r.roundRect(x, y, w, h, h / 2, g);
  r.text(text, x + w / 2, y + h / 2 + 3, { ...T.typography.caption, size: 9, align: "center" }, T.colors.secondary);
}

/**
 * Notification badge — small dot with optional count.
 */
export function badge(r: GlyphRaster, x: number, y: number, count?: number, g = T.colors.highlight) {
  const text = count !== undefined ? (count > 9 ? "9+" : String(count)) : "";
  const w = text ? (text.length > 1 ? 18 : 14) : 8;
  const h = text ? 14 : 8;
  if (text) {
    r.roundRect(x - w / 2, y - h / 2, w, h, h / 2, g);
    r.text(text, x, y + 2, { ...T.typography.caption, size: 8, align: "center" }, T.colors.off);
  } else {
    r.circle(x, y, 3, g);
  }
}

/**
 * Status bar — top bar with time, battery, signal.
 */
export function statusBar(
  r: GlyphRaster,
  opts: { time?: string; battery?: number; signal?: number; notifications?: number }
) {
  const y = 16;
  if (opts.time) {
    r.text(opts.time, 560, y, { ...T.typography.mono, size: 11, align: "right" }, T.colors.secondary);
  }
  let rx = 540;
  if (opts.battery !== undefined) {
    const fill = opts.battery > 0.2 ? T.colors.bright : T.colors.highlight;
    const w = 18, h = 8;
    r.roundRect(rx - w, y - 5, w - 2, h, 2, T.colors.border);
    if (opts.battery > 0.01) r.roundRect(rx - w + 1, y - 4, Math.max(3, (w - 4) * opts.battery), h - 2, 1, fill);
    r.fillRect(rx - 2, y - 3, 2, 4, T.colors.border);
    rx -= 26;
  }
  if (opts.signal !== undefined) {
    const bars = Math.max(1, Math.min(4, opts.signal));
    for (let i = 0; i < 4; i++) {
      const h = 3 + i * 2;
      const col = i < bars ? T.colors.bright : T.colors.border;
      r.line(rx - i * 4, y + 1, rx - i * 4, y + 1 - h, col, 2);
    }
    rx -= 20;
  }
  if (opts.notifications) {
    badge(r, rx, y - 2, opts.notifications, T.colors.highlight);
  }
}

/**
 * Tab bar — bottom navigation between app sections.
 */
export function tabBar(r: GlyphRaster, y: number, tabs: Array<{ label: string; active?: boolean }>) {
  const totalW = 544;
  const tabW = totalW / tabs.length;
  for (let i = 0; i < tabs.length; i++) {
    const tx = 16 + i * tabW + tabW / 2;
    const g = tabs[i].active ? T.colors.white : T.colors.muted;
    r.text(tabs[i].label, tx, y, { ...T.typography.label, size: 9, align: "center" }, g);
    if (tabs[i].active) {
      r.line(tx - 16, y + 6, tx + 16, y + 6, T.colors.bright, 2);
    }
  }
}

/**
 * Page indicator dots.
 */
export function pageDots(r: GlyphRaster, active: number, total: number, y = 278) {
  const startX = 288 - (total - 1) * 7;
  for (let i = 0; i < total; i++) {
    r.circle(startX + i * 14, y, 2.5, i === active ? T.colors.white : T.colors.border);
  }
}

/**
 * Toast / inline alert.
 */
export function toast(r: GlyphRaster, rect: Rect, text: string, opts: { icon?: GlyphIconName; fill?: number } = {}) {
  card(r, rect, { fill: opts.fill ?? T.colors.surfaceHover, radius: T.radius.md });
  let tx = rect.x + 12;
  if (opts.icon) {
    icon(r, opts.icon, tx + 8, rect.y + rect.height / 2, 14, T.colors.bright);
    tx += 26;
  }
  r.text(text, tx, rect.y + rect.height / 2 + 4, { ...T.typography.body, size: 12 }, T.colors.primary);
}
