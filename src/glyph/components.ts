import { icon } from "./icons.js";
import { fitStyle, truncate } from "./text.js";
import { bearingToAngle, bottom, centerX, centerY, clamp, inset, polar, right } from "./geometry.js";
import { gray as G, isOutline, radius as R, space as S, type as T } from "./theme.js";
import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Corners, Gray, HAlign, Rect, TextStyle } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Surfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface PanelOptions {
  fill?: Gray;
  stroke?: Gray;
  radius?: Corners;
  strokeWidth?: number;
  /** Draw a dotted texture inside the panel. */
  texture?: boolean;
}

/** The base container. Everything else sits on one of these. */
export function panel(g: GlyphRaster, r: Rect, opts: PanelOptions = {}): Rect {
  const rad = opts.radius ?? R.lg;
  const outline = isOutline();
  // In outline mode a panel is its border. In filled mode it is its fill.
  const fill = opts.fill ?? (outline ? undefined : G.surface);
  const stroke = opts.stroke ?? (outline ? G.border : undefined);

  if (fill !== undefined) g.roundRect(r, rad, { fill });
  if (opts.texture && !outline) {
    g.scoped((layer) => { layer.clipRound(r, rad); layer.dots(r, 5, G.sunken, 0.5); });
  }
  if (stroke !== undefined) g.roundRect(r, rad, { stroke, width: opts.strokeWidth ?? 1 });
  return inset(r, S.md);
}

/** A panel with a label strip along the top. Returns the content rect. */
export function section(
  g: GlyphRaster, r: Rect, label: string,
  opts: PanelOptions & { accessory?: string; icon?: GlyphIconName } = {}
): Rect {
  panel(g, r, { fill: opts.fill, stroke: opts.stroke, radius: opts.radius ?? R.lg, texture: opts.texture });
  const headerY = r.y + 13;
  let x = r.x + S.md;
  if (opts.icon) { icon(g, opts.icon, x + 5, headerY, 12, G.tertiary); x += 17; }
  // The accessory wins the space it needs; the label takes what is left.
  const accessoryWidth = opts.accessory ? g.measure(opts.accessory, T.micro) + S.sm : 0;
  const labelWidth = right(r) - S.md - accessoryWidth - x;
  g.text(truncate(g.measure, label, T.label, labelWidth), x, headerY, T.label, G.secondary, "left", "middle");
  if (opts.accessory) g.text(opts.accessory, right(r) - S.md, headerY, T.micro, G.tertiary, "right", "middle");
  g.hline(r.x + S.md, right(r) - S.md, r.y + 24, G.hairline);
  return inset({ x: r.x, y: r.y + 26, width: r.width, height: r.height - 26 }, { left: S.md, right: S.md, bottom: S.md });
}

/** Full-width label with rules on either side. */
export function divider(g: GlyphRaster, r: Rect, label?: string, gray: Gray = G.hairline): void {
  const y = centerY(r);
  if (!label) { g.hline(r.x, right(r), y, gray); return; }
  const w = g.measure(label, T.micro);
  const pad = 6;
  g.hline(r.x, centerX(r) - w / 2 - pad, y, gray);
  g.hline(centerX(r) + w / 2 + pad, right(r), y, gray);
  g.text(label, centerX(r), y, T.micro, G.tertiary, "center", "middle");
}

// ─────────────────────────────────────────────────────────────────────────────
// Data display
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricOptions {
  unit?: string;
  label?: string;
  icon?: GlyphIconName;
  /** Positive renders an up arrow, negative a down arrow. */
  delta?: number;
  deltaText?: string;
  align?: HAlign;
  valueStyle?: TextStyle;
  gray?: Gray;
}

/**
 * The workhorse: one number, read at a glance, with its unit and a caption.
 * The unit sits on the value's baseline rather than beside the label, because
 * "12.4 kn" reads as one token and "12.4 / kn" reads as two.
 */
