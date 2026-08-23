import type { Gray, RenderOptions, TextOptions } from "./types";

export class GlyphRaster {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  private readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(options: RenderOptions = {}) {
    this.width = options.width ?? 576;
    this.height = options.height ?? 288;
    this.scale = options.supersample ?? 2;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;

    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Glyph: Canvas 2D is unavailable.");
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.scale(this.scale, this.scale);
    this.clear(options.background ?? 0);
  }

  clear(gray: Gray = 0) {
    this.ctx.save();
    this.ctx.fillStyle = grayToCss(gray);
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  fillRect(x: number, y: number, width: number, height: number, gray: Gray = 15) {
    this.ctx.save();
    this.ctx.fillStyle = grayToCss(gray);
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
  }

  strokeRect(
    x: number, y: number, width: number, height: number,
    gray: Gray = 15, lineWidth = 1
  ) {
    this.ctx.save();
    this.ctx.strokeStyle = grayToCss(gray);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  roundRect(
    x: number, y: number, width: number, height: number,
    radius: number, fill?: Gray, stroke?: Gray, lineWidth = 1
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, r);
    if (fill !== undefined) {
      this.ctx.fillStyle = grayToCss(fill);
      this.ctx.fill();
    }
    if (stroke !== undefined) {
      this.ctx.strokeStyle = grayToCss(stroke);
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  line(x1: number, y1: number, x2: number, y2: number, gray = 15, width = 1) {
    this.ctx.save();
    this.ctx.strokeStyle = grayToCss(gray);
    this.ctx.lineWidth = width;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  circle(cx: number, cy: number, radius: number, fill?: Gray, stroke?: Gray, width = 1) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (fill !== undefined) {
      this.ctx.fillStyle = grayToCss(fill);
      this.ctx.fill();
    }
    if (stroke !== undefined) {
      this.ctx.strokeStyle = grayToCss(stroke);
      this.ctx.lineWidth = width;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  arc(
    cx: number, cy: number, radius: number,
    start: number, end: number, gray = 15, width = 1
  ) {
    this.ctx.save();
    this.ctx.strokeStyle = grayToCss(gray);
    this.ctx.lineWidth = width;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, start, end);
    this.ctx.stroke();
    this.ctx.restore();
  }

  polygon(points: Array<{ x: number; y: number }>, fill?: Gray, stroke?: Gray, width = 1) {
    if (!points.length) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
    this.ctx.closePath();
    if (fill !== undefined) {
      this.ctx.fillStyle = grayToCss(fill);
      this.ctx.fill();
    }
    if (stroke !== undefined) {
      this.ctx.strokeStyle = grayToCss(stroke);
      this.ctx.lineWidth = width;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  text(
    value: string,
    x: number,
    y: number,
    options: TextOptions = {},
    gray: Gray = 15
  ) {
    const font = options.font ?? "Inter, Arial, sans-serif";
    const size = options.size ?? 16;
    const weight = options.weight ?? 500;
    this.ctx.save();
    this.ctx.fillStyle = grayToCss(gray);
    this.ctx.font = `${weight} ${size}px ${font}`;
    this.ctx.textAlign = options.align ?? "left";
    this.ctx.textBaseline = options.baseline ?? "alphabetic";
    this.ctx.fillText(value, x, y);
    this.ctx.restore();
  }



  ellipse(cx: number, cy: number, rx: number, ry: number, fill?: Gray, stroke?: Gray, width = 1) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill !== undefined) {
      this.ctx.fillStyle = grayToCss(fill);
      this.ctx.fill();
    }
    if (stroke !== undefined) {
      this.ctx.strokeStyle = grayToCss(stroke);
      this.ctx.lineWidth = width;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  toGray4(): Uint8Array {
    const source = this.ctx.getImageData(
      0, 0, this.width * this.scale, this.height * this.scale
    );
    const out = new Uint8Array(this.width * this.height);
    const samples = this.scale * this.scale;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let sum = 0;
        for (let sy = 0; sy < this.scale; sy++) {
          const row = ((y * this.scale + sy) * this.width * this.scale) * 4;
          for (let sx = 0; sx < this.scale; sx++) {
            const i = row + (x * this.scale + sx) * 4;
            sum += 0.299 * source.data[i] + 0.587 * source.data[i + 1] + 0.114 * source.data[i + 2];
          }
        }
        out[y * this.width + x] = Math.max(0, Math.min(15, Math.round((sum / samples) / 17)));
      }
    }
    return out;
  }
}

export function packGray4(pixels: Uint8Array, width: number, height: number): Uint8Array {
  if (width % 2 !== 0) throw new Error("Glyph: Gray4 packing requires an even tile width.");
  const out = new Uint8Array((width * height) / 2);
  let p = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 2) {
      out[p++] = ((pixels[y * width + x] & 0x0f) << 4) | (pixels[y * width + x + 1] & 0x0f);
    }
  }
  return out;
}

export function gray4ToRgba(pixels: Uint8Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i] * 17;
    const j = i * 4;
    out[j] = v;
    out[j + 1] = v;
    out[j + 2] = v;
    out[j + 3] = 255;
  }
  return out;
}

function grayToCss(gray: Gray): string {
  const v = Math.max(0, Math.min(15, gray)) * 17;
  return `rgb(${v},${v},${v})`;
}
