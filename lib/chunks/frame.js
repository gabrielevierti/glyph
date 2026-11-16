const at = 16, rt = 17;
function A(o) {
  return o < 0 ? 0 : o > 15 ? 15 : Math.round(o);
}
function q(o) {
  return Math.round(A(o) * 17);
}
function ot(o) {
  return A(o / 17);
}
function $(o) {
  const t = q(o);
  return `rgb(${t},${t},${t})`;
}
function ct(o, t, e) {
  const i = e < 0 ? 0 : e > 1 ? 1 : e;
  return o + (t - o) * i;
}
const N = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map((o) => o.map((t) => (t + 0.5) / 16));
function G(o, t, e) {
  const i = e < 0 ? 0 : e > 15 ? 15 : e, s = Math.floor(i), h = i - s, n = N[t & 3][o & 3];
  return A(h > n ? s + 1 : s);
}
function Y(o) {
  let t = 2166136261;
  for (let e = 0; e < o.length; e++)
    t ^= o[e], t = Math.imul(t, 16777619);
  return t >>> 0;
}
function lt(o, t, e) {
  if (t % 2 !== 0) throw new Error("Glyph: Gray4 packing requires an even tile width.");
  const i = new Uint8Array(t * e >> 1);
  let s = 0;
  for (let h = 0; h < e; h++) {
    const n = h * t;
    for (let a = 0; a < t; a += 2)
      i[s++] = (o[n + a] & 15) << 4 | o[n + a + 1] & 15;
  }
  return i;
}
function ut(o, t, e) {
  const i = new Uint8Array(t * e);
  for (let s = 0; s < i.length; s++) {
    const h = o[s >> 1];
    i[s] = (s & 1) === 0 ? h >> 4 & 15 : h & 15;
  }
  return i;
}
const V = Uint8Array.from({ length: 16 }, (o, t) => t * 17);
function K(o) {
  const t = new Uint8ClampedArray(o.length * 4);
  for (let e = 0; e < o.length; e++) {
    const i = V[o[e] & 15], s = e * 4;
    t[s] = i, t[s + 1] = i, t[s + 2] = i, t[s + 3] = 255;
  }
  return t;
}
function P(o) {
  const t = o.size ?? 16, e = o.weight ?? 500, i = o.font ?? "Inter, Helvetica, Arial, sans-serif";
  return `${o.italic ? "italic " : ""}${e} ${t}px ${i}`;
}
function Q(o) {
  return o.leading ?? Math.round((o.size ?? 16) * 1.25);
}
function D(o, t) {
  return t.uppercase ? o.toUpperCase() : o;
}
function X(o) {
  return `${P(o)}|${o.tracking ?? 0}|${o.uppercase ? 1 : 0}`;
}
function z(o, t = 4096) {
  const e = /* @__PURE__ */ new Map();
  return (i, s) => {
    const h = `${X(s)}\0${i}`, n = e.get(h);
    if (n !== void 0) return n;
    const a = o(i, s);
    return e.size >= t && e.clear(), e.set(h, a), a;
  };
}
function J(o, t, e, i) {
  const s = D(t, e), h = [];
  for (const n of s.split(`
`)) {
    if (n === "") {
      h.push("");
      continue;
    }
    let a = "";
    for (const r of n.split(/\s+/)) {
      const c = a ? `${a} ${r}` : r;
      if (o(c, e) <= i) {
        a = c;
        continue;
      }
      if (a && (h.push(a), a = ""), o(r, e) <= i) {
        a = r;
        continue;
      }
      let l = "";
      for (const u of r)
        l && o(l + u, e) > i ? (h.push(l), l = u) : l += u;
      a = l;
    }
    h.push(a);
  }
  return h;
}
function W(o, t, e, i, s = "…") {
  const h = D(t, e);
  if (o(h, e) <= i) return h;
  const n = o(s, e);
  let a = "";
  for (const r of h) {
    if (o(a + r, e) + n > i) break;
    a += r;
  }
  return a.trimEnd() + s;
}
function Z(o, t, e, i, s) {
  const h = J(o, t, e, i);
  if (h.length <= s) return h;
  const n = h.slice(0, s), a = n[s - 1], r = o("…", e);
  let c = "";
  for (const l of a) {
    if (o(c + l, e) + r > i) break;
    c += l;
  }
  return n[s - 1] = c.trimEnd() + "…", n;
}
function ft(o, t, e, i, s = 1 / 0, h = 9) {
  const n = e.size ?? 16, a = Math.min(n, s), r = (d) => {
    const g = a - d;
    return e.leading === void 0 || g === n ? { ...e, size: g } : { ...e, size: g, leading: Math.max(1, Math.round(e.leading * g / n)) };
  };
  if (o(t, r(0)) <= i) return r(0);
  const c = Math.max(0, Math.ceil(a - h));
  if (o(t, r(c)) > i) return r(c);
  let l = 0, u = c;
  for (; u - l > 1; ) {
    const d = l + u >> 1;
    o(t, r(d)) <= i ? u = d : l = d;
  }
  return r(u);
}
function dt(o, t, e, i) {
  for (const s of e)
    if (o(t, s) <= i) return s;
  return e[e.length - 1] ?? {};
}
const tt = { width: 1, cap: "round", join: "round", alpha: 1 };
function F(o) {
  return typeof o == "number" ? [o, o, o, o] : o;
}
class O {
  width;
  height;
  scale;
  ctx;
  /**
   * How panels and tracks draw themselves. Lives here rather than in a module
   * global, so a layer, a screenshot pass and the live app can disagree — and
   * so two tests running at once cannot corrupt each other's setting.
   */
  surface;
  /** Global output scale, 0..1, applied once at resolve. */
  brightness;
  /** Text rasterization policy. See `FontMode`. */
  fontMode = "auto";
  canvas;
  makeCanvas;
  scratch = null;
  fontSet = null;
  lintMinDelta = 0;
  lintRecords = null;
  styleObserver = null;
  /**
   * Uncached measurement. Kept separate so `useFont` can rebuild the cache
   * around it without every caller having to re-read `g.measure`.
   */
  rawMeasure = (t, e) => {
    this.styleObserver?.(e);
    const i = D(t, e), s = this.faceFor(e);
    if (s) return s.measure(i, e.tracking ?? 0);
    this.ctx.save(), this.ctx.font = P(e);
    let h;
    if (e.tracking) {
      h = 0;
      let n = 0;
      for (const a of i)
        h += this.ctx.measureText(a).width, n++;
      n > 1 && (h += e.tracking * (n - 1));
    } else
      h = this.ctx.measureText(i).width;
    return this.ctx.restore(), h;
  };
  /**
   * Width of a string in logical pixels. Memoized — wrapping, truncation and
   * `fitStyle` all re-measure the same unchanged labels on every paint.
   */
  measure = z(this.rawMeasure);
  constructor(t = {}) {
    this.width = t.width ?? 576, this.height = t.height ?? 288, this.scale = t.supersample ?? 2, this.surface = t.surface ?? "outline", this.brightness = t.brightness ?? 1, this.makeCanvas = t.createCanvas ?? ((i, s) => {
      const h = document.createElement("canvas");
      return h.width = i, h.height = s, h;
    }), this.canvas = this.makeCanvas(this.width * this.scale, this.height * this.scale), this.canvas.width = this.width * this.scale, this.canvas.height = this.height * this.scale;
    const e = this.canvas.getContext("2d", { alpha: !1, willReadFrequently: !0 });
    if (!e) throw new Error("Glyph: Canvas 2D is unavailable.");
    this.ctx = e, this.ctx.scale(this.scale, this.scale), t.lint && this.enableContrastLint(typeof t.lint == "object" ? t.lint.minDelta : void 0), this.clear(t.background ?? 0);
  }
  // ── fonts ────────────────────────────────────────────────────────────────
  /**
   * Install a bitmap font set. Metrics and coverage then come from the atlas
   * rather than from the host, which is what makes a committed snapshot mean
   * anything on a machine other than the one that made it.
   */
  useFont(t, e = t ? "auto" : "canvas") {
    return this.fontSet = t, this.fontMode = e, this.measure = z(this.rawMeasure), this;
  }
  get font() {
    return this.fontSet;
  }
  /**
   * Report every text style this raster is asked to draw or measure.
   *
   * The atlas builder uses this to discover which faces an app actually needs,
   * rather than making you keep a list in sync by hand — screens use one-off
   * sizes (`{ ...T.numeral, size: 13 }`) constantly, and a face that is missing
   * from the atlas is a face that silently falls back to the host.
   */
  observeStyles(t) {
    return this.styleObserver = t, this.measure = z(this.rawMeasure), this;
  }
  faceFor(t) {
    if (this.fontMode === "canvas") return null;
    const e = this.fontSet?.find(t) ?? null;
    if (!e && this.fontMode === "bitmap")
      throw new Error(
        `Glyph: no bitmap face for ${P(t)} and fontMode is "bitmap". Add the size to tools/build-font.mjs and re-run \`npm run font\`.`
      );
    return e;
  }
  // ── contrast lint ────────────────────────────────────────────────────────
  /**
   * Record any glyph drawn within `minDelta` levels of its background.
   *
   * Ink says how much of the world the UI is hiding. Contrast says whether what
   * it hides it with can be read. Neither shows up in a screenshot on a bright
   * monitor, which is exactly why both are assertions rather than eyeballing.
   */
  enableContrastLint(t = 4) {
    return this.lintMinDelta = t, this.lintRecords = [], this.lintRecords;
  }
  get contrastWarnings() {
    return this.lintRecords ?? [];
  }
  clearContrastWarnings() {
    this.lintRecords && (this.lintRecords.length = 0);
  }
  /** Level currently on the surface at a logical point. */
  sample(t, e) {
    const i = Math.max(0, Math.min(this.canvas.width - 1, Math.round(t * this.scale))), s = Math.max(0, Math.min(this.canvas.height - 1, Math.round(e * this.scale)));
    return A(this.ctx.getImageData(i, s, 1, 1).data[0] / 17);
  }
  /**
   * The darkest level in a small neighbourhood — the backdrop a glyph will
   * actually sit against.
   *
   * A single sample is not enough: land it on a stroke of text drawn a moment
   * ago and the lint reports a clash with something the eye reads as a separate
   * word. The minimum over a span finds the surface showing through the gaps,
   * which is the thing the new glyph has to be distinguishable from.
   */
  backdrop(t, e, i = 4) {
    let s = 15;
    for (let h = -1; h <= 1; h++)
      for (let n = -i; n <= i; n += i) {
        const a = this.sample(t + n, e + h * i);
        a < s && (s = a);
      }
    return s;
  }
  lintText(t, e, i, s) {
    if (!this.lintRecords) return;
    const h = this.backdrop(e, i), n = Math.abs(s - h);
    n < this.lintMinDelta && this.lintRecords.push({ text: t, gray: s, background: h, delta: n, x: e, y: i });
  }
  // ── state ────────────────────────────────────────────────────────────────
  save() {
    return this.ctx.save(), this;
  }
  restore() {
    return this.ctx.restore(), this;
  }
  /** Run `fn` inside a save/restore pair. Clips and transforms cannot leak out. */
  scoped(t) {
    this.ctx.save();
    try {
      t(this);
    } finally {
      this.ctx.restore();
    }
    return this;
  }
  translate(t, e) {
    return this.ctx.translate(t, e), this;
  }
  rotate(t) {
    return this.ctx.rotate(t), this;
  }
  scaleBy(t, e = t) {
    return this.ctx.scale(t, e), this;
  }
  /** Rotate about an arbitrary point. */
  rotateAbout(t, e, i) {
    return this.ctx.translate(t, e), this.ctx.rotate(i), this.ctx.translate(-t, -e), this;
  }
  clipRect(t) {
    return this.ctx.beginPath(), this.ctx.rect(t.x, t.y, t.width, t.height), this.ctx.clip(), this;
  }
  clipRound(t, e) {
    return this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, t.width, t.height, F(e)), this.ctx.clip(), this;
  }
  clipCircle(t, e, i) {
    return this.ctx.beginPath(), this.ctx.arc(t, e, i, 0, Math.PI * 2), this.ctx.clip(), this;
  }
  clipPath(t, e = 0, i = 0, s = 1) {
    return t.apply(this.ctx, e, i, s), this.ctx.clip(), this;
  }
  // ── painting helpers ─────────────────────────────────────────────────────
  paint(t, e) {
    const i = { ...tt, ...t };
    return i.fill === void 0 && i.stroke === void 0 && e !== void 0 && (i.fill = e), i;
  }
  stroke(t) {
    t.stroke !== void 0 && (this.ctx.strokeStyle = $(t.stroke), this.ctx.lineWidth = t.width ?? 1, this.ctx.lineCap = t.cap ?? "round", this.ctx.lineJoin = t.join ?? "round", this.ctx.setLineDash(t.dash ?? []), this.ctx.lineDashOffset = t.dashOffset ?? 0, this.ctx.stroke(), this.ctx.setLineDash([]));
  }
  fillAndStroke(t) {
    this.ctx.globalAlpha = t.alpha ?? 1, t.fill !== void 0 && (this.ctx.fillStyle = $(t.fill), this.ctx.fill()), this.stroke(t), this.ctx.globalAlpha = 1;
  }
  // ── primitives ───────────────────────────────────────────────────────────
  clear(t = 0) {
    return this.scoped(() => {
      this.ctx.globalAlpha = 1, this.ctx.fillStyle = $(t), this.ctx.fillRect(0, 0, this.width, this.height);
    });
  }
  /** Set a single logical pixel. */
  pixel(t, e, i) {
    return this.scoped(() => {
      this.ctx.fillStyle = $(i), this.ctx.fillRect(Math.floor(t), Math.floor(e), 1, 1);
    });
  }
  rect(t, e) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.rect(t.x, t.y, t.width, t.height), this.fillAndStroke(this.paint(e, 15));
    });
  }
  roundRect(t, e = 8, i) {
    const s = Math.min(t.width, t.height) / 2, h = F(e).map((n) => Math.max(0, Math.min(n, s)));
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, t.width, t.height, h), this.fillAndStroke(this.paint(i, 15));
    });
  }
  circle(t, e, i, s) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.arc(t, e, Math.max(0, i), 0, Math.PI * 2), this.fillAndStroke(this.paint(s, 15));
    });
  }
  ellipse(t, e, i, s, h = 0, n) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.ellipse(t, e, Math.max(0, i), Math.max(0, s), h, 0, Math.PI * 2), this.fillAndStroke(this.paint(n, 15));
    });
  }
  line(t, e, i, s, h) {
    return this.scoped(() => {
      const n = this.paint(h);
      this.ctx.globalAlpha = n.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(i, s), this.stroke({ ...n, stroke: n.stroke ?? n.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  /** A line with an arrowhead at its far end. `head` is the head's length in logical pixels. */
  arrow(t, e, i, s, h, n = 6) {
    const a = this.paint(h), r = a.stroke ?? a.fill ?? 15, c = Math.hypot(i - t, s - e);
    if (!(c > 0)) return this;
    const l = (i - t) / c, u = (s - e) / c, d = Math.min(n, c), g = i - l * d, x = s - u * d, M = d * 0.5;
    return this.line(t, e, g, x, { ...h, stroke: r, fill: void 0, cap: h?.cap ?? "butt" }), this.polygon(
      [{ x: i, y: s }, { x: g - u * M, y: x + l * M }, { x: g + u * M, y: x - l * M }],
      { fill: r, alpha: a.alpha }
    );
  }
  /** Crisp single-pixel horizontal rule. Snapped so it never lands between pixels. */
  hline(t, e, i, s = 15, h = 1) {
    return this.rect({ x: Math.min(t, e), y: Math.round(i), width: Math.abs(e - t), height: h }, { fill: s });
  }
  /** Crisp single-pixel vertical rule. */
  vline(t, e, i, s = 15, h = 1) {
    return this.rect({ x: Math.round(t), y: Math.min(e, i), width: h, height: Math.abs(i - e) }, { fill: s });
  }
  polyline(t, e) {
    return t.length < 2 ? this : this.scoped(() => {
      const i = this.paint(e);
      this.ctx.globalAlpha = i.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let s = 1; s < t.length; s++) this.ctx.lineTo(t[s].x, t[s].y);
      this.stroke({ ...i, stroke: i.stroke ?? i.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  polygon(t, e) {
    return t.length < 2 ? this : this.scoped(() => {
      this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let i = 1; i < t.length; i++) this.ctx.lineTo(t[i].x, t[i].y);
      this.ctx.closePath(), this.fillAndStroke(this.paint(e, 15));
    });
  }
  /** Regular n-gon. `rotation` 0 puts a vertex at the top. */
  regularPolygon(t, e, i, s, h = 0, n) {
    const a = [];
    for (let r = 0; r < s; r++) {
      const c = h - Math.PI / 2 + r * Math.PI * 2 / s;
      a.push({ x: t + Math.cos(c) * i, y: e + Math.sin(c) * i });
    }
    return this.polygon(a, n);
  }
  star(t, e, i, s, h = 5, n = 0, a) {
    const r = [];
    for (let c = 0; c < h * 2; c++) {
      const l = c % 2 === 0 ? i : s, u = n - Math.PI / 2 + c * Math.PI / h;
      r.push({ x: t + Math.cos(u) * l, y: e + Math.sin(u) * l });
    }
    return this.polygon(r, a);
  }
  /** Stroked arc. Angles in radians, 0 = east. */
  arc(t, e, i, s, h, n) {
    return this.scoped(() => {
      const a = this.paint(n);
      this.ctx.globalAlpha = a.alpha ?? 1, this.ctx.beginPath(), this.ctx.arc(t, e, Math.max(0, i), s, h), this.stroke({ ...a, stroke: a.stroke ?? a.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  /** Filled pie slice. */
  sector(t, e, i, s, h, n) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.arc(t, e, Math.max(0, i), s, h), this.ctx.closePath(), this.fillAndStroke(this.paint(n, 15));
    });
  }
  /** Filled annulus segment — a donut slice. */
  ring(t, e, i, s, h = 0, n = Math.PI * 2, a) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.arc(t, e, Math.max(0, i), h, n), this.ctx.arc(t, e, Math.max(0, Math.min(s, i)), n, h, !0), this.ctx.closePath(), this.fillAndStroke(this.paint(a, 15));
    });
  }
  quad(t, e, i, s, h, n, a) {
    return this.scoped(() => {
      const r = this.paint(a);
      this.ctx.globalAlpha = r.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.quadraticCurveTo(i, s, h, n), this.stroke({ ...r, stroke: r.stroke ?? r.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  bezier(t, e, i, s, h, n, a, r, c) {
    return this.scoped(() => {
      const l = this.paint(c);
      this.ctx.globalAlpha = l.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.bezierCurveTo(i, s, h, n, a, r), this.stroke({ ...l, stroke: l.stroke ?? l.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  /** Draw a path, optionally translated and scaled. */
  path(t, e = 0, i = 0, s = 1, h) {
    return this.scoped(() => {
      t.apply(this.ctx, e, i, s), this.fillAndStroke(this.paint(h, 15));
    });
  }
  /** Smooth curve through a set of points (Catmull-Rom converted to beziers). */
  spline(t, e, i = 0.5) {
    return t.length < 3 ? this.polyline(t, e) : this.scoped(() => {
      const s = this.paint(e);
      this.ctx.globalAlpha = s.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let h = 0; h < t.length - 1; h++) {
        const n = t[h - 1] ?? t[h], a = t[h], r = t[h + 1], c = t[h + 2] ?? r;
        this.ctx.bezierCurveTo(
          a.x + (r.x - n.x) / 6 * i * 2,
          a.y + (r.y - n.y) / 6 * i * 2,
          r.x - (c.x - a.x) / 6 * i * 2,
          r.y - (c.y - a.y) / 6 * i * 2,
          r.x,
          r.y
        );
      }
      this.stroke({ ...s, stroke: s.stroke ?? s.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  // ── tone: gradients, dither, patterns ────────────────────────────────────
  /**
   * Dithered linear gradient. Canvas gradients band badly once you quantize to
   * 16 levels, so this computes the ramp per logical pixel and applies an
   * ordered dither. It is the difference between a ramp and a staircase.
   */
  gradient(t, e, i, s = Math.PI / 2) {
    if (!(t.width > 0) || !(t.height > 0)) return this;
    const h = Math.max(1, Math.ceil(t.width)), n = Math.max(1, Math.ceil(t.height)), a = new Uint8Array(h * n), r = Math.cos(s), c = Math.sin(s), l = Math.abs(r) * h + Math.abs(c) * n || 1, u = r < 0 ? h : 0, d = c < 0 ? n : 0;
    for (let g = 0; g < n; g++)
      for (let x = 0; x < h; x++) {
        const M = ((x - u) * r + (g - d) * c) / l;
        a[g * h + x] = G(x, g, e + (i - e) * Math.abs(M));
      }
    return this.blit(a, h, n, t.x, t.y);
  }
  /** Dithered radial gradient, bright at the centre by default. */
  radialGradient(t, e, i, s, h) {
    const n = Math.ceil(i * 2);
    if (!(n > 0)) return this;
    const a = new Uint8Array(n * n);
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const l = Math.hypot(c - i, r - i) / i;
        a[r * n + c] = G(c, r, s + (h - s) * Math.min(1, l));
      }
    return this.blit(a, n, n, t - i, e - i);
  }
  /** Fill an area with a fractional gray level using ordered dithering. */
  ditherRect(t, e) {
    if (!(t.width > 0) || !(t.height > 0)) return this;
    const i = Math.max(1, Math.ceil(t.width)), s = Math.max(1, Math.ceil(t.height)), h = new Uint8Array(i * s);
    for (let n = 0; n < s; n++)
      for (let a = 0; a < i; a++) h[n * i + a] = G(a, n, e);
    return this.blit(h, i, s, t.x, t.y);
  }
  /** Diagonal hatching. `angle` in radians, `spacing` in logical pixels. */
  hatch(t, e = 4, i = 6, s = Math.PI / 4, h = 1) {
    return e > 0 ? this.scoped((n) => {
      n.clipRect(t);
      const a = Math.hypot(t.width, t.height), r = Math.cos(s) * a, c = Math.sin(s) * a, l = -Math.sin(s), u = Math.cos(s), d = t.x + t.width / 2, g = t.y + t.height / 2, x = Math.ceil(a / e);
      for (let M = -x; M <= x; M++) {
        const y = d + l * M * e, v = g + u * M * e;
        n.line(y - r / 2, v - c / 2, y + r / 2, v + c / 2, { stroke: i, width: h, cap: "butt" });
      }
    }) : this;
  }
  /** Regular dot field. Good for backgrounds that need texture without weight. */
  dots(t, e = 6, i = 4, s = 0.6) {
    return e > 0 ? this.scoped((h) => {
      h.clipRect(t);
      for (let n = t.y + e / 2; n < t.y + t.height; n += e)
        for (let a = t.x + e / 2; a < t.x + t.width; a += e)
          h.circle(a, n, s, { fill: i });
    }) : this;
  }
  /** Grid lines. Useful as a chart backdrop or a design overlay. */
  gridLines(t, e, i = e, s = 3) {
    return !(e > 0) || !(i > 0) ? this : this.scoped((h) => {
      h.clipRect(t);
      for (let n = t.x; n <= t.x + t.width; n += e) h.vline(n, t.y, t.y + t.height, s);
      for (let n = t.y; n <= t.y + t.height; n += i) h.hline(t.x, t.x + t.width, n, s);
    });
  }
  /** Copy a level buffer straight onto the surface, nearest-neighbour. */
  blit(t, e, i, s, h) {
    if (!(e > 0) || !(i > 0)) return this;
    if (t.length < e * i)
      throw new Error(`Glyph: blit needs ${e * i} pixels for ${e}×${i}, got ${t.length}.`);
    const n = this.getScratch(e, i), a = n.getContext("2d"), r = a.createImageData(e, i);
    return r.data.set(K(t)), a.putImageData(r, 0, 0), this.scoped(() => {
      this.ctx.imageSmoothingEnabled = !1, this.ctx.drawImage(n, Math.round(s), Math.round(h), e, i);
    });
  }
  /**
   * Draw a photograph, map tile, album cover — anything with more tones than
   * the display has — reduced to 16 levels with dithering.
   *
   * The source must be readable: an image from another origin needs CORS
   * headers and `crossOrigin = "anonymous"`, or the browser will refuse to hand
   * its pixels back.
   */
  image(t, e, i = {}) {
    const s = Math.round(e.width), h = Math.round(e.height);
    if (!(s > 0) || !(h > 0)) return this;
    const n = t, a = (f) => typeof f == "number" ? f : 0, r = a(n.naturalWidth) || a(n.videoWidth) || a(n.displayWidth) || a(n.width), c = a(n.naturalHeight) || a(n.videoHeight) || a(n.displayHeight) || a(n.height);
    if (!(r > 0) || !(c > 0)) return this;
    const u = this.getScratch(s, h).getContext("2d", { willReadFrequently: !0 });
    if (!u) throw new Error("Glyph: Canvas 2D unavailable for image conversion.");
    u.fillStyle = "#000", u.fillRect(0, 0, s, h), u.imageSmoothingEnabled = !0, u.imageSmoothingQuality = "high";
    const d = i.fit ?? "cover";
    if (d === "fill")
      u.drawImage(t, 0, 0, s, h);
    else {
      const f = d === "cover" ? Math.max(s / r, h / c) : Math.min(s / r, h / c), p = r * f, m = c * f;
      u.drawImage(t, (s - p) / 2, (h - m) / 2, p, m);
    }
    let g;
    try {
      g = u.getImageData(0, 0, s, h).data;
    } catch (f) {
      throw new Error(
        `Glyph: the image's pixels cannot be read — it was loaded from another origin without CORS. Set crossOrigin = "anonymous" and serve it with Access-Control-Allow-Origin. (${f instanceof Error ? f.message : f})`
      );
    }
    const x = Number.isFinite(i.brightness) ? i.brightness : 1, M = Number.isFinite(i.contrast) ? i.contrast : 1, y = i.gamma !== void 0 && i.gamma > 0 ? i.gamma : 1, v = A(i.maxLevel ?? 15), T = i.dither ?? "ordered", b = new Float32Array(s * h);
    for (let f = 0, p = 0; f < b.length; f++, p += 4) {
      let m = (0.2126 * g[p] + 0.7152 * g[p + 1] + 0.0722 * g[p + 2]) / 255;
      m = (m - 0.5) * M + 0.5, m *= x, m = m <= 0 ? 0 : m >= 1 ? 1 : y === 1 ? m : Math.pow(m, 1 / y), b[f] = (i.invert ? 1 - m : m) * v;
    }
    const k = new Uint8Array(s * h);
    if (T === "diffusion")
      for (let f = 0; f < h; f++) {
        const p = (f & 1) === 0;
        for (let m = 0; m < s; m++) {
          const E = p ? m : s - 1 - m, S = f * s + E, R = b[S], _ = R <= 0 ? 0 : R >= v ? v : Math.round(R);
          k[S] = _;
          const C = R - _, L = p ? 1 : -1, I = E + L;
          if (I >= 0 && I < s && (b[S + L] += C * (7 / 16)), f + 1 < h) {
            const U = S + s, B = E - L;
            B >= 0 && B < s && (b[U - L] += C * (3 / 16)), b[U] += C * (5 / 16), I >= 0 && I < s && (b[U + L] += C * (1 / 16));
          }
        }
      }
    else if (T === "none")
      for (let f = 0; f < k.length; f++) k[f] = A(b[f]);
    else
      for (let f = 0; f < h; f++)
        for (let p = 0; p < s; p++) k[f * s + p] = Math.min(v, G(p, f, b[f * s + p]));
    return i.radius === void 0 ? this.blit(k, s, h, e.x, e.y) : this.scoped((f) => {
      f.clipRound({ x: Math.round(e.x), y: Math.round(e.y), width: s, height: h }, i.radius), f.blit(k, s, h, e.x, e.y);
    });
  }
  /** Compose another raster onto this one. */
  drawRaster(t, e = 0, i = 0, s = 1) {
    return this.scoped(() => {
      this.ctx.globalAlpha = s, this.ctx.imageSmoothingEnabled = !0, this.ctx.drawImage(t.element, e, i, t.width, t.height);
    });
  }
  /**
   * An offscreen raster with the same supersampling — for layers and masks.
   * Inherits surface style, brightness and the installed font, so a layer draws
   * the same way the surface that produced it does.
   */
  layer(t = this.width, e = this.height) {
    const i = new O({
      width: t,
      height: e,
      supersample: this.scale,
      background: 0,
      createCanvas: this.makeCanvas,
      surface: this.surface,
      brightness: this.brightness
    });
    return this.fontSet && i.useFont(this.fontSet, this.fontMode), i;
  }
  getScratch(t, e) {
    return this.scratch || (this.scratch = this.makeCanvas(t, e)), (this.scratch.width !== t || this.scratch.height !== e) && (this.scratch.width = t, this.scratch.height = e), this.scratch;
  }
  get element() {
    return this.canvas;
  }
  /** Release cached canvases. The raster is unusable afterwards. */
  dispose() {
    this.scratch && (this.scratch.width = 0, this.scratch.height = 0), this.scratch = null, this.fontSet = null, this.canvas.width = 0, this.canvas.height = 0;
  }
  // ── text ─────────────────────────────────────────────────────────────────
  /** Cap height of the style, useful for optical vertical centring. */
  capHeight(t = {}) {
    this.styleObserver?.(t);
    const e = this.faceFor(t);
    if (e) return e.capHeight;
    this.ctx.save(), this.ctx.font = P(t);
    const i = this.ctx.measureText("H");
    return this.ctx.restore(), i.actualBoundingBoxAscent || (t.size ?? 16) * 0.72;
  }
  /**
   * Draw a single line of text.
   * `x` is interpreted according to `hAlign`, `y` according to `vAlign`.
   */
  text(t, e, i, s = {}, h = 15, n = "left", a = "top") {
    this.styleObserver?.(s);
    const r = D(t, s);
    if (r === "") return this;
    this.lintRecords && this.lintText(r, e, i, h);
    const c = this.faceFor(s);
    return c ? this.drawBitmapText(c, r, e, i, s, h, n, a) : this.scoped(() => {
      if (this.ctx.fillStyle = $(h), this.ctx.font = P(s), this.ctx.textBaseline = a === "top" ? "top" : a === "bottom" ? "bottom" : "middle", s.tracking) {
        const l = this.measure(r, s);
        let u = n === "left" ? e : n === "right" ? e - l : e - l / 2;
        this.ctx.textAlign = "left";
        for (const d of r)
          this.ctx.fillText(d, u, i), u += this.ctx.measureText(d).width + s.tracking;
      } else
        this.ctx.textAlign = n === "center" ? "center" : n === "right" ? "right" : "left", this.ctx.fillText(r, e, i);
    });
  }
  /**
   * Bitmap text.
   *
   * Glyphs are blitted from a pre-tinted atlas at whole logical pixels, so the
   * coverage committed to the repository is the coverage on the glasses — no
   * host font stack, no subpixel positioning, no drift between machines.
   */
  drawBitmapText(t, e, i, s, h, n, a, r) {
    const c = h.tracking ?? 0, l = t.measure(e, c), u = h.leading ?? t.lineHeight, d = a === "left" ? i : a === "right" ? i - l : i - l / 2, x = (r === "top" ? s : r === "bottom" ? s - u : s - u / 2) + t.ascent, M = t.tintedAtlas(A(n), this.makeCanvas);
    return this.scoped(() => {
      this.ctx.imageSmoothingEnabled = !1;
      let y = d;
      for (const v of e) {
        const T = t.face.glyphs[v];
        if (!T) {
          y += t.face.fallbackAdvance + c;
          continue;
        }
        const [b, k, f, p, m, E, S] = T;
        f > 0 && p > 0 && this.ctx.drawImage(
          M,
          b,
          k,
          f,
          p,
          Math.round(y + m),
          Math.round(x - E),
          f,
          p
        ), y += S + c;
      }
    });
  }
  /**
   * Draw text into a box, with wrapping, alignment and ellipsis.
   * Returns the height actually consumed, so callers can flow content.
   */
  textBox(t, e, i = {}, s = 15, h = {}) {
    const n = h.hAlign ?? "left", a = h.vAlign ?? "top", r = Q(i), c = h.maxLines ?? Math.max(1, Math.floor(e.height / r)), l = h.wrap === !1 ? [W(this.measure, t, i, e.width)] : Z(this.measure, t, i, e.width, c), u = l.length * r, d = a === "top" ? e.y : a === "bottom" ? e.y + e.height - u : e.y + (e.height - u) / 2, g = n === "left" ? e.x : n === "right" ? e.x + e.width : e.x + e.width / 2;
    return l.forEach((x, M) => {
      this.text(x, g, d + M * r + r / 2, i, s, n, "middle");
    }), u;
  }
  // ── resolve ──────────────────────────────────────────────────────────────
  /**
   * Resolve the supersampled canvas to one byte per pixel at 16 levels.
   * This is the only place the device pixel grid exists.
   *
   * The average is a straight mean of the encoded bytes, deliberately. Every
   * value on this canvas is `level * 17` — a linear encoding of a level, not an
   * sRGB colour — and the panel's output is linear in level, so the arithmetic
   * mean *is* the physically correct one. "Fixing" this with a gamma curve is a
   * plausible-sounding way to make every antialiased edge slightly wrong.
   *
   * Only the red channel is read: everything drawn here is gray by construction.
   */
  toLevels(t) {
    const e = this.scale, i = this.ctx.getImageData(0, 0, this.width * e, this.height * e).data, s = t && t.length === this.width * this.height ? t : new Uint8Array(this.width * this.height), h = e * e, n = this.width * e * 4, a = this.brightness / (h * 17);
    for (let r = 0; r < this.height; r++) {
      const c = r * this.width;
      for (let l = 0; l < this.width; l++) {
        let u = 0;
        for (let d = 0; d < e; d++) {
          let g = (r * e + d) * n + l * e * 4;
          for (let x = 0; x < e; x++, g += 4) u += i[g];
        }
        s[c + l] = A(u * a);
      }
    }
    return s;
  }
}
const H = 4, w = (o, t, e, i, s) => ({ id: o, name: `t${o - 10}`, x: t, y: e, width: i, height: s, zOrder: o - 9 }), j = {
  name: "quadrants",
  note: "288×144 ×4 — the SDK reference layout. Good default.",
  tiles: [w(10, 0, 0, 288, 144), w(11, 288, 0, 288, 144), w(12, 0, 144, 288, 144), w(13, 288, 144, 288, 144)]
}, et = {
  name: "bands",
  note: "576×72 ×4 — for screens that change in horizontal strips (status bar, header, body, footer).",
  tiles: [w(10, 0, 0, 576, 72), w(11, 0, 72, 576, 72), w(12, 0, 144, 576, 72), w(13, 0, 216, 576, 72)]
}, it = {
  name: "columns",
  note: "144×288 ×4 — for side-by-side panels that update independently.",
  tiles: [w(10, 0, 0, 144, 288), w(11, 144, 0, 144, 288), w(12, 288, 0, 144, 288), w(13, 432, 0, 144, 288)]
}, st = {
  name: "chrome",
  note: "576×32 status strip + three 192×256 panels — isolates chrome from content.",
  tiles: [w(10, 0, 0, 576, 32), w(11, 0, 32, 192, 256), w(12, 192, 32, 192, 256), w(13, 384, 32, 192, 256)]
}, ht = {
  name: "hero",
  note: "426×288 hero + a 150-wide rail in three stacked tiles.",
  tiles: [w(10, 0, 0, 426, 288), w(11, 426, 0, 150, 96), w(12, 426, 96, 150, 96), w(13, 426, 192, 150, 96)]
}, gt = {
  quadrants: j,
  bands: et,
  columns: it,
  chrome: st,
  hero: ht
};
function nt(o, t = 576, e = 288) {
  const i = [];
  o.tiles.length > H && i.push(`${o.tiles.length} tiles exceeds the ${H}-container hardware limit (the simulator will accept it; the glasses will not).`);
  const s = new Uint8Array(t * e);
  for (const a of o.tiles) {
    if (a.width % 2 !== 0 && i.push(`tile "${a.name}" has odd width ${a.width}; Gray4 packs two pixels per byte.`), a.x < 0 || a.y < 0 || a.x + a.width > t || a.y + a.height > e) {
      i.push(`tile "${a.name}" (${a.x},${a.y} ${a.width}×${a.height}) falls outside the ${t}×${e} surface.`);
      continue;
    }
    for (let r = 0; r < a.height; r++) {
      const c = (a.y + r) * t + a.x;
      for (let l = 0; l < a.width; l++) s[c + l]++;
    }
  }
  const h = s.reduce((a, r) => a + (r === 0 ? 1 : 0), 0), n = s.reduce((a, r) => a + (r > 1 ? 1 : 0), 0);
  return h && i.push(`${h} pixels are not covered by any tile.`), n && i.push(`${n} pixels are covered by more than one tile.`), i;
}
class xt {
  hashes = /* @__PURE__ */ new Map();
  /** Tiles whose contents differ from the last call. Records them as seen. */
  changed(t) {
    const e = [];
    for (const i of t)
      this.hashes.get(i.id) !== i.hash && (e.push(i), this.hashes.set(i.id, i.hash));
    return e;
  }
  /** Peek without recording — for a transport that may fail to deliver. */
  peek(t) {
    return t.filter((e) => this.differs(e));
  }
  /** Does this one tile differ from what was last accepted? Records nothing. */
  differs(t) {
    return this.hashes.get(t.id) !== t.hash;
  }
  accept(t) {
    this.hashes.set(t.id, t.hash);
  }
  reject(t) {
    this.hashes.delete(t.id);
  }
  /** Forget everything, so the next comparison reports a full repaint. */
  reset() {
    this.hashes.clear();
  }
}
class pt {
  raster;
  tileLayout;
  levels;
  /** One packed Gray4 buffer per tile, reused between frames. */
  packed;
  constructor(t = {}) {
    this.raster = new O(t), this.tileLayout = t.tileLayout ?? j;
    const e = nt(this.tileLayout, this.raster.width, this.raster.height);
    if (e.length > 0)
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":
  ${e.join(`
  `)}`);
    this.levels = new Uint8Array(this.raster.width * this.raster.height), this.packed = this.tileLayout.tiles.map((i) => new Uint8Array(i.width * i.height >> 1));
  }
  get width() {
    return this.raster.width;
  }
  get height() {
    return this.raster.height;
  }
  /** How panels and tracks draw themselves on this frame's surface. */
  get surface() {
    return this.raster.surface;
  }
  set surface(t) {
    this.raster.surface = t;
  }
  /** Release the underlying canvases. */
  dispose() {
    this.raster.dispose();
  }
  /** Paint into the framebuffer. */
  draw(t) {
    return t(this.raster), this;
  }
  /** Resolve to levels only — for the browser preview, which needs no tiling. */
  toLevels() {
    return this.raster.toLevels(this.levels);
  }
  /**
   * Resolve, slice and pack. Pass levels from `toLevels()` to avoid resolving
   * twice. Tiles are packed straight out of the level buffer into reused
   * storage — see the note on buffer lifetime above.
   */
  toFrame(t = this.toLevels()) {
    const e = this.raster.width, i = this.tileLayout.tiles.map((s, h) => {
      const n = this.packed[h], { x: a, y: r, width: c, height: l } = s;
      let u = 0;
      for (let d = 0; d < l; d++) {
        let g = (r + d) * e + a;
        for (let x = 0; x < c; x += 2, g += 2)
          n[u++] = (t[g] & 15) << 4 | t[g + 1] & 15;
      }
      return {
        id: s.id,
        name: s.name,
        rect: { x: a, y: r, width: c, height: l },
        pixels: n,
        hash: Y(n)
      };
    });
    return { width: e, height: this.raster.height, pixels: t, tiles: i };
  }
}
export {
  lt as A,
  N as B,
  X as C,
  Z as D,
  pt as G,
  at as L,
  H as M,
  xt as T,
  dt as a,
  j as b,
  O as c,
  rt as d,
  et as e,
  ft as f,
  st as g,
  it as h,
  ht as i,
  gt as j,
  ot as k,
  Q as l,
  z as m,
  A as n,
  G as o,
  D as p,
  P as q,
  q as r,
  $ as s,
  W as t,
  ut as u,
  nt as v,
  J as w,
  K as x,
  Y as y,
  ct as z
};
