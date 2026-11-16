/**
 * Heads-up instruments.
 *
 * These are the shapes a see-through display is actually good at: thin moving
 * scales, a fixed reference mark, one boxed number. Aviation worked this out
 * decades ago under the same constraint Glyph has — whatever you draw sits on
 * top of the thing the wearer is trying to look at — so most of what is here is
 * borrowed from a cockpit rather than from a phone.
 *
 * Every instrument is drawn in strokes. None of them fills more than a few
 * hundred pixels, in either surface style.
 */
import { bearingToAngle, bottom, centerX, centerY, clamp, polar, right } from "./geometry.js";
import { gray as G, isOutline, type as T } from "./theme.js";
import { count, finite, isMultiple, norm360, positive, unit } from "./util.js";
import type { GlyphRaster } from "./raster.js";
import type { Gray, Point, Rect, TextStyle } from "./types.js";

/** Scale numbers: small, untracked, so three digits fit between two ticks. */
const TICK: TextStyle = { ...T.micro, tracking: 0, uppercase: false };
const CARDINAL: TextStyle = { ...T.label, tracking: 0 };
const TAPE: TextStyle = { ...T.numeral, size: 12, leading: 14 };

const CARDINALS: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };

// ─────────────────────────────────────────────────────────────────────────────
// Tapes
// ─────────────────────────────────────────────────────────────────────────────

export interface HeadingTapeOptions {
  /** Degrees visible across the full width. Default 90. */
  span?: number;
  /** Spacing of the small ticks, in degrees. Default 5. */
  minorEvery?: number;
  /** Spacing of the labelled ticks, in degrees. Default 30. */
  labelEvery?: number;
  /** A selected heading to mark on the tape — a waypoint bearing, an autopilot bug. */
  bug?: number;
  /** Boxed numeric readout at the centre. Default true. */
  showValue?: boolean;
}

/**
 * A compass as a strip: the scale slides, the pointer stays put.
 *
 * It tells you less than a rose — only what is ahead — in a fifth of the
 * height, which is the trade a display this size wants along its top edge.
 */
export function headingTape(g: GlyphRaster, r: Rect, heading: number, opts: HeadingTapeOptions = {}): void {
  const span = clamp(finite(opts.span, 90), 10, 360);
  const minor = positive(opts.minorEvery, 5);
  const labelEvery = Math.max(minor, positive(opts.labelEvery, 30));
  const h = norm360(finite(heading));
  const pxPerDeg = r.width / span;
  const cx = centerX(r);
  const base = Math.round(bottom(r) - 7);     // room underneath for the pointer
  const labelY = base - 15;
  const showValue = opts.showValue !== false;

  g.scoped((layer) => {
    layer.clipRect(r);
    layer.hline(r.x, right(r), base, G.border);

    const first = Math.ceil((h - span / 2) / minor);
    const last = Math.floor((h + span / 2) / minor);
    for (let n = first; n <= last && n - first < 720; n++) {
      const d = n * minor;
      const x = cx + (d - h) * pxPerDeg;
      const deg = norm360(d);
      const labelled = isMultiple(deg, labelEvery);
      const medium = isMultiple(deg, 10);
      layer.vline(x, base - (labelled ? 8 : medium ? 5 : 3), base, labelled ? G.secondary : G.disabled);
      if (labelled) {
        const cardinal = CARDINALS[Math.round(deg)];
        layer.text(
          cardinal ?? String(Math.round(deg)), x, labelY,
          cardinal ? CARDINAL : TICK, cardinal ? G.max : G.secondary, "center", "middle"
        );
      }
    }

    if (opts.bug !== undefined && Number.isFinite(opts.bug)) {
      const delta = norm360(opts.bug - h + 180) - 180;
      const bx = cx + delta * pxPerDeg;
      if (bx > r.x + 6 && bx < right(r) - 6) {
        // On the tape: a notched marker sitting on the scale.
        layer.polygon(
          [
            { x: bx - 5, y: base }, { x: bx - 5, y: base - 6 }, { x: bx - 2, y: base - 6 },
            { x: bx, y: base - 3 }, { x: bx + 2, y: base - 6 }, { x: bx + 5, y: base - 6 }, { x: bx + 5, y: base }
          ],
          { fill: G.off, stroke: G.max, width: 1.2, join: "miter" }
        );
      } else {
        // Off the tape: point at the side it went off.
        const ex = bx <= r.x + 6 ? r.x + 1 : right(r) - 1;
        const dir = bx <= r.x + 6 ? 1 : -1;
        layer.polygon(
          [{ x: ex, y: labelY }, { x: ex + dir * 6, y: labelY - 4 }, { x: ex + dir * 6, y: labelY + 4 }],
          { fill: G.strong }
        );
      }
    }
  });

  // Fixed pointer: the wearer, not the scale, is what stays still.
  g.polygon([{ x: cx, y: base + 1 }, { x: cx - 5, y: base + 7 }, { x: cx + 5, y: base + 7 }], { fill: G.max });

  if (showValue) {
    // Half a pixel in from the top: a stroke is centred on its edge, and the
    // tape promises not to draw outside the rect it was given.
    const box = { x: cx - 24, y: r.height >= 42 ? r.y + 0.5 : labelY - 9, width: 48, height: 18 };
    g.roundRect(box, 3, { fill: G.off });
    g.roundRect(box, 3, { stroke: G.max, width: 1 });
    g.text(`${String(Math.round(h) % 360).padStart(3, "0")}°`, cx, centerY(box), T.numeral, G.max, "center", "middle");
  }
}

