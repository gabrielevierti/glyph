import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Gray, HAlign, Rect, TextStyle } from "./types.js";
/** The title strip of a screen: where you are, optionally how to go back, and one accessory. */
export declare function screenHeader(g: GlyphRaster, r: Rect, title: string, opts?: {
    back?: boolean;
    subtitle?: string;
    accessory?: string;
    icon?: GlyphIconName;
}): void;
/** A panel with a heading. Returns the rect left over for its content. */
export declare function card(g: GlyphRaster, r: Rect, opts?: {
    title?: string;
    subtitle?: string;
    icon?: GlyphIconName;
    accessory?: string;
    selected?: boolean;
}): Rect;
/** A grid of labelled figures, ruled apart — a spec sheet. */
export declare function statGrid(g: GlyphRaster, r: Rect, items: ReadonlyArray<{
    label: string;
    value: string;
}>, opts?: {
    columns?: number;
}): void;
export type Presence = "online" | "busy" | "away" | "offline";
/** Presence as a shape, since it cannot be a colour: solid, barred, ring, dim ring. */
export declare function statusDot(g: GlyphRaster, cx: number, cy: number, state: Presence, radius?: number): void;
/** A person as a circle with initials or an icon, and optionally whether they are around. */
export declare function avatar(g: GlyphRaster, cx: number, cy: number, radius: number, opts?: {
    initials?: string;
    icon?: GlyphIconName;
    presence?: Presence;
    selected?: boolean;
}): void;
/** Several people, overlapping, with a "+N" for the ones that do not fit. Returns the width used. */
export declare function avatarGroup(g: GlyphRaster, x: number, cy: number, radius: number, initials: readonly string[], opts?: {
    max?: number;
}): number;
/**
 * One message in a conversation. Sized to its text, pushed to the side of
 * whoever said it. Returns the height used, so the next bubble knows where to go.
 */
export declare function chatBubble(g: GlyphRaster, r: Rect, text: string, opts?: {
    from?: "me" | "them";
    name?: string;
    time?: string;
    style?: TextStyle;
}): number;
export interface TableColumn {
    label: string;
    /** Fixed width in pixels. Columns without one share what is left. */
    width?: number;
    /** Share of the leftover width, for columns with no fixed width. Default 1. */
    weight?: number;
    align?: HAlign;
    /** Monospaced digits, right-aligned by default. */
    numeric?: boolean;
}
export interface TableOptions {
    rowHeight?: number;
    /** Draw the header row. Default true. */
    header?: boolean;
    selected?: number;
    /** Index of the first visible row. */
    offset?: number;
    dividers?: boolean;
}
/** Rows and columns. Returns how many rows fit. */
export declare function table(g: GlyphRaster, r: Rect, columns: readonly TableColumn[], rows: ReadonlyArray<readonly string[]>, opts?: TableOptions): number;
export interface TimelineEvent {
    title: string;
    time?: string;
    detail?: string;
    /** Default `upcoming`. */
    state?: "done" | "current" | "upcoming";
}
/**
 * A sequence down the page: what has happened, what is happening, what is
 * next. Solid behind you, dashed ahead. Returns how many events fit.
 */
export declare function timeline(g: GlyphRaster, r: Rect, events: readonly TimelineEvent[], opts?: {
    rowHeight?: number;
}): number;
export interface CalendarOptions {
    /** Day of the month to outline. */
    selected?: number;
    /** Day of the month to invert. */
    today?: number;
    /** Days that carry a dot. */
    marked?: readonly number[];
    /** 0 for Sunday-first, 1 for Monday-first. Default 1. */
    weekStart?: 0 | 1;
    /** Seven weekday initials, in display order. */
    weekdays?: readonly string[];
    /** A heading, e.g. "November 2026". Formatting it is the caller's job, so it can be in any language. */
    title?: string;
}
/** One month as a grid. `month` is 1–12. */
export declare function calendarMonth(g: GlyphRaster, r: Rect, year: number, month: number, opts?: CalendarOptions): void;
export interface Stop {
    name: string;
    time?: string;
}
/**
 * A route as a line of stops — a transit line, a delivery, the stages of a
 * trip. `current` may be fractional: 2.5 is halfway between the third stop and
 * the fourth.
 */