export function metric(g: GlyphRaster, r: Rect, value: string, opts: MetricOptions = {}): void {
  const align = opts.align ?? "left";
  const requested = opts.valueStyle ?? T.numeralLg;
  const anchorX = align === "left" ? r.x : align === "right" ? right(r) : centerX(r);
  const labelY = bottom(r) - 5;
  const hasLabel = !!opts.label;
  const valueY = hasLabel ? bottom(r) - 18 : centerY(r);

  let x = anchorX;
  if (opts.icon && align === "left") {
    icon(g, opts.icon, r.x + 7, r.y + 8, 14, G.tertiary);
    x = r.x + 18;
  }

  // The value is the one thing that must never be clipped, so the type scale
  // yields to the box rather than the other way round.
  const unitWidth = opts.unit ? g.measure(opts.unit, T.caption) + 6 : 0;
  const style = fitStyle(
    g.measure, value, requested,
    Math.max(24, right(r) - x - unitWidth),
    hasLabel ? r.height - 24 : r.height
  );

  const valueWidth = g.measure(value, style);
  g.text(value, x, valueY, style, opts.gray ?? G.max, align, "bottom");

  if (opts.unit) {
    const unitX = align === "right" ? x - valueWidth - 3 : align === "center" ? x + valueWidth / 2 + 3 : x + valueWidth + 3;
    g.text(opts.unit, unitX, valueY - 1, T.caption, G.tertiary, align === "right" ? "right" : "left", "bottom");
  }
  if (opts.label) g.text(opts.label, anchorX, labelY, T.label, G.secondary, align, "bottom");

  if (opts.delta !== undefined && opts.delta !== 0) {
    const up = opts.delta > 0;
    icon(g, up ? "caret-up" : "caret-down", right(r) - 8, r.y + 9, 12, G.strong);
    if (opts.deltaText) g.text(opts.deltaText, right(r) - 17, r.y + 9, T.micro, G.secondary, "right", "middle");
  }
}

/** Label above, value below — for dense readouts where the label leads. */
export function stat(g: GlyphRaster, r: Rect, label: string, value: string, opts: { gray?: Gray; align?: HAlign; style?: TextStyle } = {}): void {
  const align = opts.align ?? "left";
  const x = align === "left" ? r.x : align === "right" ? right(r) : centerX(r);
  g.text(label, x, r.y, T.micro, G.tertiary, align, "top");
  g.text(value, x, r.y + 12, opts.style ?? T.numeral, opts.gray ?? G.primary, align, "top");
}

/** Key on the left, value on the right, aligned across a stack of rows. */
export function keyValue(g: GlyphRaster, r: Rect, key: string, value: string, opts: { gray?: Gray; leader?: boolean } = {}): void {
  const y = centerY(r);
  g.text(key, r.x, y, T.caption, G.secondary, "left", "middle");
  g.text(value, right(r), y, T.numeral, opts.gray ?? G.primary, "right", "middle");
  if (opts.leader) {
    const keyW = g.measure(key, T.caption);
    const valW = g.measure(value, T.numeral);
    const from = r.x + keyW + 5;
    const to = right(r) - valW - 5;
    if (to > from) g.line(from, y + 2, to, y + 2, { stroke: G.hairline, width: 1, dash: [1, 3], cap: "butt" });
  }
}

export interface ListRowOptions {
  icon?: GlyphIconName;
  title: string;
  subtitle?: string;
  value?: string;
  meta?: string;
  chevron?: boolean;
  selected?: boolean;
  checked?: boolean;
}

