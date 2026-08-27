import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Corners, Gray, HAlign, Rect, TextStyle } from "./types.js";
export interface PanelOptions {
    fill?: Gray;
    stroke?: Gray;
    radius?: Corners;
    strokeWidth?: number;
    /** Draw a dotted texture inside the panel. */
    texture?: boolean;
}
/** The base container. Everything else sits on one of these. */
export declare function panel(g: GlyphRaster, r: Rect, opts?: PanelOptions): Rect;
/** A panel with a label strip along the top. Returns the content rect. */
export declare function section(g: GlyphRaster, r: Rect, label: string, opts?: PanelOptions & {
    accessory?: string;
    icon?: GlyphIconName;
}): Rect;
/** Full-width label with rules on either side. */
export declare function divider(g: GlyphRaster, r: Rect, label?: string, gray?: Gray): void;
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
export declare function metric(g: GlyphRaster, r: Rect, value: string, opts?: MetricOptions): void;
/** Label above, value below — for dense readouts where the label leads. */
export declare function stat(g: GlyphRaster, r: Rect, label: string, value: string, opts?: {
    gray?: Gray;
    align?: HAlign;
    style?: TextStyle;
}): void;
/** Key on the left, value on the right, aligned across a stack of rows. */
export declare function keyValue(g: GlyphRaster, r: Rect, key: string, value: string, opts?: {
    gray?: Gray;
    leader?: boolean;
}): void;
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
export declare function listRow(g: GlyphRaster, r: Rect, opts: ListRowOptions): void;
export declare function progressBar(g: GlyphRaster, r: Rect, value: number, opts?: {
    fill?: Gray;
    track?: Gray;
    radius?: number;
    ticks?: number;
}): void;
/** Discrete segments — better than a smooth bar when the count matters. */
export declare function segmentedBar(g: GlyphRaster, r: Rect, segments: number, filled: number, opts?: {
    fill?: Gray;
    track?: Gray;
    gap?: number;
}): void;
export declare function battery(g: GlyphRaster, x: number, y: number, level: number, opts?: {
    width?: number;
    height?: number;
    gray?: Gray;
}): void;
export declare function signalBars(g: GlyphRaster, x: number, y: number, level: number, bars?: number, opts?: {
    height?: number;
}): void;
/** The top strip. Fixed to the 576-wide surface by design — it is chrome. */
export declare function statusBar(g: GlyphRaster, r: Rect, opts?: {
    title?: string;
    time?: string;
    battery?: number;
    signal?: number;
    icons?: GlyphIconName[];
}): void;
export declare function pageDots(g: GlyphRaster, cx: number, y: number, count: number, active: number): void;
export declare function tabBar(g: GlyphRaster, r: Rect, tabs: string[], active: number): void;
/** Vertical scroll indicator for lists that overflow. */
export declare function scrollbar(g: GlyphRaster, r: Rect, offset: number, visible: number, total: number): void;
/** A small rounded tag. Width is measured, not guessed. */
export declare function pill(g: GlyphRaster, x: number, y: number, text: string, opts?: {
    fill?: Gray;
    gray?: Gray;
    icon?: GlyphIconName;
    height?: number;
    style?: TextStyle;
}): number;
/** Outlined variant — reads as "state" rather than "chip". */
export declare function tag(g: GlyphRaster, x: number, y: number, text: string, opts?: {
    gray?: Gray;
    height?: number;
}): number;
export declare function badge(g: GlyphRaster, x: number, y: number, count?: number): void;
export declare function button(g: GlyphRaster, r: Rect, text: string, opts?: {
    icon?: GlyphIconName;
    primary?: boolean;
    focused?: boolean;
}): void;
export declare function toggle(g: GlyphRaster, x: number, y: number, on: boolean, width?: number): void;
/** Transient message strip. */
export declare function toast(g: GlyphRaster, r: Rect, text: string, opts?: {
    icon?: GlyphIconName;
    alpha?: number;
}): void;
/** Centred placeholder for "nothing here yet". */
export declare function emptyState(g: GlyphRaster, r: Rect, iconName: GlyphIconName, title: string, subtitle?: string): void;
/** Dim everything behind a foreground panel. */
export declare function scrim(g: GlyphRaster, r: Rect, level?: number): void;
/**
 * A proper compass rose: cardinal letters, minor ticks, a fixed lubber line and
 * an optional second pointer (wind, next waypoint) that rotates with the card.
 */
export declare function compassRose(g: GlyphRaster, cx: number, cy: number, radius: number, heading: number, opts?: {
    pointer?: number;
    pointerLabel?: string;
    showValue?: boolean;
    ticks?: boolean;
}): void;
/**
 * Artificial horizon. Pitch shifts the horizon line, roll rotates it.
 * Clipped to a circle so the rotation never bleeds into the layout.
 */
export declare function attitudeIndicator(g: GlyphRaster, cx: number, cy: number, radius: number, pitch: number, roll: number): void;
/** Wind arrow with speed, drawn as a barb pointing the way the wind is going. */
export declare function windIndicator(g: GlyphRaster, cx: number, cy: number, radius: number, direction: number, speed: number, unit?: string): void;
/** Speed roundel — the European sign, which reads instantly. */
export declare function speedLimit(g: GlyphRaster, cx: number, cy: number, radius: number, limit: number, over?: boolean): void;
/** Big directional maneuver arrow for navigation. */
export declare function maneuverArrow(g: GlyphRaster, cx: number, cy: number, size: number, kind: "left" | "right" | "straight" | "uturn" | "slight-left" | "slight-right"): void;
