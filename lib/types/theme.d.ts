import type { Gray, SurfaceStyled, TextStyle } from "./types.js";
/**
 * The G2 renders 16 levels of a single green phosphor-like channel.
 * Naming the levels by role rather than by number is what keeps a design
 * coherent once five different screens are drawing at once.
 */
export declare const gray: {
    off: Gray;
    sunken: Gray;
    surface: Gray;
    raised: Gray;
    hairline: Gray;
    border: Gray;
    disabled: Gray;
    tertiary: Gray;
    secondary: Gray;
    primary: Gray;
    strong: Gray;
    max: Gray;
};
/**
 * A type scale built for glanceable reading through a waveguide, not for a
 * page. Sizes step aggressively — there is no useful middle ground between
 * "read this" and "see this".
 */
export declare const type: {
    hero: TextStyle;
    display: TextStyle;
    displaySm: TextStyle;
    headline: TextStyle;
    title: TextStyle;
    body: TextStyle;
    bodyStrong: TextStyle;
    caption: TextStyle;
    label: TextStyle;
    micro: TextStyle;
    numeral: TextStyle;
    numeralLg: TextStyle;
    numeralXl: TextStyle;
};
export declare const space: {
    none: number;
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
};
export declare const radius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
};
/** The G2's logical surface. */
export declare const screen: {
    width: number;
    height: number;
};
/**
 * Safe area. The outer few pixels of a waveguide are the first thing to clip
 * on a poorly-fitted pair, so nothing load-bearing goes there.
 */
export declare const safe: {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * Is this surface drawn in outline mode?
 *
 * Takes the thing being drawn on rather than reading a module global, so an
 * offscreen layer, a screenshot pass and the live app can each have their own
 * answer at the same time.
 */
export declare function isOutline(target: SurfaceStyled): boolean;
/** Ink budget: roughly what fraction of the surface a screen should light up. */
export declare const inkBudget = 0.18;
/**
 * Minimum level separation between a glyph and what sits behind it.
 *
 * Ink measures how much of the world the UI hides. Contrast measures whether
 * what it hides it with can actually be read. Both are cheap to assert and
 * neither is visible in a screenshot taken on a bright monitor.
 */
export declare const minContrast = 4;
export declare const theme: {
    gray: {
        off: Gray;
        sunken: Gray;
        surface: Gray;
        raised: Gray;
        hairline: Gray;
        border: Gray;
        disabled: Gray;
        tertiary: Gray;
        secondary: Gray;
        primary: Gray;
        strong: Gray;
        max: Gray;
    };
    type: {
        hero: TextStyle;
        display: TextStyle;
        displaySm: TextStyle;
        headline: TextStyle;
        title: TextStyle;
        body: TextStyle;
        bodyStrong: TextStyle;
        caption: TextStyle;
        label: TextStyle;
        micro: TextStyle;
        numeral: TextStyle;
        numeralLg: TextStyle;
        numeralXl: TextStyle;
    };
    space: {
        none: number;
        xxs: number;
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
        xxxl: number;
    };
    radius: {
        none: number;
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        pill: number;
    };
    screen: {
        width: number;
        height: number;
    };
    safe: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    inkBudget: number;
    minContrast: number;
};
export type Theme = typeof theme;
