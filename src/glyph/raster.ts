import { clampGray, ditherGray, grayToCss, grayToRgba } from "./gray.js";
import { GlyphPath } from "./path.js";
import { fontString, leadingOf, prepare, truncate, wrapClamped } from "./text.js";
import type {
  Corners, Gray, HAlign, Paint, Point, Rect, RasterOptions, TextStyle, VAlign
} from "./types.js";

const DEFAULT_PAINT: Paint = { width: 1, cap: "round", join: "round", alpha: 1 };

function corners(c: Corners): [number, number, number, number] {
  return typeof c === "number" ? [c, c, c, c] : c;
}

/**
 * The drawing surface.
 *
 * Everything is drawn in logical pixels into a supersampled canvas, then
 * resolved down to one byte per pixel at 16 levels. Supersampling is what buys
 * you clean diagonals and curves on a display this small — the averaging step
 * turns coverage into gray levels for free.
 */
export class GlyphRaster {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly makeCanvas: (w: number, h: number) => HTMLCanvasElement;
  private scratch: HTMLCanvasElement | null = null;

  constructor(options: RasterOptions = {}) {
    this.width = options.width ?? 576;
    this.height = options.height ?? 288;
    this.scale = options.supersample ?? 2;
    this.makeCanvas = options.createCanvas ?? ((w, h) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return c;
    });

    this.canvas = this.makeCanvas(this.width * this.scale, this.height * this.scale);
    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;

