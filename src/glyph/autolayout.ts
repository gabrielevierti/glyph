import { MAX_IMAGE_CONTAINERS, validateLayout } from "./frame.js";
import type { Rect, TileLayout, TileSlot } from "./types.js";

/**
 * Choosing a tile shape, automatically.
 *
 * Four image containers is a hardware limit, so tiles always cover the same
 * 165,888 pixels between them. The only remaining lever is *shape*: how much of
 * the screen a given change drags along with it. Measured across the reference
 * screens, the gap between the best and worst shape for the same screen is up
 * to 35% of transport — which is a lot of battery to leave on the table because
 * a layout looked tidy.
 *
 * The rule that falls out of the hand-measured table is "put the seams between
 * the regions that change at different rates". That is a rule a computer can
 * follow better than a person can. Record which pixels actually change while a
 * screen animates, then search the space of tilings for the one that costs the
 * fewest bytes on that evidence.
 *
 *   const recorder = new ChangeRecorder();
 *   for (const t of timestamps) recorder.observe(renderAt(t));
 *   const best = recorder.suggest();
 *
 * The search is exhaustive over guillotine tilings on a grid, not a heuristic —
 * at a 16px step there are only a few hundred thousand of them.
 */

export interface ChangeRecorderOptions {
  width?: number;
  height?: number;
  /** Resolution of the change map, in logical pixels. Must divide the surface. */
  cell?: number;
}

export interface LayoutCandidate {
  layout: TileLayout;
  /** Total Gray4 bytes sent across all recorded transitions. */
  bytes: number;
  /** Mean tiles dirtied per transition. */
  tilesPerFrame: number;
}

export interface SuggestOptions {
  /** Cut positions are multiples of this, in logical pixels. Smaller is slower. */
  step?: number;
  /** No tile narrower or shorter than this. */
  minTile?: number;
  /** Name for the produced layout. */
  name?: string;
  /** How many tiles to partition into. Never more than the hardware allows. */
  tiles?: number;
}

interface Box { x: number; y: number; w: number; h: number; }

/**
 * Accumulates which parts of the surface actually change between frames.
 *
 * Storage is one integral image of changed cells per transition, so asking
 * "did anything inside this rectangle change on frame 7" is four array reads
 * rather than a scan. That is what makes an exhaustive search affordable.
 */
export class ChangeRecorder {
  readonly width: number;
  readonly height: number;
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;

  private previous: Uint8Array | null = null;
  /** One (cols+1)x(rows+1) integral image per observed transition. */
  private integrals: Int32Array[] = [];

  constructor(options: ChangeRecorderOptions = {}) {
    this.width = options.width ?? 576;
    this.height = options.height ?? 288;
    this.cell = options.cell ?? 8;
    if (this.width % this.cell || this.height % this.cell) {
      throw new Error(`Glyph: change-map cell ${this.cell} does not divide ${this.width}x${this.height}.`);
    }
    this.cols = this.width / this.cell;
    this.rows = this.height / this.cell;
  }

  get transitions(): number { return this.integrals.length; }

  /** Feed one resolved frame. The first call only establishes a baseline. */
  observe(levels: Uint8Array): void {
    if (levels.length !== this.width * this.height) {
      throw new Error("Glyph: change map received a frame of the wrong size.");
    }
    if (!this.previous) {
      this.previous = Uint8Array.from(levels);
      return;
    }

    const { cols, rows, cell, width } = this;
    const changed = new Uint8Array(cols * rows);
    const prev = this.previous;
    for (let y = 0; y < this.height; y++) {
      const row = y * width;
      const cellRow = ((y / cell) | 0) * cols;
      for (let x = 0; x < width; x++) {
        if (prev[row + x] !== levels[row + x]) changed[cellRow + ((x / cell) | 0)] = 1;
      }
    }

    // Integral image, so a rectangle query is O(1).
    const integral = new Int32Array((cols + 1) * (rows + 1));
    for (let cy = 0; cy < rows; cy++) {
      let rowSum = 0;
      for (let cx = 0; cx < cols; cx++) {
        rowSum += changed[cy * cols + cx];
        integral[(cy + 1) * (cols + 1) + (cx + 1)] = integral[cy * (cols + 1) + (cx + 1)] + rowSum;
      }
    }
    this.integrals.push(integral);
    this.previous.set(levels);
  }

