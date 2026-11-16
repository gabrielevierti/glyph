/**
 * Inputs: controls for an interface whose entire input vocabulary is tap,
 * double tap, and scroll up or down.
 *
 * There is no pointer, so nothing here is "clickable" — a control is either
 * focused or it is not, and the gestures act on whichever one is. Every
 * control therefore takes a `focused` flag and draws it the same way, and the
 * ones built for scrolling (`pickerWheel`, `dial`, `numberStepper`) are the
 * ones to reach for first.
 *
 * These only draw. Moving focus and changing values is the screen's `onInput`.
 */
import { toggle } from "./components.js";
import { checkBox, radioButton, sliderTrack } from "./extended.js";
import { bottom, centerX, centerY, clamp, inset, polar, right } from "./geometry.js";
import { icon } from "./icons.js";
import { pickStyle, truncate } from "./text.js";
import { gray as G, isOutline, radius as R, type as T } from "./theme.js";
import { count, finite, positive, unit } from "./util.js";
import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Rect, TextStyle } from "./types.js";

const NUM: TextStyle = { ...T.numeral, size: 12, leading: 14 };
const MICRO8: TextStyle = { ...T.micro, size: 8 };
const KEY_WORD: TextStyle = { ...T.label, tracking: 0 };

/** The one way focus is shown on a boxed control: a bright outline standing just off it. */
export function focusRing(g: GlyphRaster, r: Rect, radius: number = R.md, gap = 2.5): void {
  g.roundRect(inset(r, -gap), radius + gap, { stroke: G.max, width: 1.5 });
}

