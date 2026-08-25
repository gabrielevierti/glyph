import { GlyphRaster } from "./raster.js";
import { hashBytes, packGray4 } from "./gray.js";
import type { Frame, RasterOptions, Tile, TileLayout, TileSlot } from "./types.js";

/**
 * The G2 accepts a maximum of four image containers per page. This is a
 * hardware limit, not a firmware one — the Even Hub simulator will happily
 * accept twelve, which is a trap worth knowing about.
 */
export const MAX_IMAGE_CONTAINERS = 4;

const slot = (id: number, x: number, y: number, width: number, height: number): TileSlot =>
  ({ id, name: `t${id - 10}`, x, y, width, height, zOrder: id - 9 });

/**
 * With only four containers you cannot buy diffing granularity by making tiles
 * smaller — four tiles always cover 165,888 pixels between them. What you *can*
 * choose is their shape, and shape decides how much of the screen a given
 * change drags along with it.
 *
 * Pick the layout whose seams fall between the parts of your screen that change
 * at different rates. A ticking clock in a top band dirties 25% of the surface;
 * the same clock in a quadrant layout dirties 25% too, but a full-width status
 * bar above it dirties 50%. The shape is the whole decision.
 */
export const TILE_QUADRANTS: TileLayout = {
  name: "quadrants",
  note: "288×144 ×4 — the SDK reference layout. Good default.",
  tiles: [slot(10, 0, 0, 288, 144), slot(11, 288, 0, 288, 144), slot(12, 0, 144, 288, 144), slot(13, 288, 144, 288, 144)]
};

export const TILE_BANDS: TileLayout = {
  name: "bands",
  note: "576×72 ×4 — for screens that change in horizontal strips (status bar, header, body, footer).",
  tiles: [slot(10, 0, 0, 576, 72), slot(11, 0, 72, 576, 72), slot(12, 0, 144, 576, 72), slot(13, 0, 216, 576, 72)]
};

export const TILE_COLUMNS: TileLayout = {
  name: "columns",
  note: "144×288 ×4 — for side-by-side panels that update independently.",
  tiles: [slot(10, 0, 0, 144, 288), slot(11, 144, 0, 144, 288), slot(12, 288, 0, 144, 288), slot(13, 432, 0, 144, 288)]
};

/**
 * Non-uniform: a thin full-width strip for chrome that rarely changes, and
 * three columns beneath it. Tiles do not have to be the same size, which is
 * the lever that survives the four-container cap.
 */
export const TILE_CHROME: TileLayout = {
  name: "chrome",
  note: "576×32 status strip + three 192×256 panels — isolates chrome from content.",
  tiles: [slot(10, 0, 0, 576, 32), slot(11, 0, 32, 192, 256), slot(12, 192, 32, 192, 256), slot(13, 384, 32, 192, 256)]
};

/** Split for a screen with one dominant panel and a narrow rail. */
export const TILE_HERO: TileLayout = {
  name: "hero",
  note: "426×288 hero + a 150-wide rail in three stacked tiles.",
  tiles: [slot(10, 0, 0, 426, 288), slot(11, 426, 0, 150, 96), slot(12, 426, 96, 150, 96), slot(13, 426, 192, 150, 96)]
};

export const TILE_LAYOUTS = {
  quadrants: TILE_QUADRANTS,
  bands: TILE_BANDS,
  columns: TILE_COLUMNS,
  chrome: TILE_CHROME,
  hero: TILE_HERO
} as const;

export type TileLayoutName = keyof typeof TILE_LAYOUTS;

/**
 * Verify a layout covers the surface exactly once and fits the container cap.
 * Returns the problems rather than throwing, so tools can report them all.
 */
export function validateLayout(layout: TileLayout, width = 576, height = 288): string[] {
  const problems: string[] = [];
  if (layout.tiles.length > MAX_IMAGE_CONTAINERS) {
    problems.push(`${layout.tiles.length} tiles exceeds the ${MAX_IMAGE_CONTAINERS}-container hardware limit (the simulator will accept it; the glasses will not).`);
  }
  const cover = new Uint8Array(width * height);
  for (const t of layout.tiles) {
    if (t.width % 2 !== 0) problems.push(`tile "${t.name}" has odd width ${t.width}; Gray4 packs two pixels per byte.`);
    if (t.x < 0 || t.y < 0 || t.x + t.width > width || t.y + t.height > height) {
      problems.push(`tile "${t.name}" (${t.x},${t.y} ${t.width}×${t.height}) falls outside the ${width}×${height} surface.`);
      continue;
    }
    for (let y = 0; y < t.height; y++) {
      const row = (t.y + y) * width + t.x;
      for (let x = 0; x < t.width; x++) cover[row + x]++;
    }
  }
  const gaps = cover.reduce((n, v) => n + (v === 0 ? 1 : 0), 0);
  const overlaps = cover.reduce((n, v) => n + (v > 1 ? 1 : 0), 0);
  if (gaps) problems.push(`${gaps} pixels are not covered by any tile.`);
  if (overlaps) problems.push(`${overlaps} pixels are covered by more than one tile.`);
  return problems;
}

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

  constructor(options: RasterOptions & { tileLayout?: TileLayout } = {}) {
    this.raster = new GlyphRaster(options);
    this.tileLayout = options.tileLayout ?? TILE_QUADRANTS;

    const problems = validateLayout(this.tileLayout, this.raster.width, this.raster.height);
    if (problems.length > 0) {
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":\n  ${problems.join("\n  ")}`);
    }

    this.levels = new Uint8Array(this.raster.width * this.raster.height);
    this.tileBuffers = this.tileLayout.tiles.map((t) => new Uint8Array(t.width * t.height));
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
    const tiles: Tile[] = this.tileLayout.tiles.map((slotDef, index) => {
      const buf = this.tileBuffers[index];
      for (let y = 0; y < slotDef.height; y++) {
        const src = (slotDef.y + y) * W + slotDef.x;
        buf.set(levels.subarray(src, src + slotDef.width), y * slotDef.width);
      }
      const packed = packGray4(buf, slotDef.width, slotDef.height);
      return {
        id: slotDef.id,
        name: slotDef.name,
        rect: { x: slotDef.x, y: slotDef.y, width: slotDef.width, height: slotDef.height },
        pixels: packed,
        hash: hashBytes(packed)
      };
    });
    return { width: W, height: this.raster.height, pixels: levels, tiles };
  }
}