  reset(): void {
    this.previous = null;
    this.integrals = [];
  }

  /** How many recorded transitions touched this rectangle. */
  dirtyCount(r: Rect): number {
    const x0 = Math.max(0, Math.floor(r.x / this.cell));
    const y0 = Math.max(0, Math.floor(r.y / this.cell));
    const x1 = Math.min(this.cols, Math.ceil((r.x + r.width) / this.cell));
    const y1 = Math.min(this.rows, Math.ceil((r.y + r.height) / this.cell));
    if (x1 <= x0 || y1 <= y0) return 0;
    const stride = this.cols + 1;
    let count = 0;
    for (const integral of this.integrals) {
      const sum = integral[y1 * stride + x1] - integral[y0 * stride + x1]
        - integral[y1 * stride + x0] + integral[y0 * stride + x0];
      if (sum > 0) count++;
    }
    return count;
  }

  /** Cost of one candidate tiling, in Gray4 bytes across every transition. */
  cost(layout: TileLayout): LayoutCandidate {
    let bytes = 0;
    let dirty = 0;
    for (const tile of layout.tiles) {
      const hits = this.dirtyCount(tile);
      dirty += hits;
      bytes += hits * ((tile.width * tile.height) >> 1);
    }
    return {
      layout,
      bytes,
      tilesPerFrame: this.transitions ? dirty / this.transitions : 0
    };
  }

