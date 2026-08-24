import {
  CreateStartUpPageContainer, ImageRawDataUpdate,
  ImageRawDataUpdateResult, StartUpPageCreateResult, TextContainerProperty,
  waitForEvenAppBridge, type EvenAppBridge
} from "@evenrealities/even_hub_sdk";
import { TILE_LAYOUT_288 } from "./frame";
import type { Frame, TileLayout } from "./types";

export interface GlyphRuntimeOptions {
  tileLayout?: TileLayout; debug?: boolean; timeoutMs?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(msg)), ms);
    p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); });
  });
}

/**
 * Convert packed Gray4 tile data into a PNG Uint8Array.
 * The Even Hub SDK expects standard image formats (PNG/BMP), not raw nibbles.
 */
async function tileToPng(packed: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  // Unpack Gray4 (2 pixels/byte, high nibble first) → 8-bit grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const byteIdx = i >> 1;
    const nibble = (i & 1) === 0 ? (packed[byteIdx] >> 4) & 0x0f : packed[byteIdx] & 0x0f;
    gray[i] = nibble * 17;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const imgData = ctx.createImageData(width, height);
  const d = imgData.data;
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    const j = i * 4;
    d[j] = v; d[j + 1] = v; d[j + 2] = v; d[j + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("Glyph: PNG encoding failed for tile");
  return new Uint8Array(await blob.arrayBuffer());
}

export class GlyphRuntime {
  private bridge: EvenAppBridge | null = null;
  private started = false;
  private queue = Promise.resolve();
  readonly tileLayout: TileLayout;
  private debug: boolean;
  private timeoutMs: number;
  private onStateChange?: (s: { connected: boolean; message: string }) => void;

  constructor(options: GlyphRuntimeOptions = {}) {
    this.tileLayout = options.tileLayout ?? TILE_LAYOUT_288;
    if (this.tileLayout.tiles.length === 0) {
      throw new Error("Glyph: tileLayout must declare at least one tile.");
    }
    this.debug = options.debug ?? false;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  setOnStateChange(cb: (s: { connected: boolean; message: string }) => void) { this.onStateChange = cb; }
  private emit(s: { connected: boolean; message: string }) { this.onStateChange?.(s); }

  async start(): Promise<void> {
    if (this.started) return;
    this.emit({ connected: false, message: "Connecting…" });
    try {
      this.bridge = await withTimeout(waitForEvenAppBridge(), this.timeoutMs, "Bridge timeout");
    } catch (e) {
      const msg = `No G2 bridge. (${e})`;
      this.emit({ connected: false, message: msg });
      throw new Error(msg);
    }
    const images = this.tileLayout.tiles.map((t) => ({
      xPosition: t.x, yPosition: t.y, width: this.tileLayout.width, height: this.tileLayout.height,
      containerID: t.id, containerName: t.name, zOrderIndex: t.zOrder
    }));
    const maxZ = images.reduce((m, i) => Math.max(m, i.zOrderIndex), 0);
    const eventCapture: TextContainerProperty = {
      xPosition: 0, yPosition: 0, width: 576, height: 288,
      borderWidth: 0, paddingLength: 0, containerID: 1, containerName: "events",
      content: "", isEventCapture: 1, zOrderIndex: maxZ + 1
    };
    const result = await this.bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({ containerTotalNum: images.length + 1, textObject: [eventCapture], imageObject: images })
    );
    if (result !== StartUpPageCreateResult.success) {
      const err = `createStartUpPageContainer failed: ${StartUpPageCreateResult[result] ?? result}. Try a smaller tile layout.`;
      this.emit({ connected: false, message: err });
      throw new Error(err);
    }
    this.started = true;
    this.emit({ connected: true, message: `Connected — ${images.length} tiles` });
  }

  async stop(): Promise<void> {
    this.started = false;
    this.bridge = null;
    this.queue = Promise.resolve();
    this.emit({ connected: false, message: "Stopped" });
  }

  async render(frame: Frame): Promise<void> {
    if (!this.bridge || !this.started) return;
    // Note: the queue is reset to a resolved promise after each render so a
    // single failed tile update cannot permanently poison every later render.
    const next = this.queue.then(async () => {
      for (const tile of frame.tiles) {
        const png = await tileToPng(tile.pixels, tile.rect.width, tile.rect.height);
        const res = await this.bridge!.updateImageRawData(
          new ImageRawDataUpdate({ containerID: tile.id, containerName: tile.name, imageData: png })
        );
        if (res !== ImageRawDataUpdateResult.success && this.debug) {
          console.warn(`tile ${tile.name} update failed: ${ImageRawDataUpdateResult[res] ?? res}`);
        }
      }
    });
    this.queue = next.catch(() => {});
    return next;
  }

  onInput(cb: (e: GlyphInputEvent) => void): () => void {
    if (!this.bridge) throw new Error("start() first");
    return this.bridge.onEvenHubEvent((ev) => {
      const s = ev.sysEvent, t = ev.textEvent;
      if (s) {
        if (s.eventType === 3) cb({ type: "double-tap" });
        else if (s.eventType === 1) cb({ type: "scroll-up" });
        else if (s.eventType === 2) cb({ type: "scroll-down" });
        else if (s.eventType === undefined) cb({ type: "tap" });
      }
      if (t) {
        if (t.eventType === 1) cb({ type: "scroll-up" });
        else if (t.eventType === 2) cb({ type: "scroll-down" });
      }
    });
  }
}

export type GlyphInputEvent =
  | { type: "tap" } | { type: "double-tap" } | { type: "scroll-up" } | { type: "scroll-down" };