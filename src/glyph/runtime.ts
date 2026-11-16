import {
  CreateStartUpPageContainer, ImageContainerProperty, ImageRawDataUpdate,
  ImageRawDataUpdateResult, StartUpPageCreateResult, TextContainerProperty,
  waitForEvenAppBridge, type EvenAppBridge
} from "@evenrealities/even_hub_sdk";

import { MAX_IMAGE_CONTAINERS, TileDiff, TILE_QUADRANTS, validateLayout } from "./frame.js";
import type { CanvasFactory, Frame, Tile, TileLayout } from "./types.js";

export type GlyphInputEvent =
  | { type: "tap" }
  | { type: "double-tap" }
  | { type: "scroll-up" }
  | { type: "scroll-down" }
  /** The app came back to the foreground on the glasses. The runtime repaints. */
  | { type: "foreground-enter" }
  /** The app left the foreground. Nothing drawn now will be seen. */
  | { type: "foreground-exit" };

/**
 * Event type codes from the Even Hub bridge (`OsEventTypeList`). The SDK
 * reports them as bare numbers; naming them here is the difference between
 * reading this function and guessing at it.
 *
 * `click` is 0, and a protobuf default is omitted on the wire — so a click
 * routinely arrives with `eventType` *undefined*. Everything from 6 up
 * (abnormal exit, system exit, IMU reports) is not input at all.
 */
const EVENT = {
  click: 0, scrollUp: 1, scrollDown: 2, doubleTap: 3,
  foregroundEnter: 4, foregroundExit: 5
} as const;

/**
 * Translate one bridge event code. Returns null for codes that are not input —
 * an earlier version mapped *every* unrecognised system event to a tap, so
 * re-entering the app, an IMU sample or an exit notice all advanced the screen.
 */
export function inputFromEventType(code: number | undefined | null): GlyphInputEvent | null {
  switch (code) {
    case undefined:
    case null:
    case EVENT.click: return { type: "tap" };
    case EVENT.scrollUp: return { type: "scroll-up" };
    case EVENT.scrollDown: return { type: "scroll-down" };
    case EVENT.doubleTap: return { type: "double-tap" };
    case EVENT.foregroundEnter: return { type: "foreground-enter" };
    case EVENT.foregroundExit: return { type: "foreground-exit" };
    default: return null;
  }
}

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
  /** Packed Gray4 bytes of the tiles sent — the cost model the tile tools use. */
  bytes: number;
  /** PNG bytes actually handed to the bridge for those tiles. */
  encodedBytes: number;
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
  /**
   * A bridge you already hold. Apps that call `waitForEvenAppBridge()`
   * themselves (for storage, audio, device info) pass it here instead of
   * waiting twice; tests pass a fake.
   */
  bridge?: EvenAppBridge;
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

/** Encoder scratch for one tile size. */
interface Encoder { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; image: ImageData; }

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
 *
 * "Changed" is judged against what the glasses will be showing once the write
 * in flight lands, not against what they showed before it started. Comparing
 * against the last *acknowledged* tile alone has a hole: paint A changes a
 * tile, paint B changes it back while A is still on the wire, B looks clean
 * against the acknowledged state and is skipped — and the glasses keep showing
 * A until something else happens to repaint that tile. On a static screen,
 * that is forever.
 */
export class GlyphRuntime {
  readonly tileLayout: TileLayout;
  private bridge: EvenAppBridge | null = null;
  private readonly suppliedBridge: EvenAppBridge | null;
  private started = false;
  private starting: Promise<void> | null = null;
  private diff = new TileDiff();
  private listener: (() => void) | null = null;
  private onState?: (state: RuntimeState) => void;
  private readonly debug: boolean;
  private readonly timeoutMs: number;
  private readonly diffing: boolean;
  private readonly makeCanvas: CanvasFactory;

  private pending: PendingTile[] | null = null;
  private draining: Promise<void> | null = null;
  /** Tiles of the batch on the wire that have not been acknowledged yet. */
  private inFlight = new Set<number>();
  /** Bumped by stop(), so a drain from a previous session cannot keep writing. */
  private session = 0;
  private encoders = new Map<string, Encoder>();

