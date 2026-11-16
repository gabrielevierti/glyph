/** Lightweight, allocation-conscious UI primitives for the G2 waveguide. */
import type { GlyphRaster } from './raster.js';
import type { Rect, Gray } from './types.js';
/** Small outlined status token; avoids occluding the view in waveguide mode. */
export declare function chip(g: GlyphRaster, r: Rect, label: string, opts?: {
    selected?: boolean;
    gray?: Gray;
}): void;
/** A compact on/off switch, with a stroke-only track on transparent displays. */
export declare function compactToggle(g: GlyphRaster, r: Rect, checked: boolean, opts?: {
    disabled?: boolean;
}): void;
/** Checkbox with a clear, scalable check mark. */
export declare function checkBox(g: GlyphRaster, r: Rect, checked: boolean, opts?: {
    disabled?: boolean;
}): void;
/** Radio button; never fills a large opaque surface. */
export declare function radioButton(g: GlyphRaster, r: Rect, selected: boolean): void;
/** Range input visualization; values are normalized to [0,1]. */
export declare function sliderTrack(g: GlyphRaster, r: Rect, value: number, opts?: {
    steps?: number;
}): void;
/** A multi-step workflow indicator. Index is zero-based. */
export declare function stepper(g: GlyphRaster, r: Rect, count: number, current: number): void;
/** Compact tab navigation with underline active state. */
export declare function compactTabs(g: GlyphRaster, r: Rect, labels: readonly string[], active: number): void;
/** Toast notification with optional secondary line. */
export declare function notificationToast(g: GlyphRaster, r: Rect, message: string, detail?: string): void;
/** Indeterminate loader: render with phase in [0,1] from the app animation clock. */
export declare function spinner(g: GlyphRaster, r: Rect, phase: number, spokes?: number): void;
/** Horizontal skeleton placeholder, useful while async content is loading. */
export declare function skeleton(g: GlyphRaster, r: Rect, lines?: number): void;
/** Inline badge for unread counts and compact alerts. */
export declare function countBadge(g: GlyphRaster, r: Rect, count: number): void;
