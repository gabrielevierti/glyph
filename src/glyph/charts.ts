import { bottom, clamp, polar, remap, right } from "./geometry.js";
import { fitStyle, pickStyle, truncate } from "./text.js";
import { gray as G, isOutline, type as T } from "./theme.js";
import { count, finite, unit } from "./util.js";
import type { GlyphRaster } from "./raster.js";
import type { Gray, HAlign, Point, Rect, TextStyle } from "./types.js";

export interface Series {
  values: number[];
  gray?: Gray;
  width?: number;
  dash?: number[];
  /** Fill under the curve at this level. Omit for a plain line. */
  fill?: Gray;
  smooth?: boolean;
  /** Draw a dot at each sample. */
  markers?: boolean;
}

export interface AxisOptions {
  min?: number;
  max?: number;
  /** Horizontal gridlines. */
  gridLines?: number;
  gridGray?: Gray;
  /** Format for the value labels drawn in the gutter. */
  format?: (v: number) => string;
  /** Width reserved on the left for value labels. 0 hides them. */
  gutter?: number;
  labels?: string[];
  labelGray?: Gray;
  baseline?: boolean;
}

/**
 * Smallest and largest finite value. Live data has gaps — a sensor that has not
 * reported yet is a NaN — and `Math.min(...values)` turns one NaN into a chart
 * with no scale at all. It also throws outright on a long enough array.
 */
function extent(values: number[]): [number, number] | null {
  let lo = Infinity, hi = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo <= hi ? [lo, hi] : null;
}

function bounds(series: Series[], axis: AxisOptions): [number, number] {
  const found = extent(series.flatMap((s) => s.values));
  const min = axis.min ?? found?.[0] ?? 0;
  const max = axis.max ?? found?.[1] ?? 1;
  return max === min ? [min - 1, max + 1] : [min, max];
}

function pointsFor(values: number[], plot: Rect, min: number, max: number): Point[] {
  if (values.length === 0) return [];
  if (values.length === 1) {
    return [{ x: plot.x + plot.width / 2, y: remap(values[0], min, max, bottom(plot), plot.y) }];
  }
  return values.map((v, i) => ({
    x: plot.x + (i / (values.length - 1)) * plot.width,
    y: remap(v, min, max, bottom(plot), plot.y)
  }));
}

/** Grid, gutter labels and baseline. Returns the plotting area. */
export function chartFrame(g: GlyphRaster, box: Rect, min: number, max: number, axis: AxisOptions = {}): Rect {
  const gutter = axis.gutter ?? 0;
  const labelHeight = axis.labels?.length ? 12 : 0;
  const plot: Rect = {
    x: box.x + gutter,
    y: box.y,
    width: box.width - gutter,
    height: box.height - labelHeight
  };

  const lines = axis.gridLines ?? 0;
  for (let i = 0; i < lines; i++) {
    const t = lines === 1 ? 0.5 : i / (lines - 1);
    const y = Math.round(bottom(plot) - t * plot.height);
    g.hline(plot.x, right(plot), y, axis.gridGray ?? G.hairline);
    if (gutter > 0 && axis.format) {
      g.text(axis.format(min + (max - min) * t), box.x + gutter - 5, y, T.micro, axis.labelGray ?? G.tertiary, "right", "middle");
    }
  }
  if (axis.baseline !== false) g.hline(plot.x, right(plot), bottom(plot), G.border);

  if (axis.labels?.length) {
    axis.labels.forEach((label, i) => {
      const t = axis.labels!.length === 1 ? 0.5 : i / (axis.labels!.length - 1);
      g.text(label, plot.x + t * plot.width, bottom(plot) + 4, T.micro, axis.labelGray ?? G.tertiary,
        i === 0 ? "left" : i === axis.labels!.length - 1 ? "right" : "center", "top");
    });
  }
  return plot;
}