export interface ValueTapeOptions {
  /** Value between two adjacent ticks. Default 1. */
  step?: number;
  /** Every n-th tick is long and carries a number. Default 5. */
  labelEvery?: number;
  /** How many ticks fit in the height. Default 20. */
  visible?: number;
  /** Which edge the ticks sit on — normally the one facing the middle of the display. */
  edge?: "left" | "right";
  format?: (value: number) => string;
  /** A selected value to mark on the scale. */
  bug?: number;
  /** The scale stops here: no ticks below `min` or above `max`. */
  min?: number;
  max?: number;
}

/**
 * A vertical moving scale with the current value boxed at its centre — speed
 * on one side, altitude or depth on the other.
 *
 * The number is what you read. The tape around it is what tells you, without
 * reading, which way it is going and how fast.
 */
export function valueTape(g: GlyphRaster, r: Rect, value: number, opts: ValueTapeOptions = {}): void {
  const step = positive(opts.step, 1);
  const labelEvery = count(opts.labelEvery, 5, 1, 1000);
  const visible = clamp(finite(opts.visible, 20), 2, 200);
  const pxPerUnit = r.height / visible / step;
  const v = finite(value);
  const cy = centerY(r);
  const onRight = (opts.edge ?? "right") === "right";
  const edgeX = onRight ? Math.round(right(r)) - 1 : Math.round(r.x);
  const dir = onRight ? -1 : 1;
  const format = opts.format ?? ((n: number) => String(Math.round(n)));
  const lo = opts.min ?? -Infinity;
  const hi = opts.max ?? Infinity;

  g.scoped((layer) => {
    layer.clipRect(r);
    layer.vline(edgeX, r.y, bottom(r), G.border);

    const first = Math.ceil((v - (visible / 2) * step) / step);
    const last = Math.floor((v + (visible / 2) * step) / step);
    for (let n = first; n <= last && n - first < 400; n++) {
      const tv = n * step;
      if (tv < lo || tv > hi) continue;
      const y = cy - (tv - v) * pxPerUnit;
      const labelled = ((n % labelEvery) + labelEvery) % labelEvery === 0;
      layer.hline(edgeX, edgeX + dir * (labelled ? 8 : 4), y, labelled ? G.secondary : G.disabled);
      if (labelled) {
        layer.text(format(tv), edgeX + dir * 12, y, TAPE, G.secondary, onRight ? "right" : "left", "middle");
      }
    }

    if (opts.bug !== undefined && Number.isFinite(opts.bug)) {
      const by = clamp(cy - (opts.bug - v) * pxPerUnit, r.y + 5, bottom(r) - 5);
      layer.rect({ x: onRight ? edgeX - 2 : edgeX, y: by - 5, width: 3, height: 10 }, { fill: G.max });
    }
  });

  // The readout knocks a hole in the tape so the number is never crossed by a tick.
  const box = { x: (onRight ? r.x : r.x + 7) + 0.5, y: cy - 10, width: Math.max(0, r.width - 8), height: 20 };
  g.roundRect(box, 3, { fill: G.off });
  g.roundRect(box, 3, { stroke: G.max, width: 1 });
  const notch = onRight ? right(box) : box.x;
  g.polygon([{ x: notch, y: cy - 4 }, { x: notch - dir * 5, y: cy }, { x: notch, y: cy + 4 }], { fill: G.max });
  const text = format(v);
  const style = g.measure(text, T.numeral) <= box.width - 6 ? T.numeral : TAPE;
  g.text(text, centerX(box), cy, style, G.max, "center", "middle");
}