    const ctx = this.canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error("Glyph: Canvas 2D is unavailable.");
    this.ctx = ctx as CanvasRenderingContext2D;
    this.ctx.scale(this.scale, this.scale);
    this.clear(options.background ?? 0);
  }

  // ── state ────────────────────────────────────────────────────────────────

  save(): this { this.ctx.save(); return this; }
  restore(): this { this.ctx.restore(); return this; }

  /** Run `fn` inside a save/restore pair. Clips and transforms cannot leak out. */
  scoped(fn: (g: this) => void): this {
    this.ctx.save();
    try { fn(this); } finally { this.ctx.restore(); }
    return this;
  }

  translate(dx: number, dy: number): this { this.ctx.translate(dx, dy); return this; }
  rotate(radians: number): this { this.ctx.rotate(radians); return this; }
  scaleBy(sx: number, sy = sx): this { this.ctx.scale(sx, sy); return this; }

  /** Rotate about an arbitrary point. */
  rotateAbout(x: number, y: number, radians: number): this {
    this.ctx.translate(x, y);
    this.ctx.rotate(radians);
    this.ctx.translate(-x, -y);
    return this;
  }

  clipRect(r: Rect): this {
    this.ctx.beginPath();
    this.ctx.rect(r.x, r.y, r.width, r.height);
    this.ctx.clip();
    return this;
  }

  clipRound(r: Rect, radius: Corners): this {
    this.ctx.beginPath();
    this.ctx.roundRect(r.x, r.y, r.width, r.height, corners(radius));
    this.ctx.clip();
    return this;
  }

  clipCircle(cx: number, cy: number, radius: number): this {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.clip();
    return this;
  }

  clipPath(path: GlyphPath, x = 0, y = 0, scale = 1): this {
    path.apply(this.ctx, x, y, scale);
    this.ctx.clip();
    return this;
  }

  // ── painting helpers ─────────────────────────────────────────────────────

  private paint(p: Paint | undefined, defaultFill?: Gray): Paint {
    const merged = { ...DEFAULT_PAINT, ...p };
    if (merged.fill === undefined && merged.stroke === undefined && defaultFill !== undefined) {
      merged.fill = defaultFill;
    }
    return merged;
  }

  private stroke(p: Paint): void {
    if (p.stroke === undefined) return;
    this.ctx.strokeStyle = grayToCss(p.stroke);
    this.ctx.lineWidth = p.width ?? 1;
    this.ctx.lineCap = p.cap ?? "round";
    this.ctx.lineJoin = p.join ?? "round";
    this.ctx.setLineDash(p.dash ?? []);
    this.ctx.lineDashOffset = p.dashOffset ?? 0;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private fillAndStroke(p: Paint): void {
    this.ctx.globalAlpha = p.alpha ?? 1;
    if (p.fill !== undefined) {
      this.ctx.fillStyle = grayToCss(p.fill);
      this.ctx.fill();
    }
    this.stroke(p);
    this.ctx.globalAlpha = 1;
  }

  // ── primitives ───────────────────────────────────────────────────────────

  clear(gray: Gray = 0): this {
    return this.scoped(() => {
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = grayToCss(gray);
      this.ctx.fillRect(0, 0, this.width, this.height);
    });
  }

  /** Set a single logical pixel. */
  pixel(x: number, y: number, gray: Gray): this {
    return this.scoped(() => {
      this.ctx.fillStyle = grayToCss(gray);
      this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    });
  }

  rect(r: Rect, p?: Paint): this {
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.rect(r.x, r.y, r.width, r.height);
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  roundRect(r: Rect, radius: Corners = 8, p?: Paint): this {
    const max = Math.min(r.width, r.height) / 2;
    const rr = corners(radius).map((v) => Math.max(0, Math.min(v, max))) as [number, number, number, number];
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.roundRect(r.x, r.y, r.width, r.height, rr);
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  circle(cx: number, cy: number, radius: number, p?: Paint): this {
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, rotation = 0, p?: Paint): this {
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), rotation, 0, Math.PI * 2);
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  line(x1: number, y1: number, x2: number, y2: number, p?: Paint): this {
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.globalAlpha = paint.alpha ?? 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.stroke({ ...paint, stroke: paint.stroke ?? paint.fill ?? 15 });
      this.ctx.globalAlpha = 1;
    });
  }

  /** Crisp single-pixel horizontal rule. Snapped so it never lands between pixels. */
  hline(x1: number, x2: number, y: number, gray: Gray = 15, weight = 1): this {
    return this.rect({ x: Math.min(x1, x2), y: Math.round(y), width: Math.abs(x2 - x1), height: weight }, { fill: gray });
  }

  /** Crisp single-pixel vertical rule. */
  vline(x: number, y1: number, y2: number, gray: Gray = 15, weight = 1): this {
    return this.rect({ x: Math.round(x), y: Math.min(y1, y2), width: weight, height: Math.abs(y2 - y1) }, { fill: gray });
  }

  polyline(points: Point[], p?: Paint): this {
    if (points.length < 2) return this;
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.globalAlpha = paint.alpha ?? 1;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
      this.stroke({ ...paint, stroke: paint.stroke ?? paint.fill ?? 15 });
      this.ctx.globalAlpha = 1;
    });
  }

  polygon(points: Point[], p?: Paint): this {
    if (points.length < 2) return this;
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
      this.ctx.closePath();
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  /** Regular n-gon. `rotation` 0 puts a vertex at the top. */
  regularPolygon(cx: number, cy: number, radius: number, sides: number, rotation = 0, p?: Paint): this {
    const pts: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const a = rotation - Math.PI / 2 + (i * Math.PI * 2) / sides;
      pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
    }
    return this.polygon(pts, p);
  }

  star(cx: number, cy: number, outer: number, inner: number, points = 5, rotation = 0, p?: Paint): this {
    const pts: Point[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rotation - Math.PI / 2 + (i * Math.PI) / points;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return this.polygon(pts, p);
  }

  /** Stroked arc. Angles in radians, 0 = east. */
  arc(cx: number, cy: number, radius: number, start: number, end: number, p?: Paint): this {
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.globalAlpha = paint.alpha ?? 1;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(0, radius), start, end);
      this.stroke({ ...paint, stroke: paint.stroke ?? paint.fill ?? 15 });
      this.ctx.globalAlpha = 1;
    });
  }

  /** Filled pie slice. */
  sector(cx: number, cy: number, radius: number, start: number, end: number, p?: Paint): this {
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.arc(cx, cy, radius, start, end);
      this.ctx.closePath();
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  /** Filled annulus segment — a donut slice. */
  ring(cx: number, cy: number, outer: number, inner: number, start = 0, end = Math.PI * 2, p?: Paint): this {
    return this.scoped(() => {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, outer, start, end);
      this.ctx.arc(cx, cy, inner, end, start, true);
      this.ctx.closePath();
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  quad(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, p?: Paint): this {
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.quadraticCurveTo(cx, cy, x2, y2);
      this.stroke({ ...paint, stroke: paint.stroke ?? 15 });
    });
  }

  bezier(
    x1: number, y1: number, c1x: number, c1y: number,
    c2x: number, c2y: number, x2: number, y2: number, p?: Paint
  ): this {
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
      this.stroke({ ...paint, stroke: paint.stroke ?? 15 });
    });
  }

  /** Draw a path, optionally translated and scaled. */
  path(path: GlyphPath, x = 0, y = 0, scale = 1, p?: Paint): this {
    return this.scoped(() => {
      path.apply(this.ctx, x, y, scale);
      this.fillAndStroke(this.paint(p, 15));
    });
  }

  /** Smooth curve through a set of points (Catmull-Rom converted to beziers). */
  spline(points: Point[], p?: Paint, tension = 0.5): this {
    if (points.length < 3) return this.polyline(points, p);
    return this.scoped(() => {
      const paint = this.paint(p);
      this.ctx.globalAlpha = paint.alpha ?? 1;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        this.ctx.bezierCurveTo(
          p1.x + ((p2.x - p0.x) / 6) * tension * 2,
          p1.y + ((p2.y - p0.y) / 6) * tension * 2,
          p2.x - ((p3.x - p1.x) / 6) * tension * 2,
          p2.y - ((p3.y - p1.y) / 6) * tension * 2,
          p2.x, p2.y
        );
      }
      this.stroke({ ...paint, stroke: paint.stroke ?? 15 });
      this.ctx.globalAlpha = 1;
    });
  }

  // ── tone: gradients, dither, patterns ────────────────────────────────────

  /**
   * Dithered linear gradient. Canvas gradients band badly once you quantize to
   * 16 levels, so this computes the ramp per logical pixel and applies an
   * ordered dither. It is the difference between a ramp and a staircase.
   */
  gradient(r: Rect, from: number, to: number, angle = Math.PI / 2): this {
    const w = Math.max(1, Math.ceil(r.width));
    const h = Math.max(1, Math.ceil(r.height));
    const buf = new Uint8Array(w * h);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const span = Math.abs(dx) * w + Math.abs(dy) * h || 1;
    const originX = dx < 0 ? w : 0;
    const originY = dy < 0 ? h : 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = ((x - originX) * dx + (y - originY) * dy) / span;
        buf[y * w + x] = ditherGray(x, y, from + (to - from) * Math.abs(t));
      }
    }
    return this.blit(buf, w, h, r.x, r.y);
  }

  /** Dithered radial gradient, bright at the centre by default. */
  radialGradient(cx: number, cy: number, radius: number, from: number, to: number): this {
    const size = Math.ceil(radius * 2);
    const buf = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - radius, y - radius) / radius;
        buf[y * size + x] = ditherGray(x, y, from + (to - from) * Math.min(1, d));
      }
    }
    return this.blit(buf, size, size, cx - radius, cy - radius);
  }

  /** Fill an area with a fractional gray level using ordered dithering. */
  ditherRect(r: Rect, level: number): this {
    const w = Math.max(1, Math.ceil(r.width));
    const h = Math.max(1, Math.ceil(r.height));
    const buf = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) buf[y * w + x] = ditherGray(x, y, level);
    }
    return this.blit(buf, w, h, r.x, r.y);
  }

  /** Diagonal hatching. `angle` in radians, `spacing` in logical pixels. */
  hatch(r: Rect, spacing = 4, gray: Gray = 6, angle = Math.PI / 4, width = 1): this {
    return this.scoped((g) => {
      g.clipRect(r);
      const diag = Math.hypot(r.width, r.height);
      const dx = Math.cos(angle) * diag;
      const dy = Math.sin(angle) * diag;
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const cxp = r.x + r.width / 2;
      const cyp = r.y + r.height / 2;
      const steps = Math.ceil(diag / spacing);
      for (let i = -steps; i <= steps; i++) {
        const ox = cxp + nx * i * spacing;
        const oy = cyp + ny * i * spacing;
        g.line(ox - dx / 2, oy - dy / 2, ox + dx / 2, oy + dy / 2, { stroke: gray, width, cap: "butt" });
      }
    });
  }

  /** Regular dot field. Good for backgrounds that need texture without weight. */
  dots(r: Rect, spacing = 6, gray: Gray = 4, radius = 0.6): this {
    return this.scoped((g) => {
      g.clipRect(r);
      for (let y = r.y + spacing / 2; y < r.y + r.height; y += spacing) {
        for (let x = r.x + spacing / 2; x < r.x + r.width; x += spacing) {
          g.circle(x, y, radius, { fill: gray });
        }
      }
    });
  }

  /** Grid lines. Useful as a chart backdrop or a design overlay. */
  gridLines(r: Rect, stepX: number, stepY = stepX, gray: Gray = 3): this {
    return this.scoped((g) => {
      g.clipRect(r);
      for (let x = r.x; x <= r.x + r.width; x += stepX) g.vline(x, r.y, r.y + r.height, gray);
      for (let y = r.y; y <= r.y + r.height; y += stepY) g.hline(r.x, r.x + r.width, y, gray);
    });
  }

  /** Copy a level buffer straight onto the surface, nearest-neighbour. */
  blit(pixels: Uint8Array, width: number, height: number, x: number, y: number): this {
    const scratch = this.getScratch(width, height);
    const sctx = scratch.getContext("2d")!;
    const img = sctx.createImageData(width, height);
    img.data.set(grayToRgba(pixels));
    sctx.putImageData(img, 0, 0);
    return this.scoped(() => {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(scratch, Math.round(x), Math.round(y), width, height);
    });
  }

  /** Compose another raster onto this one. */
  drawRaster(other: GlyphRaster, x = 0, y = 0, alpha = 1): this {
    return this.scoped(() => {
      this.ctx.globalAlpha = alpha;
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.drawImage(other.element, x, y, other.width, other.height);
    });
  }

  /** An offscreen raster with the same supersampling — for layers and masks. */
  layer(width = this.width, height = this.height): GlyphRaster {
    return new GlyphRaster({
      width, height, supersample: this.scale, background: 0, createCanvas: this.makeCanvas
    });
  }

  private getScratch(w: number, h: number): HTMLCanvasElement {
    if (!this.scratch) this.scratch = this.makeCanvas(w, h);
    if (this.scratch.width !== w || this.scratch.height !== h) {
      this.scratch.width = w;
      this.scratch.height = h;
    }
    return this.scratch;
  }

  get element(): HTMLCanvasElement { return this.canvas; }

  // ── text ─────────────────────────────────────────────────────────────────

  measure = (text: string, style: TextStyle = {}): number => {
    this.ctx.save();
    this.ctx.font = fontString(style);
    let w = this.ctx.measureText(prepare(text, style)).width;
    this.ctx.restore();
    if (style.tracking) w += style.tracking * Math.max(0, text.length - 1);
    return w;
  };

  /** Cap height of the style, useful for optical vertical centring. */
  capHeight(style: TextStyle = {}): number {
    this.ctx.save();
    this.ctx.font = fontString(style);
    const m = this.ctx.measureText("H");
    this.ctx.restore();
    return m.actualBoundingBoxAscent || (style.size ?? 16) * 0.72;
  }

  /**
   * Draw a single line of text.
   * `x` is interpreted according to `hAlign`, `y` according to `vAlign`.
   */
  text(
    value: string, x: number, y: number,
    style: TextStyle = {}, gray: Gray = 15,
    hAlign: HAlign = "left", vAlign: VAlign = "top"
  ): this {
    const content = prepare(value, style);
    return this.scoped(() => {
      this.ctx.fillStyle = grayToCss(gray);
      this.ctx.font = fontString(style);
      this.ctx.textBaseline =
        vAlign === "top" ? "top" : vAlign === "bottom" ? "bottom" : "middle";
      if (style.tracking) {
        // Manual tracking: canvas letterSpacing is not universally available.
        const total = this.measure(content, style);
        let cursor = hAlign === "left" ? x : hAlign === "right" ? x - total : x - total / 2;
        this.ctx.textAlign = "left";
        for (const ch of content) {
          this.ctx.fillText(ch, cursor, y);
          cursor += this.ctx.measureText(ch).width + style.tracking;
        }
      } else {
        this.ctx.textAlign = hAlign === "center" ? "center" : hAlign === "right" ? "right" : "left";
        this.ctx.fillText(content, x, y);
      }
    });
  }

  /**
   * Draw text into a box, with wrapping, alignment and ellipsis.
   * Returns the height actually consumed, so callers can flow content.
   */
  textBox(
    value: string, box: Rect, style: TextStyle = {}, gray: Gray = 15,
    opts: { hAlign?: HAlign; vAlign?: VAlign; maxLines?: number; wrap?: boolean } = {}
  ): number {
    const hAlign = opts.hAlign ?? "left";
    const vAlign = opts.vAlign ?? "top";
    const leading = leadingOf(style);
    const maxLines = opts.maxLines ?? Math.max(1, Math.floor(box.height / leading));
    const lines = opts.wrap === false
      ? [truncate(this.measure, value, style, box.width)]
      : wrapClamped(this.measure, value, style, box.width, maxLines);

    const blockHeight = lines.length * leading;
    const startY = vAlign === "top" ? box.y
      : vAlign === "bottom" ? box.y + box.height - blockHeight
        : box.y + (box.height - blockHeight) / 2;
    const anchorX = hAlign === "left" ? box.x
      : hAlign === "right" ? box.x + box.width
        : box.x + box.width / 2;

    lines.forEach((line, i) => {
      this.text(line, anchorX, startY + i * leading + leading / 2, style, gray, hAlign, "middle");
    });
    return blockHeight;
  }

  // ── resolve ──────────────────────────────────────────────────────────────

  /**
   * Resolve the supersampled canvas to one byte per pixel at 16 levels.
   * This is the only place the device pixel grid exists.
   */
  toLevels(out?: Uint8Array): Uint8Array {
    const s = this.scale;
    const src = this.ctx.getImageData(0, 0, this.width * s, this.height * s).data;
    const dst = out && out.length === this.width * this.height
      ? out
      : new Uint8Array(this.width * this.height);
    const samples = s * s;
    const rowStride = this.width * s * 4;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let sum = 0;
        for (let sy = 0; sy < s; sy++) {
          let i = (y * s + sy) * rowStride + x * s * 4;
          for (let sx = 0; sx < s; sx++, i += 4) {
            sum += 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
          }
        }
        dst[y * this.width + x] = clampGray(sum / samples / 17);
      }
    }
    return dst;
  }
}