export declare function stopLine(g: GlyphRaster, r: Rect, stops: readonly Stop[], opts?: {
    current?: number;
    labels?: "ends" | "all";
}): void;
/** Stars, with fractions. Returns the width used. */
export declare function rating(g: GlyphRaster, x: number, cy: number, value: number, opts?: {
    max?: number;
    size?: number;
    gap?: number;
}): number;
/** Where you are in a hierarchy. When it does not fit, it drops from the front, never the end. */
export declare function breadcrumb(g: GlyphRaster, r: Rect, parts: readonly string[]): void;
/** "3 / 12", with chevrons that go dim at either end. `page` counts from 1. */
export declare function pagination(g: GlyphRaster, r: Rect, page: number, total: number): void;
/** Chips that flow onto as many lines as they need. Returns the height used. */
export declare function chipRow(g: GlyphRaster, r: Rect, labels: readonly string[], opts?: {
    selected?: number | readonly number[];
    gap?: number;
    height?: number;
}): number;
export interface LegendItem {
    label: string;
    gray?: Gray;
    dash?: number[];
    marker?: "line" | "dot" | "square";
}
/** What each mark on a chart means. */
export declare function legend(g: GlyphRaster, r: Rect, items: readonly LegendItem[], opts?: {
    direction?: "row" | "column";
    gap?: number;
}): void;
/** A change, with its direction: up is bright, down is dim, flat is a dash. Returns the width used. */
export declare function trendBadge(g: GlyphRaster, x: number, cy: number, delta: number, opts?: {
    text?: string;
    format?: (delta: number) => string;
}): number;
/** A key, for writing "press this" — or, here, "say this". Returns the width used. */
export declare function keycap(g: GlyphRaster, x: number, cy: number, label: string, opts?: {
    height?: number;
}): number;
/** Seconds as "m:ss", or "h:mm:ss" once there are hours. */
export declare function formatDuration(seconds: number): string;
export interface MediaOptions {
    title: string;
    artist?: string;
    /** Seconds played. */
    position: number;
    /** Total seconds. */
    duration: number;
    playing?: boolean;
}
/** Now playing: what, by whom, how far through, and the transport. */
export declare function mediaTransport(g: GlyphRaster, r: Rect, opts: MediaOptions): void;
/** An amplitude envelope as bars. Samples are 0..1; the played part is bright. */
export declare function waveform(g: GlyphRaster, r: Rect, samples: readonly number[], opts?: {
    progress?: number;
    barWidth?: number;
    gap?: number;
    mirrored?: boolean;
}): void;
/** Frequency bands as stacks of segments. Levels are 0..1. */
export declare function equalizer(g: GlyphRaster, r: Rect, levels: readonly number[], opts?: {
    segments?: number;
    gap?: number;
    peaks?: readonly number[];
}): void;
/** A timer as a ring that empties, with the time left written inside it. */
export declare function countdownRing(g: GlyphRaster, cx: number, cy: number, radius: number, remaining: number, total: number, opts?: {
    label?: string;
    width?: number;
}): void;
/**
 * One line that scrolls if — and only if — it does not fit. Pass the app clock
 * as `now`, and mark the screen `animated`. Returns whether it is scrolling.
 */
export declare function marquee(g: GlyphRaster, r: Rect, text: string, now: number, opts?: {
    style?: TextStyle;
    gray?: Gray;
    speed?: number;
    gap?: number;
    pauseMs?: number;
}): boolean;
/**
 * Text that appears a character at a time. `progress` is 0..1 of the whole
 * text. Line breaks are decided from the complete text, so words do not jump
 * to the next line halfway through being typed.
 */
export declare function typewriter(g: GlyphRaster, r: Rect, text: string, progress: number, opts?: {
    style?: TextStyle;
    gray?: Gray;
    caret?: boolean;
}): void;