// ─────────────────────────────────────────────────────────────────────────────
// Attitude and aiming
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pitch ladder: the horizon and its rungs, rotated by roll, behind a fixed
 * aircraft symbol. The open-centre version of `attitudeIndicator` — nothing is
 * filled, so the real horizon stays visible through it.
 */
export function pitchLadder(
  g: GlyphRaster, r: Rect, pitch: number, roll: number,
  opts: { step?: number; pxPerDeg?: number } = {}
): void {
  const step = positive(opts.step, 10);
  const k = positive(opts.pxPerDeg, r.height / 50);
  const p = clamp(finite(pitch), -90, 90);
  const cx = centerX(r);
  const cy = centerY(r);
  const theta = (-finite(roll) * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  // A point given in the rolled frame, in screen coordinates.
  const at = (dx: number, dy: number): Point => ({ x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos });

  g.scoped((layer) => {
    layer.clipRect(r);
    const reach = Math.hypot(r.width, r.height) / 2 / k;
    const first = Math.ceil((p - reach) / step);
    const last = Math.floor((p + reach) / step);
    for (let n = first; n <= last && n - first < 200; n++) {
      const deg = n * step;
      if (Math.abs(deg) > 90) continue;
      const dy = (p - deg) * k;

      if (deg === 0) {
        const a = at(-r.width, dy);
        const b = at(r.width, dy);
        layer.line(a.x, a.y, b.x, b.y, { stroke: G.max, width: 1.5, cap: "butt" });
        continue;
      }

      const inner = 16;
      const outer = 42;
      for (const side of [-1, 1]) {
        const a = at(side * inner, dy);
        const b = at(side * outer, dy);
        // Rungs below the horizon are dashed, so up and down cannot be confused
        // when the horizon itself has scrolled out of view.
        layer.line(a.x, a.y, b.x, b.y, { stroke: G.strong, width: 1.2, cap: "butt", dash: deg < 0 ? [4, 3] : undefined });
        const tip = at(side * outer, dy + (deg > 0 ? 5 : -5));
        layer.line(b.x, b.y, tip.x, tip.y, { stroke: G.strong, width: 1.2, cap: "butt" });
        // Numbers are placed, not rotated: bitmap text does not survive a rotation.
        const label = at(side * (outer + 11), dy);
        layer.text(String(Math.abs(deg)), label.x, label.y, TICK, G.secondary, "center", "middle");
      }
    }
  });

  // Fixed aircraft symbol.
  g.polyline(
    [{ x: cx - 22, y: cy }, { x: cx - 8, y: cy }, { x: cx, y: cy + 6 }, { x: cx + 8, y: cy }, { x: cx + 22, y: cy }],
    { stroke: G.max, width: 2, join: "miter" }
  );
  g.circle(cx, cy, 1.4, { fill: G.max });
}

/** An aiming mark: `cross` leaves the centre open, `circle` rings it, `dot` is the minimum. */
export function reticle(
  g: GlyphRaster, cx: number, cy: number, size = 24,
  opts: { style?: "cross" | "circle" | "dot"; gap?: number; gray?: Gray; width?: number } = {}
): void {
  const half = Math.max(2, finite(size, 24) / 2);
  const gray = opts.gray ?? G.max;
  const width = opts.width ?? 1.5;
  const style = opts.style ?? "cross";

  if (style === "dot") {
    g.circle(cx, cy, half, { stroke: G.border, width: 1 });
    g.circle(cx, cy, 1.6, { fill: gray });
    return;
  }

  const ring = half * 0.6;
  const from = style === "circle" ? ring : clamp(opts.gap ?? half * 0.35, 0, half);
  if (style === "circle") g.circle(cx, cy, ring, { stroke: gray, width });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    g.line(cx + dx * from, cy + dy * from, cx + dx * half, cy + dy * half, { stroke: gray, width, cap: "butt" });
  }
  g.circle(cx, cy, 1.2, { fill: gray });
}

