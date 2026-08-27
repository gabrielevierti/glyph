import type { GlyphFontSet } from "./font.js";
import { GlyphPath } from "./path.js";
import { type Measurer } from "./text.js";
import type { Corners, Gray, HAlign, Paint, Point, Rect, RasterOptions, SurfaceStyle, TextStyle, VAlign } from "./types.js";
/** One place a glyph was drawn too close in level to what sits behind it. */
export interface ContrastWarning {
    text: string;
    /** Level the text was drawn at. */
    gray: Gray;
    /** Level already on the surface underneath it. */
    background: Gray;
    delta: number;
    x: number;
    y: number;
}
/**
 * How text is rasterized.
 *
 * `auto`   — a bitmap face when the installed atlas has one, canvas otherwise.
 * `bitmap` — bitmap only; a missing face throws. Use this in CI, where the
 *            whole point is that the host's fonts cannot influence the output.
 * `canvas` — always the host. Used when generating an atlas.
 */
export type FontMode = "auto" | "bitmap" | "canvas";
/**
 * The drawing surface.
 *
 * Everything is drawn in logical pixels into a supersampled canvas, then
 * resolved down to one byte per pixel at 16 levels. Supersampling is what buys
 * you clean diagonals and curves on a display this small — the averaging step
 * turns coverage into gray levels for free.
 */
