import { bottom, clamp, remap, right } from "./geometry.js";
import { fitStyle, truncate } from "./text.js";
import { gray as G, type as T } from "./theme.js";
import type { GlyphRaster } from "./raster.js";
import type { Gray, Point, Rect } from "./types.js";

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

function bounds(series: Series[], axis: AxisOptions): [number, number] {
  const all = series.flatMap((s) => s.values);
  const min = axis.min ?? (all.length ? Math.min(...all) : 0);
  const max = axis.max ?? (all.length ? Math.max(...all) : 1);
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
    const pts = pointsFor(s.values, plot, min, max);
    if (pts.length < 2) continue;
    if (s.fill !== undefined) {
      g.scoped((layer) => {
        layer.clipRect(plot);
        layer.polygon(
          [{ x: pts[0].x, y: bottom(plot) }, ...pts, { x: pts[pts.length - 1].x, y: bottom(plot) }],
          { fill: s.fill }
        );
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
  if (values.length < 2) return;
  const min = opts.min ?? Math.min(...values);
  const max = opts.max ?? Math.max(...values);
  const pts = pointsFor(values, box, min, max === min ? min + 1 : max);
  if (opts.fill !== undefined) {
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
  const min = opts.min ?? Math.min(0, ...values);
  const max = opts.max ?? Math.max(...values, 0);
  const plot = chartFrame(g, box, min, max, { ...opts, baseline: opts.baseline ?? false });
  const gap = opts.gap ?? 2;
  const barWidth = (plot.width - gap * (values.length - 1)) / values.length;
  const zeroY = remap(0, min, max, bottom(plot), plot.y);

  values.forEach((v, i) => {
    const y = remap(v, min, max, bottom(plot), plot.y);
    const x = plot.x + i * (barWidth + gap);
    const h = Math.abs(y - zeroY);
    const fill = i === opts.highlight ? (opts.highlightGray ?? G.max) : (opts.gray ?? G.secondary);
    g.roundRect(
      { x, y: Math.min(y, zeroY), width: barWidth, height: Math.max(1, h) },
      opts.radius ?? Math.min(2, barWidth / 3),
      { fill }
    );
  });
  if (min < 0) g.hline(plot.x, right(plot), zeroY, G.border);
}

/** Horizontal bars with labels — a ranking, not a time series. */
export function rankChart(
  g: GlyphRaster, box: Rect,
  rows: Array<{ label: string; value: number; gray?: Gray }>,
  opts: { max?: number; labelWidth?: number; format?: (v: number) => string; gap?: number } = {}
): void {
  const max = opts.max ?? Math.max(...rows.map((r) => r.value), 1);
  const labelWidth = opts.labelWidth ?? 60;
  const gap = opts.gap ?? 4;
  const rowHeight = (box.height - gap * (rows.length - 1)) / rows.length;
  rows.forEach((row, i) => {
    const y = box.y + i * (rowHeight + gap);
    g.text(row.label, box.x, y + rowHeight / 2, T.caption, G.secondary, "left", "middle");
    const track: Rect = { x: box.x + labelWidth, y: y + rowHeight / 2 - 3, width: box.width - labelWidth - 34, height: 6 };
    g.roundRect(track, 3, { fill: G.sunken });
    g.roundRect({ ...track, width: Math.max(2, (track.width * clamp(row.value, 0, max)) / max) }, 3, { fill: row.gray ?? G.strong });
    g.text(opts.format ? opts.format(row.value) : String(row.value), right(box), y + rowHeight / 2, T.numeral, G.primary, "right", "middle");
  });
}

/** Scatter plot. */
export function scatterChart(
  g: GlyphRaster, box: Rect, points: Point[],
  opts: AxisOptions & { gray?: Gray; radius?: number; xMin?: number; xMax?: number } = {}
): void {
  const ys = points.map((p) => p.y);
  const min = opts.min ?? Math.min(...ys);
  const max = opts.max ?? Math.max(...ys);
  const plot = chartFrame(g, box, min, max, opts);
  const xs = points.map((p) => p.x);
  const xMin = opts.xMin ?? Math.min(...xs);
  const xMax = opts.xMax ?? Math.max(...xs);
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
  const p = clamp(progress, 0, 1);
  g.arc(cx, cy, radius, 0, Math.PI * 2, { stroke: opts.trackGray ?? G.sunken, width: w, cap: "butt" });
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
  const angleFor = (v: number) => start + (clamp(v, min, max) - min) / (max - min) * sweep;

  for (const zone of opts.zones ?? []) {
    g.arc(cx, cy, radius, angleFor(zone.from), angleFor(zone.to), { stroke: zone.gray, width: 5, cap: "butt" });
  }
  g.arc(cx, cy, radius, start, start + sweep, { stroke: G.border, width: 1.5, cap: "round" });

  const ticks = opts.ticks ?? 5;
  for (let i = 0; i < ticks; i++) {
    const a = start + (i / (ticks - 1)) * sweep;
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
  const min = opts.min ?? Math.min(...values);
  const max = opts.max ?? Math.max(...values);
  const gap = opts.gap ?? 1;
  const w = (box.width - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    const level = remap(v, min, max, opts.low ?? G.sunken, opts.high ?? G.max);
    g.rect({ x: box.x + i * (w + gap), y: box.y, width: w, height: box.height }, { fill: Math.round(level) });
  });
}

/** Target-vs-actual in one line. */
export function bulletChart(
  g: GlyphRaster, box: Rect, value: number, target: number,
  opts: { max?: number; gray?: Gray } = {}
): void {
  const max = opts.max ?? Math.max(value, target) * 1.15;
  g.roundRect(box, box.height / 2, { fill: G.sunken });
  g.roundRect({ ...box, width: Math.max(2, (box.width * clamp(value, 0, max)) / max) }, box.height / 2, { fill: opts.gray ?? G.strong });
  const tx = box.x + (box.width * clamp(target, 0, max)) / max;
  g.vline(tx, box.y - 2, bottom(box) + 2, G.max, 2);
}