/**
 * Corner brackets around something in the world, with a caption — the way to
 * mark a thing without covering it.
 */
export function targetBox(
  g: GlyphRaster, r: Rect,
  opts: { label?: string; detail?: string; corner?: number; gray?: Gray; locked?: boolean } = {}
): void {
  const c = Math.max(2, Math.min(finite(opts.corner, 8), r.width / 2, r.height / 2));
  const gray = opts.gray ?? (opts.locked ? G.max : G.strong);
  const paint = { stroke: gray, width: opts.locked ? 2 : 1.2, join: "miter" as const, cap: "butt" as const };
  const x1 = r.x, y1 = r.y, x2 = right(r), y2 = bottom(r);

  g.polyline([{ x: x1, y: y1 + c }, { x: x1, y: y1 }, { x: x1 + c, y: y1 }], paint);
  g.polyline([{ x: x2 - c, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y1 + c }], paint);
  g.polyline([{ x: x2, y: y2 - c }, { x: x2, y: y2 }, { x: x2 - c, y: y2 }], paint);
  g.polyline([{ x: x1 + c, y: y2 }, { x: x1, y: y2 }, { x: x1, y: y2 - c }], paint);

  if (opts.locked) {
    // Locked on: a tick from the middle of each side, pointing in. Unlike a
    // marker above the box, this cannot collide with the caption.
    const cx = centerX(r);
    const cy = centerY(r);
    const t = Math.min(5, r.width / 4, r.height / 4);
    g.line(cx, y1, cx, y1 + t, paint); g.line(cx, y2, cx, y2 - t, paint);
    g.line(x1, cy, x1 + t, cy, paint); g.line(x2, cy, x2 - t, cy, paint);
  }
  if (opts.label) {
    // Above the box when there is room, below it when the box is against the top.
    const above = y1 >= 16;
    g.text(opts.label, x1, above ? y1 - 4 : y2 + 4, T.micro, opts.locked ? G.max : G.secondary, "left", above ? "bottom" : "top");
  }
  if (opts.detail) g.text(opts.detail, x2, y2 + 4, TAPE, G.tertiary, "right", "top");
}

/** Lateral deviation: a fixed centre, dots at regular offsets, and a diamond that is you. */
export function deviationBar(g: GlyphRaster, r: Rect, deviation: number, opts: { dots?: number; gray?: Gray } = {}): void {
  const dots = count(opts.dots, 2, 1, 5);
  const d = finite(deviation);
  const cx = centerX(r);
  const cy = centerY(r);
  const half = Math.max(0, r.width / 2 - 7);

  for (let i = 1; i <= dots; i++) {
    for (const side of [-1, 1]) g.circle(cx + (side * half * i) / dots, cy, 2.2, { stroke: G.secondary, width: 1 });
  }
  g.vline(cx, r.y, bottom(r), G.secondary);

  const x = cx + clamp(d, -1, 1) * half;
  const s = Math.max(3, Math.min(r.height / 2, 7));
  const diamond = [{ x, y: cy - s }, { x: x + s * 0.7, y: cy }, { x, y: cy + s }, { x: x - s * 0.7, y: cy }];
  // Pegged against the stop: hollow, so "off the scale" does not read as "at the edge".
  if (Math.abs(d) > 1) g.polygon(diamond, { fill: G.off, stroke: opts.gray ?? G.max, width: 1.5 });
  else g.polygon(diamond, { fill: opts.gray ?? G.max });
}

// ─────────────────────────────────────────────────────────────────────────────
// Scopes and dials
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarBlip {
  /** Bearing from the centre, degrees clockwise from north. */
  bearing: number;
  /** Distance from the centre as a fraction of the scope's radius, 0..1. */
  range: number;
  label?: string;
  gray?: Gray;
  kind?: "dot" | "triangle" | "square" | "diamond";
  /** Direction of travel, for `triangle` blips. */
  course?: number;
}

export interface RadarScopeOptions {
  rings?: number;
  /** Rotate the picture so this heading is up. Default 0 — north up. */
  heading?: number;
  /** Bearing of the sweep line. Omit for a static scope. */
  sweep?: number;
  blips?: RadarBlip[];
  /** Caption for the outer ring, e.g. "10 NM". */
  rangeLabel?: string;
}

/**
 * Range rings, bearing ticks and contacts around your own position. A
 * `rangeLabel` is written just below the scope, so leave about 14px under it.
 */
