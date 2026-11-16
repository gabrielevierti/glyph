import type { GlyphRaster } from "./raster.js";
import type { Gray, Rect } from "./types.js";
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
export declare function headingTape(g: GlyphRaster, r: Rect, heading: number, opts?: HeadingTapeOptions): void;
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
export declare function valueTape(g: GlyphRaster, r: Rect, value: number, opts?: ValueTapeOptions): void;
/**
 * Pitch ladder: the horizon and its rungs, rotated by roll, behind a fixed
 * aircraft symbol. The open-centre version of `attitudeIndicator` — nothing is
 * filled, so the real horizon stays visible through it.
 */
export declare function pitchLadder(g: GlyphRaster, r: Rect, pitch: number, roll: number, opts?: {
    step?: number;
    pxPerDeg?: number;
}): void;
/** An aiming mark: `cross` leaves the centre open, `circle` rings it, `dot` is the minimum. */
export declare function reticle(g: GlyphRaster, cx: number, cy: number, size?: number, opts?: {
    style?: "cross" | "circle" | "dot";
    gap?: number;
    gray?: Gray;
    width?: number;
}): void;
/**
 * Corner brackets around something in the world, with a caption — the way to
 * mark a thing without covering it.
 */
export declare function targetBox(g: GlyphRaster, r: Rect, opts?: {
    label?: string;
    detail?: string;
    corner?: number;
    gray?: Gray;
    locked?: boolean;
}): void;
/** Lateral deviation: a fixed centre, dots at regular offsets, and a diamond that is you. */
export declare function deviationBar(g: GlyphRaster, r: Rect, deviation: number, opts?: {
    dots?: number;
    gray?: Gray;
}): void;
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
export declare function radarScope(g: GlyphRaster, cx: number, cy: number, radius: number, opts?: RadarScopeOptions): void;
/** Analog clock. Pass a `Date`, or hours and minutes of your own. */
export declare function clockFace(g: GlyphRaster, cx: number, cy: number, radius: number, time: Date | {
    hours: number;
    minutes: number;
    seconds?: number;
}, opts?: {
    numerals?: boolean;
    seconds?: boolean;
}): void;
/**
 * Segmented level meter — audio level, signal, throttle. Runs along whichever
 * side of the box is longer unless told otherwise.
 */
export declare function levelMeter(g: GlyphRaster, r: Rect, level: number, opts?: {
    segments?: number;
    peak?: number;
    hot?: number;
    gap?: number;
    vertical?: boolean;
}): void;
export interface GaugeZone {
    from: number;
    to: number;
    gray: Gray;
}
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
export declare function linearGauge(g: GlyphRaster, r: Rect, value: number, opts?: LinearGaugeOptions): void;
export interface BarGaugeOptions {
    min?: number;
    max?: number;
    ticks?: number;
    format?: (value: number) => string;
    target?: number;
}
/** A vertical column that fills from the bottom, with its scale alongside — temperature, tank, battery. */
export declare function barGauge(g: GlyphRaster, r: Rect, value: number, opts?: BarGaugeOptions): void;
/** Map scale: a measured line with its distance written above it. */
export declare function scaleBar(g: GlyphRaster, x: number, y: number, width: number, label: string, gray?: Gray): void;
