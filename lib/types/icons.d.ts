import type { Gray, Paint } from "./types.js";
import type { GlyphRaster } from "./raster.js";
/**
 * Icons are authored as path data on a 24x24 grid and stroked, not filled.
 * A stroked path holds up at 10px on a low-level display in a way that a
 * filled silhouette does not — the strokes stay separable when the whole
 * glyph is only a handful of gray levels wide.
 */
export declare const iconPaths: Record<string, string>;
export type GlyphIconName = keyof typeof iconPaths | (string & {});
/** Add or override an icon at runtime. Path data is on the same 24x24 grid. */
export declare function registerIcon(name: string, d: string): void;
export declare function hasIcon(name: string): boolean;
export declare function iconNames(): string[];
/**
 * Draw an icon centred on (cx, cy) at the given size.
 * Stroke width scales with size but is clamped so icons stay legible when
 * small — a hairline-stroked 10px icon reads as noise on this display.
 */
export declare function icon(r: GlyphRaster, name: GlyphIconName, cx: number, cy: number, size?: number, gray?: Gray, paint?: Paint): void;
/** Draw an icon filled rather than stroked. Good for solid arrows and markers. */
export declare function iconFilled(r: GlyphRaster, name: GlyphIconName, cx: number, cy: number, size?: number, gray?: Gray): void;
