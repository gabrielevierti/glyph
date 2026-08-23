import type { Gray } from "./types";

/**
 * Even Realities G2 uses a 16-level green monochrome display.
 * The ecosystem favors high contrast, large scannable elements,
 * and a widget-based dashboard paradigm.
 */
export const glyphTheme = {
  colors: {
    off: 0 as Gray,         // completely black
    void: 1 as Gray,        // near-black backgrounds
    surface: 2 as Gray,     // card backgrounds
    surfaceHover: 3 as Gray,
    border: 4 as Gray,      // subtle borders
    divider: 5 as Gray,     // section dividers
    muted: 6 as Gray,       // disabled / inactive
    secondary: 8 as Gray,   // secondary text
    primary: 10 as Gray,    // body text
    bright: 12 as Gray,     // emphasized text
    highlight: 13 as Gray,  // active states
    white: 15 as Gray,      // primary content / icons
  },
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40
  },
  radius: {
    sm: 4, md: 8, lg: 12, xl: 16, full: 999
  },
  typography: {
    // For the big clock / primary numbers you glance at
    display: { font: "Inter, Arial, sans-serif", size: 56, weight: 800 },
    displayMd: { font: "Inter, Arial, sans-serif", size: 40, weight: 800 },
    displaySm: { font: "Inter, Arial, sans-serif", size: 28, weight: 700 },
    // Section headers
    headline: { font: "Inter, Arial, sans-serif", size: 20, weight: 700 },
    title: { font: "Inter, Arial, sans-serif", size: 16, weight: 700 },
    // Body / labels
    body: { font: "Inter, Arial, sans-serif", size: 14, weight: 600 },
    label: { font: "Inter, Arial, sans-serif", size: 11, weight: 700 },
    caption: { font: "Inter, Arial, sans-serif", size: 10, weight: 600 },
    // Mono for numbers / data
    mono: { font: "ui-monospace, SFMono-Regular, Menlo, monospace", size: 13, weight: 600 },
    monoLg: { font: "ui-monospace, SFMono-Regular, Menlo, monospace", size: 18, weight: 700 },
  }
} as const;
