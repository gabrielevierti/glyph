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