/** One row of a list. Selection is a filled well, not a colour change. */
export function listRow(g: GlyphRaster, r: Rect, opts: ListRowOptions): void {
  if (opts.selected) {
    if (isOutline()) {
      // A bright edge marker costs a few dozen pixels; a filled row costs the view.
      g.roundRect({ x: r.x, y: r.y + 2, width: 2.5, height: r.height - 4 }, 1.5, { fill: G.max });
      g.roundRect(r, R.md, { stroke: G.hairline, width: 1 });
    } else {
      g.roundRect(r, R.md, { fill: G.raised });
    }
  }
  const cy = centerY(r);
  let x = r.x + S.md;

  if (opts.checked !== undefined) {
    icon(g, opts.checked ? "check-square" : "square", x + 7, cy, 15, opts.checked ? G.max : G.disabled);
    x += 24;
  }
  if (opts.icon) {
    icon(g, opts.icon, x + 8, cy, 16, opts.selected ? G.max : G.strong);
    x += 26;
  }

  const rightEdge = right(r) - S.md - (opts.chevron ? 14 : 0);
  const valueWidth = opts.value ? g.measure(opts.value, T.numeral) + 10 : 0;
  const textWidth = rightEdge - x - valueWidth;

  if (opts.subtitle) {
    g.textBox(opts.title, { x, y: cy - 15, width: textWidth, height: 16 }, T.bodyStrong, opts.selected ? G.max : G.primary, { wrap: false, vAlign: "middle" });
    g.textBox(opts.subtitle, { x, y: cy + 1, width: textWidth, height: 14 }, T.caption, G.tertiary, { wrap: false, vAlign: "middle" });
  } else {
    g.textBox(opts.title, { x, y: r.y, width: textWidth, height: r.height }, T.body, opts.selected ? G.max : G.primary, { wrap: false, vAlign: "middle" });
  }

  if (opts.value) g.text(opts.value, rightEdge, cy, T.numeral, opts.selected ? G.max : G.secondary, "right", "middle");
  if (opts.chevron) icon(g, "chevron-right", right(r) - S.md, cy, 12, G.disabled);
}

// ─────────────────────────────────────────────────────────────────────────────
// Indicators
// ─────────────────────────────────────────────────────────────────────────────

export function progressBar(
  g: GlyphRaster, r: Rect, value: number,
  opts: { fill?: Gray; track?: Gray; radius?: number; ticks?: number } = {}
): void {
  const v = clamp(value, 0, 1);
  const rad = opts.radius ?? r.height / 2;
  if (opts.track !== undefined) g.roundRect(r, rad, { fill: opts.track });
  else if (isOutline()) g.roundRect(r, rad, { stroke: G.hairline, width: 1 });
  else g.roundRect(r, rad, { fill: G.sunken });
  if (opts.ticks) {
    for (let i = 1; i < opts.ticks; i++) g.vline(r.x + (r.width * i) / opts.ticks, r.y, bottom(r), G.off);
  }
  if (v > 0.005) g.roundRect({ ...r, width: Math.max(r.height, r.width * v) }, rad, { fill: opts.fill ?? G.max });
}

/** Discrete segments — better than a smooth bar when the count matters. */
export function segmentedBar(
  g: GlyphRaster, r: Rect, segments: number, filled: number,
  opts: { fill?: Gray; track?: Gray; gap?: number } = {}
): void {
  const gap = opts.gap ?? 3;
  const w = (r.width - gap * (segments - 1)) / segments;
  for (let i = 0; i < segments; i++) {
    const cell = { x: r.x + i * (w + gap), y: r.y, width: w, height: r.height };
    const rad = Math.min(2, r.height / 2);
    if (i < filled) g.roundRect(cell, rad, { fill: opts.fill ?? G.max });
    else if (isOutline() && opts.track === undefined) g.roundRect(cell, rad, { stroke: G.hairline, width: 1 });
    else g.roundRect(cell, rad, { fill: opts.track ?? G.sunken });
  }
}