export function radarScope(g: GlyphRaster, cx: number, cy: number, radius: number, opts: RadarScopeOptions = {}): void {
  const rad = Math.max(0, finite(radius));
  if (!(rad > 0)) return;
  const rings = count(opts.rings, 3, 1, 8);
  const heading = finite(opts.heading);

  for (let i = 1; i <= rings; i++) {
    const outer = i === rings;
    g.circle(cx, cy, (rad * i) / rings, { stroke: outer ? G.border : G.hairline, width: 1, dash: outer ? undefined : [2, 3] });
  }
  for (let deg = 0; deg < 360; deg += 30) {
    const a = bearingToAngle(deg - heading);
    const from = polar(cx, cy, rad - (deg % 90 === 0 ? 5 : 3), a);
    const to = polar(cx, cy, rad, a);
    g.line(from.x, from.y, to.x, to.y, { stroke: deg % 90 === 0 ? G.secondary : G.border, width: 1, cap: "butt" });
  }
  const north = polar(cx, cy, rad - 12, bearingToAngle(-heading));
  g.text("N", north.x, north.y, CARDINAL, G.secondary, "center", "middle");

  if (opts.sweep !== undefined && Number.isFinite(opts.sweep)) {
    // A fading fan of lines rather than a filled wedge: the afterglow without the ink.
    const trail: Gray[] = [15, 12, 10, 8, 6, 5, 4];
    for (let i = trail.length - 1; i >= 0; i--) {
      const a = bearingToAngle(opts.sweep - heading - i * 4);
      const from = polar(cx, cy, rad * 0.1, a);
      const to = polar(cx, cy, rad - 1, a);
      g.line(from.x, from.y, to.x, to.y, { stroke: trail[i], width: i === 0 ? 1.5 : 1, cap: "butt" });
    }
  }

  for (const blip of opts.blips ?? []) {
    if (!Number.isFinite(blip.bearing) || !Number.isFinite(blip.range)) continue;
    const p = polar(cx, cy, rad * unit(blip.range), bearingToAngle(blip.bearing - heading));
    const gray = blip.gray ?? G.max;
    const kind = blip.kind ?? "dot";
    if (kind === "square") g.rect({ x: p.x - 2.5, y: p.y - 2.5, width: 5, height: 5 }, { stroke: gray, width: 1.2 });
    else if (kind === "diamond") {
      g.polygon([{ x: p.x, y: p.y - 4 }, { x: p.x + 3.5, y: p.y }, { x: p.x, y: p.y + 4 }, { x: p.x - 3.5, y: p.y }], { stroke: gray, width: 1.2 });
    } else if (kind === "triangle") {
      const a = bearingToAngle(finite(blip.course) - heading);
      const nose = polar(p.x, p.y, 5, a);
      const l = polar(p.x, p.y, 4, a + 2.5);
      const rr = polar(p.x, p.y, 4, a - 2.5);
      g.polygon([nose, l, rr], { fill: gray });
    } else g.circle(p.x, p.y, 2.2, { fill: gray });

    if (blip.label) {
      // Keep the caption on the inward side so it stays inside the scope.
      const leftSide = p.x > cx + rad * 0.45;
      g.text(blip.label, p.x + (leftSide ? -7 : 7), p.y - 6, T.micro, G.tertiary, leftSide ? "right" : "left", "middle");
    }
  }

  g.polygon([{ x: cx, y: cy - 5 }, { x: cx - 4, y: cy + 4 }, { x: cx + 4, y: cy + 4 }], { fill: G.off, stroke: G.max, width: 1.2 });
  // Under the scope rather than in a corner of it: every corner is somewhere a contact can be.
  if (opts.rangeLabel) g.text(opts.rangeLabel, cx, cy + rad + 9, T.micro, G.tertiary, "center", "middle");
}

