import { GlyphFrame, TileDiff, TILE_QUADRANTS } from "./frame.js";
import type { FontMode, GlyphRaster } from "./raster.js";
import type { GlyphFontSet } from "./font.js";
import { Tween, ease } from "./animate.js";
import { clamp } from "./geometry.js";
import { safe as SAFE, screen as SCREEN } from "./theme.js";
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
export class GlyphApp {
  readonly frame: GlyphFrame;
  readonly screens: Screen[];
  private index = 0;
  private runtime: GlyphRuntime | null = null;
  private started = 0;
  private dirty = true;
  private running = false;
  private lastPaint = 0;
  private readonly interval: number;
  private readonly transitionMs: number;
  private readonly onPaint?: (levels: Uint8Array, app: GlyphApp) => void;
  private readonly onSlowFrame?: (info: SlowFrame, app: GlyphApp) => void;
  private frameHandle: number | null = null;

  // Transition state. The two layers are allocated once and reused: a full
  // 576x288 raster at 2x supersampling is a 1152x576 canvas, and churning two
  // of those on every screen change is a lot of garbage for an animation the
  // wearer sees for a fifth of a second.
  private fromLayer: GlyphRaster | null = null;
  private toLayer: GlyphRaster | null = null;
  private transition: { tween: Tween; direction: number } | null = null;

  /** Painted frames per second, averaged. Shown in the dev preview. */
  fps = 0;

  /**
   * How many tiles changed on the last paint. Tracked whether or not glasses
   * are attached, so you can see the transport cost of a design decision while
   * you are still making it.
   */
  lastDirtyTiles = 0;
  private diff = new TileDiff();

  constructor(options: GlyphAppOptions) {
    if (options.screens.length === 0) throw new Error("Glyph: an app needs at least one screen.");
    this.screens = options.screens;
    this.frame = new GlyphFrame({
      width: SCREEN.width,
      height: SCREEN.height,
      supersample: options.supersample ?? 2,
      tileLayout: options.tileLayout ?? TILE_QUADRANTS,
      createCanvas: options.createCanvas,
      surface: options.surface,
      brightness: options.brightness
    });
    if (options.font) this.frame.raster.useFont(options.font, options.fontMode ?? "auto");
    this.interval = 1000 / (options.fps ?? 20);
    this.transitionMs = options.transitionMs ?? 220;
    this.onPaint = options.onPaint;
    this.onSlowFrame = options.onSlowFrame;
  }

  get screen(): Screen { return this.screens[this.index]; }
  get screenIndex(): number { return this.index; }
  get now(): number { return performance.now() - this.started; }

  /** How panels and tracks draw themselves. Changing it forces a repaint. */
  get surface(): SurfaceStyle { return this.frame.raster.surface; }
  set surface(style: SurfaceStyle) {
    this.frame.raster.surface = style;
    if (this.fromLayer) this.fromLayer.surface = style;
    if (this.toLayer) this.toLayer.surface = style;
    this.runtime?.invalidate();
    this.diff.reset();
    this.dirty = true;
  }

  /** Global output scale, 0..1, applied at resolve. */
  get brightness(): number { return this.frame.raster.brightness; }
  set brightness(value: number) {
    this.frame.raster.brightness = value;
    this.runtime?.invalidate();
    this.diff.reset();
    this.dirty = true;
  }

  /** Install a bitmap font set on this app's surface and its transition layers. */
  useFont(set: GlyphFontSet | null, mode: FontMode = set ? "auto" : "canvas"): void {
    this.frame.raster.useFont(set, mode);
    this.fromLayer?.useFont(set, mode);
    this.toLayer?.useFont(set, mode);
    this.runtime?.invalidate();
    this.diff.reset();
    this.dirty = true;
  }

  /** Request a repaint on the next tick. */
  invalidate(): void { this.dirty = true; }

  attachRuntime(runtime: GlyphRuntime | null): void {
    this.runtime = runtime;
    runtime?.invalidate();
    this.dirty = true;
  }

  /** What the transport is costing right now, if any is attached. */
  get transportStats(): TransportStats | null {
    return this.runtime?.isConnected ? this.runtime.stats : null;
  }

