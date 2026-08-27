import { GlyphFrame } from "./frame.js";
import type { FontMode, GlyphRaster } from "./raster.js";
import type { GlyphFontSet } from "./font.js";
import type { GlyphInputEvent, GlyphRuntime, TransportStats } from "./runtime.js";
import type { CanvasFactory, Rect, SurfaceStyle, TileLayout } from "./types.js";
export interface RenderContext {
    /** The surface to draw on. */
    g: GlyphRaster;
    /** Milliseconds since the app started. Use this, not Date.now(), for animation. */
    now: number;
    /** The full 576x288 surface. */
    screen: Rect;
    /** The surface minus the margin that a badly-fitted waveguide may clip. */
    safe: Rect;
    app: GlyphApp;
}
export interface Screen {
    name: string;
    /** Paint one frame. Called only when something has changed, or every tick if `animated`. */
    render(ctx: RenderContext): void;
    /** Return true if the event was handled and should not fall through to the app. */
    onInput?(event: GlyphInputEvent, app: GlyphApp): boolean | void;
    /** Repaint continuously rather than only on `invalidate()`. */
    animated?: boolean;
    onEnter?(app: GlyphApp): void;
    onExit?(app: GlyphApp): void;
}
/** A paint that overran the frame budget. */
export interface SlowFrame {
    screen: string;
    /** How long the paint took, in milliseconds. */
    ms: number;
    /** The budget it was supposed to fit in. */
    budgetMs: number;
}
export interface GlyphAppOptions {
    screens: Screen[];
    tileLayout?: TileLayout;
    supersample?: number;
    /** Upper bound on repaints per second. */
    fps?: number;
    /** Slide between screens. Set 0 to switch instantly. */
    transitionMs?: number;
    /** How panels and tracks draw themselves. Defaults to `outline`. */
    surface?: SurfaceStyle;
    /** Global output scale, 0..1. */
    brightness?: number;
    /** Bitmap font set, for host-independent text. */
    font?: GlyphFontSet | null;
    fontMode?: FontMode;
    createCanvas?: CanvasFactory;
    /** Called after every paint, with the resolved levels. Drives the preview. */
    onPaint?: (levels: Uint8Array, app: GlyphApp) => void;
    /**
     * Called when a paint takes longer than the frame budget. Without this a slow
     * screen just quietly runs at a lower frame rate and nobody finds out until
     * it is on someone's face.
     */
    onSlowFrame?: (info: SlowFrame, app: GlyphApp) => void;
}
/**
 * The app shell: screens, input routing, and a paint loop that does nothing
 * when nothing has changed.
 *
 * Screens are plain objects with a `render` function. There is no retained
 * tree — on a display this size, a full repaint is cheaper than reconciling
 * one, and the tile diffing downstream means an unchanged screen costs no
 * transport at all.
 */
export declare class GlyphApp {
    readonly frame: GlyphFrame;
    readonly screens: Screen[];
    private index;
    private runtime;
    private started;
    private dirty;
    private running;
    private lastPaint;
    private readonly interval;
    private readonly transitionMs;
    private readonly onPaint?;
    private readonly onSlowFrame?;
    private frameHandle;
    private fromLayer;
    private toLayer;
    private transition;
    /** Painted frames per second, averaged. Shown in the dev preview. */
    fps: number;
    /**
     * How many tiles changed on the last paint. Tracked whether or not glasses
     * are attached, so you can see the transport cost of a design decision while
     * you are still making it.
     */
    lastDirtyTiles: number;
    private diff;
    constructor(options: GlyphAppOptions);
    get screen(): Screen;
    get screenIndex(): number;
    get now(): number;
    /** How panels and tracks draw themselves. Changing it forces a repaint. */
    get surface(): SurfaceStyle;
    set surface(style: SurfaceStyle);
    /** Global output scale, 0..1, applied at resolve. */
    get brightness(): number;
    set brightness(value: number);
    /** Install a bitmap font set on this app's surface and its transition layers. */
    useFont(set: GlyphFontSet | null, mode?: FontMode): void;
    /** Request a repaint on the next tick. */
    invalidate(): void;
    attachRuntime(runtime: GlyphRuntime | null): void;
    /** What the transport is costing right now, if any is attached. */
    get transportStats(): TransportStats | null;
    goto(target: number | string, direction?: number): void;
    private ensureLayer;
    next(): void;
    previous(): void;
    handleInput(event: GlyphInputEvent): void;
    /** Paint one frame now, regardless of the dirty flag. */
    paint(): Uint8Array;
    private tick;
    start(): void;
    stop(): void;
    /** Stop and release every canvas this app owns. */
    dispose(): void;
}
/**
 * Selection and scrolling for list screens. Keeps the cursor inside the window
 * so a screen only has to ask which rows to draw.
 */
export declare class Cursor {
    total: number;
    visible: number;
    index: number;
    offset: number;
    constructor(total: number, visible: number);
    move(delta: number): void;
    setTotal(total: number): void;
    /** Indices currently on screen. */
    window(): number[];
}