export function battery(g: GlyphRaster, x: number, y: number, level: number, opts: { width?: number; height?: number; gray?: Gray } = {}): void {
  const w = opts.width ?? 22;
  const h = opts.height ?? 11;
  const v = clamp(level, 0, 1);
  g.roundRect({ x, y: y - h / 2, width: w, height: h }, 2.5, { stroke: opts.gray ?? G.secondary, width: 1 });
  g.roundRect({ x: x + w + 1, y: y - 2.5, width: 2, height: 5 }, 1, { fill: opts.gray ?? G.secondary });
  const inner = w - 4;
  if (v > 0.02) {
    g.roundRect({ x: x + 2, y: y - h / 2 + 2, width: Math.max(1.5, inner * v), height: h - 4 }, 1, { fill: v < 0.15 ? G.strong : G.max });
  }
}

export function signalBars(g: GlyphRaster, x: number, y: number, level: number, bars = 4, opts: { height?: number } = {}): void {
  const maxH = opts.height ?? 11;
  for (let i = 0; i < bars; i++) {
    const h = ((i + 1) / bars) * maxH;
    g.rect({ x: x + i * 4, y: y + maxH / 2 - h, width: 2.5, height: h }, { fill: i < level ? G.max : G.hairline });
  }
}

/** The top strip. Fixed to the 576-wide surface by design — it is chrome. */
export function statusBar(
  g: GlyphRaster, r: Rect,
  opts: { title?: string; time?: string; battery?: number; signal?: number; icons?: GlyphIconName[] } = {}
): void {
  const cy = centerY(r);
  if (opts.title) g.text(opts.title, r.x, cy, T.label, G.secondary, "left", "middle");
  let x = right(r);
  if (opts.battery !== undefined) { battery(g, x - 24, cy, opts.battery); x -= 34; }
  if (opts.signal !== undefined) { signalBars(g, x - 14, cy, opts.signal); x -= 24; }
  for (const name of opts.icons ?? []) { icon(g, name, x - 7, cy, 13, G.secondary); x -= 18; }
  if (opts.time) { g.text(opts.time, x - 4, cy, T.numeral, G.primary, "right", "middle"); }
}

export function pageDots(g: GlyphRaster, cx: number, y: number, count: number, active: number): void {
  const gap = 9;
  const startX = cx - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    if (i === active) g.circle(startX + i * gap, y, 2.6, { fill: G.max });
    else g.circle(startX + i * gap, y, 2.2, { fill: G.border });
  }
}

export function tabBar(g: GlyphRaster, r: Rect, tabs: string[], active: number): void {
  const w = r.width / tabs.length;
  tabs.forEach((tab, i) => {
    const cx = r.x + i * w + w / 2;
    const on = i === active;
    g.text(tab, cx, centerY(r) - 2, T.micro, on ? G.max : G.disabled, "center", "middle");
    if (on) g.roundRect({ x: cx - 12, y: bottom(r) - 4, width: 24, height: 2 }, 1, { fill: G.max });
  });
}

/** Vertical scroll indicator for lists that overflow. */
export function scrollbar(g: GlyphRaster, r: Rect, offset: number, visible: number, total: number): void {
  if (total <= visible) return;
  if (!isOutline()) g.roundRect(r, r.width / 2, { fill: G.sunken });
  const h = Math.max(10, (visible / total) * r.height);
  const y = r.y + (offset / total) * r.height;
  g.roundRect({ x: r.x, y: Math.min(y, bottom(r) - h), width: r.width, height: h }, r.width / 2, { fill: G.border });
}

// ─────────────────────────────────────────────────────────────────────────────
// Chips, buttons, overlays
// ─────────────────────────────────────────────────────────────────────────────