  goto(target: number | string, direction?: number): void {
    const next = typeof target === "number"
      ? ((target % this.screens.length) + this.screens.length) % this.screens.length
      : this.screens.findIndex((s) => s.name === target);
    if (next < 0 || next === this.index) return;

    const dir = direction ?? (next > this.index ? 1 : -1);
    if (this.transitionMs > 0) {
      const from = this.ensureLayer("from");
      from.clear(0);
      from.drawRaster(this.frame.raster);
      this.ensureLayer("to");
      this.transition = {
        tween: new Tween(0, this.transitionMs, ease.inOutCubic).to(1, this.now),
        direction: dir
      };
    }

    this.screen.onExit?.(this);
    this.index = next;
    this.screen.onEnter?.(this);
    this.dirty = true;
  }

  private ensureLayer(which: "from" | "to"): GlyphRaster {
    const existing = which === "from" ? this.fromLayer : this.toLayer;
    if (existing) return existing;
    const layer = this.frame.raster.layer();
    if (which === "from") this.fromLayer = layer; else this.toLayer = layer;
    return layer;
  }

  next(): void { this.goto(this.index + 1, 1); }
  previous(): void { this.goto(this.index - 1, -1); }

  handleInput(event: GlyphInputEvent): void {
    if (this.screen.onInput?.(event, this) === true) { this.dirty = true; return; }
    if (event.type === "tap" || event.type === "scroll-down") this.next();
    else if (event.type === "scroll-up") this.previous();
    this.dirty = true;
  }

  /** Paint one frame now, regardless of the dirty flag. */
  paint(): Uint8Array {
    const startedAt = performance.now();
    const now = this.now;
    const context = (g: GlyphRaster): RenderContext => ({
      g, now, screen: { x: 0, y: 0, ...SCREEN }, safe: SAFE, app: this
    });

    if (this.transition && this.fromLayer && this.toLayer) {
      const t = clamp(this.transition.tween.valueAt(now), 0, 1);
      const { direction } = this.transition;
      this.toLayer.clear(0);
      this.screen.render(context(this.toLayer));
      const g = this.frame.raster;
      g.clear(0);
      g.drawRaster(this.fromLayer, -direction * SCREEN.width * t, 0);
      g.drawRaster(this.toLayer, direction * SCREEN.width * (1 - t), 0);
      if (t >= 1) this.transition = null;
    } else {
      this.frame.raster.clear(0);
      this.screen.render(context(this.frame.raster));
    }

    const levels = this.frame.toLevels();
    const frame = this.frame.toFrame(levels);

    this.lastDirtyTiles = this.diff.changed(frame.tiles).length;

    this.onPaint?.(levels, this);
    if (this.runtime?.isConnected) {
      void this.runtime.render(frame).catch(() => undefined);
    }

    const elapsed = performance.now() - startedAt;
    if (this.onSlowFrame && elapsed > this.interval) {
      this.onSlowFrame({ screen: this.screen.name, ms: elapsed, budgetMs: this.interval }, this);
    }
    return levels;
  }

  private tick = (): void => {
    if (!this.running) return;
    this.frameHandle = requestAnimationFrame(this.tick);
    const now = performance.now();
    if (now - this.lastPaint < this.interval) return;

    const animating = this.screen.animated === true || this.transition !== null;
    if (!this.dirty && !animating) return;

    const delta = now - this.lastPaint;
    this.lastPaint = now;
    this.fps = this.fps === 0 ? 1000 / delta : this.fps * 0.9 + (1000 / delta) * 0.1;
    this.dirty = false;
    this.paint();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.started = performance.now();
    this.lastPaint = performance.now() - this.interval;
    this.screen.onEnter?.(this);
    this.frameHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  /** Stop and release every canvas this app owns. */
  dispose(): void {
    this.stop();
    this.fromLayer?.dispose();
    this.toLayer?.dispose();
    this.fromLayer = null;
    this.toLayer = null;
    this.transition = null;
    this.frame.dispose();
  }
}

/**
 * Selection and scrolling for list screens. Keeps the cursor inside the window
 * so a screen only has to ask which rows to draw.
 */
export class Cursor {
  index = 0;
  offset = 0;

  constructor(public total: number, public visible: number) {}

  move(delta: number): void {
    this.index = clamp(this.index + delta, 0, Math.max(0, this.total - 1));
    if (this.index < this.offset) this.offset = this.index;
    if (this.index >= this.offset + this.visible) this.offset = this.index - this.visible + 1;
  }

  setTotal(total: number): void {
    this.total = total;
    this.index = clamp(this.index, 0, Math.max(0, total - 1));
    this.offset = clamp(this.offset, 0, Math.max(0, total - this.visible));
  }

  /** Indices currently on screen. */
  window(): number[] {
    const out: number[] = [];
    for (let i = this.offset; i < Math.min(this.total, this.offset + this.visible); i++) out.push(i);
    return out;
  }
}