  /**
   * Search every guillotine tiling on the step grid and return the cheapest.
   *
   * Guillotine tilings are the ones you can describe as "cut the rectangle, then
   * cut the pieces" — which is every tiling the four-container model can express
   * and, conveniently, exactly the ones a person would think to draw.
   */
  suggest(options: SuggestOptions = {}): LayoutCandidate {
    if (this.transitions === 0) {
      throw new Error("Glyph: nothing recorded — call observe() with at least two frames.");
    }
    const step = options.step ?? 16;
    const minTile = options.minTile ?? 32;
    const count = Math.min(options.tiles ?? MAX_IMAGE_CONTAINERS, MAX_IMAGE_CONTAINERS);
    if (step % 2 !== 0) throw new Error("Glyph: search step must be even — Gray4 needs even tile widths.");

    // Cost of a single rectangle, memoized. Candidates share rectangles heavily,
    // and this is the only expensive part of evaluating one.
    const memo = new Map<number, number>();
    const rectCost = (b: Box): number => {
      const key = ((b.x * 577 + b.y) * 577 + b.w) * 289 + b.h;
      const hit = memo.get(key);
      if (hit !== undefined) return hit;
      const value = this.dirtyCount({ x: b.x, y: b.y, width: b.w, height: b.h }) * ((b.w * b.h) >> 1);
      memo.set(key, value);
      return value;
    };

    const best: { cost: number; boxes: Box[] | null } = { cost: Infinity, boxes: null };
    const stack: Box[] = [];

    const walk = (box: Box, remaining: number, accumulated: number): void => {
      if (accumulated >= best.cost) return;        // nothing below here can win
      if (remaining === 1) {
        const total = accumulated + rectCost(box);
        if (total < best.cost) {
          best.cost = total;
          best.boxes = [...stack, box];
        }
        return;
      }
      // Vertical cuts.
      for (let cut = step; cut <= box.w - step; cut += step) {
        if (cut < minTile || box.w - cut < minTile) continue;
        const left: Box = { x: box.x, y: box.y, w: cut, h: box.h };
        const right: Box = { x: box.x + cut, y: box.y, w: box.w - cut, h: box.h };
        for (let k = 1; k < remaining; k++) split(left, k, right, remaining - k, accumulated);
      }
      // Horizontal cuts.
      for (let cut = step; cut <= box.h - step; cut += step) {
        if (cut < minTile || box.h - cut < minTile) continue;
        const upper: Box = { x: box.x, y: box.y, w: box.w, h: cut };
        const lower: Box = { x: box.x, y: box.y + cut, w: box.w, h: box.h - cut };
        for (let k = 1; k < remaining; k++) split(upper, k, lower, remaining - k, accumulated);
      }
    };

    const split = (a: Box, an: number, b: Box, bn: number, accumulated: number): void => {
      if (an === 1) {
        const cost = accumulated + rectCost(a);
        if (cost >= best.cost) return;
        stack.push(a);
        walk(b, bn, cost);
        stack.pop();
        return;
      }
      // Both sides subdivide: enumerate the left side's tilings, then the right.
      enumerate(a, an, accumulated, (partial, cost) => {
        if (cost >= best.cost) return;
        const depth = stack.length;
        stack.push(...partial);
        walk(b, bn, cost);
        stack.length = depth;
      });
    };

    const enumerate = (
      box: Box, remaining: number, accumulated: number,
      emit: (boxes: Box[], cost: number) => void
    ): void => {
      if (remaining === 1) { emit([box], accumulated + rectCost(box)); return; }
      for (let cut = step; cut <= box.w - step; cut += step) {
        if (cut < minTile || box.w - cut < minTile) continue;
        const left: Box = { x: box.x, y: box.y, w: cut, h: box.h };
        const right: Box = { x: box.x + cut, y: box.y, w: box.w - cut, h: box.h };
        for (let k = 1; k < remaining; k++) {
          enumerate(left, k, accumulated, (la, lc) =>
            enumerate(right, remaining - k, lc, (ra, rc) => emit([...la, ...ra], rc)));
        }
      }
      for (let cut = step; cut <= box.h - step; cut += step) {
        if (cut < minTile || box.h - cut < minTile) continue;
        const upper: Box = { x: box.x, y: box.y, w: box.w, h: cut };
        const lower: Box = { x: box.x, y: box.y + cut, w: box.w, h: box.h - cut };
        for (let k = 1; k < remaining; k++) {
          enumerate(upper, k, accumulated, (ua, uc) =>
            enumerate(lower, remaining - k, uc, (la, lc) => emit([...ua, ...la], lc)));
        }
      }
    };

    walk({ x: 0, y: 0, w: this.width, h: this.height }, count, 0);
    const boxes = best.boxes;
    if (!boxes) throw new Error("Glyph: no valid tiling found — try a smaller step or a smaller minTile.");

    const layout = layoutFromBoxes(boxes, options.name ?? "measured");
    const problems = validateLayout(layout, this.width, this.height);
    if (problems.length) throw new Error(`Glyph: search produced an invalid layout:\n  ${problems.join("\n  ")}`);
    return this.cost(layout);
  }
}

function layoutFromBoxes(boxes: Box[], name: string): TileLayout {
  // Reading order keeps ids stable between runs, which keeps diffs readable.
  const sorted = [...boxes].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const tiles: TileSlot[] = sorted.map((b, i) => ({
    id: 10 + i,
    name: `t${i}`,
    x: b.x, y: b.y, width: b.w, height: b.h,
    zOrder: i + 1
  }));
  const shape = sorted.map((b) => `${b.w}×${b.h}`).join(" + ");
  return { name, note: `measured — ${shape}`, tiles };
}

/** Emit a layout as TypeScript, ready to paste into a project. */
export function layoutToSource(layout: TileLayout, constName = "TILE_MEASURED"): string {
  const tiles = layout.tiles
    .map((t) => `    { id: ${t.id}, name: "${t.name}", x: ${t.x}, y: ${t.y}, width: ${t.width}, height: ${t.height}, zOrder: ${t.zOrder} }`)
    .join(",\n");
  return `export const ${constName}: TileLayout = {\n  name: "${layout.name}",\n  note: ${JSON.stringify(layout.note ?? "")},\n  tiles: [\n${tiles}\n  ]\n};\n`;
}
