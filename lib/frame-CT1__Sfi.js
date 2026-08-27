const W = 16, tt = 17;
function w(c) {
  return c < 0 ? 0 : c > 15 ? 15 : Math.round(c);
}
function R(c) {
  return Math.round(w(c) * 17);
}
function et(c) {
  return w(c / 17);
}
function M(c) {
  const t = R(c);
  return `rgb(${t},${t},${t})`;
}
function st(c, t, e) {
  const s = e < 0 ? 0 : e > 1 ? 1 : e;
  return c + (t - c) * s;
}
const O = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map((c) => c.map((t) => (t + 0.5) / 16));
function T(c, t, e) {
  const s = e < 0 ? 0 : e > 15 ? 15 : e, i = Math.floor(s), h = s - i, a = O[t & 3][c & 3];
  return w(h > a ? i + 1 : i);
}
function _(c) {
  let t = 2166136261;
  for (let e = 0; e < c.length; e++)
    t ^= c[e], t = Math.imul(t, 16777619);
  return t >>> 0;
}
function F(c, t, e) {
  if (t % 2 !== 0) throw new Error("Glyph: Gray4 packing requires an even tile width.");
  const s = new Uint8Array(t * e >> 1);
  let i = 0;
  for (let h = 0; h < e; h++) {
    const a = h * t;
    for (let n = 0; n < t; n += 2)
      s[i++] = (c[a + n] & 15) << 4 | c[a + n + 1] & 15;
  }
  return s;
}
function it(c, t, e) {
  const s = new Uint8Array(t * e);
  for (let i = 0; i < s.length; i++) {
    const h = c[i >> 1];
    s[i] = (i & 1) === 0 ? h >> 4 & 15 : h & 15;
  }
  return s;
}
function H(c) {
  const t = new Uint8ClampedArray(c.length * 4);
  for (let e = 0; e < c.length; e++) {
    const s = R(c[e]), i = e * 4;
    t[i] = s, t[i + 1] = s, t[i + 2] = s, t[i + 3] = 255;
  }
  return t;
}
function b(c) {
  const t = c.size ?? 16, e = c.weight ?? 500, s = c.font ?? "Inter, Helvetica, Arial, sans-serif";
  return `${c.italic ? "italic " : ""}${e} ${t}px ${s}`;
}
function j(c) {
  return c.leading ?? Math.round((c.size ?? 16) * 1.25);
}
function v(c, t) {
  return t.uppercase ? c.toUpperCase() : c;
}
function q(c) {
  return `${b(c)}|${c.tracking ?? 0}|${c.uppercase ? 1 : 0}`;
}
function S(c, t = 4096) {
  const e = /* @__PURE__ */ new Map();
  return (s, i) => {
    const h = `${q(i)}\0${s}`, a = e.get(h);
    if (a !== void 0) return a;
    const n = c(s, i);
    return e.size >= t && e.clear(), e.set(h, n), n;
  };
}
function N(c, t, e, s) {
  const i = v(t, e), h = [];
  for (const a of i.split(`
`)) {
    if (a === "") {
      h.push("");
      continue;
    }
    let n = "";
    for (const r of a.split(/\s+/)) {
      const o = n ? `${n} ${r}` : r;
      if (c(o, e) <= s || n === "")
        if (c(o, e) > s && n === "") {
          let l = "";
          for (const u of r)
            c(l + u, e) > s && l ? (h.push(l), l = u) : l += u;
          n = l;
        } else
          n = o;
      else
        h.push(n), n = r;
    }
    h.push(n);
  }
  return h;
}
function Y(c, t, e, s, i = "…") {
  const h = v(t, e);
  if (c(h, e) <= s) return h;
  const a = c(i, e);
  let n = "";
  for (const r of h) {
    if (c(n + r, e) + a > s) break;
    n += r;
  }
  return n.trimEnd() + i;
}
function D(c, t, e, s, i) {
  const h = N(c, t, e, s);
  if (h.length <= i) return h;
  const a = h.slice(0, i), n = a[i - 1], r = c("…", e);
  let o = "";
  for (const l of n) {
    if (c(o + l, e) + r > s) break;
    o += l;
  }
  return a[i - 1] = o.trimEnd() + "…", a;
}
function ht(c, t, e, s, i = 1 / 0, h = 9) {
  const a = Math.min(e.size ?? 16, i), n = (u) => ({ ...e, size: a - u });
  if (c(t, n(0)) <= s) return n(0);
  const r = Math.max(0, Math.ceil(a - h));
  if (c(t, n(r)) > s) return n(r);
  let o = 0, l = r;
  for (; l - o > 1; ) {
    const u = o + l >> 1;
    c(t, n(u)) <= s ? l = u : o = u;
  }
  return n(l);
}
const V = { width: 1, cap: "round", join: "round", alpha: 1 };
function P(c) {
  return typeof c == "number" ? [c, c, c, c] : c;
}
class E {
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
    const s = v(t, e), i = this.faceFor(e);
    if (i) return i.measure(s, e.tracking ?? 0);
    this.ctx.save(), this.ctx.font = b(e);
    let h;
    if (e.tracking) {
      h = 0;
      let a = 0;
      for (const n of s)
        h += this.ctx.measureText(n).width, a++;
      a > 1 && (h += e.tracking * (a - 1));
    } else
      h = this.ctx.measureText(s).width;
    return this.ctx.restore(), h;
  };
  /**
   * Width of a string in logical pixels. Memoized — wrapping, truncation and
   * `fitStyle` all re-measure the same unchanged labels on every paint.
   */
  measure = S(this.rawMeasure);
  constructor(t = {}) {
    this.width = t.width ?? 576, this.height = t.height ?? 288, this.scale = t.supersample ?? 2, this.surface = t.surface ?? "outline", this.brightness = t.brightness ?? 1, this.makeCanvas = t.createCanvas ?? ((s, i) => {
      const h = document.createElement("canvas");
      return h.width = s, h.height = i, h;
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
    return this.fontSet = t, this.fontMode = e, this.measure = S(this.rawMeasure), this;
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
    return this.styleObserver = t, this.measure = S(this.rawMeasure), this;
  }
  faceFor(t) {
    if (this.fontMode === "canvas") return null;
    const e = this.fontSet?.find(t) ?? null;
    if (!e && this.fontMode === "bitmap")
      throw new Error(
        `Glyph: no bitmap face for ${b(t)} and fontMode is "bitmap". Add the size to tools/build-font.mjs and re-run \`npm run font\`.`
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
    const s = Math.max(0, Math.min(this.canvas.width - 1, Math.round(t * this.scale))), i = Math.max(0, Math.min(this.canvas.height - 1, Math.round(e * this.scale)));
    return w(this.ctx.getImageData(s, i, 1, 1).data[0] / 17);
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
  backdrop(t, e, s = 4) {
    let i = 15;
    for (let h = -1; h <= 1; h++)
      for (let a = -s; a <= s; a += s) {
        const n = this.sample(t + a, e + h * s);
        n < i && (i = n);
      }
    return i;
  }
  lintText(t, e, s, i) {
    if (!this.lintRecords) return;
    const h = this.backdrop(e, s), a = Math.abs(i - h);
    a < this.lintMinDelta && this.lintRecords.push({ text: t, gray: i, background: h, delta: a, x: e, y: s });
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
  rotateAbout(t, e, s) {
    return this.ctx.translate(t, e), this.ctx.rotate(s), this.ctx.translate(-t, -e), this;
  }
  clipRect(t) {
    return this.ctx.beginPath(), this.ctx.rect(t.x, t.y, t.width, t.height), this.ctx.clip(), this;
  }
  clipRound(t, e) {
    return this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, t.width, t.height, P(e)), this.ctx.clip(), this;
  }
  clipCircle(t, e, s) {
    return this.ctx.beginPath(), this.ctx.arc(t, e, s, 0, Math.PI * 2), this.ctx.clip(), this;
  }
  clipPath(t, e = 0, s = 0, i = 1) {
    return t.apply(this.ctx, e, s, i), this.ctx.clip(), this;
  }
  // ── painting helpers ─────────────────────────────────────────────────────
  paint(t, e) {
    const s = { ...V, ...t };
    return s.fill === void 0 && s.stroke === void 0 && e !== void 0 && (s.fill = e), s;
  }
  stroke(t) {
    t.stroke !== void 0 && (this.ctx.strokeStyle = M(t.stroke), this.ctx.lineWidth = t.width ?? 1, this.ctx.lineCap = t.cap ?? "round", this.ctx.lineJoin = t.join ?? "round", this.ctx.setLineDash(t.dash ?? []), this.ctx.lineDashOffset = t.dashOffset ?? 0, this.ctx.stroke(), this.ctx.setLineDash([]));
  }
  fillAndStroke(t) {
    this.ctx.globalAlpha = t.alpha ?? 1, t.fill !== void 0 && (this.ctx.fillStyle = M(t.fill), this.ctx.fill()), this.stroke(t), this.ctx.globalAlpha = 1;
  }
  // ── primitives ───────────────────────────────────────────────────────────
  clear(t = 0) {
    return this.scoped(() => {
      this.ctx.globalAlpha = 1, this.ctx.fillStyle = M(t), this.ctx.fillRect(0, 0, this.width, this.height);
    });
  }
  /** Set a single logical pixel. */
  pixel(t, e, s) {
    return this.scoped(() => {
      this.ctx.fillStyle = M(s), this.ctx.fillRect(Math.floor(t), Math.floor(e), 1, 1);
    });
  }
  rect(t, e) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.rect(t.x, t.y, t.width, t.height), this.fillAndStroke(this.paint(e, 15));
    });
  }
  roundRect(t, e = 8, s) {
    const i = Math.min(t.width, t.height) / 2, h = P(e).map((a) => Math.max(0, Math.min(a, i)));
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, t.width, t.height, h), this.fillAndStroke(this.paint(s, 15));
    });
  }
  circle(t, e, s, i) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.arc(t, e, Math.max(0, s), 0, Math.PI * 2), this.fillAndStroke(this.paint(i, 15));
    });
  }
  ellipse(t, e, s, i, h = 0, a) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.ellipse(t, e, Math.max(0, s), Math.max(0, i), h, 0, Math.PI * 2), this.fillAndStroke(this.paint(a, 15));
    });
  }
  line(t, e, s, i, h) {
    return this.scoped(() => {
      const a = this.paint(h);
      this.ctx.globalAlpha = a.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(s, i), this.stroke({ ...a, stroke: a.stroke ?? a.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  /** Crisp single-pixel horizontal rule. Snapped so it never lands between pixels. */
  hline(t, e, s, i = 15, h = 1) {
    return this.rect({ x: Math.min(t, e), y: Math.round(s), width: Math.abs(e - t), height: h }, { fill: i });
  }
  /** Crisp single-pixel vertical rule. */
  vline(t, e, s, i = 15, h = 1) {
    return this.rect({ x: Math.round(t), y: Math.min(e, s), width: h, height: Math.abs(s - e) }, { fill: i });
  }
  polyline(t, e) {
    return t.length < 2 ? this : this.scoped(() => {
      const s = this.paint(e);
      this.ctx.globalAlpha = s.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let i = 1; i < t.length; i++) this.ctx.lineTo(t[i].x, t[i].y);
      this.stroke({ ...s, stroke: s.stroke ?? s.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  polygon(t, e) {
    return t.length < 2 ? this : this.scoped(() => {
      this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let s = 1; s < t.length; s++) this.ctx.lineTo(t[s].x, t[s].y);
      this.ctx.closePath(), this.fillAndStroke(this.paint(e, 15));
    });
  }
  /** Regular n-gon. `rotation` 0 puts a vertex at the top. */
  regularPolygon(t, e, s, i, h = 0, a) {
    const n = [];
    for (let r = 0; r < i; r++) {
      const o = h - Math.PI / 2 + r * Math.PI * 2 / i;
      n.push({ x: t + Math.cos(o) * s, y: e + Math.sin(o) * s });
    }
    return this.polygon(n, a);
  }
  star(t, e, s, i, h = 5, a = 0, n) {
    const r = [];
    for (let o = 0; o < h * 2; o++) {
      const l = o % 2 === 0 ? s : i, u = a - Math.PI / 2 + o * Math.PI / h;
      r.push({ x: t + Math.cos(u) * l, y: e + Math.sin(u) * l });
    }
    return this.polygon(r, n);
  }
  /** Stroked arc. Angles in radians, 0 = east. */
  arc(t, e, s, i, h, a) {
    return this.scoped(() => {
      const n = this.paint(a);
      this.ctx.globalAlpha = n.alpha ?? 1, this.ctx.beginPath(), this.ctx.arc(t, e, Math.max(0, s), i, h), this.stroke({ ...n, stroke: n.stroke ?? n.fill ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  /** Filled pie slice. */
  sector(t, e, s, i, h, a) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.arc(t, e, s, i, h), this.ctx.closePath(), this.fillAndStroke(this.paint(a, 15));
    });
  }
  /** Filled annulus segment — a donut slice. */
  ring(t, e, s, i, h = 0, a = Math.PI * 2, n) {
    return this.scoped(() => {
      this.ctx.beginPath(), this.ctx.arc(t, e, s, h, a), this.ctx.arc(t, e, i, a, h, !0), this.ctx.closePath(), this.fillAndStroke(this.paint(n, 15));
    });
  }
  quad(t, e, s, i, h, a, n) {
    return this.scoped(() => {
      const r = this.paint(n);
      this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.quadraticCurveTo(s, i, h, a), this.stroke({ ...r, stroke: r.stroke ?? 15 });
    });
  }
  bezier(t, e, s, i, h, a, n, r, o) {
    return this.scoped(() => {
      const l = this.paint(o);
      this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.bezierCurveTo(s, i, h, a, n, r), this.stroke({ ...l, stroke: l.stroke ?? 15 });
    });
  }
  /** Draw a path, optionally translated and scaled. */
  path(t, e = 0, s = 0, i = 1, h) {
    return this.scoped(() => {
      t.apply(this.ctx, e, s, i), this.fillAndStroke(this.paint(h, 15));
    });
  }
  /** Smooth curve through a set of points (Catmull-Rom converted to beziers). */
  spline(t, e, s = 0.5) {
    return t.length < 3 ? this.polyline(t, e) : this.scoped(() => {
      const i = this.paint(e);
      this.ctx.globalAlpha = i.alpha ?? 1, this.ctx.beginPath(), this.ctx.moveTo(t[0].x, t[0].y);
      for (let h = 0; h < t.length - 1; h++) {
        const a = t[h - 1] ?? t[h], n = t[h], r = t[h + 1], o = t[h + 2] ?? r;
        this.ctx.bezierCurveTo(
          n.x + (r.x - a.x) / 6 * s * 2,
          n.y + (r.y - a.y) / 6 * s * 2,
          r.x - (o.x - n.x) / 6 * s * 2,
          r.y - (o.y - n.y) / 6 * s * 2,
          r.x,
          r.y
        );
      }
      this.stroke({ ...i, stroke: i.stroke ?? 15 }), this.ctx.globalAlpha = 1;
    });
  }
  // ── tone: gradients, dither, patterns ────────────────────────────────────
  /**
   * Dithered linear gradient. Canvas gradients band badly once you quantize to
   * 16 levels, so this computes the ramp per logical pixel and applies an
   * ordered dither. It is the difference between a ramp and a staircase.
   */
  gradient(t, e, s, i = Math.PI / 2) {
    const h = Math.max(1, Math.ceil(t.width)), a = Math.max(1, Math.ceil(t.height)), n = new Uint8Array(h * a), r = Math.cos(i), o = Math.sin(i), l = Math.abs(r) * h + Math.abs(o) * a || 1, u = r < 0 ? h : 0, x = o < 0 ? a : 0;
    for (let g = 0; g < a; g++)
      for (let f = 0; f < h; f++) {
        const p = ((f - u) * r + (g - x) * o) / l;
        n[g * h + f] = T(f, g, e + (s - e) * Math.abs(p));
      }
    return this.blit(n, h, a, t.x, t.y);
  }
  /** Dithered radial gradient, bright at the centre by default. */
  radialGradient(t, e, s, i, h) {
    const a = Math.ceil(s * 2), n = new Uint8Array(a * a);
    for (let r = 0; r < a; r++)
      for (let o = 0; o < a; o++) {
        const l = Math.hypot(o - s, r - s) / s;
        n[r * a + o] = T(o, r, i + (h - i) * Math.min(1, l));
      }
    return this.blit(n, a, a, t - s, e - s);
  }
  /** Fill an area with a fractional gray level using ordered dithering. */
  ditherRect(t, e) {
    const s = Math.max(1, Math.ceil(t.width)), i = Math.max(1, Math.ceil(t.height)), h = new Uint8Array(s * i);
    for (let a = 0; a < i; a++)
      for (let n = 0; n < s; n++) h[a * s + n] = T(n, a, e);
    return this.blit(h, s, i, t.x, t.y);
  }
  /** Diagonal hatching. `angle` in radians, `spacing` in logical pixels. */
  hatch(t, e = 4, s = 6, i = Math.PI / 4, h = 1) {
    return this.scoped((a) => {
      a.clipRect(t);
      const n = Math.hypot(t.width, t.height), r = Math.cos(i) * n, o = Math.sin(i) * n, l = -Math.sin(i), u = Math.cos(i), x = t.x + t.width / 2, g = t.y + t.height / 2, f = Math.ceil(n / e);
      for (let p = -f; p <= f; p++) {
        const m = x + l * p * e, y = g + u * p * e;
        a.line(m - r / 2, y - o / 2, m + r / 2, y + o / 2, { stroke: s, width: h, cap: "butt" });
      }
    });
  }
  /** Regular dot field. Good for backgrounds that need texture without weight. */
  dots(t, e = 6, s = 4, i = 0.6) {
    return this.scoped((h) => {
      h.clipRect(t);
      for (let a = t.y + e / 2; a < t.y + t.height; a += e)
        for (let n = t.x + e / 2; n < t.x + t.width; n += e)
          h.circle(n, a, i, { fill: s });
    });
  }
  /** Grid lines. Useful as a chart backdrop or a design overlay. */
  gridLines(t, e, s = e, i = 3) {
    return this.scoped((h) => {
      h.clipRect(t);
      for (let a = t.x; a <= t.x + t.width; a += e) h.vline(a, t.y, t.y + t.height, i);
      for (let a = t.y; a <= t.y + t.height; a += s) h.hline(t.x, t.x + t.width, a, i);
    });
  }
  /** Copy a level buffer straight onto the surface, nearest-neighbour. */
  blit(t, e, s, i, h) {
    const a = this.getScratch(e, s), n = a.getContext("2d"), r = n.createImageData(e, s);
    return r.data.set(H(t)), n.putImageData(r, 0, 0), this.scoped(() => {
      this.ctx.imageSmoothingEnabled = !1, this.ctx.drawImage(a, Math.round(i), Math.round(h), e, s);
    });
  }
  /** Compose another raster onto this one. */
  drawRaster(t, e = 0, s = 0, i = 1) {
    return this.scoped(() => {
      this.ctx.globalAlpha = i, this.ctx.imageSmoothingEnabled = !0, this.ctx.drawImage(t.element, e, s, t.width, t.height);
    });
  }
  /**
   * An offscreen raster with the same supersampling — for layers and masks.
   * Inherits surface style, brightness and the installed font, so a layer draws
   * the same way the surface that produced it does.
   */
  layer(t = this.width, e = this.height) {
    const s = new E({
      width: t,
      height: e,
      supersample: this.scale,
      background: 0,
      createCanvas: this.makeCanvas,
      surface: this.surface,
      brightness: this.brightness
    });
    return this.fontSet && s.useFont(this.fontSet, this.fontMode), s;
  }
  getScratch(t, e) {
    return this.scratch || (this.scratch = this.makeCanvas(t, e)), (this.scratch.width !== t || this.scratch.height !== e) && (this.scratch.width = t, this.scratch.height = e), this.scratch;
  }
  get element() {
    return this.canvas;
  }
  /** Release cached canvases. The raster is unusable afterwards. */
  dispose() {
    this.scratch = null, this.fontSet = null, this.canvas.width = 0, this.canvas.height = 0;
  }
  // ── text ─────────────────────────────────────────────────────────────────
  /** Cap height of the style, useful for optical vertical centring. */
  capHeight(t = {}) {
    this.styleObserver?.(t);
    const e = this.faceFor(t);
    if (e) return e.capHeight;
    this.ctx.save(), this.ctx.font = b(t);
    const s = this.ctx.measureText("H");
    return this.ctx.restore(), s.actualBoundingBoxAscent || (t.size ?? 16) * 0.72;
  }
  /**
   * Draw a single line of text.
   * `x` is interpreted according to `hAlign`, `y` according to `vAlign`.
   */
  text(t, e, s, i = {}, h = 15, a = "left", n = "top") {
    this.styleObserver?.(i);
    const r = v(t, i);
    if (r === "") return this;
    this.lintRecords && this.lintText(r, e, s, h);
    const o = this.faceFor(i);
    return o ? this.drawBitmapText(o, r, e, s, i, h, a, n) : this.scoped(() => {
      if (this.ctx.fillStyle = M(h), this.ctx.font = b(i), this.ctx.textBaseline = n === "top" ? "top" : n === "bottom" ? "bottom" : "middle", i.tracking) {
        const l = this.measure(r, i);
        let u = a === "left" ? e : a === "right" ? e - l : e - l / 2;
        this.ctx.textAlign = "left";
        for (const x of r)
          this.ctx.fillText(x, u, s), u += this.ctx.measureText(x).width + i.tracking;
      } else
        this.ctx.textAlign = a === "center" ? "center" : a === "right" ? "right" : "left", this.ctx.fillText(r, e, s);
    });
  }
  /**
   * Bitmap text.
   *
   * Glyphs are blitted from a pre-tinted atlas at whole logical pixels, so the
   * coverage committed to the repository is the coverage on the glasses — no
   * host font stack, no subpixel positioning, no drift between machines.
   */
  drawBitmapText(t, e, s, i, h, a, n, r) {
    const o = h.tracking ?? 0, l = t.measure(e, o), u = h.leading ?? t.lineHeight, x = n === "left" ? s : n === "right" ? s - l : s - l / 2, f = (r === "top" ? i : r === "bottom" ? i - u : i - u / 2) + t.ascent, p = t.tintedAtlas(w(a), this.makeCanvas);
    return this.scoped(() => {
      this.ctx.imageSmoothingEnabled = !1;
      let m = x;
      for (const y of e) {
        const L = t.face.glyphs[y];
        if (!L) {
          m += t.face.fallbackAdvance + o;
          continue;
        }
        const [C, G, k, A, z, B, U] = L;
        k > 0 && A > 0 && this.ctx.drawImage(
          p,
          C,
          G,
          k,
          A,
          Math.round(m + z),
          Math.round(f - B),
          k,
          A
        ), m += U + o;
      }
    });
  }
  /**
   * Draw text into a box, with wrapping, alignment and ellipsis.
   * Returns the height actually consumed, so callers can flow content.
   */
  textBox(t, e, s = {}, i = 15, h = {}) {
    const a = h.hAlign ?? "left", n = h.vAlign ?? "top", r = j(s), o = h.maxLines ?? Math.max(1, Math.floor(e.height / r)), l = h.wrap === !1 ? [Y(this.measure, t, s, e.width)] : D(this.measure, t, s, e.width, o), u = l.length * r, x = n === "top" ? e.y : n === "bottom" ? e.y + e.height - u : e.y + (e.height - u) / 2, g = a === "left" ? e.x : a === "right" ? e.x + e.width : e.x + e.width / 2;
    return l.forEach((f, p) => {
      this.text(f, g, x + p * r + r / 2, s, i, a, "middle");
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
    const e = this.scale, s = this.ctx.getImageData(0, 0, this.width * e, this.height * e).data, i = t && t.length === this.width * this.height ? t : new Uint8Array(this.width * this.height), h = e * e, a = this.width * e * 4, n = this.brightness / (h * 17);
    for (let r = 0; r < this.height; r++) {
      const o = r * this.width;
      for (let l = 0; l < this.width; l++) {
        let u = 0;
        for (let x = 0; x < e; x++) {
          let g = (r * e + x) * a + l * e * 4;
          for (let f = 0; f < e; f++, g += 4) u += s[g];
        }
        i[o + l] = w(u * n);
      }
    }
    return i;
  }
}
const $ = 4, d = (c, t, e, s, i) => ({ id: c, name: `t${c - 10}`, x: t, y: e, width: s, height: i, zOrder: c - 9 }), I = {
  name: "quadrants",
  note: "288×144 ×4 — the SDK reference layout. Good default.",
  tiles: [d(10, 0, 0, 288, 144), d(11, 288, 0, 288, 144), d(12, 0, 144, 288, 144), d(13, 288, 144, 288, 144)]
}, X = {
  name: "bands",
  note: "576×72 ×4 — for screens that change in horizontal strips (status bar, header, body, footer).",
  tiles: [d(10, 0, 0, 576, 72), d(11, 0, 72, 576, 72), d(12, 0, 144, 576, 72), d(13, 0, 216, 576, 72)]
}, K = {
  name: "columns",
  note: "144×288 ×4 — for side-by-side panels that update independently.",
  tiles: [d(10, 0, 0, 144, 288), d(11, 144, 0, 144, 288), d(12, 288, 0, 144, 288), d(13, 432, 0, 144, 288)]
}, J = {
  name: "chrome",
  note: "576×32 status strip + three 192×256 panels — isolates chrome from content.",
  tiles: [d(10, 0, 0, 576, 32), d(11, 0, 32, 192, 256), d(12, 192, 32, 192, 256), d(13, 384, 32, 192, 256)]
}, Q = {
  name: "hero",
  note: "426×288 hero + a 150-wide rail in three stacked tiles.",
  tiles: [d(10, 0, 0, 426, 288), d(11, 426, 0, 150, 96), d(12, 426, 96, 150, 96), d(13, 426, 192, 150, 96)]
}, nt = {
  quadrants: I,
  bands: X,
  columns: K,
  chrome: J,
  hero: Q
};
function Z(c, t = 576, e = 288) {
  const s = [];
  c.tiles.length > $ && s.push(`${c.tiles.length} tiles exceeds the ${$}-container hardware limit (the simulator will accept it; the glasses will not).`);
  const i = new Uint8Array(t * e);
  for (const n of c.tiles) {
    if (n.width % 2 !== 0 && s.push(`tile "${n.name}" has odd width ${n.width}; Gray4 packs two pixels per byte.`), n.x < 0 || n.y < 0 || n.x + n.width > t || n.y + n.height > e) {
      s.push(`tile "${n.name}" (${n.x},${n.y} ${n.width}×${n.height}) falls outside the ${t}×${e} surface.`);
      continue;
    }
    for (let r = 0; r < n.height; r++) {
      const o = (n.y + r) * t + n.x;
      for (let l = 0; l < n.width; l++) i[o + l]++;
    }
  }
  const h = i.reduce((n, r) => n + (r === 0 ? 1 : 0), 0), a = i.reduce((n, r) => n + (r > 1 ? 1 : 0), 0);
  return h && s.push(`${h} pixels are not covered by any tile.`), a && s.push(`${a} pixels are covered by more than one tile.`), s;
}
class at {
  hashes = /* @__PURE__ */ new Map();
  /** Tiles whose contents differ from the last call. Records them as seen. */
  changed(t) {
    const e = [];
    for (const s of t)
      this.hashes.get(s.id) !== s.hash && (e.push(s), this.hashes.set(s.id, s.hash));
    return e;
  }
  /** Peek without recording — for a transport that may fail to deliver. */
  peek(t) {
    return t.filter((e) => this.hashes.get(e.id) !== e.hash);
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
class rt {
  raster;
  tileLayout;
  levels;
  tileBuffers;
  constructor(t = {}) {
    this.raster = new E(t), this.tileLayout = t.tileLayout ?? I;
    const e = Z(this.tileLayout, this.raster.width, this.raster.height);
    if (e.length > 0)
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":
  ${e.join(`
  `)}`);
    this.levels = new Uint8Array(this.raster.width * this.raster.height), this.tileBuffers = this.tileLayout.tiles.map((s) => new Uint8Array(s.width * s.height));
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
  /** Resolve, slice and pack. Pass levels from `toLevels()` to avoid resolving twice. */
  toFrame(t = this.toLevels()) {
    const e = this.raster.width, s = this.tileLayout.tiles.map((i, h) => {
      const a = this.tileBuffers[h];
      for (let r = 0; r < i.height; r++) {
        const o = (i.y + r) * e + i.x;
        a.set(t.subarray(o, o + i.width), r * i.width);
      }
      const n = F(a, i.width, i.height);
      return {
        id: i.id,
        name: i.name,
        rect: { x: i.x, y: i.y, width: i.width, height: i.height },
        pixels: n,
        hash: _(n)
      };
    });
    return { width: e, height: this.raster.height, pixels: t, tiles: s };
  }
}
export {
  N as A,
  O as B,
  D as C,
  rt as G,
  W as L,
  $ as M,
  at as T,
  I as a,
  E as b,
  tt as c,
  X as d,
  J as e,
  ht as f,
  K as g,
  Q as h,
  nt as i,
  et as j,
  S as k,
  w as l,
  T as m,
  b as n,
  R as o,
  v as p,
  M as q,
  H as r,
  _ as s,
  Y as t,
  it as u,
  Z as v,
  j as w,
  st as x,
  F as y,
  q as z
};
