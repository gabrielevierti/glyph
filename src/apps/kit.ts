import { gray as G, pageDots, screenHeader, type as T } from "../glyph/index.js";
import type { GlyphRaster, Rect, RenderContext } from "../glyph/index.js";

/**
 * Shared chrome for the component reference screens: a header, a footer, and
 * the small captions that say which component is which.
 */

export const rect = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height });

/** The area between header and footer. */
export const BODY: Rect = { x: 22, y: 48, width: 532, height: 214 };

export function header(g: GlyphRaster, title: string, tag: string): void {
  screenHeader(g, rect(22, 10, 532, 28), title, { accessory: tag });
}

export function footer(ctx: RenderContext, note: string): void {
  const { g, app } = ctx;
  g.hline(22, 554, 267, G.hairline);
  g.text(note, 22, 277, T.micro, G.tertiary, "left", "middle");
  // Right-aligned, however many screens there are.
  pageDots(g, 551 - (app.screens.length - 1) * 4.5, 277, app.screens.length, app.screenIndex);
}

/** Caption above a specimen. */
export function caption(g: GlyphRaster, x: number, y: number, text: string): void {
  g.text(text, x, y, T.micro, G.tertiary, "left", "middle");
}