/** A small rounded tag. Width is measured, not guessed. */
export function pill(
  g: GlyphRaster, x: number, y: number, text: string,
  opts: { fill?: Gray; gray?: Gray; icon?: GlyphIconName; height?: number; style?: TextStyle } = {}
): number {
  const style = opts.style ?? T.micro;
  const h = opts.height ?? 17;
  const iconW = opts.icon ? 14 : 0;
  const w = g.measure(text, style) + 16 + iconW;
  const box = { x, y: y - h / 2, width: w, height: h };
  if (opts.fill !== undefined) g.roundRect(box, h / 2, { fill: opts.fill });
  else if (isOutline()) g.roundRect(box, h / 2, { stroke: G.border, width: 1 });
  else g.roundRect(box, h / 2, { fill: G.raised });
  if (opts.icon) icon(g, opts.icon, x + 12, y, 11, opts.gray ?? G.secondary);
  g.text(text, x + 8 + iconW, y, style, opts.gray ?? G.primary, "left", "middle");
  return w;
}

/** Outlined variant — reads as "state" rather than "chip". */
export function tag(g: GlyphRaster, x: number, y: number, text: string, opts: { gray?: Gray; height?: number } = {}): number {
  const h = opts.height ?? 16;
  const w = g.measure(text, T.micro) + 14;
  g.roundRect({ x, y: y - h / 2, width: w, height: h }, R.xs, { stroke: opts.gray ?? G.border, width: 1 });
  g.text(text, x + w / 2, y, T.micro, opts.gray ?? G.secondary, "center", "middle");
  return w;
}

export function badge(g: GlyphRaster, x: number, y: number, count?: number): void {
  if (count === undefined) { g.circle(x, y, 3, { fill: G.max }); return; }
  const text = count > 99 ? "99+" : String(count);
  const w = Math.max(15, g.measure(text, T.micro) + 9);
  g.roundRect({ x: x - w / 2, y: y - 7.5, width: w, height: 15 }, 7.5, { fill: G.max });
  g.text(text, x, y, { ...T.micro, size: 9 }, G.off, "center", "middle");
}

export function button(
  g: GlyphRaster, r: Rect, text: string,
  opts: { icon?: GlyphIconName; primary?: boolean; focused?: boolean } = {}
): void {
  const outline = isOutline();
  const fill = outline ? undefined : opts.primary ? G.max : G.raised;
  const fg = outline ? (opts.primary ? G.max : G.secondary) : opts.primary ? G.off : G.primary;
  if (fill !== undefined) g.roundRect(r, R.md, { fill });
  if (outline) g.roundRect(r, R.md, { stroke: opts.primary ? G.max : G.border, width: opts.primary ? 1.5 : 1 });
  if (opts.focused) g.roundRect(inset(r, -2.5), R.md + 2, { stroke: G.max, width: 1.5 });
  const iconW = opts.icon ? 18 : 0;
  const textW = g.measure(text, T.bodyStrong);
  const startX = centerX(r) - (textW + iconW) / 2;
  if (opts.icon) icon(g, opts.icon, startX + 7, centerY(r), 14, fg);
  g.text(text, startX + iconW, centerY(r), T.bodyStrong, fg, "left", "middle");
}

export function toggle(g: GlyphRaster, x: number, y: number, on: boolean, width = 32): void {
  const h = width * 0.56;
  if (isOutline()) {
    g.roundRect({ x, y: y - h / 2, width, height: h }, h / 2, { stroke: on ? G.max : G.border, width: 1 });
    g.circle(on ? x + width - h / 2 : x + h / 2, y, h / 2 - 3, { fill: on ? G.max : G.disabled });
  } else {
    g.roundRect({ x, y: y - h / 2, width, height: h }, h / 2, { fill: on ? G.max : G.border });
    g.circle(on ? x + width - h / 2 : x + h / 2, y, h / 2 - 2.5, { fill: on ? G.off : G.surface });
  }
}

/** Transient message strip. */
export function toast(g: GlyphRaster, r: Rect, text: string, opts: { icon?: GlyphIconName; alpha?: number } = {}): void {
  g.scoped((layer) => {
    if (!isOutline()) layer.roundRect(r, R.pill, { fill: G.raised, alpha: opts.alpha ?? 1 });
    layer.roundRect(r, R.pill, { stroke: G.border, width: 1, alpha: opts.alpha ?? 1 });
    let x = r.x + 16;
    if (opts.icon) { icon(layer, opts.icon, x + 7, centerY(r), 14, G.max); x += 24; }
    layer.text(text, x, centerY(r), T.body, G.primary, "left", "middle");
  });
}

