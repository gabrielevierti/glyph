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
/** Grid, gutter labels and baseline. Returns the plotting area. */
export declare function chartFrame(g: GlyphRaster, box: Rect, min: number, max: number, axis?: AxisOptions): Rect;
/** Multi-series line or area chart. */
export declare function lineChart(g: GlyphRaster, box: Rect, series: Series[], axis?: AxisOptions): void;
/** Compact trend line with no axes. Sized to fit anywhere. */
export declare function sparkline(g: GlyphRaster, box: Rect, values: number[], opts?: {
    gray?: Gray;
    fill?: Gray;
    width?: number;
    smooth?: boolean;
    dot?: boolean;
    min?: number;
    max?: number;
}): void;
/** Vertical bars. Negative values draw below the zero line. */
export declare function barChart(g: GlyphRaster, box: Rect, values: number[], opts?: AxisOptions & {
    gray?: Gray;
    highlight?: number;
    highlightGray?: Gray;
    gap?: number;
    radius?: number;
}): void;
/** Horizontal bars with labels — a ranking, not a time series. */
export declare function rankChart(g: GlyphRaster, box: Rect, rows: Array<{
    label: string;
    value: number;
    gray?: Gray;
}>, opts?: {
    max?: number;
    labelWidth?: number;
    format?: (v: number) => string;
    gap?: number;
}): void;
/** Scatter plot. */
export declare function scatterChart(g: GlyphRaster, box: Rect, points: Point[], opts?: AxisOptions & {
    gray?: Gray;
    radius?: number;
    xMin?: number;
    xMax?: number;
}): void;
/** Circular progress ring with an optional centred readout. */
export declare function ringChart(g: GlyphRaster, cx: number, cy: number, radius: number, progress: number, opts?: {
    width?: number;
    gray?: Gray;
    trackGray?: Gray;
    startAngle?: number;
    value?: string;
    label?: string;
}): void;
/** Half-circle gauge with a needle. Reads faster than a number for "is it in range". */
export declare function gaugeChart(g: GlyphRaster, cx: number, cy: number, radius: number, value: number, opts?: {
    min?: number;
    max?: number;
    ticks?: number;
    gray?: Gray;
    label?: string;
    format?: (v: number) => string;
    zones?: Array<{
        from: number;
        to: number;
        gray: Gray;
    }>;
}): void;
/** A dense band of levels — 24 hours of something, at a glance. */
export declare function heatStrip(g: GlyphRaster, box: Rect, values: number[], opts?: {
    min?: number;
    max?: number;
    low?: Gray;
    high?: Gray;
    gap?: number;
}): void;
/** Target-vs-actual in one line. */
export declare function bulletChart(g: GlyphRaster, box: Rect, value: number, target: number, opts?: {
    max?: number;
    gray?: Gray;
}): void;
export interface Segment {
    value: number;
    gray?: Gray;
    /** `hatch` draws the segment as an outline filled with lines — a fifth category, or a "projected" one. */
    pattern?: "solid" | "hatch";
}
/** Shares of a total as arcs of a ring, with room in the middle for the total itself. */
export declare function donutChart(g: GlyphRaster, cx: number, cy: number, radius: number, segments: readonly Segment[], opts?: {
    width?: number;
    gap?: number;
    startAngle?: number;
    value?: string;
    label?: string;
}): void;
/** Shares of a total along one bar. */
export declare function stackedBar(g: GlyphRaster, r: Rect, segments: readonly Segment[], opts?: {
    gap?: number;
}): void;
/** A count out of a total, as dots you could actually count. */
export declare function dotMatrix(g: GlyphRaster, r: Rect, value: number, total: number, opts?: {
    columns?: number;
    gray?: Gray;
}): void;
/** Several progress rings, one inside the next. Values are 0..1, outermost first. */
export declare function activityRings(g: GlyphRaster, cx: number, cy: number, radius: number, values: readonly number[], opts?: {
    width?: number;
    gap?: number;
    grays?: readonly Gray[];
}): void;
/** How values are spread: counts per bin. `highlight` picks out the bin a given value falls in. */
export declare function histogram(g: GlyphRaster, box: Rect, values: readonly number[], opts?: {
    bins?: number;
    min?: number;
    max?: number;
    highlight?: number;
    gray?: Gray;
}): void;
/** A band between a low and a high series, with an optional line through it — a forecast and its uncertainty. */
export declare function rangeChart(g: GlyphRaster, box: Rect, low: readonly number[], high: readonly number[], opts?: AxisOptions & {
    mid?: readonly number[];
    gray?: Gray;
}): void;
export interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
}
/** Open, high, low, close. A rising candle is hollow and a falling one is solid — the convention that needs no colour. */
export declare function candlestickChart(g: GlyphRaster, box: Rect, candles: readonly Candle[], opts?: AxisOptions & {
    gap?: number;
}): void;
/** Tiny bars with no axes, the newest one bright. A sparkline for things that are counted. */
export declare function sparkBars(g: GlyphRaster, box: Rect, values: readonly number[], opts?: {
    gray?: Gray;
    gap?: number;
    highlightLast?: boolean;
    min?: number;
    max?: number;
}): void;
export interface RadarSeries {
    /** One value per axis, 0..1. */
    values: readonly number[];
    gray?: Gray;
    dash?: number[];
}
/** Several measures of one thing on spokes from a centre. Dash a series to tell two apart. */
export declare function radarChart(g: GlyphRaster, cx: number, cy: number, radius: number, axes: readonly string[], series: readonly RadarSeries[], opts?: {
    rings?: number;
    labels?: boolean;
}): void;
/** Values by direction — a wind rose. The first value points north; the largest is filled. */
export declare function polarChart(g: GlyphRaster, cx: number, cy: number, radius: number, values: readonly number[], opts?: {
    max?: number;
    labels?: readonly string[];
    rings?: number;
    gray?: Gray;
}): void;
