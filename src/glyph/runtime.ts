import {
  CreateStartUpPageContainer, ImageRawDataUpdate, ImageRawDataUpdateResult,
  StartUpPageCreateResult, waitForEvenAppBridge,
  type EvenAppBridge, type TextContainerProperty
} from "@evenrealities/even_hub_sdk";
import { TILE_288x144 } from "./frame.js";
import { unpackGray4 } from "./gray.js";
import type { Frame, TileLayout } from "./types.js";

export type GlyphInputEvent =
  | { type: "tap" }
  | { type: "double-tap" }
  | { type: "scroll-up" }
  | { type: "scroll-down" };

export interface RuntimeState {
  connected: boolean;
  message: string;
}

export interface GlyphRuntimeOptions {
  tileLayout?: TileLayout;
  debug?: boolean;
  /** How long to wait for the Even Hub bridge before giving up. */
  timeoutMs?: number;
  /** Send every tile every frame instead of only the changed ones. */
  disableDiffing?: boolean;
  createCanvas?: (w: number, h: number) => HTMLCanvasElement;
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

/**
 * Transport. Turns resolved frames into image-container updates.
 *
 * Two things matter here. First, only tiles whose contents actually changed are
 * sent — a clock screen touches one tile a second, not nine. Second, renders
 * are serialised, so a slow frame queues behind its predecessor instead of
 * interleaving tile writes and tearing.
 */
export class GlyphRuntime {
  readonly tileLayout: TileLayout;
  private bridge: EvenAppBridge | null = null;
  private started = false;
  private queue: Promise<void> = Promise.resolve();
  private lastHashes = new Map<number, number>();
  private listener: (() => void) | null = null;
  private onState?: (state: RuntimeState) => void;
  private readonly debug: boolean;
  private readonly timeoutMs: number;
  private readonly diffing: boolean;
  private readonly makeCanvas: (w: number, h: number) => HTMLCanvasElement;

  /** Tiles sent on the most recent render — useful for a stats readout. */
  lastTilesSent = 0;

  constructor(options: GlyphRuntimeOptions = {}) {
    this.tileLayout = options.tileLayout ?? TILE_288x144;
    if (this.tileLayout.tiles.length === 0) {
      throw new Error("Glyph: tileLayout must declare at least one tile.");
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

    const images = this.tileLayout.tiles.map((t) => ({
      xPosition: t.x,
      yPosition: t.y,
      width: this.tileLayout.width,
      height: this.tileLayout.height,
      containerID: t.id,
      containerName: t.name,
      zOrderIndex: t.zOrder
    }));

    const maxZ = images.reduce((max, image) => Math.max(max, image.zOrderIndex), 0);
    const eventLayer: TextContainerProperty = {
      xPosition: 0, yPosition: 0, width: 576, height: 288,
      borderWidth: 0, paddingLength: 0,
      containerID: 1, containerName: "events",
      content: "", isEventCapture: 1, zOrderIndex: maxZ + 1
    };

    const result = await this.bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: images.length + 1,
        textObject: [eventLayer],
        imageObject: images
      })
    );

    if (result !== StartUpPageCreateResult.success) {
      const message =
        `createStartUpPageContainer failed: ${StartUpPageCreateResult[result] ?? result}. ` +
        `Try a smaller tile layout — this firmware may cap container size.`;
      this.emit({ connected: false, message });
      throw new Error(message);
    }

    this.started = true;
    this.lastHashes.clear();
    this.emit({ connected: true, message: `Connected · ${images.length} tiles` });
  }

  /** Forget which tiles were sent, so the next render is a full repaint. */
  invalidate(): void { this.lastHashes.clear(); }

  async render(frame: Frame): Promise<void> {
    if (!this.bridge || !this.started) return;

    const dirty = this.diffing
      ? frame.tiles.filter((tile) => this.lastHashes.get(tile.id) !== tile.hash)
      : frame.tiles;
    this.lastTilesSent = dirty.length;
    if (dirty.length === 0) return;

    // Copy the packed data now: the frame's buffers are reused next paint.
    const payload = dirty.map((tile) => ({ tile, pixels: Uint8Array.from(tile.pixels) }));

    const next = this.queue.then(async () => {
      for (const { tile, pixels } of payload) {
        const png = await this.encodeTile(pixels, tile.rect.width, tile.rect.height);
        const result = await this.bridge!.updateImageRawData(
          new ImageRawDataUpdate({ containerID: tile.id, containerName: tile.name, imageData: png })
        );
        if (result === ImageRawDataUpdateResult.success) {
          this.lastHashes.set(tile.id, tile.hash);
        } else {
          this.lastHashes.delete(tile.id);
          if (this.debug) console.warn(`Glyph: tile ${tile.name} update failed (${ImageRawDataUpdateResult[result] ?? result})`);
        }
      }
    });

    // The stored queue never holds a rejection, so one bad frame cannot
    // permanently wedge every render that follows it.
    this.queue = next.catch(() => undefined);
    return next;
  }

  onInput(handler: (event: GlyphInputEvent) => void): () => void {
    if (!this.bridge) throw new Error("Glyph: call start() before onInput().");
    this.listener?.();
    const unsubscribe = this.bridge.onEvenHubEvent((event) => {
      const sys = event.sysEvent;
      const text = event.textEvent;
      if (sys) {
        if (sys.eventType === 3) handler({ type: "double-tap" });
        else if (sys.eventType === 1) handler({ type: "scroll-up" });
        else if (sys.eventType === 2) handler({ type: "scroll-down" });
        else handler({ type: "tap" });
      }
      if (text) {
        if (text.eventType === 1) handler({ type: "scroll-up" });
        else if (text.eventType === 2) handler({ type: "scroll-down" });
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
    this.queue = Promise.resolve();
    this.lastHashes.clear();
    this.emit({ connected: false, message: "Disconnected" });
  }

  /**
   * Tiles are carried as PNG because that is what the image containers accept
   * today. The Gray4 packing upstream is not wasted work — it is the diffing
   * key and the wire format the moment raw uploads are exposed.
   */
  private async encodeTile(packed: Uint8Array, width: number, height: number): Promise<Uint8Array> {
    const levels = unpackGray4(packed, width, height);
    const canvas = this.makeCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
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
}