/** Multi-series line or area chart. */
export function lineChart(g: GlyphRaster, box: Rect, series: Series[], axis: AxisOptions = {}): void {
  const [min, max] = bounds(series, axis);
  const plot = chartFrame(g, box, min, max, axis);

  for (const s of series) {
    const pts = pointsFor(s.values, plot, min, max).filter((pt) => Number.isFinite(pt.y));
    if (pts.length < 2) continue;
    if (s.fill !== undefined) {
      // A solid area fill is the single largest block of ink a chart can put on
      // a see-through display, so outline mode hatches it instead.
      g.scoped((layer) => {
        layer.clipRect(plot);
        const area = [{ x: pts[0].x, y: bottom(plot) }, ...pts, { x: pts[pts.length - 1].x, y: bottom(plot) }];
        if (isOutline(g)) {
          layer.scoped((inner) => {
            inner.ctx.beginPath();
            area.forEach((pt, i) => (i === 0 ? inner.ctx.moveTo(pt.x, pt.y) : inner.ctx.lineTo(pt.x, pt.y)));
            inner.ctx.closePath();
            inner.ctx.clip();
            inner.hatch(plot, 6, G.hairline, Math.PI / 4, 1);
          });
        } else {
          layer.polygon(area, { fill: s.fill });
        }
      });
    }
    const paint = { stroke: s.gray ?? G.max, width: s.width ?? 1.5, dash: s.dash };
    if (s.smooth) g.spline(pts, paint); else g.polyline(pts, paint);
    if (s.markers) for (const p of pts) g.circle(p.x, p.y, 1.6, { fill: s.gray ?? G.max });
  }
}

/** Compact trend line with no axes. Sized to fit anywhere. */
export function sparkline(
  g: GlyphRaster, box: Rect, values: number[],
  opts: { gray?: Gray; fill?: Gray; width?: number; smooth?: boolean; dot?: boolean; min?: number; max?: number } = {}
): void {
  values = values.filter(Number.isFinite);
  if (values.length < 2) return;
  const found = extent(values)!;
  const min = opts.min ?? found[0];
  const max = opts.max ?? found[1];
  const pts = pointsFor(values, box, min, max === min ? min + 1 : max);
  if (opts.fill !== undefined && !isOutline(g)) {
    g.polygon([{ x: pts[0].x, y: bottom(box) }, ...pts, { x: pts[pts.length - 1].x, y: bottom(box) }], { fill: opts.fill });
  }
  const paint = { stroke: opts.gray ?? G.strong, width: opts.width ?? 1.5 };
  if (opts.smooth) g.spline(pts, paint); else g.polyline(pts, paint);
  if (opts.dot !== false) {
    const last = pts[pts.length - 1];
    g.circle(last.x, last.y, 2.2, { fill: G.off });
    g.circle(last.x, last.y, 2.2, { stroke: opts.gray ?? G.max, width: 1.2 });
  }
}

/** Vertical bars. Negative values draw below the zero line. */
export function barChart(
  g: GlyphRaster, box: Rect, values: number[],
  opts: AxisOptions & { gray?: Gray; highlight?: number; highlightGray?: Gray; gap?: number; radius?: number } = {}
): void {
  if (values.length === 0) return;
  const found = extent(values) ?? [0, 0];
  const min = opts.min ?? Math.min(0, found[0]);
  const rawMax = opts.max ?? Math.max(found[1], 0);
  const max = rawMax === min ? min + 1 : rawMax;
  const plot = chartFrame(g, box, min, max, { ...opts, baseline: opts.baseline ?? false });
  const gap = opts.gap ?? 2;
  const barWidth = (plot.width - gap * (values.length - 1)) / values.length;
  const zeroY = remap(0, min, max, bottom(plot), plot.y);

  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;               // a gap in the data is a gap in the chart
    const y = remap(v, min, max, bottom(plot), plot.y);
    const x = plot.x + i * (barWidth + gap);
    const h = Math.abs(y - zeroY);
    const bar = { x, y: Math.min(y, zeroY), width: barWidth, height: Math.max(1, h) };
    const rad = opts.radius ?? Math.min(2, barWidth / 3);
    const highlighted = i === opts.highlight;
    if (isOutline(g) && !highlighted) g.roundRect(bar, rad, { stroke: opts.gray ?? G.border, width: 1 });
    else g.roundRect(bar, rad, { fill: highlighted ? (opts.highlightGray ?? G.max) : (opts.gray ?? G.secondary) });
  });
  if (min < 0) g.hline(plot.x, right(plot), zeroY, G.border);
}

