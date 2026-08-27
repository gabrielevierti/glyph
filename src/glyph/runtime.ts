import {
  CreateStartUpPageContainer, ImageContainerProperty, ImageRawDataUpdate,
  ImageRawDataUpdateResult, StartUpPageCreateResult, TextContainerProperty,
  waitForEvenAppBridge, type EvenAppBridge
} from "@evenrealities/even_hub_sdk";

import { MAX_IMAGE_CONTAINERS, TileDiff, TILE_QUADRANTS, validateLayout } from "./frame.js";
import { unpackGray4 } from "./gray.js";
import type { CanvasFactory, Frame, Tile, TileLayout } from "./types.js";

export type GlyphInputEvent =
  | { type: "tap" }
  | { type: "double-tap" }
  | { type: "scroll-up" }
  | { type: "scroll-down" };

/**
 * Event type codes from the Even Hub bridge. The SDK reports them as bare
 * numbers; naming them here is the difference between reading this function
 * and guessing at it.
 */
const EVENT = { scrollUp: 1, scrollDown: 2, doubleTap: 3 } as const;

export interface RuntimeState {
  connected: boolean;
  message: string;
}

/**
 * What the transport actually cost.
 *
 * Bytes per second is a proxy. What caps your frame rate is the round trip for
 * one image-container update over BLE, and that number is not in any datasheet
 * — so measure it. `npm run bench` puts these on the glasses.
 */
export interface TransportStats {
  /** Tiles handed to the bridge since the last reset. */
  sent: number;
  /** Tiles that were superseded by a newer frame before they went out. */
  dropped: number;
  bytes: number;
  /** Per-tile round trip, milliseconds. */
  p50: number;
  p95: number;
  last: number;
  /** Tile updates per second, averaged over the sample window. */
  rate: number;
}

export interface GlyphRuntimeOptions {
  tileLayout?: TileLayout;
  debug?: boolean;
  /** How long to wait for the Even Hub bridge before giving up. */
  timeoutMs?: number;
  /** Send every tile every frame instead of only the changed ones. */
  disableDiffing?: boolean;
  createCanvas?: CanvasFactory;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index];
}

/** A tile with its pixel data detached from the frame's reusable buffers. */
interface PendingTile { tile: Tile; pixels: Uint8Array; }

/**
 * Transport. Turns resolved frames into image-container updates.
 *
 * Three things matter here.
 *
 * First, only tiles whose contents actually changed are sent — a clock screen
 * touches one tile a second, not four.
 *
 * Second, **the newest frame wins**. An earlier version of this queued every
 * render behind its predecessor, which is correct right up until the transport
 * is slower than the paint loop: then the queue grows without bound and the
 * glasses fall further behind forever, displaying frames from ten seconds ago.
 * A display has no use for a stale frame. At most one frame is ever waiting,
 * and a superseded one is counted rather than sent.
 *
 * Third, tile writes are serialised, so a slow frame cannot interleave with the
 * next one and tear.
 */
export class GlyphRuntime {
  readonly tileLayout: TileLayout;
  private bridge: EvenAppBridge | null = null;
  private started = false;
  private diff = new TileDiff();
  private listener: (() => void) | null = null;
  private onState?: (state: RuntimeState) => void;
  private readonly debug: boolean;
  private readonly timeoutMs: number;
  private readonly diffing: boolean;
  private readonly makeCanvas: CanvasFactory;

  private pending: PendingTile[] | null = null;
  private draining: Promise<void> | null = null;
  private encoders = new Map<string, HTMLCanvasElement>();

  private durations: number[] = [];
  private sampleStart = 0;
  private counters = { sent: 0, dropped: 0, bytes: 0 };

  /** Tiles sent on the most recent flush — useful for a stats readout. */
  lastTilesSent = 0;