/** Analog clock. Pass a `Date`, or hours and minutes of your own. */
export function clockFace(
  g: GlyphRaster, cx: number, cy: number, radius: number,
  time: Date | { hours: number; minutes: number; seconds?: number },
  opts: { numerals?: boolean; seconds?: boolean } = {}
): void {
  const rad = Math.max(0, finite(radius));
  if (!(rad > 0)) return;
  const t = time instanceof Date
    ? { hours: time.getHours(), minutes: time.getMinutes(), seconds: time.getSeconds() + time.getMilliseconds() / 1000 }
    : time;
  const hours = finite(t.hours) % 12;
  const minutes = finite(t.minutes);
  const seconds = t.seconds === undefined ? undefined : finite(t.seconds);

  g.circle(cx, cy, rad, { stroke: G.border, width: 1 });
  const numerals = opts.numerals === true && rad >= 28;
  for (let i = 0; i < 12; i++) {
    const major = i % 3 === 0;
    const a = bearingToAngle(i * 30);
    if (major && numerals) {
      const p = polar(cx, cy, rad - 9, a);
      g.text(String(i === 0 ? 12 : i), p.x, p.y, TICK, G.secondary, "center", "middle");
      continue;
    }
    const from = polar(cx, cy, rad - (major ? 6 : 3), a);
    const to = polar(cx, cy, rad - 1.5, a);
    g.line(from.x, from.y, to.x, to.y, { stroke: major ? G.secondary : G.disabled, width: major ? 1.5 : 1, cap: "butt" });
  }

  const hand = (degrees: number, length: number, width: number, gray: Gray, tail = 0): void => {
    const a = bearingToAngle(degrees);
    const from = polar(cx, cy, -rad * tail, a);
    const to = polar(cx, cy, rad * length, a);
    g.line(from.x, from.y, to.x, to.y, { stroke: gray, width });
  };
  hand((hours + minutes / 60) * 30, 0.5, 3, G.strong);
  hand((minutes + (seconds ?? 0) / 60) * 6, 0.78, 2, G.max);
  if (seconds !== undefined && opts.seconds !== false) hand(seconds * 6, 0.86, 1, G.secondary, 0.16);
  g.circle(cx, cy, 2.5, { fill: G.max });
  g.circle(cx, cy, 1, { fill: G.off });
}

// ─────────────────────────────────────────────────────────────────────────────
// Meters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Segmented level meter — audio level, signal, throttle. Runs along whichever
 * side of the box is longer unless told otherwise.
 */
export function levelMeter(
  g: GlyphRaster, r: Rect, level: number,
  opts: { segments?: number; peak?: number; hot?: number; gap?: number; vertical?: boolean } = {}
): void {
  const n = count(opts.segments, 12, 1, 64);
  const v = unit(level);
  const hot = unit(opts.hot ?? 0.8);
  const vertical = opts.vertical ?? r.height > r.width;
  const gap = Math.max(0, finite(opts.gap, 2));
  const long = vertical ? r.height : r.width;
  const seg = (long - gap * (n - 1)) / n;
  if (!(seg > 0)) return;

  const lit = Math.round(v * n);
  const peak = opts.peak === undefined ? -1 : Math.ceil(unit(opts.peak) * n) - 1;
  const rad = Math.min(1.5, seg / 2);
  for (let i = 0; i < n; i++) {
    const cell = vertical
      ? { x: r.x, y: bottom(r) - (i + 1) * seg - i * gap, width: r.width, height: seg }
      : { x: r.x + i * (seg + gap), y: r.y, width: seg, height: r.height };
    if (i < lit) g.roundRect(cell, rad, { fill: (i + 1) / n > hot ? G.max : G.primary });
    else if (i === peak) g.roundRect(cell, rad, { fill: G.strong });
    else if (isOutline(g)) g.roundRect(cell, rad, { stroke: G.hairline, width: 1 });
    else g.roundRect(cell, rad, { fill: G.sunken });
  }
}

export interface GaugeZone { from: number; to: number; gray: Gray; }

export interface LinearGaugeOptions {
  min?: number;
  max?: number;
  /** Labelled ticks, including both ends. Default 5. */
  ticks?: number;
  /** Subdivisions between two labelled ticks. Default 4; 0 or 1 for none. */
  minor?: number;
  zones?: GaugeZone[];
  format?: (value: number) => string;
  /** A second marker for a target or limit. */
  target?: number;
}

