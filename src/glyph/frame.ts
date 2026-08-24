import { GlyphRaster, packGray4 } from "./raster";
import type { Frame, RenderOptions, Tile, TileLayout } from "./types";

/**
 * Even Realities G2 display: 576 x 288 pixels, 16 grayscale levels.
 * The official SDK reference uses four 288x144 image containers.
 * Some firmware builds cap single containers at 200x100.
 */

export const TILE_LAYOUT_288: TileLayout = {
  width: 288, height: 144,
  tiles: [
    { id: 10, name: "g0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "g1", x: 288, y: 0, zOrder: 2 },
    { id: 12, name: "g2", x: 0, y: 144, zOrder: 3 },
    { id: 13, name: "g3", x: 288, y: 144, zOrder: 4 }
  ]
};

export const TILE_LAYOUT_144: TileLayout = {
  width: 144, height: 144,
  tiles: [
    { id: 10, name: "g0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "g1", x: 144, y: 0, zOrder: 2 },
    { id: 12, name: "g2", x: 288, y: 0, zOrder: 3 },
    { id: 13, name: "g3", x: 432, y: 0, zOrder: 4 },
    { id: 14, name: "g4", x: 0, y: 144, zOrder: 5 },
    { id: 15, name: "g5", x: 144, y: 144, zOrder: 6 },
    { id: 16, name: "g6", x: 288, y: 144, zOrder: 7 },
    { id: 17, name: "g7", x: 432, y: 144, zOrder: 8 }
  ]
};

export const TILE_LAYOUT_192_96: TileLayout = {
  width: 192, height: 96,
  tiles: [
    { id: 10, name: "g0", x: 0, y: 0, zOrder: 1 },
    { id: 11, name: "g1", x: 192, y: 0, zOrder: 2 },
    { id: 12, name: "g2", x: 384, y: 0, zOrder: 3 },
    { id: 13, name: "g3", x: 0, y: 96, zOrder: 4 },
    { id: 14, name: "g4", x: 192, y: 96, zOrder: 5 },
    { id: 15, name: "g5", x: 384, y: 96, zOrder: 6 },
    { id: 16, name: "g6", x: 0, y: 192, zOrder: 7 },
    { id: 17, name: "g7", x: 192, y: 192, zOrder: 8 },
    { id: 18, name: "g8", x: 384, y: 192, zOrder: 9 }
  ]
};

export class GlyphFrame {
  readonly raster: GlyphRaster;
  readonly tileLayout: TileLayout;

  constructor(options: RenderOptions & { tileLayout?: TileLayout } = {}) {
    this.raster = new GlyphRaster({
      width: options.width ?? 576,
      height: options.height ?? 288,
      supersample: options.supersample ?? 2,
      background: options.background ?? 0
    });
    this.tileLayout = options.tileLayout ?? TILE_LAYOUT_288;
  }

  draw(fn: (raster: GlyphRaster) => void): this {
    fn(this.raster);
    return this;
  }

  /**
   * Rasterize and slice into tiles.
   * Pass an already-computed Gray4 buffer (from `raster.toGray4()`) to avoid
   * paying for the supersample resolve twice in the same paint.
   */
  toFrame(pixels: Uint8Array = this.raster.toGray4()): Frame {
    const W = this.raster.width;
    const H = this.raster.height;
    const tiles: Tile[] = [];
    const { width: tw, height: th, tiles: layout } = this.tileLayout;
    for (const t of layout) {
      if (t.x + tw > W || t.y + th > H) {
        throw new Error(`Glyph: tile "${t.name}" (${t.x},${t.y} ${tw}x${th}) falls outside the ${W}x${H} framebuffer.`);
      }
      const tile = new Uint8Array(tw * th);
      for (let y = 0; y < th; y++) {
        const src = (t.y + y) * W + t.x;
        tile.set(pixels.subarray(src, src + tw), y * tw);
      }
      tiles.push({ id: t.id, name: t.name, rect: { x: t.x, y: t.y, width: tw, height: th }, pixels: packGray4(tile, tw, th) });
    }
    return { width: W, height: H, pixels, tiles };
  }
}