  constructor(options: GlyphRuntimeOptions = {}) {
    this.tileLayout = options.tileLayout ?? TILE_QUADRANTS;
    const problems = validateLayout(this.tileLayout);
    if (problems.length > 0) {
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":\n  ${problems.join("\n  ")}`);
    }
    this.debug = options.debug ?? false;
    this.timeoutMs = options.timeoutMs ?? 12000;
    this.diffing = !options.disableDiffing;
    this.makeCanvas = options.createCanvas ?? ((w, h) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return c;
    });
  }

  get isConnected(): boolean { return this.started; }

  setOnStateChange(cb: (state: RuntimeState) => void): void { this.onState = cb; }
  private emit(state: RuntimeState): void { this.onState?.(state); }

  async start(): Promise<void> {
    if (this.started) return;
    this.emit({ connected: false, message: "Waiting for Even Hub bridge…" });

    try {
      this.bridge = await withTimeout(waitForEvenAppBridge(), this.timeoutMs, "Bridge timeout");
    } catch (error) {
      const message = `No G2 bridge available (${error instanceof Error ? error.message : error})`;
      this.emit({ connected: false, message });
      throw new Error(message);
    }

    const images = this.tileLayout.tiles.map((t) => new ImageContainerProperty({
      xPosition: t.x,
      yPosition: t.y,
      width: t.width,
      height: t.height,
      containerID: t.id,
      containerName: t.name,
      zOrderIndex: t.zOrder
    }));

    const maxZ = images.reduce((max, image) => Math.max(max, image.zOrderIndex ?? 0), 0);
    const eventLayer = new TextContainerProperty({
      xPosition: 0, yPosition: 0, width: 576, height: 288,
      borderWidth: 0, paddingLength: 0,
      containerID: 1, containerName: "events",
      content: "", isEventCapture: 1, zOrderIndex: maxZ + 1
    });

    const result = await this.bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: images.length + 1,
        textObject: [eventLayer],
        imageObject: images
      })
    );

    if (result !== StartUpPageCreateResult.success) {
      // The event-capture text container counts toward the page total, so the
      // usable image budget is MAX_IMAGE_CONTAINERS. The simulator does not
      // enforce this; the glasses do.
      const message =
        `createStartUpPageContainer failed: ${StartUpPageCreateResult[result] ?? result}. ` +
        `Sent ${images.length} image containers (hardware limit is ${MAX_IMAGE_CONTAINERS}) plus one event layer.`;
      this.emit({ connected: false, message });
      throw new Error(message);
    }

    this.started = true;
    this.diff.reset();
    this.resetStats();
    this.emit({ connected: true, message: `Connected · ${images.length} tiles` });
  }

  /** Forget which tiles were sent, so the next render is a full repaint. */
  invalidate(): void { this.diff.reset(); }

  /**
   * Queue a frame. Resolves once the transport has drained past it — but the
   * frame itself may have been superseded and never sent, which is the point.
   */
  async render(frame: Frame): Promise<void> {
    if (!this.bridge || !this.started) return;

    const dirty = this.diffing ? this.diff.peek(frame.tiles) : frame.tiles;
    if (dirty.length === 0) { this.lastTilesSent = 0; return; }

    // Copy now: the frame's buffers are reused on the next paint.
    const batch: PendingTile[] = dirty.map((tile) => ({ tile, pixels: Uint8Array.from(tile.pixels) }));

    if (this.pending) this.counters.dropped += this.pending.length;
    this.pending = batch;

    if (!this.draining) {
      const task = this.drain();
      this.draining = task;
      void task.catch(() => undefined).finally(() => {
        if (this.draining === task) this.draining = null;
      });
    }
    await this.draining;
  }

  private async drain(): Promise<void> {
    while (this.pending) {
      const batch = this.pending;
      this.pending = null;
      this.lastTilesSent = batch.length;

      for (const { tile, pixels } of batch) {
        if (!this.bridge || !this.started) return;   // stop() while draining
        const started = now();
        try {
          const png = await this.encodeTile(pixels, tile.rect.width, tile.rect.height);
          const result = await this.bridge!.updateImageRawData(
            new ImageRawDataUpdate({ containerID: tile.id, containerName: tile.name, imageData: png })
          );
          if (result === ImageRawDataUpdateResult.success) {
            this.diff.accept(tile);
            this.counters.sent++;
            this.counters.bytes += pixels.length;
          } else {
            this.diff.reject(tile);
            if (this.debug) {
              console.warn(`Glyph: tile ${tile.name} update failed (${ImageRawDataUpdateResult[result] ?? result})`);
            }
          }
        } catch (error) {
          this.diff.reject(tile);
          if (this.debug) console.warn(`Glyph: tile ${tile.name} threw`, error);
        } finally {
          this.record(now() - started);
        }
      }
    }
  }

  // ── stats ────────────────────────────────────────────────────────────────

  private record(ms: number): void {
    this.durations.push(ms);
    if (this.durations.length > 256) this.durations.shift();
  }

  resetStats(): void {
    this.durations = [];
    this.counters = { sent: 0, dropped: 0, bytes: 0 };
    this.sampleStart = now();
  }

  get stats(): TransportStats {
    const sorted = [...this.durations].sort((a, b) => a - b);
    const elapsed = Math.max(1, now() - this.sampleStart) / 1000;
    return {
      sent: this.counters.sent,
      dropped: this.counters.dropped,
      bytes: this.counters.bytes,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      last: this.durations[this.durations.length - 1] ?? 0,
      rate: this.counters.sent / elapsed
    };
  }

  // ── input ────────────────────────────────────────────────────────────────

  onInput(handler: (event: GlyphInputEvent) => void): () => void {
    if (!this.bridge) throw new Error("Glyph: call start() before onInput().");
    this.listener?.();
    const unsubscribe = this.bridge.onEvenHubEvent((event) => {
      const sys = event.sysEvent;
      const text = event.textEvent;
      if (sys) {
        if (sys.eventType === EVENT.doubleTap) handler({ type: "double-tap" });
        else if (sys.eventType === EVENT.scrollUp) handler({ type: "scroll-up" });
        else if (sys.eventType === EVENT.scrollDown) handler({ type: "scroll-down" });
        else handler({ type: "tap" });
      }
      if (text) {
        if (text.eventType === EVENT.scrollUp) handler({ type: "scroll-up" });
        else if (text.eventType === EVENT.scrollDown) handler({ type: "scroll-down" });
      }
    });
    this.listener = unsubscribe;
    return unsubscribe;
  }

  async stop(): Promise<void> {
    this.listener?.();
    this.listener = null;
    this.bridge = null;
    this.started = false;
    this.pending = null;
    this.draining = null;
    this.diff.reset();
    for (const canvas of this.encoders.values()) { canvas.width = 0; canvas.height = 0; }
    this.encoders.clear();
    this.emit({ connected: false, message: "Disconnected" });
  }

  /**
   * Tiles are carried as PNG because that is what the image containers accept
   * today. The Gray4 packing upstream is not wasted work — it is the diffing
   * key and the wire format the moment raw uploads are exposed.
   *
   * The encoding canvas is cached per tile size. Allocating one per tile per
   * frame is four canvases twenty times a second, which the garbage collector
   * notices even if you do not.
   */
  private async encodeTile(packed: Uint8Array, width: number, height: number): Promise<Uint8Array> {
    const levels = unpackGray4(packed, width, height);
    const canvas = this.encoderFor(width, height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Glyph: Canvas 2D unavailable for tile encoding.");
    const image = ctx.createImageData(width, height);
    for (let i = 0; i < levels.length; i++) {
      const v = levels[i] * 17;
      const j = i * 4;
      image.data[j] = v; image.data[j + 1] = v; image.data[j + 2] = v; image.data[j + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Glyph: PNG encoding failed.");
    return new Uint8Array(await blob.arrayBuffer());
  }

  private encoderFor(width: number, height: number): HTMLCanvasElement {
    const key = `${width}x${height}`;
    const cached = this.encoders.get(key);
    if (cached) return cached;
    const canvas = this.makeCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
    this.encoders.set(key, canvas);
    return canvas;
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