/** Centred placeholder for "nothing here yet". */
export function emptyState(g: GlyphRaster, r: Rect, iconName: GlyphIconName, title: string, subtitle?: string): void {
  const cy = centerY(r) - (subtitle ? 10 : 4);
  icon(g, iconName, centerX(r), cy - 18, 30, G.disabled);
  g.text(title, centerX(r), cy + 10, T.title, G.secondary, "center", "middle");
  if (subtitle) g.textBox(subtitle, { x: r.x + 40, y: cy + 22, width: r.width - 80, height: 32 }, T.caption, G.tertiary, { hAlign: "center" });
}

/** Dim everything behind a foreground panel. */
export function scrim(g: GlyphRaster, r: Rect, level = 0.5): void {
  g.rect(r, { fill: G.off, alpha: level });
}

// ─────────────────────────────────────────────────────────────────────────────
// Instruments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A proper compass rose: cardinal letters, minor ticks, a fixed lubber line and
 * an optional second pointer (wind, next waypoint) that rotates with the card.
 */
export function compassRose(
  g: GlyphRaster, cx: number, cy: number, radius: number, heading: number,
  opts: { pointer?: number; pointerLabel?: string; showValue?: boolean; ticks?: boolean } = {}
): void {
  g.circle(cx, cy, radius, { stroke: G.border, width: 1 });

  if (opts.ticks !== false) {
    for (let deg = 0; deg < 360; deg += 15) {
      const a = bearingToAngle(deg - heading);
      const major = deg % 45 === 0;
      const from = polar(cx, cy, radius - (major ? 7 : 4), a);
      const to = polar(cx, cy, radius - 1, a);
      g.line(from.x, from.y, to.x, to.y, { stroke: major ? G.secondary : G.hairline, width: major ? 1.5 : 1, cap: "butt" });
    }
  }

  const cardinals: Array<[string, number]> = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  for (const [letter, deg] of cardinals) {
    const p = polar(cx, cy, radius - 16, bearingToAngle(deg - heading));
    g.text(letter, p.x, p.y, letter === "N" ? T.bodyStrong : T.caption, letter === "N" ? G.max : G.secondary, "center", "middle");
  }

  if (opts.pointer !== undefined) {
    const a = bearingToAngle(opts.pointer - heading);
    const tip = polar(cx, cy, radius - 22, a);
    const leftP = polar(cx, cy, radius - 33, a - 0.16);
    const rightP = polar(cx, cy, radius - 33, a + 0.16);
    g.polygon([tip, leftP, rightP], { fill: G.strong });
    if (opts.pointerLabel) {
      const lp = polar(cx, cy, radius - 40, a);
      g.text(opts.pointerLabel, lp.x, lp.y, T.micro, G.tertiary, "center", "middle");
    }
  }

  // Fixed lubber line: the boat, not the card, is what stays still.
  g.polygon(
    [{ x: cx, y: cy - radius + 2 }, { x: cx - 5, y: cy - radius - 7 }, { x: cx + 5, y: cy - radius - 7 }],
    { fill: G.max }
  );

  if (opts.showValue !== false) {
    g.text(`${Math.round(heading).toString().padStart(3, "0")}°`, cx, cy, T.numeralLg, G.max, "center", "middle");
  }
}

/**
 * Artificial horizon. Pitch shifts the horizon line, roll rotates it.
 * Clipped to a circle so the rotation never bleeds into the layout.
 */