/** Horizontal bars with labels — a ranking, not a time series. */
export function rankChart(
  g: GlyphRaster, box: Rect,
  rows: Array<{ label: string; value: number; gray?: Gray }>,
  opts: { max?: number; labelWidth?: number; format?: (v: number) => string; gap?: number } = {}
): void {
  if (rows.length === 0) return;
  const max = opts.max ?? Math.max(extent(rows.map((r) => r.value))?.[1] ?? 1, 1);
  const labelWidth = opts.labelWidth ?? 60;
  const gap = opts.gap ?? 4;
  const rowHeight = (box.height - gap * (rows.length - 1)) / rows.length;
  rows.forEach((row, i) => {
    const y = box.y + i * (rowHeight + gap);
    g.text(row.label, box.x, y + rowHeight / 2, T.caption, G.secondary, "left", "middle");
    const track: Rect = { x: box.x + labelWidth, y: y + rowHeight / 2 - 3, width: box.width - labelWidth - 34, height: 6 };
    if (isOutline(g)) g.roundRect(track, 3, { stroke: G.hairline, width: 1 });
    else g.roundRect(track, 3, { fill: G.sunken });
    g.roundRect({ ...track, width: Math.max(2, (track.width * clamp(row.value, 0, max)) / max) }, 3, { fill: row.gray ?? G.strong });
    g.text(opts.format ? opts.format(row.value) : String(row.value), right(box), y + rowHeight / 2, T.numeral, G.primary, "right", "middle");
  });
}

/** Scatter plot. */
export function scatterChart(
  g: GlyphRaster, box: Rect, points: Point[],
  opts: AxisOptions & { gray?: Gray; radius?: number; xMin?: number; xMax?: number } = {}
): void {
  points = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const yExtent = extent(points.map((p) => p.y)) ?? [0, 1];
  const xExtent = extent(points.map((p) => p.x)) ?? [0, 1];
  const min = opts.min ?? yExtent[0];
  const max = opts.max ?? yExtent[1];
  const plot = chartFrame(g, box, min, max, opts);
  const xMin = opts.xMin ?? xExtent[0];
  const xMax = opts.xMax ?? xExtent[1];
  for (const p of points) {
    g.circle(
      remap(p.x, xMin, xMax, plot.x, right(plot)),
      remap(p.y, min, max, bottom(plot), plot.y),
      opts.radius ?? 2,
      { fill: opts.gray ?? G.strong }
    );
  }
}

/** Circular progress ring with an optional centred readout. */
export function ringChart(
  g: GlyphRaster, cx: number, cy: number, radius: number, progress: number,
  opts: { width?: number; gray?: Gray; trackGray?: Gray; startAngle?: number; value?: string; label?: string } = {}
): void {
  const w = opts.width ?? 6;
  const start = opts.startAngle ?? -Math.PI / 2;
  const p = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
  g.arc(cx, cy, radius, 0, Math.PI * 2, { stroke: opts.trackGray ?? (isOutline(g) ? G.hairline : G.sunken), width: isOutline(g) ? 1 : w, cap: "butt" });
  if (p > 0.001) {
    g.arc(cx, cy, radius, start, start + Math.PI * 2 * p, { stroke: opts.gray ?? G.max, width: w, cap: "round" });
  }
  const inner = radius - w / 2 - 4;
  if (opts.value) {
    const style = fitStyle(g.measure, opts.value, T.numeralLg, inner * 1.9, inner * 1.3);
    g.text(opts.value, cx, cy - (opts.label ? 5 : 0), style, G.max, "center", "middle");
  }
  if (opts.label) {
    g.text(truncate(g.measure, opts.label, T.micro, inner * 1.9), cx, cy + 11, { ...T.micro, size: 8 }, G.tertiary, "center", "middle");
  }
}