export declare class GlyphRaster {
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    readonly ctx: CanvasRenderingContext2D;
    /**
     * How panels and tracks draw themselves. Lives here rather than in a module
     * global, so a layer, a screenshot pass and the live app can disagree — and
     * so two tests running at once cannot corrupt each other's setting.
     */
    surface: SurfaceStyle;
    /** Global output scale, 0..1, applied once at resolve. */
    brightness: number;
    /** Text rasterization policy. See `FontMode`. */
    fontMode: FontMode;
    private readonly canvas;
    private readonly makeCanvas;
    private scratch;
    private fontSet;
    private lintMinDelta;
    private lintRecords;
    private styleObserver;
    /**
     * Uncached measurement. Kept separate so `useFont` can rebuild the cache
     * around it without every caller having to re-read `g.measure`.
     */
    private rawMeasure;
    /**
     * Width of a string in logical pixels. Memoized — wrapping, truncation and
     * `fitStyle` all re-measure the same unchanged labels on every paint.
     */
    measure: Measurer;
    constructor(options?: RasterOptions);
    /**
     * Install a bitmap font set. Metrics and coverage then come from the atlas
     * rather than from the host, which is what makes a committed snapshot mean
     * anything on a machine other than the one that made it.
     */
    useFont(set: GlyphFontSet | null, mode?: FontMode): this;
    get font(): GlyphFontSet | null;
    /**
     * Report every text style this raster is asked to draw or measure.
     *
     * The atlas builder uses this to discover which faces an app actually needs,
     * rather than making you keep a list in sync by hand — screens use one-off
     * sizes (`{ ...T.numeral, size: 13 }`) constantly, and a face that is missing
     * from the atlas is a face that silently falls back to the host.
     */
    observeStyles(cb: ((style: TextStyle) => void) | null): this;
    private faceFor;
    /**
     * Record any glyph drawn within `minDelta` levels of its background.
     *
     * Ink says how much of the world the UI is hiding. Contrast says whether what
     * it hides it with can be read. Neither shows up in a screenshot on a bright
     * monitor, which is exactly why both are assertions rather than eyeballing.
     */
    enableContrastLint(minDelta?: number): ContrastWarning[];
    get contrastWarnings(): ContrastWarning[];
    clearContrastWarnings(): void;
    /** Level currently on the surface at a logical point. */
    sample(x: number, y: number): Gray;
    /**
     * The darkest level in a small neighbourhood — the backdrop a glyph will
     * actually sit against.
     *
     * A single sample is not enough: land it on a stroke of text drawn a moment
     * ago and the lint reports a clash with something the eye reads as a separate
     * word. The minimum over a span finds the surface showing through the gaps,
     * which is the thing the new glyph has to be distinguishable from.
     */
    private backdrop;
    private lintText;
    save(): this;
    restore(): this;
    /** Run `fn` inside a save/restore pair. Clips and transforms cannot leak out. */
    scoped(fn: (g: this) => void): this;
    translate(dx: number, dy: number): this;
    rotate(radians: number): this;
    scaleBy(sx: number, sy?: number): this;
    /** Rotate about an arbitrary point. */
    rotateAbout(x: number, y: number, radians: number): this;
    clipRect(r: Rect): this;
    clipRound(r: Rect, radius: Corners): this;
    clipCircle(cx: number, cy: number, radius: number): this;
    clipPath(path: GlyphPath, x?: number, y?: number, scale?: number): this;
    private paint;
    private stroke;
    private fillAndStroke;
    clear(gray?: Gray): this;
    /** Set a single logical pixel. */
    pixel(x: number, y: number, gray: Gray): this;
    rect(r: Rect, p?: Paint): this;
    roundRect(r: Rect, radius?: Corners, p?: Paint): this;
    circle(cx: number, cy: number, radius: number, p?: Paint): this;
    ellipse(cx: number, cy: number, rx: number, ry: number, rotation?: number, p?: Paint): this;
    line(x1: number, y1: number, x2: number, y2: number, p?: Paint): this;
    /** Crisp single-pixel horizontal rule. Snapped so it never lands between pixels. */
    hline(x1: number, x2: number, y: number, gray?: Gray, weight?: number): this;
    /** Crisp single-pixel vertical rule. */
    vline(x: number, y1: number, y2: number, gray?: Gray, weight?: number): this;
    polyline(points: Point[], p?: Paint): this;
    polygon(points: Point[], p?: Paint): this;
    /** Regular n-gon. `rotation` 0 puts a vertex at the top. */
    regularPolygon(cx: number, cy: number, radius: number, sides: number, rotation?: number, p?: Paint): this;
    star(cx: number, cy: number, outer: number, inner: number, points?: number, rotation?: number, p?: Paint): this;
    /** Stroked arc. Angles in radians, 0 = east. */
    arc(cx: number, cy: number, radius: number, start: number, end: number, p?: Paint): this;
    /** Filled pie slice. */
    sector(cx: number, cy: number, radius: number, start: number, end: number, p?: Paint): this;
    /** Filled annulus segment — a donut slice. */
    ring(cx: number, cy: number, outer: number, inner: number, start?: number, end?: number, p?: Paint): this;
    quad(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, p?: Paint): this;
    bezier(x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number, p?: Paint): this;
    /** Draw a path, optionally translated and scaled. */
    path(path: GlyphPath, x?: number, y?: number, scale?: number, p?: Paint): this;
    /** Smooth curve through a set of points (Catmull-Rom converted to beziers). */
    spline(points: Point[], p?: Paint, tension?: number): this;
    /**
     * Dithered linear gradient. Canvas gradients band badly once you quantize to
     * 16 levels, so this computes the ramp per logical pixel and applies an
     * ordered dither. It is the difference between a ramp and a staircase.
     */
    gradient(r: Rect, from: number, to: number, angle?: number): this;
    /** Dithered radial gradient, bright at the centre by default. */
    radialGradient(cx: number, cy: number, radius: number, from: number, to: number): this;
    /** Fill an area with a fractional gray level using ordered dithering. */
    ditherRect(r: Rect, level: number): this;
    /** Diagonal hatching. `angle` in radians, `spacing` in logical pixels. */
    hatch(r: Rect, spacing?: number, gray?: Gray, angle?: number, width?: number): this;
    /** Regular dot field. Good for backgrounds that need texture without weight. */
    dots(r: Rect, spacing?: number, gray?: Gray, radius?: number): this;
    /** Grid lines. Useful as a chart backdrop or a design overlay. */
    gridLines(r: Rect, stepX: number, stepY?: number, gray?: Gray): this;
    /** Copy a level buffer straight onto the surface, nearest-neighbour. */
    blit(pixels: Uint8Array, width: number, height: number, x: number, y: number): this;
    /** Compose another raster onto this one. */
    drawRaster(other: GlyphRaster, x?: number, y?: number, alpha?: number): this;
    /**
     * An offscreen raster with the same supersampling — for layers and masks.
     * Inherits surface style, brightness and the installed font, so a layer draws
     * the same way the surface that produced it does.
     */
    layer(width?: number, height?: number): GlyphRaster;
    private getScratch;
    get element(): HTMLCanvasElement;
    /** Release cached canvases. The raster is unusable afterwards. */
    dispose(): void;
    /** Cap height of the style, useful for optical vertical centring. */
    capHeight(style?: TextStyle): number;
    /**
     * Draw a single line of text.
     * `x` is interpreted according to `hAlign`, `y` according to `vAlign`.
     */
    text(value: string, x: number, y: number, style?: TextStyle, gray?: Gray, hAlign?: HAlign, vAlign?: VAlign): this;
    /**
     * Bitmap text.
     *
     * Glyphs are blitted from a pre-tinted atlas at whole logical pixels, so the
     * coverage committed to the repository is the coverage on the glasses — no
     * host font stack, no subpixel positioning, no drift between machines.
     */
    private drawBitmapText;
    /**
     * Draw text into a box, with wrapping, alignment and ellipsis.
     * Returns the height actually consumed, so callers can flow content.
     */
    textBox(value: string, box: Rect, style?: TextStyle, gray?: Gray, opts?: {
        hAlign?: HAlign;
        vAlign?: VAlign;
        maxLines?: number;
        wrap?: boolean;
    }): number;
    /**
     * Resolve the supersampled canvas to one byte per pixel at 16 levels.
     * This is the only place the device pixel grid exists.
     *
     * The average is a straight mean of the encoded bytes, deliberately. Every
     * value on this canvas is `level * 17` — a linear encoding of a level, not an
     * sRGB colour — and the panel's output is linear in level, so the arithmetic
     * mean *is* the physically correct one. "Fixing" this with a gamma curve is a
     * plausible-sounding way to make every antialiased edge slightly wrong.
     *
     * Only the red channel is read: everything drawn here is gray by construction.
     */
    toLevels(out?: Uint8Array): Uint8Array;
}
