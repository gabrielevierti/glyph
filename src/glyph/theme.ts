import type { Gray, TextStyle } from "./types.js";

/**
 * The G2 renders 16 levels of a single green phosphor-like channel.
 * Naming the levels by role rather than by number is what keeps a design
 * coherent once five different screens are drawing at once.
 */
export const gray = {
  off: 0 as Gray,        // background — the display is genuinely off here
  sunken: 1 as Gray,     // recessed wells
  surface: 2 as Gray,    // card and panel fills
  raised: 3 as Gray,     // hover / selected fills
  hairline: 4 as Gray,   // faint separators
  border: 5 as Gray,     // visible borders
  disabled: 6 as Gray,   // inactive glyphs
  tertiary: 7 as Gray,   // captions, units
  secondary: 9 as Gray,  // labels, supporting text
  primary: 11 as Gray,   // body text
  strong: 13 as Gray,    // emphasis, icons
  max: 15 as Gray        // headline numerals, focus
};

const sans = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif";
const mono = "SF Mono, ui-monospace, Menlo, Consolas, monospace";

/**
 * A type scale built for glanceable reading through a waveguide, not for a
 * page. Sizes step aggressively — there is no useful middle ground between
 * "read this" and "see this".
 */
export const type = {
  hero: { font: sans, size: 64, weight: 800, leading: 62 } as TextStyle,
  display: { font: sans, size: 46, weight: 800, leading: 46 } as TextStyle,
  displaySm: { font: sans, size: 34, weight: 800, leading: 34 } as TextStyle,
  headline: { font: sans, size: 22, weight: 700, leading: 26 } as TextStyle,
  title: { font: sans, size: 17, weight: 700, leading: 21 } as TextStyle,
  body: { font: sans, size: 14, weight: 500, leading: 18 } as TextStyle,
  bodyStrong: { font: sans, size: 14, weight: 700, leading: 18 } as TextStyle,
  caption: { font: sans, size: 11, weight: 500, leading: 14 } as TextStyle,
  label: { font: sans, size: 10, weight: 700, tracking: 1.1, uppercase: true, leading: 13 } as TextStyle,
  micro: { font: sans, size: 9, weight: 700, tracking: 0.8, uppercase: true, leading: 11 } as TextStyle,
  numeral: { font: mono, size: 15, weight: 600, leading: 18 } as TextStyle,
  numeralLg: { font: mono, size: 24, weight: 700, leading: 28 } as TextStyle,
  numeralXl: { font: mono, size: 40, weight: 700, leading: 42 } as TextStyle
};

export const space = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { none: 0, xs: 3, sm: 5, md: 8, lg: 12, xl: 18, pill: 999 };

/** The G2's logical surface. */
export const screen = { width: 576, height: 288 };

/**
 * Safe area. The outer few pixels of a waveguide are the first thing to clip
 * on a poorly-fitted pair, so nothing load-bearing goes there.
 */
export const safe = { x: 14, y: 12, width: 548, height: 264 };

export const theme = { gray, type, space, radius, screen, safe };
export type Theme = typeof theme;