/** A horizontal scale with a pointer riding above it. Needs about 30px of height with labels. */
export function linearGauge(g: GlyphRaster, r: Rect, value: number, opts: LinearGaugeOptions = {}): void {
  const min = finite(opts.min, 0);
  const max = finite(opts.max, 100);
  const span = max - min > 0 ? max - min : 1;
  const x0 = r.x + 5;
  const x1 = right(r) - 5;
  const y = Math.round(r.y + 10);
  const X = (v: number): number => x0 + ((clamp(finite(v, min), min, min + span) - min) / span) * (x1 - x0);

  for (const zone of opts.zones ?? []) {
    const a = X(zone.from);
    const b = X(zone.to);
    g.rect({ x: Math.min(a, b), y: y - 1, width: Math.abs(b - a), height: 3 }, { fill: zone.gray });
  }
  g.hline(x0, x1, y, G.border);

  const ticks = count(opts.ticks, 5, 2, 50);
  const minor = count(opts.minor, 4, 0, 20);
  for (let i = 0; i < ticks; i++) {
    const tx = x0 + (i / (ticks - 1)) * (x1 - x0);
    g.vline(tx, y, y + 6, G.secondary);
    if (i < ticks - 1) {
      const next = x0 + ((i + 1) / (ticks - 1)) * (x1 - x0);
      for (let j = 1; j < minor; j++) g.vline(tx + ((next - tx) * j) / minor, y, y + 3, G.disabled);
    }
    if (opts.format) {
      const first = i === 0;
      const lastTick = i === ticks - 1;
      g.text(
        opts.format(min + (span * i) / (ticks - 1)), first ? r.x : lastTick ? right(r) : tx, y + 9,
        TICK, G.tertiary, first ? "left" : lastTick ? "right" : "center", "top"
      );
    }
  }

  if (opts.target !== undefined && Number.isFinite(opts.target)) {
    g.rect({ x: X(opts.target) - 1, y: y - 6, width: 2, height: 6 }, { fill: G.strong });
  }
  const px = X(value);
  g.polygon([{ x: px, y: y - 1 }, { x: px - 4.5, y: y - 9 }, { x: px + 4.5, y: y - 9 }], { fill: G.max });
}

export interface BarGaugeOptions {
  min?: number;
  max?: number;
  ticks?: number;
  format?: (value: number) => string;
  target?: number;
}

/** A vertical column that fills from the bottom, with its scale alongside — temperature, tank, battery. */
export function barGauge(g: GlyphRaster, r: Rect, value: number, opts: BarGaugeOptions = {}): void {
  const min = finite(opts.min, 0);
  const max = finite(opts.max, 100);
  const span = max - min > 0 ? max - min : 1;
  const barW = Math.max(4, Math.min(12, r.width * 0.4));
  const bar = { x: r.x, y: r.y, width: barW, height: r.height };
  const inner = { x: bar.x + 2.5, y: bar.y + 2.5, width: barW - 5, height: Math.max(0, bar.height - 5) };
  const Y = (v: number): number => bottom(inner) - ((clamp(finite(v, min), min, min + span) - min) / span) * inner.height;

  if (isOutline(g)) g.roundRect(bar, barW / 2, { stroke: G.border, width: 1 });
  else g.roundRect(bar, barW / 2, { fill: G.sunken });

  const top = Y(value);
  const fillH = bottom(inner) - top;
  if (fillH > 0.5) g.roundRect({ x: inner.x, y: top, width: inner.width, height: fillH }, inner.width / 2, { fill: G.max });

  const ticks = count(opts.ticks, 5, 0, 30);
  for (let i = 0; i < ticks; i++) {
    const t = ticks === 1 ? 0.5 : i / (ticks - 1);
    const ty = bottom(inner) - t * inner.height;
    g.hline(right(bar) + 3, right(bar) + 7, ty, G.disabled);
    if (opts.format) g.text(opts.format(min + span * t), right(bar) + 10, ty, TICK, G.tertiary, "left", "middle");
  }
  if (opts.target !== undefined && Number.isFinite(opts.target)) {
    const ty = Y(opts.target);
    g.polygon([{ x: right(bar) + 1, y: ty }, { x: right(bar) + 7, y: ty - 4 }, { x: right(bar) + 7, y: ty + 4 }], { fill: G.strong });
  }
}

/** Map scale: a measured line with its distance written above it. */
export function scaleBar(g: GlyphRaster, x: number, y: number, width: number, label: string, gray: Gray = G.secondary): void {
  const w = Math.max(0, finite(width));
  g.hline(x, x + w, y, gray);
  g.vline(x, y - 4, y + 1, gray);
  g.vline(x + w - 1, y - 4, y + 1, gray);
  g.text(label, x + w / 2, y - 5, TICK, G.tertiary, "center", "bottom");
}
