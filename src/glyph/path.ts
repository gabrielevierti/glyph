import type { Point } from "./types.js";

type Cmd =
  | { op: "M"; x: number; y: number }
  | { op: "L"; x: number; y: number }
  | { op: "Q"; cx: number; cy: number; x: number; y: number }
  | { op: "C"; c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number }
  | { op: "A"; cx: number; cy: number; r: number; start: number; end: number; ccw: boolean }
  | { op: "Z" };

/**
 * A resolution-independent path. Built once, replayed into any raster at any
 * scale — which is how icons stay sharp at 10px and 64px from one definition.
 */
export class GlyphPath {
  readonly commands: Cmd[] = [];

  moveTo(x: number, y: number): this { this.commands.push({ op: "M", x, y }); return this; }
  lineTo(x: number, y: number): this { this.commands.push({ op: "L", x, y }); return this; }
  quadTo(cx: number, cy: number, x: number, y: number): this {
    this.commands.push({ op: "Q", cx, cy, x, y }); return this;
  }
  curveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this {
    this.commands.push({ op: "C", c1x, c1y, c2x, c2y, x, y }); return this;
  }
  arc(cx: number, cy: number, r: number, start: number, end: number, ccw = false): this {
    this.commands.push({ op: "A", cx, cy, r, start, end, ccw }); return this;
  }
  close(): this { this.commands.push({ op: "Z" }); return this; }

  /** Append a run of points as a polyline. */
  polyline(points: Point[]): this {
    points.forEach((p, i) => (i === 0 ? this.moveTo(p.x, p.y) : this.lineTo(p.x, p.y)));
    return this;
  }

  /** Replay into a 2D context, optionally translated and scaled. */
  apply(ctx: CanvasRenderingContext2D, x = 0, y = 0, scale = 1): void {
    ctx.beginPath();
    for (const c of this.commands) {
      switch (c.op) {
        case "M": ctx.moveTo(x + c.x * scale, y + c.y * scale); break;
        case "L": ctx.lineTo(x + c.x * scale, y + c.y * scale); break;
        case "Q": ctx.quadraticCurveTo(x + c.cx * scale, y + c.cy * scale, x + c.x * scale, y + c.y * scale); break;
        case "C": ctx.bezierCurveTo(
          x + c.c1x * scale, y + c.c1y * scale,
          x + c.c2x * scale, y + c.c2y * scale,
          x + c.x * scale, y + c.y * scale
        ); break;
        case "A": ctx.arc(x + c.cx * scale, y + c.cy * scale, c.r * scale, c.start, c.end, c.ccw); break;
        case "Z": ctx.closePath(); break;
      }
    }
  }

  /** Axis-aligned bounds of the control points. Approximate for curves. */
  bounds(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const put = (px: number, py: number) => {
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    };
    for (const c of this.commands) {
      if (c.op === "Z") continue;
      if (c.op === "A") {
        put(c.cx - c.r, c.cy - c.r); put(c.cx + c.r, c.cy + c.r);
        continue;
      }
      if (c.op === "C") { put(c.c1x, c.c1y); put(c.c2x, c.c2y); }
      if (c.op === "Q") { put(c.cx, c.cy); }
      put(c.x, c.y);
    }
    if (minX === Infinity) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

/**
 * Parse a compact path string. Supports a useful subset of SVG path data —
 * absolute M, L, H, V, C, Q, Z — plus `O cx cy r` for a full circle.
 * Icons are authored in this syntax on a 24x24 grid.
 */
export function parsePath(d: string): GlyphPath {
  const path = new GlyphPath();
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cx = 0, cy = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const op = tokens[i++];
    switch (op) {
      case "M": cx = num(); cy = num(); path.moveTo(cx, cy); break;
      case "L": cx = num(); cy = num(); path.lineTo(cx, cy); break;
      case "H": cx = num(); path.lineTo(cx, cy); break;
      case "V": cy = num(); path.lineTo(cx, cy); break;
      case "Q": { const qx = num(), qy = num(); cx = num(); cy = num(); path.quadTo(qx, qy, cx, cy); break; }
      case "C": {
        const a = num(), b = num(), c = num(), e = num();
        cx = num(); cy = num();
        path.curveTo(a, b, c, e, cx, cy);
        break;
      }
      case "O": { const ox = num(), oy = num(), r = num(); path.moveTo(ox + r, oy); path.arc(ox, oy, r, 0, Math.PI * 2); break; }
      case "Z": path.close(); break;
      default: break;
    }
  }
  return path;
}