/** Half-circle gauge with a needle. Reads faster than a number for "is it in range". */
export function gaugeChart(
  g: GlyphRaster, cx: number, cy: number, radius: number, value: number,
  opts: { min?: number; max?: number; ticks?: number; gray?: Gray; label?: string; format?: (v: number) => string;
    zones?: Array<{ from: number; to: number; gray: Gray }> } = {}
): void {
  const min = opts.min ?? 0;
  const max = opts.max ?? 100;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  // A degenerate range or a missing reading parks the needle at the start
  // rather than producing a NaN angle, which canvas silently draws as nothing.
  const span = max - min;
  const angleFor = (v: number) =>
    start + (span > 0 && Number.isFinite(v) ? (clamp(v, min, max) - min) / span : 0) * sweep;

  for (const zone of opts.zones ?? []) {
    g.arc(cx, cy, radius, angleFor(zone.from), angleFor(zone.to), { stroke: zone.gray, width: 5, cap: "butt" });
  }
  g.arc(cx, cy, radius, start, start + sweep, { stroke: G.border, width: 1.5, cap: "round" });

  const ticks = Math.min(180, Math.max(0, Math.floor(opts.ticks ?? 5)));
  for (let i = 0; i < ticks; i++) {
    const a = start + (ticks === 1 ? 0.5 : i / (ticks - 1)) * sweep;
    const inner = radius - 6;
    g.line(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner, cx + Math.cos(a) * (radius - 1), cy + Math.sin(a) * (radius - 1),
      { stroke: G.disabled, width: 1.5, cap: "butt" });
  }

  const a = angleFor(value);
  g.line(cx, cy, cx + Math.cos(a) * (radius - 9), cy + Math.sin(a) * (radius - 9), { stroke: opts.gray ?? G.max, width: 2.5 });
  g.circle(cx, cy, 3, { fill: G.max });
  // The needle sweeps 270 degrees, so the readout lives below the dial where
  // it can never be crossed.
  if (opts.format) g.text(opts.format(value), cx, cy + radius * 0.52, T.numeralLg, G.max, "center", "top");
  if (opts.label) g.text(opts.label, cx, cy + radius * 0.52 + 22, { ...T.micro, size: 8 }, G.tertiary, "center", "top");
}

/** A dense band of levels — 24 hours of something, at a glance. */
export function heatStrip(
  g: GlyphRaster, box: Rect, values: number[],
  opts: { min?: number; max?: number; low?: Gray; high?: Gray; gap?: number } = {}
): void {
  if (values.length === 0) return;
  const found = extent(values) ?? [0, 1];
  const min = opts.min ?? found[0];
  const max = opts.max ?? found[1];
  const gap = opts.gap ?? 1;
  const w = (box.width - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const level = remap(v, min, max, opts.low ?? G.sunken, opts.high ?? G.max);
    g.rect({ x: box.x + i * (w + gap), y: box.y, width: w, height: box.height }, { fill: Math.round(level) });
  });
}