/** How a focused row is shown: the same edge marker a selected list row gets. */
function rowFocus(g: GlyphRaster, r: Rect): void {
  if (isOutline(g)) {
    g.roundRect({ x: r.x, y: r.y + 2, width: 2.5, height: Math.max(0, r.height - 4) }, 1.5, { fill: G.max });
    g.roundRect(r, R.md, { stroke: G.hairline, width: 1 });
  } else {
    g.roundRect(r, R.md, { fill: G.raised });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Choosing
// ─────────────────────────────────────────────────────────────────────────────

/** A handful of mutually exclusive options, side by side. */
export function segmentedControl(
  g: GlyphRaster, r: Rect, labels: readonly string[], active: number,
  opts: { focused?: boolean } = {}
): void {
  if (labels.length === 0) return;
  const outline = isOutline(g);
  const rad = Math.min(R.md, r.height / 2);
  const w = r.width / labels.length;
  if (!outline) g.roundRect(r, rad, { fill: G.sunken });
  g.roundRect(r, rad, { stroke: G.border, width: 1 });

  labels.forEach((label, i) => {
    const cell = { x: r.x + i * w, y: r.y, width: w, height: r.height };
    const on = i === active;
    if (on) {
      const well = inset(cell, 2.5);
      if (outline) g.roundRect(well, Math.max(0, rad - 2), { stroke: G.max, width: 1.2 });
      else g.roundRect(well, Math.max(0, rad - 2), { fill: G.max });
    } else if (i > 0 && i - 1 !== active) {
      g.vline(cell.x, r.y + 5, bottom(r) - 5, G.hairline);
    }
    g.text(
      truncate(g.measure, label, T.label, w - 10), centerX(cell), centerY(cell),
      T.label, on ? (outline ? G.max : G.off) : G.tertiary, "center", "middle"
    );
  });
  if (opts.focused) focusRing(g, r, rad);
}

/**
 * A wheel of options, scrolled through the middle. `index` may be fractional,
 * so a tween can roll it. Two side by side make a time picker.
 */
export function pickerWheel(
  g: GlyphRaster, r: Rect, options: readonly string[], index: number,
  opts: { visible?: number; focused?: boolean } = {}
): void {
  if (options.length === 0) return;
  let visible = count(opts.visible, 5, 1, 9);
  if (visible % 2 === 0) visible += 1;
  const rowH = r.height / visible;
  const pos = clamp(finite(index), 0, options.length - 1);
  const cy = centerY(r);

  const band = opts.focused ? G.max : G.border;
  g.hline(r.x + 4, right(r) - 4, cy - rowH / 2, band);
  g.hline(r.x + 4, right(r) - 4, cy + rowH / 2, band);

  g.scoped((layer) => {
    layer.clipRect(r);
    const first = Math.max(0, Math.floor(pos - visible / 2 - 1));
    const last = Math.min(options.length - 1, Math.ceil(pos + visible / 2 + 1));
    for (let i = first; i <= last; i++) {
      const distance = Math.abs(i - pos);
      const centre = distance < 0.5;
      const style = centre ? T.bodyStrong : T.body;
      layer.text(
        truncate(g.measure, options[i], style, r.width - 12), centerX(r), cy + (i - pos) * rowH,
        style, centre ? G.max : distance < 1.5 ? G.secondary : G.disabled, "center", "middle"
      );
    }
  });
}

function optionList(
  g: GlyphRaster, r: Rect, labels: readonly string[], isOn: (index: number) => boolean,
  kind: "radio" | "check", opts: { focused?: number; rowHeight?: number }
): void {
  const rowH = Math.max(16, finite(opts.rowHeight, 22));
  const shown = Math.min(labels.length, Math.max(1, Math.floor(r.height / rowH)));
  for (let i = 0; i < shown; i++) {
    const row = { x: r.x, y: r.y + i * rowH, width: r.width, height: rowH - 2 };
    const cy = centerY(row);
    const on = isOn(i);
    if (i === opts.focused) rowFocus(g, row);
    const box = { x: r.x + 8, y: cy - 8, width: 16, height: 16 };
    if (kind === "radio") radioButton(g, box, on); else checkBox(g, box, on);
    g.text(truncate(g.measure, labels[i], T.body, r.width - 40), r.x + 32, cy, T.body, on ? G.max : G.secondary, "left", "middle");
  }
}

/** One of several, stacked. */
export function radioGroup(
  g: GlyphRaster, r: Rect, labels: readonly string[], selected: number,
  opts: { focused?: number; rowHeight?: number } = {}
): void {
  optionList(g, r, labels, (i) => i === selected, "radio", opts);
}

/** Any of several, stacked. */
export function checkGroup(
  g: GlyphRaster, r: Rect, labels: readonly string[], checked: readonly boolean[],
  opts: { focused?: number; rowHeight?: number } = {}
): void {
  optionList(g, r, labels, (i) => checked[i] === true, "check", opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Numbers
// ─────────────────────────────────────────────────────────────────────────────

/** A value with a step down on its left and a step up on its right. */
export function numberStepper(
  g: GlyphRaster, r: Rect, value: string,
  opts: { canDecrement?: boolean; canIncrement?: boolean; focused?: boolean } = {}
): void {
  const rad = Math.min(R.md, r.height / 2);
  const side = Math.min(r.height + 4, r.width / 3);
  const cy = centerY(r);
  if (!isOutline(g)) g.roundRect(r, rad, { fill: G.sunken });
  g.roundRect(r, rad, { stroke: G.border, width: 1 });
  g.vline(r.x + side, r.y + 4, bottom(r) - 4, G.hairline);
  g.vline(right(r) - side, r.y + 4, bottom(r) - 4, G.hairline);
  icon(g, "minus", r.x + side / 2, cy, 12, opts.canDecrement === false ? G.border : G.strong);
  icon(g, "plus", right(r) - side / 2, cy, 12, opts.canIncrement === false ? G.border : G.strong);
  const style = pickStyle(g.measure, value, [T.numeral, NUM], r.width - side * 2 - 8);
  g.text(value, centerX(r), cy, style, G.max, "center", "middle");
  if (opts.focused) focusRing(g, r, rad);
}

/** A range within a range: two thumbs on one track. Values are 0..1. */
export function rangeSlider(g: GlyphRaster, r: Rect, low: number, high: number, opts: { steps?: number } = {}): void {
  let a = unit(low);
  let b = unit(high);
  if (a > b) [a, b] = [b, a];
  const y = Math.round(centerY(r));
  const x0 = r.x + 5;
  const w = Math.max(0, r.width - 10);
  g.hline(x0, x0 + w, y, G.border);
  const steps = count(opts.steps, 0, 0, 100);
  for (let i = 0; i < steps && steps > 1; i++) g.vline(x0 + (i * w) / (steps - 1), y - 3, y + 4, G.tertiary);
  g.rect({ x: x0 + w * a, y: y - 1, width: w * (b - a), height: 3 }, { fill: G.max });
  for (const v of [a, b]) {
    g.circle(x0 + w * v, y + 0.5, 5, { fill: G.off });
    g.circle(x0 + w * v, y + 0.5, 4, { fill: G.max });
  }
}

/**
 * A rotary control: the natural partner of a scroll gesture. The value sits in
 * the middle, where the sweep cannot cross it.
 */
export function dial(
  g: GlyphRaster, cx: number, cy: number, radius: number, value: number,
  opts: { label?: string; valueText?: string; ticks?: number; focused?: boolean } = {}
): void {
  const rad = Math.max(6, finite(radius, 20));
  const v = unit(value);
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const a = start + v * sweep;

  g.arc(cx, cy, rad, start, start + sweep, {
    stroke: opts.focused ? G.secondary : isOutline(g) ? G.border : G.sunken, width: isOutline(g) ? 1 : 3, cap: "round"
  });
  if (v > 0.003) g.arc(cx, cy, rad, start, a, { stroke: G.max, width: 3, cap: "round" });

  const ticks = count(opts.ticks, 0, 0, 60);
  for (let i = 0; i < ticks; i++) {
    const ta = start + (ticks === 1 ? 0.5 : i / (ticks - 1)) * sweep;
    const from = polar(cx, cy, rad + 6, ta);
    const to = polar(cx, cy, rad + 9, ta);
    g.line(from.x, from.y, to.x, to.y, { stroke: G.disabled, width: 1, cap: "butt" });
  }

  // The thumb rides on the arc itself, well away from the number in the middle.
  const thumb = polar(cx, cy, rad, a);
  g.circle(thumb.x, thumb.y, 5, { fill: G.off });
  g.circle(thumb.x, thumb.y, 3.5, { fill: G.max });
  if (opts.valueText) {
    const style = pickStyle(g.measure, opts.valueText, [T.numeral, NUM], rad * 1.4);
    g.text(opts.valueText, cx, cy, style, G.max, "center", "middle");
  }
  if (opts.label) g.text(opts.label, cx, cy + rad * 0.82, MICRO8, G.tertiary, "center", "middle");
}

// ─────────────────────────────────────────────────────────────────────────────
// Text and codes
// ─────────────────────────────────────────────────────────────────────────────

export interface TextFieldOptions {
  label?: string;
  placeholder?: string;
  focused?: boolean;
  /** Draw the insertion caret. Blink it by passing a value that alternates. */
  caret?: boolean;
  /** Show a dot per character instead of the text. */
  secure?: boolean;
  icon?: GlyphIconName;
}

/**
 * A single-line field — for dictated text, a search term, a code. When the
 * value is too long the *end* stays visible: that is where the typing is.
 */
export function textField(g: GlyphRaster, r: Rect, value: string, opts: TextFieldOptions = {}): void {
  let box = r;
  if (opts.label && r.height >= 36) {
    g.text(opts.label, r.x, r.y + 5, T.micro, G.tertiary, "left", "middle");
    box = { x: r.x, y: r.y + 13, width: r.width, height: r.height - 13 };
  }
  box = { ...box, height: Math.min(box.height, 28) };
  if (!isOutline(g)) g.roundRect(box, R.sm, { fill: G.sunken });
  g.roundRect(box, R.sm, { stroke: opts.focused ? G.max : G.border, width: opts.focused ? 1.5 : 1 });

  const cy = centerY(box);
  let x = box.x + 9;
  if (opts.icon) { icon(g, opts.icon, x + 6, cy, 13, G.tertiary); x += 19; }
  const room = Math.max(0, right(box) - 9 - x - (opts.caret ? 5 : 0));
  let end = x;

  if (value === "") {
    if (opts.placeholder) g.text(truncate(g.measure, opts.placeholder, T.body, room), x, cy, T.body, G.tertiary, "left", "middle");
  } else if (opts.secure) {
    const n = Math.min([...value].length, Math.max(0, Math.floor(room / 9)));
    for (let i = 0; i < n; i++) g.circle(x + 3 + i * 9, cy, 2.5, { fill: G.primary });
    end = x + n * 9;
  } else {
    let shown = value;
    if (g.measure(shown, T.body) > room) {
      const chars = [...value];
      let tail = "";
      for (let i = chars.length - 1; i >= 0; i--) {
        const next = chars[i] + tail;
        if (g.measure(`…${next}`, T.body) > room) break;
        tail = next;
      }
      shown = `…${tail}`;
    }
    g.text(shown, x, cy, T.body, G.primary, "left", "middle");
    end = x + g.measure(shown, T.body);
  }
  if (opts.caret) g.vline(end + 2, cy - 7, cy + 7, G.max, 1.5);
}

/** How many digits of a code have been entered. */
export function pinDots(
  g: GlyphRaster, cx: number, cy: number, length: number, filled: number,
  opts: { radius?: number; gap?: number } = {}
): void {
  const n = count(length, 4, 1, 16);
  const rad = positive(opts.radius, 4);
  const gap = Math.max(0, finite(opts.gap, 10));
  const pitch = rad * 2 + gap;
  const x0 = cx - ((n - 1) * pitch) / 2;
  const done = count(filled, 0, 0, n);
  for (let i = 0; i < n; i++) {
    if (i < done) g.circle(x0 + i * pitch, cy, rad, { fill: G.max });
    else g.circle(x0 + i * pitch, cy, rad - 0.5, { stroke: G.secondary, width: 1 });
  }
}

const KEYS: readonly (readonly string[])[] = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["←", "0", "OK"]];

/**
 * A grid of keys. `focused` and `pressed` are indices counted along the rows,
 * so scroll gestures can walk the keys in reading order.
 */
export function keypad(
  g: GlyphRaster, r: Rect,
  opts: { keys?: readonly (readonly string[])[]; focused?: number; pressed?: number; gap?: number } = {}
): void {
  const keys = opts.keys ?? KEYS;
  const rows = keys.length;
  const cols = keys.reduce((most, row) => Math.max(most, row.length), 0);
  if (rows === 0 || cols === 0) return;
  const gap = Math.max(0, finite(opts.gap, 4));
  const w = (r.width - gap * (cols - 1)) / cols;
  const h = (r.height - gap * (rows - 1)) / rows;
  if (!(w > 0) || !(h > 0)) return;
  const rad = Math.min(R.sm, h / 2);

  let index = 0;
  keys.forEach((rowKeys, ri) => {
    rowKeys.forEach((key, ci) => {
      const cell = { x: r.x + ci * (w + gap), y: r.y + ri * (h + gap), width: w, height: h };
      const pressed = index === opts.pressed;
      const focused = index === opts.focused;
      index++;
      if (pressed) g.roundRect(cell, rad, { fill: G.max });
      else {
        if (!isOutline(g)) g.roundRect(cell, rad, { fill: G.surface });
        g.roundRect(cell, rad, { stroke: focused ? G.max : G.border, width: focused ? 1.5 : 1 });
      }
      g.text(
        key, centerX(cell), centerY(cell), [...key].length > 1 ? KEY_WORD : T.numeral,
        pressed ? G.off : focused ? G.max : G.primary, "center", "middle"
      );
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings rows
// ─────────────────────────────────────────────────────────────────────────────

/** A setting that is on or off: its name, optionally what it does, and a switch. */
export function switchRow(
  g: GlyphRaster, r: Rect, label: string, on: boolean,
  opts: { detail?: string; icon?: GlyphIconName; focused?: boolean; disabled?: boolean } = {}
): void {
  if (opts.focused) rowFocus(g, r);
  const cy = centerY(r);
  let x = r.x + 10;
  if (opts.icon) { icon(g, opts.icon, x + 7, cy, 14, opts.disabled ? G.disabled : G.strong); x += 22; }
  const switchW = 28;
  const room = right(r) - 10 - switchW - 8 - x;
  const fg = opts.disabled ? G.disabled : opts.focused ? G.max : G.primary;

  if (opts.detail && r.height >= 30) {
    g.text(truncate(g.measure, label, T.body, room), x, cy - 7, T.body, fg, "left", "middle");
    g.text(truncate(g.measure, opts.detail, T.caption, room), x, cy + 8, T.caption, G.tertiary, "left", "middle");
  } else {
    g.text(truncate(g.measure, label, T.body, room), x, cy, T.body, fg, "left", "middle");
  }
  toggle(g, right(r) - 10 - switchW, cy, on, switchW);
}

/** A setting on a scale: its name, its current value, and a slider beneath. `value` is 0..1. */
export function sliderRow(
  g: GlyphRaster, r: Rect, label: string, value: number,
  opts: { valueText?: string; focused?: boolean; steps?: number } = {}
): void {
  if (opts.focused) rowFocus(g, r);
  const x = r.x + 10;
  const w = Math.max(0, r.width - 20);
  g.text(label, x, r.y + 9, T.caption, opts.focused ? G.max : G.secondary, "left", "middle");
  if (opts.valueText) g.text(opts.valueText, x + w, r.y + 9, NUM, G.primary, "right", "middle");
  sliderTrack(g, { x: x + 4, y: r.y + 17, width: Math.max(0, w - 8), height: Math.max(10, r.height - 20) }, value, { steps: opts.steps });
}