  private durations: number[] = [];
  private sampleStart = 0;
  private counters = { sent: 0, dropped: 0, bytes: 0, encodedBytes: 0 };

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
    this.suppliedBridge = options.bridge ?? null;
    this.makeCanvas = options.createCanvas ?? ((w, h) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return c;
    });
  }

  get isConnected(): boolean { return this.started; }

  setOnStateChange(cb: (state: RuntimeState) => void): void { this.onState = cb; }
  private emit(state: RuntimeState): void { this.onState?.(state); }

  /** Connect and create the page. Safe to call twice: the second call joins the first. */
  start(): Promise<void> {
    if (this.started) return Promise.resolve();
    if (!this.starting) {
      const attempt = this.connect().finally(() => {
        if (this.starting === attempt) this.starting = null;
      });
      this.starting = attempt;
    }
    return this.starting;
  }

  private async connect(): Promise<void> {
    const session = this.session;
    this.emit({ connected: false, message: "Waiting for Even Hub bridge…" });

    let bridge: EvenAppBridge;
    try {
      bridge = this.suppliedBridge
        ?? await withTimeout(waitForEvenAppBridge(), this.timeoutMs, "Bridge timeout");
    } catch (error) {
      const message = `No G2 bridge available (${error instanceof Error ? error.message : error})`;
      this.emit({ connected: false, message });
      throw new Error(message);
    }
    if (session !== this.session) throw new Error("Glyph: runtime stopped while connecting.");

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

    const result = await bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: images.length + 1,
        textObject: [eventLayer],
        imageObject: images
      })
    );
    if (session !== this.session) throw new Error("Glyph: runtime stopped while connecting.");

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

    this.bridge = bridge;
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

    // A tile needs sending if it differs from what the glasses show — or if a
    // write for it is on the wire right now, because that write is about to
    // change what they show and its outcome is not known yet.
    const dirty = this.diffing
      ? frame.tiles.filter((tile) => this.inFlight.has(tile.id) || this.diff.differs(tile))
      : frame.tiles;

    if (this.pending) {
      this.counters.dropped += this.pending.length;
      this.pending = null;
    }
    if (dirty.length === 0) {
      if (!this.draining) this.lastTilesSent = 0;
      return;
    }

    // Copy now: the frame's buffers are reused on the next paint.
    this.pending = dirty.map((tile) => {
      const pixels = Uint8Array.from(tile.pixels);
      return { tile: { ...tile, pixels }, pixels };
    });

    if (!this.draining) {
      const task = this.drain(this.session);
      this.draining = task;
      void task.catch(() => undefined).finally(() => {
        if (this.draining === task) this.draining = null;
      });
    }
    await this.draining;
  }

  private async drain(session: number): Promise<void> {
    const live = (): boolean => session === this.session && this.started && this.bridge !== null;

    while (this.pending && live()) {
      const batch = this.pending;
      this.pending = null;
      this.inFlight = new Set(batch.map((entry) => entry.tile.id));
      let sentNow = 0;

      for (const { tile, pixels } of batch) {
        if (!live()) return;                         // stop() while draining
        // Already on the glasses: the write this tile was guarding against
        // landed, and landed with exactly this content.
        if (this.diffing && !this.diff.differs(tile)) { this.inFlight.delete(tile.id); continue; }

        const started = now();
        try {
          const png = await this.encodeTile(pixels, tile.rect.width, tile.rect.height);
          if (!live()) return;
          const result = await this.bridge!.updateImageRawData(
            new ImageRawDataUpdate({ containerID: tile.id, containerName: tile.name, imageData: png })
          );
          if (!live()) return;
          if (result === ImageRawDataUpdateResult.success) {
            this.diff.accept(tile);
            sentNow++;
            this.counters.sent++;
            this.counters.bytes += pixels.length;
            this.counters.encodedBytes += png.length;
          } else {
            this.diff.reject(tile);
            if (this.debug) {
              console.warn(`Glyph: tile ${tile.name} update failed (${ImageRawDataUpdateResult[result] ?? result})`);
            }
          }
        } catch (error) {
          if (!live()) return;
          this.diff.reject(tile);
          if (this.debug) console.warn(`Glyph: tile ${tile.name} threw`, error);
        } finally {
          if (session === this.session) {
            this.inFlight.delete(tile.id);
            this.record(now() - started);
          }
        }
      }
      this.lastTilesSent = sentNow;
    }
  }

  // ── stats ────────────────────────────────────────────────────────────────

  private record(ms: number): void {
    this.durations.push(ms);
    if (this.durations.length > 256) this.durations.shift();
  }

  resetStats(): void {
    this.durations = [];
    this.counters = { sent: 0, dropped: 0, bytes: 0, encodedBytes: 0 };
    this.sampleStart = now();
  }

  get stats(): TransportStats {
    const sorted = [...this.durations].sort((a, b) => a - b);
    const elapsed = Math.max(1, now() - this.sampleStart) / 1000;
    return {
      sent: this.counters.sent,
      dropped: this.counters.dropped,
      bytes: this.counters.bytes,
      encodedBytes: this.counters.encodedBytes,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      last: this.durations[this.durations.length - 1] ?? 0,
      rate: this.counters.sent / elapsed
    };
  }

  // ── input ────────────────────────────────────────────────────────────────

  /**
   * Subscribe to input. Taps, double taps and scrolls arrive as they happen;
   * `foreground-enter` also forgets what was sent, because a page that was
   * away may not be showing what it showed when it left.
   */
  onInput(handler: (event: GlyphInputEvent) => void): () => void {
    if (!this.bridge) throw new Error("Glyph: call start() before onInput().");
    this.listener?.();
    const unsubscribe = this.bridge.onEvenHubEvent((event) => {
      // One physical gesture is reported through exactly one of these, and
      // which one depends on the host (glasses, ring, simulator).
      const source = event.sysEvent ?? event.textEvent ?? event.listEvent;
      if (!source) return;
      const input = inputFromEventType(source.eventType);
      if (!input) return;
      if (input.type === "foreground-enter") this.invalidate();
      handler(input);
    });
    this.listener = unsubscribe;
    return unsubscribe;
  }

  async stop(): Promise<void> {
    this.session++;
    this.listener?.();
    this.listener = null;
    this.bridge = null;
    this.started = false;
    this.starting = null;
    this.pending = null;
    this.draining = null;
    this.inFlight.clear();
    this.diff.reset();
    for (const { canvas } of this.encoders.values()) { canvas.width = 0; canvas.height = 0; }
    this.encoders.clear();
    this.emit({ connected: false, message: "Disconnected" });
  }

  /**
   * Tiles are carried as PNG because that is what the image containers accept
   * today. The Gray4 packing upstream is not wasted work — it is the diffing
   * key and the wire format the moment raw uploads are exposed.
   *
   * The encoding canvas and its ImageData are cached per tile size. Allocating
   * them per tile per frame is four canvases twenty times a second, which the
   * garbage collector notices even if you do not.
   */
  private async encodeTile(packed: Uint8Array, width: number, height: number): Promise<Uint8Array> {
    const { canvas, ctx, image } = this.encoderFor(width, height);
    const data = image.data;
    const count = width * height;
    for (let i = 0, j = 0; i < count; i++, j += 4) {
      const byte = packed[i >> 1];
      const v = ((i & 1) === 0 ? byte >> 4 : byte & 0x0f) * 17;
      data[j] = v; data[j + 1] = v; data[j + 2] = v; data[j + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Glyph: PNG encoding failed.");
    return new Uint8Array(await blob.arrayBuffer());
  }

  private encoderFor(width: number, height: number): Encoder {
    const key = `${width}x${height}`;
    const cached = this.encoders.get(key);
    if (cached) return cached;
    const canvas = this.makeCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Glyph: Canvas 2D unavailable for tile encoding.");
    const encoder: Encoder = { canvas, ctx, image: ctx.createImageData(width, height) };
    this.encoders.set(key, encoder);
    return encoder;
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