/** Target-vs-actual in one line. */
export function bulletChart(
  g: GlyphRaster, box: Rect, value: number, target: number,
  opts: { max?: number; gray?: Gray } = {}
): void {
  const max = Math.max(opts.max ?? Math.max(value, target) * 1.15, Number.EPSILON);
  if (isOutline(g)) g.roundRect(box, box.height / 2, { stroke: G.hairline, width: 1 });
  else g.roundRect(box, box.height / 2, { fill: G.sunken });
  g.roundRect({ ...box, width: Math.max(2, (box.width * clamp(value, 0, max)) / max) }, box.height / 2, { fill: opts.gray ?? G.strong });
  const tx = box.x + (box.width * clamp(target, 0, max)) / max;
  g.vline(tx, box.y - 2, bottom(box) + 2, G.max, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parts of a whole
// ─────────────────────────────────────────────────────────────────────────────

/**
 * With one channel, categories are told apart by level — and four levels is
 * about as many as stay distinguishable through a waveguide. A chart with more
 * categories than this wants a different chart.
 */
const SEGMENT_GRAYS: Gray[] = [15, 11, 8, 5];
const CHART_NUM: TextStyle = { ...T.numeral, size: 12, leading: 14 };
const CHART_MICRO: TextStyle = { ...T.micro, size: 8 };

export interface Segment {
  value: number;
  gray?: Gray;
  /** `hatch` draws the segment as an outline filled with lines — a fifth category, or a "projected" one. */
  pattern?: "solid" | "hatch";
}

/** Shares of a total as arcs of a ring, with room in the middle for the total itself. */
export function donutChart(
  g: GlyphRaster, cx: number, cy: number, radius: number, segments: readonly Segment[],
  opts: { width?: number; gap?: number; startAngle?: number; value?: string; label?: string } = {}
): void {
  const w = Math.max(1, finite(opts.width, 8));
  const rr = Math.max(0, finite(radius) - w / 2);
  const values = segments.map((s) => Math.max(0, finite(s.value)));
  const total = values.reduce((a, b) => a + b, 0);

  if (!(total > 0)) {
    g.arc(cx, cy, rr, 0, Math.PI * 2, { stroke: G.hairline, width: 1 });
  } else {
    const parts = values.filter((v) => v > 0).length;
    const gap = parts > 1 ? Math.max(0, finite(opts.gap, 0.07)) : 0;
    let a = opts.startAngle ?? -Math.PI / 2;
    values.forEach((v, i) => {
      if (v <= 0) return;
      const span = (v / total) * Math.PI * 2;
      const from = a + gap / 2;
      const to = a + span - gap / 2;
      if (to > from) g.arc(cx, cy, rr, from, to, { stroke: segments[i].gray ?? SEGMENT_GRAYS[i % SEGMENT_GRAYS.length], width: w, cap: "butt" });
      a += span;
    });
  }

  const room = Math.max(0, (finite(radius) - w - 4) * 1.9);
  if (opts.value) {
    g.text(opts.value, cx, cy - (opts.label ? 5 : 0), pickStyle(g.measure, opts.value, [T.numeralLg, T.numeral, CHART_NUM], room), G.max, "center", "middle");
  }
  if (opts.label) g.text(truncate(g.measure, opts.label, CHART_MICRO, room), cx, cy + 11, CHART_MICRO, G.tertiary, "center", "middle");
}

/** Shares of a total along one bar. */
export function stackedBar(g: GlyphRaster, r: Rect, segments: readonly Segment[], opts: { gap?: number } = {}): void {
  const values = segments.map((s) => Math.max(0, finite(s.value)));
  const total = values.reduce((a, b) => a + b, 0);
  if (!(total > 0)) {
    g.roundRect(r, Math.min(2, r.height / 2), { stroke: G.hairline, width: 1 });
    return;
  }
  const parts = values.filter((v) => v > 0).length;
  const gap = Math.max(0, finite(opts.gap, 2));
  const usable = Math.max(0, r.width - gap * (parts - 1));
  let x = r.x;
  values.forEach((v, i) => {
    if (v <= 0) return;
    const cell = { x, y: r.y, width: (usable * v) / total, height: r.height };
    const gray = segments[i].gray ?? SEGMENT_GRAYS[i % SEGMENT_GRAYS.length];
    if (segments[i].pattern === "hatch") {
      g.rect(cell, { stroke: gray, width: 1 });
      g.hatch(cell, 4, gray, Math.PI / 4, 1);
    } else {
      g.roundRect(cell, Math.min(2, r.height / 2), { fill: gray });
    }
    x += cell.width + gap;
  });
}

/** A count out of a total, as dots you could actually count. */
export function dotMatrix(g: GlyphRaster, r: Rect, value: number, total: number, opts: { columns?: number; gray?: Gray } = {}): void {
  const t = count(total, 0, 0, 400);
  if (t === 0 || !(r.width > 0) || !(r.height > 0)) return;
  const v = count(value, 0, 0, t);
  const cols = count(opts.columns, Math.ceil(Math.sqrt((t * r.width) / r.height)), 1, t);
  const rows = Math.ceil(t / cols);
  const cell = Math.min(r.width / cols, r.height / rows);
  const rad = Math.max(0.8, cell * 0.32);
  for (let i = 0; i < t; i++) {
    const cx = r.x + ((i % cols) + 0.5) * cell;
    const cy = r.y + (Math.floor(i / cols) + 0.5) * cell;
    if (i < v) g.circle(cx, cy, rad, { fill: opts.gray ?? G.max });
    else g.circle(cx, cy, Math.max(0.6, rad - 0.5), { stroke: G.border, width: 1 });
  }
}

/** Several progress rings, one inside the next. Values are 0..1, outermost first. */
export function activityRings(
  g: GlyphRaster, cx: number, cy: number, radius: number, values: readonly number[],
  opts: { width?: number; gap?: number; grays?: readonly Gray[] } = {}
): void {
  const w = Math.max(1, finite(opts.width, 5));
  const gap = Math.max(0, finite(opts.gap, 3));
  const grays = opts.grays?.length ? opts.grays : [15, 12, 9, 7];
  values.forEach((value, i) => {
    const rr = finite(radius) - w / 2 - i * (w + gap);
    if (rr <= w / 2) return;
    g.arc(cx, cy, rr, 0, Math.PI * 2, { stroke: isOutline(g) ? G.hairline : G.sunken, width: isOutline(g) ? 1 : w, cap: "butt" });
    const p = unit(value);
    if (p > 0.001) g.arc(cx, cy, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, { stroke: grays[i % grays.length], width: w, cap: "round" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Distributions and ranges
// ─────────────────────────────────────────────────────────────────────────────

/** How values are spread: counts per bin. `highlight` picks out the bin a given value falls in. */
export function histogram(
  g: GlyphRaster, box: Rect, values: readonly number[],
  opts: { bins?: number; min?: number; max?: number; highlight?: number; gray?: Gray } = {}
): void {
  const data = values.filter((v) => Number.isFinite(v));
  const bins = count(opts.bins, 12, 1, 200);
  const found = extent(data);
  const lo = opts.min ?? found?.[0] ?? 0;
  let hi = opts.max ?? found?.[1] ?? 1;
  if (!(hi > lo)) hi = lo + 1;
  const binOf = (v: number): number => Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins)));

  const counts = new Array<number>(bins).fill(0);
  for (const v of data) if (v >= lo && v <= hi) counts[binOf(v)]++;
  let peak = 1;
  for (const c of counts) if (c > peak) peak = c;
  const hot = opts.highlight !== undefined && Number.isFinite(opts.highlight) ? binOf(opts.highlight) : -1;

  const gap = 1;
  const w = (box.width - gap * (bins - 1)) / bins;
  const base = bottom(box);
  counts.forEach((c, i) => {
    if (c === 0) return;
    const h = Math.max(1, (c / peak) * (box.height - 1));
    const bar = { x: box.x + i * (w + gap), y: base - h, width: w, height: h };
    if (i === hot) g.rect(bar, { fill: G.max });
    else if (isOutline(g) && w >= 4) g.rect(bar, { stroke: opts.gray ?? G.secondary, width: 1 });
    else g.rect(bar, { fill: opts.gray ?? G.secondary });
  });
  g.hline(box.x, right(box), base, G.border);
}

/** A band between a low and a high series, with an optional line through it — a forecast and its uncertainty. */
export function rangeChart(
  g: GlyphRaster, box: Rect, low: readonly number[], high: readonly number[],
  opts: AxisOptions & { mid?: readonly number[]; gray?: Gray } = {}
): void {
  const n = Math.min(low.length, high.length);
  if (n < 2) return;
  const found = extent([...low.slice(0, n), ...high.slice(0, n), ...(opts.mid ?? [])]);
  if (!found) return;
  let min = opts.min ?? found[0];
  let max = opts.max ?? found[1];
  if (max === min) { min -= 1; max += 1; }
  const plot = chartFrame(g, box, min, max, opts);

  const top: Point[] = [];
  const base: Point[] = [];
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(low[i]) || !Number.isFinite(high[i])) continue;
    const x = plot.x + (i / (n - 1)) * plot.width;
    top.push({ x, y: remap(high[i], min, max, bottom(plot), plot.y) });
    base.push({ x, y: remap(low[i], min, max, bottom(plot), plot.y) });
  }
  if (top.length >= 2) {
    const band = [...top, ...[...base].reverse()];
    g.scoped((layer) => {
      layer.clipRect(plot);
      if (isOutline(g)) {
        layer.scoped((inner) => {
          inner.ctx.beginPath();
          band.forEach((pt, i) => (i === 0 ? inner.ctx.moveTo(pt.x, pt.y) : inner.ctx.lineTo(pt.x, pt.y)));
          inner.ctx.closePath();
          inner.ctx.clip();
          inner.hatch(plot, 5, G.hairline, Math.PI / 4, 1);
        });
        layer.polyline(top, { stroke: G.secondary, width: 1 });
        layer.polyline(base, { stroke: G.secondary, width: 1 });
      } else {
        layer.polygon(band, { fill: G.raised });
      }
    });
  }
  if (opts.mid) {
    const pts = pointsFor([...opts.mid], plot, min, max).filter((pt) => Number.isFinite(pt.y));
    if (pts.length >= 2) g.polyline(pts, { stroke: opts.gray ?? G.max, width: 1.5 });
  }
}

export interface Candle { open: number; high: number; low: number; close: number; }

/** Open, high, low, close. A rising candle is hollow and a falling one is solid — the convention that needs no colour. */
export function candlestickChart(g: GlyphRaster, box: Rect, candles: readonly Candle[], opts: AxisOptions & { gap?: number } = {}): void {
  const data = candles.filter((c) => [c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v)));
  if (data.length === 0) return;
  const found = extent(data.flatMap((c) => [c.high, c.low, c.open, c.close]))!;
  let min = opts.min ?? found[0];
  let max = opts.max ?? found[1];
  if (max === min) { min -= 1; max += 1; }
  const plot = chartFrame(g, box, min, max, { ...opts, baseline: opts.baseline ?? false });
  const slot = plot.width / data.length;
  const bodyW = Math.max(1, slot - Math.max(1, finite(opts.gap, slot * 0.35)));
  const Y = (v: number): number => remap(v, min, max, bottom(plot), plot.y);

  data.forEach((c, i) => {
    const cx = Math.round(plot.x + (i + 0.5) * slot) + 0.5;
    const rising = c.close >= c.open;
    const top = Y(Math.max(c.open, c.close));
    const body = { x: cx - bodyW / 2, y: top, width: bodyW, height: Math.max(1, Y(Math.min(c.open, c.close)) - top) };
    g.line(cx, Y(c.high), cx, Y(c.low), { stroke: rising ? G.strong : G.secondary, width: 1, cap: "butt" });
    if (rising) { g.rect(body, { fill: G.off }); g.rect(body, { stroke: G.max, width: 1 }); }
    else g.rect(body, { fill: G.secondary });
  });
}

/** Tiny bars with no axes, the newest one bright. A sparkline for things that are counted. */
export function sparkBars(
  g: GlyphRaster, box: Rect, values: readonly number[],
  opts: { gray?: Gray; gap?: number; highlightLast?: boolean; min?: number; max?: number } = {}
): void {
  const n = values.length;
  const found = extent([...values]);
  if (n === 0 || !found) return;
  const lo = opts.min ?? Math.min(0, found[0]);
  let hi = opts.max ?? found[1];
  if (!(hi > lo)) hi = lo + 1;
  const gap = Math.max(0, finite(opts.gap, 1));
  const w = Math.max(1, (box.width - gap * (n - 1)) / n);
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const h = Math.max(1, remap(v, lo, hi, 0, box.height));
    const bright = i === n - 1 && opts.highlightLast !== false;
    g.rect({ x: box.x + i * (w + gap), y: bottom(box) - h, width: w, height: h }, { fill: bright ? G.max : opts.gray ?? G.tertiary });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Around a centre
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarSeries {
  /** One value per axis, 0..1. */
  values: readonly number[];
  gray?: Gray;
  dash?: number[];
}

/** Several measures of one thing on spokes from a centre. Dash a series to tell two apart. */
export function radarChart(
  g: GlyphRaster, cx: number, cy: number, radius: number, axes: readonly string[], series: readonly RadarSeries[],
  opts: { rings?: number; labels?: boolean } = {}
): void {
  const n = axes.length;
  const rad = finite(radius);
  if (n < 3 || !(rad > 0)) return;
  const rings = count(opts.rings, 3, 1, 6);
  const angle = (i: number): number => -Math.PI / 2 + (i * Math.PI * 2) / n;
  const vertex = (i: number, f: number): Point => polar(cx, cy, rad * f, angle(i));

  for (let k = 1; k <= rings; k++) {
    g.polygon(axes.map((_, i) => vertex(i, k / rings)), { stroke: k === rings ? G.border : G.hairline, width: 1, join: "miter" });
  }
  axes.forEach((_, i) => {
    const end = vertex(i, 1);
    g.line(cx, cy, end.x, end.y, { stroke: G.hairline, width: 1, cap: "butt" });
  });

  for (const s of series) {
    const pts = axes.map((_, i) => vertex(i, unit(s.values[i])));
    const gray = s.gray ?? G.max;
    g.polygon(pts, { stroke: gray, width: 1.5, dash: s.dash });
    if (!s.dash) for (const pt of pts) g.circle(pt.x, pt.y, 1.8, { fill: gray });
  }

  if (opts.labels !== false) {
    axes.forEach((label, i) => {
      const a = angle(i);
      const cos = Math.cos(a);
      const align: HAlign = Math.abs(cos) < 0.3 ? "center" : cos > 0 ? "left" : "right";
      g.text(label, cx + cos * (rad + 6), cy + Math.sin(a) * (rad + 8), T.micro, G.tertiary, align, "middle");
    });
  }
}

/** Values by direction — a wind rose. The first value points north; the largest is filled. */
export function polarChart(
  g: GlyphRaster, cx: number, cy: number, radius: number, values: readonly number[],
  opts: { max?: number; labels?: readonly string[]; rings?: number; gray?: Gray } = {}
): void {
  const n = values.length;
  const rad = finite(radius);
  if (n === 0 || !(rad > 0)) return;
  const found = extent([...values]);
  const hi = Math.max(opts.max ?? found?.[1] ?? 1, Number.EPSILON);
  const rings = count(opts.rings, 2, 1, 6);
  for (let k = 1; k <= rings; k++) {
    g.circle(cx, cy, (rad * k) / rings, { stroke: k === rings ? G.border : G.hairline, width: 1, dash: k === rings ? undefined : [2, 3] });
  }

  let peak = -1;
  values.forEach((v, i) => { if (Number.isFinite(v) && (peak < 0 || v > values[peak])) peak = i; });
  const step = (Math.PI * 2) / n;
  values.forEach((v, i) => {
    if (!Number.isFinite(v) || v <= 0) return;
    const rr = rad * clamp(v / hi, 0, 1);
    const mid = -Math.PI / 2 + i * step;
    const a0 = mid - step * 0.42;
    const a1 = mid + step * 0.42;
    if (i === peak) g.sector(cx, cy, rr, a0, a1, { fill: opts.gray ?? G.max });
    else if (isOutline(g)) g.sector(cx, cy, rr, a0, a1, { stroke: G.secondary, width: 1, join: "miter" });
    else g.sector(cx, cy, rr, a0, a1, { fill: G.disabled });
  });

  const labels = opts.labels ?? [];
  labels.forEach((label, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
    g.text(label, cx + Math.cos(a) * (rad + 8), cy + Math.sin(a) * (rad + 8), T.micro, G.tertiary, "center", "middle");
  });
}
