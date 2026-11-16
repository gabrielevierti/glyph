import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Gray, HAlign, Rect, TextStyle } from "./types.js";
/** A row of equal-width buttons. The last one is primary unless told otherwise. */
export declare function buttonRow(g: GlyphRaster, r: Rect, labels: readonly string[], opts?: {
    focused?: number;
    primary?: number;
    gap?: number;
}): void;
export interface DialogOptions {
    title: string;
    message?: string;
    icon?: GlyphIconName;
    /** Button labels, left to right. */
    actions?: readonly string[];
    /** Index of the action that has focus. */
    focused?: number;
    /** Index of the emphasised action. Defaults to the last. */
    primary?: number;
}
/** A modal question: title, a sentence or two, and the choices. */
export declare function dialog(g: GlyphRaster, r: Rect, opts: DialogOptions): void;
/**
 * A sheet rising from the bottom of an area. Returns the rect to draw its
 * content in — put a `menu` there, or anything else.
 */
export declare function bottomSheet(g: GlyphRaster, area: Rect, opts?: {
    height?: number;
    title?: string;
    handle?: boolean;
}): Rect;
export interface MenuItem {
    label: string;
    icon?: GlyphIconName;
    /** Current value or shortcut, shown at the right. */
    value?: string;
    checked?: boolean;
    disabled?: boolean;
    /** Draw a chevron: this row opens something. */
    chevron?: boolean;
}
export interface MenuOptions {
    /** Index of the highlighted row. */
    selected?: number;
    /** Index of the first visible row. Defaults to keeping `selected` in view. */
    offset?: number;
    rowHeight?: number;
    /** A `Cursor` (or anything with `index` and `offset`) to take both from. */
    cursor?: {
        index: number;
        offset: number;
    };
}
/**
 * A scrolling list of choices. Returns how many rows fit, which is the number a
 * `Cursor` needs as its `visible`.
 */
export declare function menu(g: GlyphRaster, r: Rect, items: readonly MenuItem[], opts?: MenuOptions): number;
export interface CalloutOptions {
    /** Which edge the tail leaves from. `none` for a plain bubble. */
    pointer?: "top" | "bottom" | "left" | "right" | "none";
    /** Where along that edge, 0..1. Default 0.5. */
    at?: number;
    title?: string;
    gray?: Gray;
}
/** A bubble with a tail — a tooltip, a label pointing at something on screen. */
export declare function callout(g: GlyphRaster, r: Rect, text: string, opts?: CalloutOptions): void;
export type BannerKind = "info" | "success" | "warning" | "error";
/**
 * An inline alert strip. Severity is carried by the icon and the weight of the
 * border — there is no red to reach for.
 */
export declare function banner(g: GlyphRaster, r: Rect, text: string, opts?: {
    kind?: BannerKind;
    detail?: string;
    icon?: GlyphIconName;
}): void;
export interface NotificationOptions {
    /** Name of the app or sender category, shown small above the title. */
    app?: string;
    icon?: GlyphIconName;
    title: string;
    body?: string;
    time?: string;
}
/** An incoming notification: who it is from, one bold line, and as much of the body as fits. */
export declare function notificationCard(g: GlyphRaster, r: Rect, opts: NotificationOptions): void;
/** The four things a G2 temple, or an R1 ring, can tell you. */
export type Gesture = "tap" | "double-tap" | "scroll-up" | "scroll-down";
/** A small pictogram for one gesture. */
export declare function gestureGlyph(g: GlyphRaster, cx: number, cy: number, gesture: Gesture, gray?: Gray, size?: number): void;
/**
 * A legend of what each gesture does on this screen.
 *
 * Four gestures is the whole input vocabulary, and nothing on the glasses says
 * what they mean here — so a screen that does anything unusual should say so.
 */
export declare function hintBar(g: GlyphRaster, r: Rect, hints: ReadonlyArray<{
    gesture: Gesture;
    label: string;
}>, opts?: {
    align?: HAlign;
    gap?: number;
    gray?: Gray;
}): void;
export interface CaptionOptions {
    /** Who is speaking, shown above the text. */
    speaker?: string;
    maxLines?: number;
    style?: TextStyle;
    align?: "left" | "center";
    /** Words still being recognised: shown dimmer, after the settled text. */
    interim?: string;
}
/**
 * Live captions. The newest words are at the bottom and brightest; earlier
 * lines fade and then scroll away, so the eye always knows where "now" is.
 */
export declare function captions(g: GlyphRaster, r: Rect, text: string, opts?: CaptionOptions): void;
/**
 * A script that scrolls under a fixed reading line. `position` is the line
 * being read, and may be fractional for smooth scrolling. Returns the number of
 * lines, so the caller knows where the end is.
 */
export declare function teleprompter(g: GlyphRaster, r: Rect, text: string, position: number, opts?: {
    style?: TextStyle;
    anchor?: number;
    align?: "left" | "center";
}): number;
/** A spinner with a caption, for a screen that has nothing to show yet. Pass the app clock as `now`. */
export declare function loadingState(g: GlyphRaster, r: Rect, label: string, now: number, opts?: {
    detail?: string;
}): void;
/** Progress of unknown length: a segment that keeps crossing the track. */
export declare function indeterminateBar(g: GlyphRaster, r: Rect, now: number, opts?: {
    period?: number;
    gray?: Gray;
}): void;
/**
 * The microphone is open. Rings leave the icon at a pace set by the clock and a
 * brightness set by `level`, so silence and speech look different at a glance.
 */
export declare function listeningIndicator(g: GlyphRaster, cx: number, cy: number, radius: number, level: number, now: number, opts?: {
    state?: "listening" | "processing" | "idle";
}): void;
