import { GlyphRaster } from "./raster.js";
import { hashBytes, packGray4 } from "./gray.js";
import type { Frame, RasterOptions, Tile, TileLayout } from "./types.js";

/**
 * The G2's per-container size ceiling varies by firmware, so the same 576x288
 * surface is offered in several tilings. Fewer, larger tiles mean fewer
 * transfers; smaller tiles are more widely accepted and give finer-grained
 * dirty-region updates.
 */
export const TILE_288x144: TileLayout = {
  width: 288, height: 144,
  tiles: [
    { id: 10, name: "t0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "t1", x: 288, y: 0, zOrder: 2 },
    { id: 12, name: "t2", x: 0, y: 144, zOrder: 3 },
    { id: 13, name: "t3", x: 288, y: 144, zOrder: 4 }
  ]
};

export const TILE_192x144: TileLayout = {
  width: 192, height: 144,
  tiles: [
    { id: 10, name: "t0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "t1", x: 192, y: 0, zOrder: 2 },
    { id: 12, name: "t2", x: 384, y: 0, zOrder: 3 },
    { id: 13, name: "t3", x: 0, y: 144, zOrder: 4 },
    { id: 14, name: "t4", x: 192, y: 144, zOrder: 5 },
    { id: 15, name: "t5", x: 384, y: 144, zOrder: 6 }
  ]
};

export const TILE_192x96: TileLayout = {
  width: 192, height: 96,
  tiles: [
    { id: 10, name: "t0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "t1", x: 192, y: 0, zOrder: 2 },
    { id: 12, name: "t2", x: 384, y: 0, zOrder: 3 },
    { id: 13, name: "t3", x: 0, y: 96, zOrder: 4 },
    { id: 14, name: "t4", x: 192, y: 96, zOrder: 5 },
    { id: 15, name: "t5", x: 384, y: 96, zOrder: 6 },
    { id: 16, name: "t6", x: 0, y: 192, zOrder: 7 },
    { id: 17, name: "t7", x: 192, y: 192, zOrder: 8 },
    { id: 18, name: "t8", x: 384, y: 192, zOrder: 9 }
  ]
};

export const TILE_144x144: TileLayout = {
  width: 144, height: 144,
  tiles: [
    { id: 10, name: "t0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "t1", x: 144, y: 0, zOrder: 2 },
    { id: 12, name: "t2", x: 288, y: 0, zOrder: 3 },
    { id: 13, name: "t3", x: 432, y: 0, zOrder: 4 },
    { id: 14, name: "t4", x: 0, y: 144, zOrder: 5 },
    { id: 15, name: "t5", x: 144, y: 144, zOrder: 6 },
    { id: 16, name: "t6", x: 288, y: 144, zOrder: 7 },
    { id: 17, name: "t7", x: 432, y: 144, zOrder: 8 }
  ]
};

export const TILE_LAYOUTS = {
  "288x144": TILE_288x144,
  "192x144": TILE_192x144,
  "192x96": TILE_192x96,
  "144x144": TILE_144x144
} as const;

export type TileLayoutName = keyof typeof TILE_LAYOUTS;

/**
 * A framebuffer plus its tiling.
 *
 * `toFrame()` reuses its buffers between calls, so a steady-state app allocates
 * nothing per frame. Tile hashes are kept so the runtime can skip tiles that
 * did not change — which on a typical screen is most of them.
 */
export class GlyphFrame {
  readonly raster: GlyphRaster;
  readonly tileLayout: TileLayout;
  private levels: Uint8Array;
  private tileBuffers: Uint8Array[];
  private packedBuffers: Uint8Array[];

  constructor(options: RasterOptions & { tileLayout?: TileLayout } = {}) {
    this.raster = new GlyphRaster(options);
    this.tileLayout = options.tileLayout ?? TILE_288x144;

    const { width: tw, height: th, tiles } = this.tileLayout;
    if (tw % 2 !== 0) throw new Error("Glyph: tile width must be even (Gray4 packs two pixels per byte).");
    for (const t of tiles) {
      if (t.x + tw > this.raster.width || t.y + th > this.raster.height) {
        throw new Error(`Glyph: tile "${t.name}" at (${t.x},${t.y}) falls outside the ${this.raster.width}x${this.raster.height} surface.`);
      }
    }

    this.levels = new Uint8Array(this.raster.width * this.raster.height);
    this.tileBuffers = tiles.map(() => new Uint8Array(tw * th));
    this.packedBuffers = tiles.map(() => new Uint8Array((tw * th) >> 1));
  }

  get width(): number { return this.raster.width; }
  get height(): number { return this.raster.height; }

  /** Paint into the framebuffer. */
  draw(fn: (g: GlyphRaster) => void): this {
    fn(this.raster);
    return this;
  }

  /** Resolve to levels only — for the browser preview, which needs no tiling. */
  toLevels(): Uint8Array {
    return this.raster.toLevels(this.levels);
  }

  /** Resolve, slice and pack. Pass levels from `toLevels()` to avoid resolving twice. */
  toFrame(levels: Uint8Array = this.toLevels()): Frame {
    const W = this.raster.width;
    const { width: tw, height: th, tiles: slots } = this.tileLayout;
    const tiles: Tile[] = [];
    slots.forEach((slot, index) => {
      const buf = this.tileBuffers[index];
      for (let y = 0; y < th; y++) {
        const src = (slot.y + y) * W + slot.x;
        buf.set(levels.subarray(src, src + tw), y * tw);
      }
      const packed = packGray4(buf, tw, th);
      this.packedBuffers[index] = packed;
      tiles.push({
        id: slot.id, name: slot.name,
        rect: { x: slot.x, y: slot.y, width: tw, height: th },
        pixels: packed,
        hash: hashBytes(packed)
      });
    });
    return { width: W, height: this.raster.height, pixels: levels, tiles };
  }
}
