import type { GlyphIconName } from "./icons.js";
import type { GlyphRaster } from "./raster.js";
import type { Rect } from "./types.js";
/** The one way focus is shown on a boxed control: a bright outline standing just off it. */
export declare function focusRing(g: GlyphRaster, r: Rect, radius?: number, gap?: number): void;
/** A handful of mutually exclusive options, side by side. */
export declare function segmentedControl(g: GlyphRaster, r: Rect, labels: readonly string[], active: number, opts?: {
    focused?: boolean;
}): void;
/**
 * A wheel of options, scrolled through the middle. `index` may be fractional,
 * so a tween can roll it. Two side by side make a time picker.
 */
export declare function pickerWheel(g: GlyphRaster, r: Rect, options: readonly string[], index: number, opts?: {
    visible?: number;
    focused?: boolean;
}): void;
/** One of several, stacked. */
export declare function radioGroup(g: GlyphRaster, r: Rect, labels: readonly string[], selected: number, opts?: {
    focused?: number;
    rowHeight?: number;
}): void;
/** Any of several, stacked. */
export declare function checkGroup(g: GlyphRaster, r: Rect, labels: readonly string[], checked: readonly boolean[], opts?: {
    focused?: number;
    rowHeight?: number;
}): void;
/** A value with a step down on its left and a step up on its right. */
export declare function numberStepper(g: GlyphRaster, r: Rect, value: string, opts?: {
    canDecrement?: boolean;
    canIncrement?: boolean;
    focused?: boolean;
}): void;
/** A range within a range: two thumbs on one track. Values are 0..1. */
export declare function rangeSlider(g: GlyphRaster, r: Rect, low: number, high: number, opts?: {
    steps?: number;
}): void;
/**
 * A rotary control: the natural partner of a scroll gesture. The value sits in
 * the middle, where the sweep cannot cross it.
 */
export declare function dial(g: GlyphRaster, cx: number, cy: number, radius: number, value: number, opts?: {
    label?: string;
    valueText?: string;
    ticks?: number;
    focused?: boolean;
}): void;
export interface TextFieldOptions {
    label?: string;
    placeholder?: string;
    focused?: boolean;
    /** Draw the insertion caret. Blink it by passing a value that alternates. */
    caret?: boolean;
    /** Show a dot per character instead of the text. */
    secure?: boolean;
    icon?: GlyphIconName;
}
/**
 * A single-line field — for dictated text, a search term, a code. When the
 * value is too long the *end* stays visible: that is where the typing is.
 */
export declare function textField(g: GlyphRaster, r: Rect, value: string, opts?: TextFieldOptions): void;
/** How many digits of a code have been entered. */
export declare function pinDots(g: GlyphRaster, cx: number, cy: number, length: number, filled: number, opts?: {
    radius?: number;
    gap?: number;
}): void;
/**
 * A grid of keys. `focused` and `pressed` are indices counted along the rows,
 * so scroll gestures can walk the keys in reading order.
 */
export declare function keypad(g: GlyphRaster, r: Rect, opts?: {
    keys?: readonly (readonly string[])[];
    focused?: number;
    pressed?: number;
    gap?: number;
}): void;
/** A setting that is on or off: its name, optionally what it does, and a switch. */
export declare function switchRow(g: GlyphRaster, r: Rect, label: string, on: boolean, opts?: {
    detail?: string;
    icon?: GlyphIconName;
    focused?: boolean;
    disabled?: boolean;
}): void;
/** A setting on a scale: its name, its current value, and a slider beneath. `value` is 0..1. */
export declare function sliderRow(g: GlyphRaster, r: Rect, label: string, value: number, opts?: {
    valueText?: string;
    focused?: boolean;
    steps?: number;
}): void;