export function attitudeIndicator(
  g: GlyphRaster, cx: number, cy: number, radius: number, pitch: number, roll: number
): void {
  // Sky and ground live inside a circular clip so the roll rotation cannot
  // bleed into the surrounding layout.
  g.scoped((layer) => {
    layer.clipCircle(cx, cy, radius);
    layer.rotateAbout(cx, cy, (-roll * Math.PI) / 180);
    const horizonY = cy + pitch * 2;
    const ground = { x: cx - radius * 2, y: horizonY, width: radius * 4, height: radius * 2 };
    if (!isOutline()) layer.rect(ground, { fill: G.sunken });
    layer.hatch(ground, 5, isOutline() ? G.hairline : G.border);
    layer.hline(cx - radius * 1.4, cx + radius * 1.4, horizonY, G.max, 1.5);
    for (const step of [-20, -10, 10, 20]) {
      const y = horizonY - step * 2;
      const w = step % 20 === 0 ? 16 : 9;
      layer.hline(cx - w, cx + w, y, G.disabled);
    }
  });
  // Fixed aircraft reference.
  g.line(cx - radius * 0.5, cy, cx - radius * 0.15, cy, { stroke: G.max, width: 2 });
  g.line(cx + radius * 0.15, cy, cx + radius * 0.5, cy, { stroke: G.max, width: 2 });
  g.circle(cx, cy, 2, { fill: G.max });
  g.circle(cx, cy, radius, { stroke: G.border, width: 1.5 });
}

/** Wind arrow with speed, drawn as a barb pointing the way the wind is going. */
export function windIndicator(
  g: GlyphRaster, cx: number, cy: number, radius: number, direction: number, speed: number, unit = "kn"
): void {
  g.circle(cx, cy, radius, { stroke: G.hairline, width: 1, dash: [2, 3] });
  const a = bearingToAngle(direction + 180);
  const tip = polar(cx, cy, radius, a);
  const tail = polar(cx, cy, -radius * 0.75, a);
  g.line(tail.x, tail.y, tip.x, tip.y, { stroke: G.strong, width: 2 });
  const l = polar(tip.x, tip.y, radius * 0.35, a + 2.5);
  const rr = polar(tip.x, tip.y, radius * 0.35, a - 2.5);
  g.polygon([tip, l, rr], { fill: G.max });
  // Knock the barb out behind the readout — the number has to stay legible
  // whichever way the wind is blowing.
  g.circle(cx, cy, radius * 0.46, { fill: G.off });
  g.text(String(speed), cx, cy - 3, T.numeral, G.max, "center", "middle");
  g.text(unit, cx, cy + 8, { ...T.micro, size: 8 }, G.tertiary, "center", "middle");
}

/** Speed roundel — the European sign, which reads instantly. */
export function speedLimit(g: GlyphRaster, cx: number, cy: number, radius: number, limit: number, over = false): void {
  if (over) g.circle(cx, cy, radius + 4, { stroke: G.strong, width: 1.5, dash: [3, 4] });
  if (isOutline()) {
    g.circle(cx, cy, radius - 1.75, { stroke: G.max, width: 3.5 });
  } else {
    g.circle(cx, cy, radius, { fill: G.max });
    g.circle(cx, cy, radius - 3.5, { fill: G.off });
  }
  g.text(String(limit), cx, cy + 1, { ...T.numeralLg, size: radius * 1.05 }, G.max, "center", "middle");
}

/** Big directional maneuver arrow for navigation. */
export function maneuverArrow(g: GlyphRaster, cx: number, cy: number, size: number, kind: "left" | "right" | "straight" | "uturn" | "slight-left" | "slight-right"): void {
  const name: GlyphIconName =
    kind === "left" ? "corner-left"
      : kind === "right" ? "corner-right"
        : kind === "uturn" ? "u-turn"
          : kind === "slight-left" ? "arrow-up-left"
            : kind === "slight-right" ? "arrow-up-right"
              : "arrow-up";
  icon(g, name, cx, cy, size, G.max, { width: Math.max(2, size / 12) });
}
