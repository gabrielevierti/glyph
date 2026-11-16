import { u as At, p as Ft, a as at, t as S, f as bt, M as Ht, v as Pt, T as Nt, G as $t, b as zt, l as J, w as rt } from "./chunks/frame.js";
import { B as sn, c as cn, L as hn, d as ln, e as dn, g as fn, h as un, i as Mn, j as mn, k as xn, m as yn, n as wn, o as Ln, q as Hn, r as gn, s as Vn, x as Cn, y as bn, z as kn, A as pn, C as vn, D as Zn } from "./chunks/frame.js";
function Bt(e) {
  if (typeof atob == "function") {
    const i = atob(e), n = new Uint8Array(i.length);
    for (let o = 0; o < i.length; o++) n[o] = i.charCodeAt(o);
    return n;
  }
  const t = globalThis.Buffer;
  if (!t) throw new Error("Glyph: no base64 decoder available.");
  return t.from(e, "base64");
}
function Gt(e) {
  return ((e.font ?? "Inter").split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase();
}
function gt(e, t, i, n) {
  return `${e}|${t}|${i}|${n ? 1 : 0}`;
}
class Wt {
  face;
  /** One byte of coverage (0..15) per pixel of the atlas. */
  coverage;
  tinted = /* @__PURE__ */ new Map();
  constructor(t) {
    this.face = t, this.coverage = At(Bt(t.data), t.width, t.height);
  }
  get lineHeight() {
    return this.face.lineHeight;
  }
  get ascent() {
    return this.face.ascent;
  }
  get capHeight() {
    return this.face.capHeight;
  }
  advanceOf(t) {
    return this.face.glyphs[t]?.[6] ?? this.face.fallbackAdvance;
  }
  /** Width of a string, tracking included. Integer arithmetic, so exactly reproducible. */
  measure(t, i = 0) {
    let n = 0, o = 0;
    for (const a of t)
      n += this.advanceOf(a), o++;
    return n + (o > 1 ? i * (o - 1) : 0);
  }
  /**
   * An atlas tinted to one gray level, with coverage as alpha.
   *
   * Built once per level per face and cached: drawing text becomes a series of
   * `drawImage` calls out of a canvas the browser already has in VRAM, which is
   * both faster and more deterministic than re-rasterizing outlines.
   */
  tintedAtlas(t, i) {
    const n = this.tinted.get(t);
    if (n) return n;
    const { width: o, height: a } = this.face, s = i(o, a);
    s.width = o, s.height = a;
    const c = s.getContext("2d", { alpha: !0 });
    if (!c) throw new Error("Glyph: Canvas 2D unavailable for font tinting.");
    const h = c.createImageData(o, a), l = Math.round(Math.max(0, Math.min(15, t)) * 17);
    for (let d = 0; d < this.coverage.length; d++) {
      const f = d * 4;
      h.data[f] = l, h.data[f + 1] = l, h.data[f + 2] = l, h.data[f + 3] = this.coverage[d] * 17;
    }
    return c.putImageData(h, 0, 0), this.tinted.set(t, s), s;
  }
  dispose() {
    this.tinted.clear();
  }
}
class Dt {
  faces = /* @__PURE__ */ new Map();
  constructor(t) {
    for (const i of t.faces)
      this.faces.set(gt(i.family, i.weight, i.size, i.italic ?? !1), new Wt(i));
  }
  /** The face for a style, or null if this set was not built for that style. */
  find(t) {
    const i = Number(t.weight ?? 500), n = Math.round(t.size ?? 16);
    return this.faces.get(gt(Gt(t), i, n, t.italic ?? !1)) ?? null;
  }
  has(t) {
    return this.find(t) !== null;
  }
  /** Every (family, weight, size) this set covers. Used by the diagnostics screen. */
  keys() {
    return [...this.faces.keys()].sort();
  }
  dispose() {
    for (const t of this.faces.values()) t.dispose();
    this.faces.clear();
  }
}
async function Ze(e) {
  const t = await fetch(e);
  if (!t.ok) throw new Error(`Glyph: could not load font atlas ${e} (${t.status}).`);
  const i = await t.json();
  if (i.version !== 1) throw new Error(`Glyph: unsupported font atlas version ${i.version}.`);
  return new Dt(i);
}
function Oe(e, t, i) {
  return {
    width: e.measure(Ft(i, t), t.tracking ?? 0),
    height: t.leading ?? e.lineHeight
  };
}
function Re(e, t, i, n) {
  return { x: e, y: t, width: i, height: n };
}
function Se(e, t = e, i = e, n = t) {
  return { top: e, right: t, bottom: i, left: n };
}
const Ee = (e) => e.x, V = (e) => e.x + e.width, Ie = (e) => e.y, k = (e) => e.y + e.height, N = (e) => e.x + e.width / 2, I = (e) => e.y + e.height / 2, Te = (e) => ({ x: N(e), y: I(e) });
function U(e, t) {
  const i = typeof t == "number" ? { top: t, right: t, bottom: t, left: t } : { top: 0, right: 0, bottom: 0, left: 0, ...t };
  return {
    x: e.x + i.left,
    y: e.y + i.top,
    width: Math.max(0, e.width - i.left - i.right),
    height: Math.max(0, e.height - i.top - i.bottom)
  };
}
function Ae(e, t) {
  return U(e, -t);
}
function Fe(e, t, i) {
  return { x: e.x + t, y: e.y + i, width: e.width, height: e.height };
}
function Pe(e, t) {
  return t.x >= e.x && t.x <= V(e) && t.y >= e.y && t.y <= k(e);
}
function Ne(e, t) {
  return !(V(e) <= t.x || V(t) <= e.x || k(e) <= t.y || k(t) <= e.y);
}
function $e(e, t) {
  const i = Math.max(e.x, t.x), n = Math.max(e.y, t.y);
  return {
    x: i,
    y: n,
    width: Math.max(0, Math.min(V(e), V(t)) - i),
    height: Math.max(0, Math.min(k(e), k(t)) - n)
  };
}
function ze(e, t) {
  const i = Math.min(e.x, t.x), n = Math.min(e.y, t.y);
  return { x: i, y: n, width: Math.max(V(e), V(t)) - i, height: Math.max(k(e), k(t)) - n };
}
function jt(e, t, i = "center", n = "middle") {
  const o = i === "left" ? e.x : i === "right" ? V(e) - t.width : e.x + (e.width - t.width) / 2, a = n === "top" ? e.y : n === "bottom" ? k(e) - t.height : e.y + (e.height - t.height) / 2;
  return { x: o, y: a, width: t.width, height: t.height };
}
function Be(e, t) {
  const i = Math.min(e.width, e.height * t), n = i / t;
  return jt(e, { width: i, height: n });
}
function Ge(e, t, i = 0) {
  const n = t.reduce((c, h) => c + h, 0) || 1, o = e.width - i * (t.length - 1), a = [];
  let s = e.x;
  for (const c of t) {
    const h = o * c / n;
    a.push({ x: s, y: e.y, width: h, height: e.height }), s += h + i;
  }
  return a;
}
function We(e, t, i = 0) {
  const n = t.reduce((c, h) => c + h, 0) || 1, o = e.height - i * (t.length - 1), a = [];
  let s = e.y;
  for (const c of t) {
    const h = o * c / n;
    a.push({ x: e.x, y: s, width: e.width, height: h }), s += h + i;
  }
  return a;
}
function De(e, t, i, n = 0, o = n) {
  const a = (e.width - n * (t - 1)) / t, s = (e.height - o * (i - 1)) / i, c = [];
  for (let h = 0; h < i; h++)
    for (let l = 0; l < t; l++)
      c.push({ x: e.x + l * (a + n), y: e.y + h * (s + o), width: a, height: s });
  return c;
}
function je(e) {
  const t = Math.round(e.x), i = Math.round(e.y);
  return { x: t, y: i, width: Math.round(e.x + e.width) - t, height: Math.round(e.y + e.height) - i };
}
function F(e, t, i, n) {
  return { x: e + Math.cos(n) * i, y: t + Math.sin(n) * i };
}
function Y(e) {
  return (e - 90) * Math.PI / 180;
}
const Ye = (e) => e * 180 / Math.PI, qe = (e) => e * Math.PI / 180;
function T(e, t, i) {
  return e < t ? t : e > i ? i : e;
}
function _e(e, t, i) {
  return e + (t - e) * i;
}
function q(e, t, i, n, o) {
  return i === t ? n : T(n + (e - t) / (i - t) * (o - n), Math.min(n, o), Math.max(n, o));
}
class Yt {
  commands = [];
  moveTo(t, i) {
    return this.commands.push({ op: "M", x: t, y: i }), this;
  }
  lineTo(t, i) {
    return this.commands.push({ op: "L", x: t, y: i }), this;
  }
  quadTo(t, i, n, o) {
    return this.commands.push({ op: "Q", cx: t, cy: i, x: n, y: o }), this;
  }
  curveTo(t, i, n, o, a, s) {
    return this.commands.push({ op: "C", c1x: t, c1y: i, c2x: n, c2y: o, x: a, y: s }), this;
  }
  arc(t, i, n, o, a, s = !1) {
    return this.commands.push({ op: "A", cx: t, cy: i, r: n, start: o, end: a, ccw: s }), this;
  }
  close() {
    return this.commands.push({ op: "Z" }), this;
  }
  /** Append a run of points as a polyline. */
  polyline(t) {
    return t.forEach((i, n) => n === 0 ? this.moveTo(i.x, i.y) : this.lineTo(i.x, i.y)), this;
  }
  /** Replay into a 2D context, optionally translated and scaled. */
  apply(t, i = 0, n = 0, o = 1) {
    t.beginPath();
    for (const a of this.commands)
      switch (a.op) {
        case "M":
          t.moveTo(i + a.x * o, n + a.y * o);
          break;
        case "L":
          t.lineTo(i + a.x * o, n + a.y * o);
          break;
        case "Q":
          t.quadraticCurveTo(i + a.cx * o, n + a.cy * o, i + a.x * o, n + a.y * o);
          break;
        case "C":
          t.bezierCurveTo(
            i + a.c1x * o,
            n + a.c1y * o,
            i + a.c2x * o,
            n + a.c2y * o,
            i + a.x * o,
            n + a.y * o
          );
          break;
        case "A":
          t.arc(i + a.cx * o, n + a.cy * o, a.r * o, a.start, a.end, a.ccw);
          break;
        case "Z":
          t.closePath();
          break;
      }
  }
  /** Axis-aligned bounds of the control points. Approximate for curves. */
  bounds() {
    let t = 1 / 0, i = 1 / 0, n = -1 / 0, o = -1 / 0;
    const a = (s, c) => {
      s < t && (t = s), s > n && (n = s), c < i && (i = c), c > o && (o = c);
    };
    for (const s of this.commands)
      if (s.op !== "Z") {
        if (s.op === "A") {
          a(s.cx - s.r, s.cy - s.r), a(s.cx + s.r, s.cy + s.r);
          continue;
        }
        s.op === "C" && (a(s.c1x, s.c1y), a(s.c2x, s.c2y)), s.op === "Q" && a(s.cx, s.cy), a(s.x, s.y);
      }
    return t === 1 / 0 ? { x: 0, y: 0, width: 0, height: 0 } : { x: t, y: i, width: n - t, height: o - i };
  }
}
function qt(e) {
  const t = new Yt(), i = e.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  let n = 0, o = 0, a = 0;
  const s = () => Number(i[n++]);
  for (; n < i.length; )
    switch (i[n++]) {
      case "M":
        o = s(), a = s(), t.moveTo(o, a);
        break;
      case "L":
        o = s(), a = s(), t.lineTo(o, a);
        break;
      case "H":
        o = s(), t.lineTo(o, a);
        break;
      case "V":
        a = s(), t.lineTo(o, a);
        break;
      case "Q": {
        const h = s(), l = s();
        o = s(), a = s(), t.quadTo(h, l, o, a);
        break;
      }
      case "C": {
        const h = s(), l = s(), d = s(), f = s();
        o = s(), a = s(), t.curveTo(h, l, d, f, o, a);
        break;
      }
      case "O": {
        const h = s(), l = s(), d = s();
        t.moveTo(h + d, l), t.arc(h, l, d, 0, Math.PI * 2);
        break;
      }
      case "Z":
        t.close();
        break;
    }
  return t;
}
const r = {
  off: 0,
  // background — the display is genuinely off here
  sunken: 1,
  // recessed wells
  surface: 2,
  // card and panel fills
  raised: 3,
  // hover / selected fills
  hairline: 4,
  // faint separators
  border: 5,
  // visible borders
  disabled: 6,
  // inactive glyphs
  tertiary: 7,
  // captions, units
  secondary: 9,
  // labels, supporting text
  primary: 11,
  // body text
  strong: 13,
  // emphasis, icons
  max: 15
  // headline numerals, focus
}, _ = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif", ht = "SF Mono, ui-monospace, Menlo, Consolas, monospace", x = {
  hero: { font: _, size: 64, weight: 800, leading: 62 },
  display: { font: _, size: 46, weight: 800, leading: 46 },
  displaySm: { font: _, size: 34, weight: 800, leading: 34 },
  headline: { font: _, size: 22, weight: 700, leading: 26 },
  title: { font: _, size: 17, weight: 700, leading: 21 },
  body: { font: _, size: 14, weight: 500, leading: 18 },
  bodyStrong: { font: _, size: 14, weight: 700, leading: 18 },
  caption: { font: _, size: 11, weight: 500, leading: 14 },
  label: { font: _, size: 10, weight: 700, tracking: 1.1, uppercase: !0, leading: 13 },
  micro: { font: _, size: 9, weight: 700, tracking: 0.8, uppercase: !0, leading: 11 },
  numeral: { font: ht, size: 15, weight: 600, leading: 18 },
  numeralLg: { font: ht, size: 24, weight: 700, leading: 28 },
  numeralXl: { font: ht, size: 40, weight: 700, leading: 42 }
}, z = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }, A = { none: 0, xs: 3, sm: 5, md: 8, lg: 12, xl: 18, pill: 999 }, K = { width: 576, height: 288 }, kt = { x: 14, y: 12, width: 548, height: 264 };
function Z(e) {
  return e.surface === "outline";
}
const _t = 0.18, Xt = 4, Xe = { gray: r, type: x, space: z, radius: A, screen: K, safe: kt, inkBudget: _t, minContrast: Xt };
function Ut(e, t, i) {
  const n = e.intrinsic;
  if (typeof n == "number") return n;
  if (typeof n == "function") return n(t);
  throw new Error(
    `Glyph: flex item ${i} has size "auto" but no \`intrinsic\`. Give it a number, or a (crossSize) => number, so it can report its own size.`
  );
}
function lt(e, t) {
  let i = e;
  return t.min !== void 0 && (i = Math.max(i, t.min)), t.max !== void 0 && (i = Math.min(i, t.max)), Math.max(0, i);
}
function pt(e, t, i, n) {
  const o = i.padding !== void 0 ? U(e, i.padding) : e, a = i.gap ?? 0, s = n ? o.width : o.height, c = n ? o.height : o.width, h = a * Math.max(0, t.length - 1);
  let l = 0, d = 0;
  const f = t.map((g, b) => {
    const p = g.size ?? { grow: 1 };
    if (typeof p == "number") {
      const O = lt(p, g);
      return l += O, O;
    }
    if (p === "auto") {
      const O = lt(Ut(g, c, b), g);
      return l += O, O;
    }
    return d += p.grow, null;
  }), u = Math.max(0, s - l - h), M = f.map((g, b) => {
    if (g !== null) return g;
    const p = t[b].size;
    return lt(d > 0 ? u * p.grow / d : 0, t[b]);
  }), m = M.reduce((g, b) => g + b, 0) + h, L = Math.max(0, s - m), w = i.justify ?? "start";
  let y = (n ? o.x : o.y) + (w === "center" ? L / 2 : w === "end" ? L : 0);
  const H = w === "between" && t.length > 1 ? L / (t.length - 1) : w === "around" && t.length > 0 ? L / t.length : 0;
  return w === "around" && (y += H / 2), t.map((g, b) => {
    const p = M[b], O = g.cross ?? c, v = g.align ?? i.align ?? "stretch", R = v === "stretch" && g.cross === void 0 ? c : O, $ = v === "center" ? (c - R) / 2 : v === "end" ? c - R : 0, G = n ? { x: y, y: o.y + $, width: p, height: R } : { x: o.x + $, y, width: R, height: p };
    return y += p + a + H, G;
  });
}
function Qt(e, t, i = {}) {
  return pt(e, t, i, !0);
}
function Kt(e, t, i = {}) {
  return pt(e, t, i, !1);
}
function Ue(e, t, i = {}) {
  return Qt(e, t.map((n) => ({ size: n })), i);
}
function Qe(e, t, i = {}) {
  return Kt(e, t.map((n) => ({ size: n })), i);
}
const Ke = (e = 1) => ({ grow: e }), Je = (e, t = {}) => ({ size: "auto", intrinsic: e, ...t });
function t1(e, t = 0) {
  return U(e, t);
}
const vt = {
  linear: (e) => e,
  inQuad: (e) => e * e,
  outQuad: (e) => e * (2 - e),
  inOutQuad: (e) => e < 0.5 ? 2 * e * e : -1 + (4 - 2 * e) * e,
  inCubic: (e) => e * e * e,
  outCubic: (e) => 1 - Math.pow(1 - e, 3),
  inOutCubic: (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2,
  outBack: (e) => 1 + 2.70158 * Math.pow(e - 1, 3) + 1.70158 * Math.pow(e - 1, 2),
  outElastic: (e) => e === 0 || e === 1 ? e : Math.pow(2, -10 * e) * Math.sin((e * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  outBounce: (e) => e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375 : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375
};
class Zt {
  startValue;
  targetValue;
  startedAt = 0;
  duration;
  easing;
  constructor(t, i = 300, n = vt.outCubic) {
    this.startValue = t, this.targetValue = t, this.duration = i, this.easing = n;
  }
  /** Animate toward a new target from wherever the value currently is. */
  to(t, i, n = this.duration) {
    return t === this.targetValue ? this : (this.startValue = this.valueAt(i), this.targetValue = t, this.startedAt = i, this.duration = n, this);
  }
  /** Jump immediately, with no animation. */
  set(t) {
    return this.startValue = t, this.targetValue = t, this.duration = 0, this;
  }
  valueAt(t) {
    if (this.duration <= 0) return this.targetValue;
    const i = (t - this.startedAt) / this.duration;
    return i >= 1 ? this.targetValue : i <= 0 ? this.startValue : this.startValue + (this.targetValue - this.startValue) * this.easing(i);
  }
  isSettled(t) {
    return this.duration <= 0 || t - this.startedAt >= this.duration;
  }
  get target() {
    return this.targetValue;
  }
}
class e1 extends Zt {
  toBearing(t, i, n) {
    let o = ((t - this.target) % 360 + 540) % 360 - 180;
    return this.to(this.target + o, i, n);
  }
}
function i1(e, t = 1e3) {
  const i = e % t / t;
  return i < 0.5 ? i * 2 : 2 - i * 2;
}
const st = {
  // arrows & direction
  "arrow-up": "M12 20V4 M5 11L12 4L19 11",
  "arrow-down": "M12 4V20 M5 13L12 20L19 13",
  "arrow-left": "M20 12H4 M11 5L4 12L11 19",
  "arrow-right": "M4 12H20 M13 5L20 12L13 19",
  "arrow-up-right": "M7 17L17 7 M8 7H17V16",
  "arrow-up-left": "M17 17L7 7 M16 7H7V16",
  "chevron-up": "M5 15L12 8L19 15",
  "chevron-down": "M5 9L12 16L19 9",
  "chevron-left": "M15 5L8 12L15 19",
  "chevron-right": "M9 5L16 12L9 19",
  "chevrons-right": "M6 5L13 12L6 19 M13 5L20 12L13 19",
  "chevrons-left": "M18 5L11 12L18 19 M11 5L4 12L11 19",
  "caret-up": "M6 15L12 9L18 15Z",
  "caret-down": "M6 9L12 15L18 9Z",
  "corner-left": "M20 6H10C7 6 6 8 6 10V19 M11 14L6 19L1 14",
  "corner-right": "M4 6H14C17 6 18 8 18 10V19 M23 14L18 19L13 14",
  "u-turn": "M8 20V10C8 6 11 4 14 4C17 4 20 6 20 10V14 M15 9L20 14L25 9",
  // status & feedback
  plus: "M12 5V19 M5 12H19",
  minus: "M5 12H19",
  x: "M6 6L18 18 M18 6L6 18",
  check: "M4 13L9 18L20 6",
  "check-circle": "O12 12 9 M8 12L11 15L16 9",
  "x-circle": "O12 12 9 M9 9L15 15 M15 9L9 15",
  "alert-triangle": "M12 4L22 20H2Z M12 10V15 M12 17.5V18.5",
  "alert-circle": "O12 12 9 M12 7V13 M12 16V17",
  info: "O12 12 9 M12 11V17 M12 7V8",
  help: "O12 12 9 M9 9.5C9 7.5 10.5 6.5 12 6.5C13.8 6.5 15 7.7 15 9.2C15 11.5 12 11.5 12 14 M12 17V18",
  square: "M5 5H19V19H5Z",
  "check-square": "M19 11V19H5V5H15 M9 11L12 14L20 5",
  circle: "O12 12 8",
  dot: "O12 12 3",
  target: "O12 12 9 O12 12 4.5 O12 12 1",
  shield: "M12 3L20 6V12C20 17 16 20 12 21C8 20 4 17 4 12V6Z",
  zap: "M13 2L4 14H11L10 22L20 10H13Z",
  star: "M12 3L15 9.5L22 10.4L17 15.2L18.2 22L12 18.8L5.8 22L7 15.2L2 10.4L9 9.5Z",
  bookmark: "M6 3H18V21L12 16L6 21Z",
  flag: "M5 21V4 M5 5H18L15 9.5L18 14H5",
  // time
  clock: "O12 12 9 M12 7V12L15.5 14",
  alarm: "O12 13 8 M12 9V13L15 15 M5 4L2 7 M19 4L22 7",
  timer: "M9 2H15 M12 6V13 M12 13L16 16 O12 13 8",
  hourglass: "M7 3H17 M7 21H17 M7 3C7 8 12 10 12 12C12 14 7 16 7 21 M17 3C17 8 12 10 12 12C12 14 17 16 17 21",
  calendar: "M4 6H20V21H4Z M4 11H20 M8 3V7 M16 3V7",
  history: "M4 12C4 7.5 7.5 4 12 4C16.5 4 20 7.5 20 12C20 16.5 16.5 20 12 20C9 20 6.5 18.5 5 16 M12 8V12L15 14 M5 12H1 M3 9L1 12L5 12",
  // power & connectivity
  battery: "M2 8H18V16H2Z M20 11V13",
  "battery-half": "M2 8H18V16H2Z M20 11V13 M4 10H10V14H4Z",
  "battery-low": "M2 8H18V16H2Z M20 11V13 M4 10H7V14H4Z",
  "battery-charging": "M2 8H18V16H2Z M20 11V13 M11 7L7 13H11L9 17",
  bluetooth: "M7 8L17 16L12 20V4L17 8L7 16",
  wifi: "M2 9C7.5 4 16.5 4 22 9 M5.5 12.5C9 9.2 15 9.2 18.5 12.5 M9 16C10.7 14.4 13.3 14.4 15 16 M11.7 19.2L12.3 19.2",
  "wifi-off": "M2 9C4 7.2 6.4 6 9 5.4 M15.5 6.3C17.9 7 20.1 8.2 22 10 M9 16C10.7 14.4 13.3 14.4 15 16 M12 19.2V19.3 M3 3L21 21",
  signal: "M3 20V17 M9 20V13 M15 20V9 M21 20V4",
  "signal-low": "M3 20V17 M9 20V13 M15 20V16 M21 20V16",
  power: "M12 3V12 M18 6.5C19.9 8.3 21 10.8 21 13.5C21 18.2 17 22 12 22C7 22 3 18.2 3 13.5C3 10.8 4.1 8.3 6 6.5",
  plug: "M9 2V8 M15 2V8 M6 8H18V12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12Z M12 18V22",
  // weather
  sun: "O12 12 5 M12 1V4 M12 20V23 M4.2 4.2L6.4 6.4 M17.6 17.6L19.8 19.8 M1 12H4 M20 12H23 M4.2 19.8L6.4 17.6 M17.6 6.4L19.8 4.2",
  moon: "M20 14.5C18.9 15.5 17.3 16 15.7 16C11.7 16 8.5 12.8 8.5 8.8C8.5 6.9 9.2 5.2 10.4 4C6.2 4.8 3 8.5 3 13C3 18 7 22 12 22C15.8 22 19.1 19 20 14.5Z",
  cloud: "M6.5 19C4 19 2 17 2 14.5C2 12.2 3.7 10.3 6 10.1C6.6 6.6 9.5 4 13 4C16.9 4 20 7.1 20 11C21.7 11.6 23 13.2 23 15C23 17.2 21.2 19 19 19Z",
  "cloud-rain": "M6.5 16C4 16 2 14 2 11.5C2 9.3 3.6 7.4 5.8 7.1C6.5 4.2 9 2 12 2C15.6 2 18.5 4.9 18.5 8.5C20.4 8.9 22 10.6 22 12.7C22 14.5 20.5 16 18.7 16 M8 18L7 22 M13 18L12 22 M18 18L17 22",
  "cloud-snow": "M6.5 16C4 16 2 14 2 11.5C2 9.3 3.6 7.4 5.8 7.1C6.5 4.2 9 2 12 2C15.6 2 18.5 4.9 18.5 8.5C20.4 8.9 22 10.6 22 12.7C22 14.5 20.5 16 18.7 16 M8 19V20 M13 19V20 M18 19V20 M10.5 21.5V22.5 M15.5 21.5V22.5",
  wind: "M3 8H13C15 8 16.5 6.7 16.5 5C16.5 3.3 15.3 2 13.7 2C12.3 2 11.2 2.9 11 4 M2 13H17C19 13 20.5 14.3 20.5 16C20.5 17.7 19.3 19 17.7 19C16.3 19 15.2 18.1 15 17 M3 18H9",
  droplet: "M12 3C12 3 5 11 5 15C5 18.9 8.1 22 12 22C15.9 22 19 18.9 19 15C19 11 12 3 12 3Z",
  thermometer: "M14 14.5V4.5C14 3.1 13 2 11.5 2C10 2 9 3.1 9 4.5V14.5C7.8 15.4 7 16.8 7 18.5C7 20.9 9 23 11.5 23C14 23 16 20.9 16 18.5C16 16.8 15.2 15.4 14 14.5Z M11.5 18.5V7",
  umbrella: "M12 12V19C12 20.6 13.3 22 15 22C16.7 22 18 20.6 18 19 M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12Z",
  sunrise: "M12 3V9 M8 6L12 2L16 6 M2 18H22 M5 14L7 15.5 M19 14L17 15.5 O12 17 4",
  sunset: "M12 9V3 M8 6L12 10L16 6 M2 18H22 O12 17 4",
  // marine & navigation
  compass: "O12 12 9.5 M15.5 8.5L13.5 13.5L8.5 15.5L10.5 10.5Z",
  navigation: "M12 2L21 21L12 17L3 21Z",
  "map-pin": "M12 22C12 22 20 15.5 20 9.5C20 5.4 16.4 2 12 2C7.6 2 4 5.4 4 9.5C4 15.5 12 22 12 22Z O12 9.5 3",
  map: "M2 6L9 3L15 6L22 3V18L15 21L9 18L2 21Z M9 3V18 M15 6V21",
  route: "O5 19 3 O19 5 3 M8 19H14C16.8 19 19 16.8 19 14V8",
  anchor: "M12 8V22 O12 5 3 M4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14 M2 14H6 M18 14H22",
  boat: "M3 18L12 21L21 18 M4 14H20L18 18H6Z M12 14V4L18 10",
  waves: "M2 8C4 5.5 6 5.5 8 8C10 10.5 12 10.5 14 8C16 5.5 18 5.5 20 8 M2 14C4 11.5 6 11.5 8 14C10 16.5 12 16.5 14 14C16 11.5 18 11.5 20 14 M2 20C4 17.5 6 17.5 8 20C10 22.5 12 22.5 14 20C16 17.5 18 17.5 20 20",
  depth: "M12 2V16 M7 11L12 16L17 11 M2 20H22",
  buoy: "O12 12 9.5 M12 2.5V21.5 M2.5 12H21.5 M5.5 5.5L18.5 18.5 M18.5 5.5L5.5 18.5",
  helm: "O12 12 4 O12 12 9.5 M12 2.5V7.5 M12 16.5V21.5 M2.5 12H7.5 M16.5 12H21.5",
  // movement
  car: "M5 17H19 M4 17V11L6.5 5H17.5L20 11V17 M4 11H20 M7 17V20H4V17 M17 17V20H20V17 O7.5 14 1 O16.5 14 1",
  bike: "O5.5 17.5 4.5 O18.5 17.5 4.5 M5.5 17.5L9 8H14 M9 8L14.5 17.5 M14.5 17.5L18.5 17.5 M12 8H16",
  walk: "O13 4 2 M11 21L12 15L9 12L10 8L14 9L16 12L19 13 M9 12L7 15 M12 15L15 21",
  run: "O15 4 2 M8 21L12 16L9.5 12L10.5 8L15 9.5L17 13L21 13 M9.5 12L6 13 M12 16L16 20",
  train: "M6 3H18V15H6Z M6 15L4 21 M18 15L20 21 M6 9H18 O9 12.5 1 O15 12.5 1",
  bus: "M4 4H20V16H4Z M4 16V20H7V16 M17 16V20H20V16 M4 10H20 O7.5 13.5 1 O16.5 13.5 1",
  plane: "M2 13L22 4L18 22L13 16L9 20V15Z",
  fuel: "M4 21V4H13V21 M3 21H14 M13 10H17V17C17 18.5 18 19 19 19C20 19 21 18.5 21 17V8L18 5 M7 8H10",
  gauge: "M4 18C2.7 16.3 2 14.2 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12C22 14.2 21.3 16.3 20 18 M12 12L17 8 O12 12 1.5",
  // body & activity
  heart: "M12 21C12 21 3 15 3 8.8C3 5.6 5.4 3 8.5 3C10.3 3 11.5 4 12 5C12.5 4 13.7 3 15.5 3C18.6 3 21 5.6 21 8.8C21 15 12 21 12 21Z",
  "heart-pulse": "M2 12H7L9 8L12 16L14.5 12H22",
  footprints: "M6 3C7.7 3 9 4.5 9 7C9 9.5 8 12 6 12C4 12 3 9.5 3 7C3 4.5 4.3 3 6 3Z M18 9C19.7 9 21 10.5 21 13C21 15.5 20 18 18 18C16 18 15 15.5 15 13C15 10.5 16.3 9 18 9Z M3.5 15H8.5V19H3.5Z M15.5 21H20.5",
  flame: "M12 22C16 22 19 19 19 15C19 10 13 7 14 2C11 4 9 7 9 9C9 11 10 12 10 12C10 12 8 11 7 9C6 11 5 13 5 15C5 19 8 22 12 22Z",
  activity: "M2 12H6L9 4L15 20L18 12H22",
  "moon-sleep": "M4 8H12L4 16H12 M14 3H20L14 9H20",
  // media
  music: "M9 18V4L20 2V16 O6 18 3 O17 16 3",
  play: "M7 4L20 12L7 20Z",
  pause: "M8 4V20 M16 4V20",
  stop: "M6 6H18V18H6Z",
  "skip-forward": "M5 4L15 12L5 20Z M19 4V20",
  "skip-back": "M19 4L9 12L19 20Z M5 4V20",
  volume: "M3 9H7L12 4V20L7 15H3Z M16 9C17.2 10 17.8 11 17.8 12C17.8 13 17.2 14 16 15 M19 6C21 8 21.8 10 21.8 12C21.8 14 21 16 19 18",
  "volume-x": "M3 9H7L12 4V20L7 15H3Z M17 9L22 15 M22 9L17 15",
  mic: "M12 2C10.3 2 9 3.3 9 5V12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12V5C15 3.3 13.7 2 12 2Z M5 11C5 15 8 18 12 18C16 18 19 15 19 11 M12 18V22 M8 22H16",
  headphones: "M4 16V12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12V16 M4 14H7V21H4Z M17 14H20V21H17Z",
  // comms
  bell: "M12 3C8.7 3 6 5.7 6 9V14L4 17H20L18 14V9C18 5.7 15.3 3 12 3Z M10 20C10.5 21 11.2 21.5 12 21.5C12.8 21.5 13.5 21 14 20",
  "bell-off": "M9 4.5C9.9 3.6 11 3 12 3C15.3 3 18 5.7 18 9V14L20 17H8 M6 9V14L4 17 M10 20C10.5 21 11.2 21.5 12 21.5C12.8 21.5 13.5 21 14 20 M3 3L21 21",
  message: "M4 4H20V16H12L7 20V16H4Z",
  mail: "M2 5H22V19H2Z M2 6L12 13L22 6",
  phone: "M6 3H10L12 8L9.5 10C10.5 12.5 12 14 14 15L16 12.5L21 14.5V18.5C21 20 20 21 18.5 21C10 20 4 14 3 5.5C3 4 4 3 5.5 3Z",
  user: "O12 8 4.5 M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21",
  users: "O9 8 4 M2 21C2 16.8 5 14 9 14C13 14 16 16.8 16 21 M16 4.5C18 5 19.5 6.6 19.5 8.5C19.5 10.4 18 12 16 12.5 M18 14.5C20.8 15.5 22 18 22 21",
  // ui
  settings: "O12 12 3.2 M12 2.5V5 M12 19V21.5 M4.5 7.2L6.7 8.5 M17.3 15.5L19.5 16.8 M4.5 16.8L6.7 15.5 M17.3 8.5L19.5 7.2",
  sliders: "M4 6H14 M18 6H20 M4 12H8 M12 12H20 M4 18H16 M20 18H20.5 O16 6 2 O10 12 2 O18 18 2",
  search: "O10.5 10.5 7.5 M16 16L21 21",
  filter: "M3 4H21L14 12V20L10 18V12Z",
  home: "M3 11L12 3L21 11 M5 9.5V20H19V9.5 M10 20V14H14V20",
  menu: "M3 6H21 M3 12H21 M3 18H21",
  "more-horizontal": "O5 12 1.5 O12 12 1.5 O19 12 1.5",
  "more-vertical": "O12 5 1.5 O12 12 1.5 O12 19 1.5",
  grid: "M3 3H10V10H3Z M14 3H21V10H14Z M3 14H10V21H3Z M14 14H21V21H14Z",
  list: "M8 6H21 M8 12H21 M8 18H21 M3 6H4 M3 12H4 M3 18H4",
  layers: "M12 2L22 7.5L12 13L2 7.5Z M2 12.5L12 18L22 12.5 M2 17L12 22.5L22 17",
  columns: "M3 4H21V20H3Z M9 4V20 M15 4V20",
  maximize: "M3 9V3H9 M15 3H21V9 M21 15V21H15 M9 21H3V15",
  minimize: "M9 3V9H3 M21 9H15V3 M15 21V15H21 M3 15H9V21",
  lock: "M6 11H18V21H6Z M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11 M12 15V17",
  unlock: "M6 11H18V21H6Z M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7 M12 15V17",
  key: "O7 15 4.5 M10.2 11.8L20 2 M17 5L20 8 M14 8L17 11",
  eye: "M2 12C4.5 7.5 8 5.5 12 5.5C16 5.5 19.5 7.5 22 12C19.5 16.5 16 18.5 12 18.5C8 18.5 4.5 16.5 2 12Z O12 12 3.2",
  "eye-off": "M4 6C2.8 7.5 2 9.5 2 12C4.5 16.5 8 18.5 12 18.5C13.6 18.5 15.1 18.2 16.5 17.5 M9 5.9C9.9 5.6 11 5.5 12 5.5C16 5.5 19.5 7.5 22 12C21.2 13.6 20.2 14.9 19 16 M3 3L21 21 M9.5 9.5C9 10.2 8.8 11 8.8 12C8.8 13.8 10.2 15.2 12 15.2C13 15.2 13.8 14.9 14.5 14.3",
  trash: "M4 6H20 M9 6V4H15V6 M6 6L7 21H17L18 6 M10 10V17 M14 10V17",
  download: "M12 3V15 M6 10L12 16L18 10 M4 20H20",
  upload: "M12 16V4 M6 9L12 3L18 9 M4 20H20",
  refresh: "M20 12C20 16.4 16.4 20 12 20C8.6 20 5.7 17.9 4.6 15 M4 12C4 7.6 7.6 4 12 4C15.4 4 18.3 6.1 19.4 9 M19.4 4V9H14.4 M4.6 20V15H9.6",
  link: "M10 14C11.5 15.5 13.5 15.5 15 14L19 10C20.5 8.5 20.5 6 19 4.5C17.5 3 15 3 13.5 4.5L12 6 M14 10C12.5 8.5 10.5 8.5 9 10L5 14C3.5 15.5 3.5 18 5 19.5C6.5 21 9 21 10.5 19.5L12 18",
  camera: "M3 7H7L9 4H15L17 7H21V20H3Z O12 13 4.5",
  image: "M3 4H21V20H3Z O8 9 2 M3 17L9 12L14 16L18 13L21 15.5",
  file: "M6 2H14L19 7V22H6Z M14 2V7H19",
  folder: "M3 5H9L11 8H21V20H3Z",
  tag: "M2 2H11L22 13L13 22L2 11Z O6.5 6.5 1.5",
  "shopping-bag": "M4 7H20L19 21H5Z M8 7V5C8 3 9.8 2 12 2C14.2 2 16 3 16 5V7",
  coffee: "M3 8H17V15C17 18 15 20 12 20H8C5 20 3 18 3 15Z M17 10H19C20.7 10 22 11.3 22 13C22 14.7 20.7 16 19 16H17 M7 2V5 M11 2V5",
  glasses: "O6.5 15 4.5 O17.5 15 4.5 M11 15C11 13.5 13 13.5 13 15 M2 15C2 10 3.5 7 6 6 M22 15C22 10 20.5 7 18 6",
  // more direction
  "arrow-down-left": "M17 7L7 17 M16 17H7V8",
  "arrow-down-right": "M7 7L17 17 M8 17H17V8",
  "arrows-vertical": "M12 3V21 M7 8L12 3L17 8 M7 16L12 21L17 16",
  "arrows-horizontal": "M3 12H21 M8 7L3 12L8 17 M16 7L21 12L16 17",
  "rotate-cw": "M20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C14.5 4 16.7 5.1 18.2 6.9 M19 3V7.5H14.5",
  "rotate-ccw": "M4 12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12C20 7.6 16.4 4 12 4C9.5 4 7.3 5.1 5.8 6.9 M5 3V7.5H9.5",
  undo: "M9 14L4 9L9 4 M4 9H14C17.3 9 20 11.7 20 15C20 18.3 17.3 21 14 21H11",
  redo: "M15 14L20 9L15 4 M20 9H10C6.7 9 4 11.7 4 15C4 18.3 6.7 21 10 21H13",
  repeat: "M17 2L21 6L17 10 M3 11V9C3 7.3 4.3 6 6 6H21 M7 22L3 18L7 14 M21 13V15C21 16.7 19.7 18 18 18H3",
  shuffle: "M16 3H21V8 M4 20L21 3 M21 16V21H16 M15 15L21 21 M4 4L9 9",
  "trending-up": "M3 17L9 11L13 15L21 7 M15 7H21V13",
  "trending-down": "M3 7L9 13L13 9L21 17 M15 17H21V11",
  merge: "M6 3C6 8 12 7 12 12V21 M18 3C18 8 12 7 12 12",
  fork: "M12 21V12C12 7 6 8 6 3 M12 12C12 7 18 8 18 3 M3 6L6 3L9 6 M15 6L18 3L21 6",
  roundabout: "O12 14 5 M12 9V3 M9 6L12 3L15 6 M12 19V22",
  "keep-left": "M13 21V14L6 6 M6 12V6H12 M18 21V11",
  "keep-right": "M11 21V14L18 6 M18 12V6H12 M6 21V11",
  exit: "M10 4H5V20H10 M10 12H21 M17 8L21 12L17 16",
  enter: "M14 4H19V20H14 M3 12H14 M10 8L14 12L10 16",
  "external-link": "M10 5H5V19H19V14 M14 4H20V10 M20 4L11 13",
  // more status
  ban: "O12 12 9 M5.6 5.6L18.4 18.4",
  "alert-octagon": "M8.3 3H15.7L21 8.3V15.7L15.7 21H8.3L3 15.7V8.3Z M12 8V13 M12 16V16.5",
  loader: "M12 3V7 M12 17V21 M3 12H7 M17 12H21 M5.6 5.6L8.5 8.5 M15.5 15.5L18.4 18.4 M5.6 18.4L8.5 15.5 M15.5 8.5L18.4 5.6",
  "thumbs-up": "M7 11V20H4V11Z M7 11L11 3C12.5 3 13.5 4 13.5 5.5V9H19C20.2 9 21 10 20.8 11.2L19.5 18.3C19.3 19.3 18.5 20 17.5 20H7",
  smile: "O12 12 9 M8.5 14C9.5 15.8 10.6 16.5 12 16.5C13.4 16.5 14.5 15.8 15.5 14 M9 9.5V9.6 M15 9.5V9.6",
  sparkles: "M10 3L11.8 8.2L17 10L11.8 11.8L10 17L8.2 11.8L3 10L8.2 8.2Z M18 14L18.9 16.1L21 17L18.9 17.9L18 20L17.1 17.9L15 17L17.1 16.1Z",
  "bell-ring": "M12 4C9.2 4 7 6.2 7 9V14L5.5 17H18.5L17 14V9C17 6.2 14.8 4 12 4Z M10.5 20C11 20.8 11.4 21 12 21C12.6 21 13 20.8 13.5 20 M3.5 5.5C2.5 7 2 8.5 2 10 M20.5 5.5C21.5 7 22 8.5 22 10",
  "mic-off": "M12 2C10.3 2 9 3.3 9 5V12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12V5C15 3.3 13.7 2 12 2Z M5 11C5 15 8 18 12 18C16 18 19 15 19 11 M12 18V22 M8 22H16 M3 3L21 21",
  "volume-low": "M3 9H7L12 4V20L7 15H3Z M16 9C17.2 10 17.8 11 17.8 12C17.8 13 17.2 14 16 15",
  brightness: "O12 12 4 M12 3.5V3.6 M12 20.5V20.4 M3.5 12H3.6 M20.5 12H20.4 M6 6V6.1 M18 6V6.1 M6 18V17.9 M18 18V17.9",
  contrast: "O12 12 9 M12 3V21 M12 7.5H19.8 M12 12H21 M12 16.5H19.8",
  // more weather
  "cloud-off": "M6.5 19C4 19 2 17 2 14.5C2 12.2 3.7 10.3 6 10.1C6.3 8.6 7 7.3 8 6.3 M11 4.3C11.6 4.1 12.3 4 13 4C16.9 4 20 7.1 20 11C21.7 11.6 23 13.2 23 15C23 16 22.6 17 22 17.7 M19 19H6.5 M3 3L21 21",
  "cloud-sun": "M8 20C5.8 20 4 18.2 4 16C4 14 5.4 12.4 7.3 12.1C8 9.7 10.2 8 12.8 8C15.9 8 18.5 10.5 18.5 13.6C20 14 21 15.3 21 16.8C21 18.6 19.6 20 17.8 20Z M17 3V4.5 M21.5 7.5H20 M20.2 4.3L19.2 5.3 M14.6 6.2C15.3 5.5 16.2 5 17.2 5C19 5 20.5 6.5 20.5 8.3C20.5 8.9 20.3 9.5 20 10",
  "cloud-lightning": "M6.5 16C4 16 2 14 2 11.5C2 9.3 3.6 7.4 5.8 7.1C6.5 4.2 9 2 12 2C15.6 2 18.5 4.9 18.5 8.5C20.4 8.9 22 10.6 22 12.7C22 14.5 20.5 16 18.7 16 M13 12L9.5 17.5H13.5L11 22.5",
  fog: "M3 8H17 M7 12H21 M3 16H15 M9 20H21",
  snowflake: "M12 3V21 M4.2 7.5L19.8 16.5 M19.8 7.5L4.2 16.5 M9.5 4.5L12 7L14.5 4.5 M9.5 19.5L12 17L14.5 19.5",
  // more time
  stopwatch: "O12 14 7 M12 14V10 M10 3H14 M12 3V7 M18.5 7.5L20 6",
  "calendar-check": "M4 6H20V21H4Z M4 11H20 M8 3V7 M16 3V7 M9 16L11.5 18.5L16 13.5",
  // more places and travel
  crosshair: "O12 12 7 M12 2V7 M12 17V22 M2 12H7 M17 12H22",
  locate: "O12 12 3 O12 12 8 M12 2V4 M12 20V22 M2 12H4 M20 12H22",
  radar: "O12 12 9 O12 12 4.5 M12 12L18.4 5.6 M12 12V12.1",
  signpost: "M12 3V21 M12 6H19L21 8.5L19 11H12 M12 13H6L4 15.5L6 18H12",
  mountain: "M2 20L9 7L13 14L16 10L22 20Z",
  altitude: "M2 20L8.5 9L12.5 15L15 11.5L20 20Z M19 3V10 M16.5 5.5L19 3L21.5 5.5",
  tree: "M12 22V16 M12 3L6 11H9L5 16H19L15 11H18Z",
  tent: "M3 20L12 4L21 20Z M9.5 20L12 14L14.5 20",
  building: "M5 21V4H15V21 M15 9H19V21 M3 21H21 M8.5 8H11.5 M8.5 12H11.5 M8.5 16H11.5",
  lighthouse: "M9 21L10.5 9H13.5L15 21 M7 21H17 M10 9V6H14V9 M12 6V3.5 M4 5.5L8 7 M20 5.5L16 7 M10 14H14",
  parking: "M5 4H19V20H5Z M10 17V8H13C14.7 8 16 9.3 16 11C16 12.7 14.7 14 13 14H10",
  "traffic-light": "M8 3H16V21H8Z O12 7.5 1.6 O12 12 1.6 O12 16.5 1.6",
  stairs: "M3 20H8V15H13V10H18V5H21",
  ticket: "M3 7H21V10.5C20 10.5 19.5 11.2 19.5 12C19.5 12.8 20 13.5 21 13.5V17H3V13.5C4 13.5 4.5 12.8 4.5 12C4.5 11.2 4 10.5 3 10.5Z M14 7V17",
  truck: "M2 6H14V17H2Z M14 10H18.5L22 13.5V17H14 O6.5 18 2 O17.5 18 2",
  tram: "M6 5H18V17H6Z M6 11H18 M9 21L10.5 17 M15 21L13.5 17 M9 2H15 M12 2V5 M9 14V14.1 M15 14V14.1",
  metro: "O12 12 9 M8 16V8L12 13L16 8V16",
  helicopter: "M4 5H20 M12 5V8 M19 11C19 9.5 18 8 15.5 8H11C8 8 6 10.5 6 13C6 15 7.5 16.5 9.5 16.5H15C17.5 16.5 19 14 19 11Z M6 12H2 M2 10V14 M9.5 16.5V19.5 M15 16.5V19.5 M7 19.5H18",
  rocket: "M12 2C15.5 5 17 9 17 13L15 17H9L7 13C7 9 8.5 5 12 2Z O12 9.5 1.8 M9 17L7.5 21 M15 17L16.5 21 M12 17V22",
  parachute: "M3 11C3 6 7 3 12 3C17 3 21 6 21 11C19.5 10 18 10 16.5 11C15 10 13.5 10 12 11C10.5 10 9 10 7.5 11C6 10 4.5 10 3 11Z M3 11L12 21L21 11 M7.5 11L12 21L16.5 11",
  drone: "O6 6 2.5 O18 6 2.5 O6 18 2.5 O18 18 2.5 M8 8L16 16 M16 8L8 16 M10 10H14V14H10Z",
  antenna: "M12 9V21 M8 21L12 9L16 21 M9.3 17H14.7 O12 6.5 1.5 M7.5 3C6 4.8 6 8.2 7.5 10 M16.5 3C18 4.8 18 8.2 16.5 10",
  fish: "M3 12C6 7 12 6 16 9L21 6V18L16 15C12 18 6 17 3 12Z M7.5 11V11.1",
  lifebuoy: "O12 12 9 O12 12 4 M5.6 5.6L9.2 9.2 M14.8 14.8L18.4 18.4 M18.4 5.6L14.8 9.2 M9.2 14.8L5.6 18.4",
  // more health
  pill: "M5.5 12.5L12.5 5.5C14.4 3.6 17.6 3.6 19.5 5.5C21.4 7.4 21.4 10.6 19.5 12.5L12.5 19.5C10.6 21.4 7.4 21.4 5.5 19.5C3.6 17.6 3.6 14.4 5.5 12.5Z M9 9L16 16",
  dumbbell: "M6.5 7V17 M3.5 9.5V14.5 M17.5 7V17 M20.5 9.5V14.5 M6.5 12H17.5",
  bed: "M3 6V19 M3 15H21V19 M21 15V12C21 10.3 19.7 9 18 9H10V15 O6.5 11.5 1.8",
  scale: "M4 4H20V20H4Z M8 9.5C9 8 10.4 7.5 12 7.5C13.6 7.5 15 8 16 9.5 M12 10.5L13.6 8",
  cup: "M6 3H18L16.5 21H7.5Z M6.6 10H17.4",
  apple: "M12 7C10 5 5 6 5 12C5 17 8 21 10 21C11 21 11.3 20.5 12 20.5C12.7 20.5 13 21 14 21C16 21 19 17 19 12C19 6 14 5 12 7Z M12 7C12 5 13 3.5 15 3",
  "fork-knife": "M7 3V21 M4.5 3V7.5C4.5 9 5.5 10 7 10C8.5 10 9.5 9 9.5 7.5V3 M17 21V3C15 5 14.5 9 14.5 13H17",
  // more media
  "fast-forward": "M3 6L11 12L3 18Z M13 6L21 12L13 18Z",
  rewind: "M21 6L13 12L21 18Z M11 6L3 12L11 18Z",
  record: "O12 12 8 O12 12 3",
  playlist: "M4 6H16 M4 11H16 M4 16H10 M17 18.5V10L21 11.5 O15 18.5 2",
  radio: "M3 9H21V20H3Z M6 9L17 4 O8.5 14.5 2.5 M14 13H18 M14 16.5H18",
  speaker: "M6 3H18V21H6Z O12 14.5 3 M12 7V7.1",
  video: "M3 6H15V18H3Z M15 10.5L21 7V17L15 13.5",
  cast: "M3 8V5H21V19H14 M3 12C6.9 12 10 15.1 10 19 M3 15.5C4.9 15.5 6.5 17.1 6.5 19 M3 19V19.1",
  captions: "M3 5H21V19H3Z M10 10.5C8.5 9.2 6.5 10 6.5 12C6.5 14 8.5 14.8 10 13.5 M17 10.5C15.5 9.2 13.5 10 13.5 12C13.5 14 15.5 14.8 17 13.5",
  translate: "M3 5H13 M8 3V5 M5 5C5 9 8 12 12 13 M11 5C11 9 8 12 4 13 M13 21L17 11L21 21 M14.5 17.5H19.5",
  // more communication
  send: "M21 3L3 10.5L10 13.5L13 21Z M10 13.5L21 3",
  reply: "M9 6L3 12L9 18 M3 12H14C17.9 12 21 15.1 21 19",
  share: "O18 5 2.5 O6 12 2.5 O18 19 2.5 M8.2 10.8L15.8 6.2 M8.2 13.2L15.8 17.8",
  "at-sign": "O12 12 4 M16 8V13.5C16 15 17 16 18.5 16C20 16 21 14.5 21 12C21 7 17 3 12 3C7 3 3 7 3 12C3 17 7 21 12 21C14 21 15.8 20.4 17.3 19.3",
  inbox: "M3 13L6 5H18L21 13V19H3Z M3 13H8.5L10 16H14L15.5 13H21",
  "chat-dots": "M4 5H20V16H10L5 20V16H4Z M8.5 10.5V10.6 M12 10.5V10.6 M15.5 10.5V10.6",
  voicemail: "O6.5 12 3.5 O17.5 12 3.5 M6.5 15.5H17.5",
  globe: "O12 12 9 M3 12H21 M12 3C9 6 9 18 12 21 M12 3C15 6 15 18 12 21",
  // devices
  smartphone: "M7 2H17V22H7Z M11 18.5H13",
  watch: "M8 7H16V17H8Z M9 7L10 3H14L15 7 M9 17L10 21H14L15 17 M12 10V12.5L13.5 13.5",
  ring: "O12 14 6.5 M9.5 5L12 3L14.5 5L12 7.5Z",
  laptop: "M5 5H19V16H5Z M2 19H22",
  monitor: "M3 4H21V16H3Z M8 20H16 M12 16V20",
  cpu: "M7 7H17V17H7Z M10 10H14V14H10Z M10 3V7 M14 3V7 M10 17V21 M14 17V21 M3 10H7 M3 14H7 M17 10H21 M17 14H21",
  database: "M4 6C4 4.3 7.6 3 12 3C16.4 3 20 4.3 20 6C20 7.7 16.4 9 12 9C7.6 9 4 7.7 4 6Z M4 6V18C4 19.7 7.6 21 12 21C16.4 21 20 19.7 20 18V6 M4 12C4 13.7 7.6 15 12 15C16.4 15 20 13.7 20 12",
  terminal: "M3 4H21V20H3Z M7 9L10.5 12L7 15 M12.5 15H17",
  code: "M8 7L3 12L8 17 M16 7L21 12L16 17 M13.5 5L10.5 19",
  bug: "M8 10C8 7.8 9.8 6 12 6C14.2 6 16 7.8 16 10V15C16 17.2 14.2 19 12 19C9.8 19 8 17.2 8 15Z M12 10V19 M4 13H8 M16 13H20 M5 7L8.5 9.5 M19 7L15.5 9.5 M5 19L8.3 16.5 M19 19L15.7 16.5 M9.5 3.5L10.5 6.2 M14.5 3.5L13.5 6.2",
  bot: "M5 9H19V19H5Z M12 9V5 O12 4 1 M9 13.5V13.6 M15 13.5V13.6 M9.5 16.5H14.5 M2.5 12.5V15.5 M21.5 12.5V15.5",
  qr: "M4 4H10V10H4Z M14 4H20V10H14Z M4 14H10V20H4Z M14 14H16.5V16.5H14Z M19.5 14V14.1 M14 20V19.9 M17.5 19H20V20",
  scan: "M4 8V4H8 M16 4H20V8 M20 16V20H16 M8 20H4V16 M4 12H20",
  contactless: "M6 8C8 10.5 8 13.5 6 16 M10 5.5C13 9.5 13 14.5 10 18.5 M14 3C18.5 8.5 18.5 15.5 14 21",
  // objects
  lightbulb: "M9 18H15 M10 21H14 M8.5 15C6.8 13.8 6 12 6 10C6 6.7 8.7 4 12 4C15.3 4 18 6.7 18 10C18 12 17.2 13.8 15.5 15V18H8.5Z",
  wallet: "M3 6H18V9H21V20H3Z M3 9H18 M16.5 14.5H17.5",
  "credit-card": "M3 6H21V18H3Z M3 10H21 M6.5 14.5H10",
  "currency-euro": "M18 6.5C16.8 5 15 4 13 4C9.1 4 6.5 7.6 6.5 12C6.5 16.4 9.1 20 13 20C15 20 16.8 19 18 17.5 M4 10H14 M4 14H14",
  "currency-dollar": "M12 2V22 M17 6.5C16 5 14.3 4.5 12 4.5C9 4.5 7 6 7 8.2C7 13 17 10.5 17 15.5C17 18 15 19.5 12 19.5C9.5 19.5 7.7 18.8 6.5 17.3",
  gift: "M4 10H20V21H4Z M3 7H21V10H3Z M12 7V21 M12 7C10 3 6 4 7.5 7 M12 7C14 3 18 4 16.5 7",
  cart: "M3 4H5.5L8 15H18.5L20.5 7H6.5 O9 19 1.5 O17.5 19 1.5",
  package: "M12 3L21 7.5V16.5L12 21L3 16.5V7.5Z M3 7.5L12 12L21 7.5 M12 12V21",
  briefcase: "M3 8H21V20H3Z M9 8V5H15V8 M3 13H21",
  "book-open": "M12 6C10 4.5 7 4 3 4.5V19C7 18.5 10 19 12 20.5C14 19 17 18.5 21 19V4.5C17 4 14 4.5 12 6Z M12 6V20.5",
  clipboard: "M6 5H18V21H6Z M9 3H15V7H9Z M9 12H15 M9 16H13",
  pencil: "M4 20L5 15.5L16 4.5L19.5 8L8.5 19Z M14 6.5L17.5 10",
  paperclip: "M19 11.5L11.5 19C9.6 20.9 6.6 20.9 4.8 19C3 17.2 3 14.2 4.8 12.3L12.8 4.3C14 3.1 16 3.1 17.2 4.3C18.4 5.5 18.4 7.5 17.2 8.7L9.5 16.4C8.9 17 7.9 17 7.3 16.4C6.7 15.8 6.7 14.8 7.3 14.2L14 7.5",
  calculator: "M5 3H19V21H5Z M8 6.5H16V10H8Z M8.5 14V14.1 M12 14V14.1 M15.5 14V14.1 M8.5 17.5V17.6 M12 17.5V17.6 M15.5 17.5V17.6",
  ruler: "M3 15L15 3L21 9L9 21Z M7.5 13.5L9 15 M10.5 10.5L12.5 12.5 M13.5 7.5L15 9",
  printer: "M7 8V3H17V8 M5 8H19C20.1 8 21 8.9 21 10V17H17 M7 17H3V10C3 8.9 3.9 8 5 8 M7 14H17V21H7Z",
  archive: "M3 4H21V8H3Z M5 8V20H19V8 M10 12H14",
  "id-card": "M3 5H21V19H3Z O8.5 11 2 M5.5 16C6 14.5 7 14 8.5 14C10 14 11 14.5 11.5 16 M14 10H18 M14 14H17",
  trophy: "M8 4H16V10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10Z M8 6H4.5C4.5 9 6 10.5 8 10.5 M16 6H19.5C19.5 9 18 10.5 16 10.5 M12 14V18 M8.5 21H15.5 M9.5 18H14.5",
  crown: "M3 8L7.5 12L12 5L16.5 12L21 8L19 19H5Z",
  dice: "M4 4H20V20H4Z M8.5 8.5V8.6 M15.5 8.5V8.6 M12 12V12.1 M8.5 15.5V15.6 M15.5 15.5V15.6",
  gamepad: "M7 8H17C19.8 8 21 10.5 21.5 14C22 17.5 20 19 18.5 17.5L16 15H8L5.5 17.5C4 19 2 17.5 2.5 14C3 10.5 4.2 8 7 8Z M7 10.5V13 M5.75 11.75H8.25 M16 11V11.1 M18 13V13.1",
  paw: "O12 15.5 3.2 O6.5 11 1.6 O10 7 1.6 O14 7 1.6 O17.5 11 1.6",
  leaf: "M5 19C5 10 10 4 20 4C20 14 14 19 5 19Z M5 19L13 11",
  // interface
  copy: "M8 8H20V20H8Z M16 8V4H4V16H8",
  save: "M4 4H16L20 8V20H4Z M8 4V9H15V4 M8 20V14H16V20",
  pin: "M9 3H15L14 10L17.5 14H6.5L10 10Z M12 14V21",
  "zoom-in": "O10.5 10.5 6.5 M15.5 15.5L21 21 M10.5 7.5V13.5 M7.5 10.5H13.5",
  "zoom-out": "O10.5 10.5 6.5 M15.5 15.5L21 21 M7.5 10.5H13.5",
  sort: "M7 4V20 M3.5 16.5L7 20L10.5 16.5 M17 20V4 M13.5 7.5L17 4L20.5 7.5",
  sidebar: "M3 4H21V20H3Z M9 4V20",
  table: "M3 5H21V19H3Z M3 10H21 M3 14.5H21 M9 5V19 M15 5V19",
  "chart-bar": "M4 20H20 M7 20V12 M12 20V5 M17 20V9",
  "chart-line": "M4 4V20H20 M7 15L11 10L14 13L19 6",
  "chart-pie": "O12 12 9 M12 12V3 M12 12L19 17.5",
  hash: "M9 3L7 21 M17 3L15 21 M4 9H20 M3.5 15H19.5",
  percent: "M19 5L5 19 O7 7 2.5 O17 17 2.5",
  "text-size": "M3 7V5H15V7 M9 5V19 M7 19H11 M15 13V12H21V13 M18 12V19 M16.5 19H19.5"
}, ut = /* @__PURE__ */ new Map();
function Ot(e) {
  const t = ut.get(e);
  if (t) return t;
  const i = st[e];
  if (!i) return null;
  const n = qt(i);
  return ut.set(e, n), n;
}
function n1(e, t) {
  st[e] = t, ut.delete(e);
}
function o1(e) {
  return e in st;
}
function a1() {
  return Object.keys(st).sort();
}
function E(e, t, i, n, o = 24, a = 15, s = {}) {
  const c = Ot(t);
  if (!c) return;
  const h = o / 24, l = s.width ?? Math.max(1, Math.min(2.6, o / 11));
  e.path(c, i - o / 2, n - o / 2, h, {
    stroke: a,
    width: l,
    cap: "round",
    join: "round",
    fill: void 0,
    ...s
  });
}
function Jt(e, t, i, n, o = 24, a = 15) {
  const s = Ot(t);
  if (!s) return;
  const c = o / 24;
  e.path(s, i - o / 2, n - o / 2, c, { fill: a });
}
function C(e, t = 0) {
  return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function B(e) {
  const t = C(e);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function W(e, t) {
  const i = C(e, t);
  return i > 0 ? i : t;
}
function P(e, t, i, n) {
  const o = Math.round(C(e, t));
  return o < i ? i : o > n ? n : o;
}
function dt(e) {
  return (e % 360 + 360) % 360;
}
function Vt(e, t) {
  if (!(t > 0)) return !1;
  const i = e / t;
  return Math.abs(i - Math.round(i)) < 1e-6;
}
function j(e) {
  let t = 1 / 0, i = -1 / 0;
  for (const n of e)
    Number.isFinite(n) && (n < t && (t = n), n > i && (i = n));
  return t <= i ? [t, i] : null;
}
function te(e, t) {
  const i = j(e.flatMap((a) => a.values)), n = t.min ?? i?.[0] ?? 0, o = t.max ?? i?.[1] ?? 1;
  return o === n ? [n - 1, o + 1] : [n, o];
}
function yt(e, t, i, n) {
  return e.length === 0 ? [] : e.length === 1 ? [{ x: t.x + t.width / 2, y: q(e[0], i, n, k(t), t.y) }] : e.map((o, a) => ({
    x: t.x + a / (e.length - 1) * t.width,
    y: q(o, i, n, k(t), t.y)
  }));
}
function it(e, t, i, n, o = {}) {
  const a = o.gutter ?? 0, s = o.labels?.length ? 12 : 0, c = {
    x: t.x + a,
    y: t.y,
    width: t.width - a,
    height: t.height - s
  }, h = o.gridLines ?? 0;
  for (let l = 0; l < h; l++) {
    const d = h === 1 ? 0.5 : l / (h - 1), f = Math.round(k(c) - d * c.height);
    e.hline(c.x, V(c), f, o.gridGray ?? r.hairline), a > 0 && o.format && e.text(o.format(i + (n - i) * d), t.x + a - 5, f, x.micro, o.labelGray ?? r.tertiary, "right", "middle");
  }
  return o.baseline !== !1 && e.hline(c.x, V(c), k(c), r.border), o.labels?.length && o.labels.forEach((l, d) => {
    const f = o.labels.length === 1 ? 0.5 : d / (o.labels.length - 1);
    e.text(
      l,
      c.x + f * c.width,
      k(c) + 4,
      x.micro,
      o.labelGray ?? r.tertiary,
      d === 0 ? "left" : d === o.labels.length - 1 ? "right" : "center",
      "top"
    );
  }), c;
}
function r1(e, t, i, n = {}) {
  const [o, a] = te(i, n), s = it(e, t, o, a, n);
  for (const c of i) {
    const h = yt(c.values, s, o, a).filter((d) => Number.isFinite(d.y));
    if (h.length < 2) continue;
    c.fill !== void 0 && e.scoped((d) => {
      d.clipRect(s);
      const f = [{ x: h[0].x, y: k(s) }, ...h, { x: h[h.length - 1].x, y: k(s) }];
      Z(e) ? d.scoped((u) => {
        u.ctx.beginPath(), f.forEach((M, m) => m === 0 ? u.ctx.moveTo(M.x, M.y) : u.ctx.lineTo(M.x, M.y)), u.ctx.closePath(), u.ctx.clip(), u.hatch(s, 6, r.hairline, Math.PI / 4, 1);
      }) : d.polygon(f, { fill: c.fill });
    });
    const l = { stroke: c.gray ?? r.max, width: c.width ?? 1.5, dash: c.dash };
    if (c.smooth ? e.spline(h, l) : e.polyline(h, l), c.markers) for (const d of h) e.circle(d.x, d.y, 1.6, { fill: c.gray ?? r.max });
  }
}
function s1(e, t, i, n = {}) {
  if (i = i.filter(Number.isFinite), i.length < 2) return;
  const o = j(i), a = n.min ?? o[0], s = n.max ?? o[1], c = yt(i, t, a, s === a ? a + 1 : s);
  n.fill !== void 0 && !Z(e) && e.polygon([{ x: c[0].x, y: k(t) }, ...c, { x: c[c.length - 1].x, y: k(t) }], { fill: n.fill });
  const h = { stroke: n.gray ?? r.strong, width: n.width ?? 1.5 };
  if (n.smooth ? e.spline(c, h) : e.polyline(c, h), n.dot !== !1) {
    const l = c[c.length - 1];
    e.circle(l.x, l.y, 2.2, { fill: r.off }), e.circle(l.x, l.y, 2.2, { stroke: n.gray ?? r.max, width: 1.2 });
  }
}
function c1(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = j(i) ?? [0, 0], a = n.min ?? Math.min(0, o[0]), s = n.max ?? Math.max(o[1], 0), c = s === a ? a + 1 : s, h = it(e, t, a, c, { ...n, baseline: n.baseline ?? !1 }), l = n.gap ?? 2, d = (h.width - l * (i.length - 1)) / i.length, f = q(0, a, c, k(h), h.y);
  i.forEach((u, M) => {
    if (!Number.isFinite(u)) return;
    const m = q(u, a, c, k(h), h.y), L = h.x + M * (d + l), w = Math.abs(m - f), y = { x: L, y: Math.min(m, f), width: d, height: Math.max(1, w) }, H = n.radius ?? Math.min(2, d / 3), g = M === n.highlight;
    Z(e) && !g ? e.roundRect(y, H, { stroke: n.gray ?? r.border, width: 1 }) : e.roundRect(y, H, { fill: g ? n.highlightGray ?? r.max : n.gray ?? r.secondary });
  }), a < 0 && e.hline(h.x, V(h), f, r.border);
}
function h1(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = n.max ?? Math.max(j(i.map((h) => h.value))?.[1] ?? 1, 1), a = n.labelWidth ?? 60, s = n.gap ?? 4, c = (t.height - s * (i.length - 1)) / i.length;
  i.forEach((h, l) => {
    const d = t.y + l * (c + s);
    e.text(h.label, t.x, d + c / 2, x.caption, r.secondary, "left", "middle");
    const f = { x: t.x + a, y: d + c / 2 - 3, width: t.width - a - 34, height: 6 };
    Z(e) ? e.roundRect(f, 3, { stroke: r.hairline, width: 1 }) : e.roundRect(f, 3, { fill: r.sunken }), e.roundRect({ ...f, width: Math.max(2, f.width * T(h.value, 0, o) / o) }, 3, { fill: h.gray ?? r.strong }), e.text(n.format ? n.format(h.value) : String(h.value), V(t), d + c / 2, x.numeral, r.primary, "right", "middle");
  });
}
function l1(e, t, i, n = {}) {
  i = i.filter((f) => Number.isFinite(f.x) && Number.isFinite(f.y));
  const o = j(i.map((f) => f.y)) ?? [0, 1], a = j(i.map((f) => f.x)) ?? [0, 1], s = n.min ?? o[0], c = n.max ?? o[1], h = it(e, t, s, c, n), l = n.xMin ?? a[0], d = n.xMax ?? a[1];
  for (const f of i)
    e.circle(
      q(f.x, l, d, h.x, V(h)),
      q(f.y, s, c, k(h), h.y),
      n.radius ?? 2,
      { fill: n.gray ?? r.strong }
    );
}
function ee(e, t, i, n, o, a = {}) {
  const s = a.width ?? 6, c = a.startAngle ?? -Math.PI / 2, h = Number.isFinite(o) ? T(o, 0, 1) : 0;
  e.arc(t, i, n, 0, Math.PI * 2, { stroke: a.trackGray ?? (Z(e) ? r.hairline : r.sunken), width: Z(e) ? 1 : s, cap: "butt" }), h > 1e-3 && e.arc(t, i, n, c, c + Math.PI * 2 * h, { stroke: a.gray ?? r.max, width: s, cap: "round" });
  const l = n - s / 2 - 4;
  if (a.value) {
    const d = bt(e.measure, a.value, x.numeralLg, l * 1.9, l * 1.3);
    e.text(a.value, t, i - (a.label ? 5 : 0), d, r.max, "center", "middle");
  }
  a.label && e.text(S(e.measure, a.label, x.micro, l * 1.9), t, i + 11, { ...x.micro, size: 8 }, r.tertiary, "center", "middle");
}
function d1(e, t, i, n, o, a = {}) {
  const s = a.min ?? 0, c = a.max ?? 100, h = Math.PI * 0.75, l = Math.PI * 1.5, d = c - s, f = (m) => h + (d > 0 && Number.isFinite(m) ? (T(m, s, c) - s) / d : 0) * l;
  for (const m of a.zones ?? [])
    e.arc(t, i, n, f(m.from), f(m.to), { stroke: m.gray, width: 5, cap: "butt" });
  e.arc(t, i, n, h, h + l, { stroke: r.border, width: 1.5, cap: "round" });
  const u = Math.min(180, Math.max(0, Math.floor(a.ticks ?? 5)));
  for (let m = 0; m < u; m++) {
    const L = h + (u === 1 ? 0.5 : m / (u - 1)) * l, w = n - 6;
    e.line(
      t + Math.cos(L) * w,
      i + Math.sin(L) * w,
      t + Math.cos(L) * (n - 1),
      i + Math.sin(L) * (n - 1),
      { stroke: r.disabled, width: 1.5, cap: "butt" }
    );
  }
  const M = f(o);
  e.line(t, i, t + Math.cos(M) * (n - 9), i + Math.sin(M) * (n - 9), { stroke: a.gray ?? r.max, width: 2.5 }), e.circle(t, i, 3, { fill: r.max }), a.format && e.text(a.format(o), t, i + n * 0.52, x.numeralLg, r.max, "center", "top"), a.label && e.text(a.label, t, i + n * 0.52 + 22, { ...x.micro, size: 8 }, r.tertiary, "center", "top");
}
function f1(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = j(i) ?? [0, 1], a = n.min ?? o[0], s = n.max ?? o[1], c = n.gap ?? 1, h = (t.width - c * (i.length - 1)) / i.length;
  i.forEach((l, d) => {
    if (!Number.isFinite(l)) return;
    const f = q(l, a, s, n.low ?? r.sunken, n.high ?? r.max);
    e.rect({ x: t.x + d * (h + c), y: t.y, width: h, height: t.height }, { fill: Math.round(f) });
  });
}
function u1(e, t, i, n, o = {}) {
  const a = Math.max(o.max ?? Math.max(i, n) * 1.15, Number.EPSILON);
  Z(e) ? e.roundRect(t, t.height / 2, { stroke: r.hairline, width: 1 }) : e.roundRect(t, t.height / 2, { fill: r.sunken }), e.roundRect({ ...t, width: Math.max(2, t.width * T(i, 0, a) / a) }, t.height / 2, { fill: o.gray ?? r.strong });
  const s = t.x + t.width * T(n, 0, a) / a;
  e.vline(s, t.y - 2, k(t) + 2, r.max, 2);
}
const nt = [15, 11, 8, 5], ie = { ...x.numeral, size: 12, leading: 14 }, Ct = { ...x.micro, size: 8 };
function M1(e, t, i, n, o, a = {}) {
  const s = Math.max(1, C(a.width, 8)), c = Math.max(0, C(n) - s / 2), h = o.map((f) => Math.max(0, C(f.value))), l = h.reduce((f, u) => f + u, 0);
  if (!(l > 0))
    e.arc(t, i, c, 0, Math.PI * 2, { stroke: r.hairline, width: 1 });
  else {
    const u = h.filter((m) => m > 0).length > 1 ? Math.max(0, C(a.gap, 0.07)) : 0;
    let M = a.startAngle ?? -Math.PI / 2;
    h.forEach((m, L) => {
      if (m <= 0) return;
      const w = m / l * Math.PI * 2, y = M + u / 2, H = M + w - u / 2;
      H > y && e.arc(t, i, c, y, H, { stroke: o[L].gray ?? nt[L % nt.length], width: s, cap: "butt" }), M += w;
    });
  }
  const d = Math.max(0, (C(n) - s - 4) * 1.9);
  a.value && e.text(a.value, t, i - (a.label ? 5 : 0), at(e.measure, a.value, [x.numeralLg, x.numeral, ie], d), r.max, "center", "middle"), a.label && e.text(S(e.measure, a.label, Ct, d), t, i + 11, Ct, r.tertiary, "center", "middle");
}
function m1(e, t, i, n = {}) {
  const o = i.map((d) => Math.max(0, C(d.value))), a = o.reduce((d, f) => d + f, 0);
  if (!(a > 0)) {
    e.roundRect(t, Math.min(2, t.height / 2), { stroke: r.hairline, width: 1 });
    return;
  }
  const s = o.filter((d) => d > 0).length, c = Math.max(0, C(n.gap, 2)), h = Math.max(0, t.width - c * (s - 1));
  let l = t.x;
  o.forEach((d, f) => {
    if (d <= 0) return;
    const u = { x: l, y: t.y, width: h * d / a, height: t.height }, M = i[f].gray ?? nt[f % nt.length];
    i[f].pattern === "hatch" ? (e.rect(u, { stroke: M, width: 1 }), e.hatch(u, 4, M, Math.PI / 4, 1)) : e.roundRect(u, Math.min(2, t.height / 2), { fill: M }), l += u.width + c;
  });
}
function x1(e, t, i, n, o = {}) {
  const a = P(n, 0, 0, 400);
  if (a === 0 || !(t.width > 0) || !(t.height > 0)) return;
  const s = P(i, 0, 0, a), c = P(o.columns, Math.ceil(Math.sqrt(a * t.width / t.height)), 1, a), h = Math.ceil(a / c), l = Math.min(t.width / c, t.height / h), d = Math.max(0.8, l * 0.32);
  for (let f = 0; f < a; f++) {
    const u = t.x + (f % c + 0.5) * l, M = t.y + (Math.floor(f / c) + 0.5) * l;
    f < s ? e.circle(u, M, d, { fill: o.gray ?? r.max }) : e.circle(u, M, Math.max(0.6, d - 0.5), { stroke: r.border, width: 1 });
  }
}
function y1(e, t, i, n, o, a = {}) {
  const s = Math.max(1, C(a.width, 5)), c = Math.max(0, C(a.gap, 3)), h = a.grays?.length ? a.grays : [15, 12, 9, 7];
  o.forEach((l, d) => {
    const f = C(n) - s / 2 - d * (s + c);
    if (f <= s / 2) return;
    e.arc(t, i, f, 0, Math.PI * 2, { stroke: Z(e) ? r.hairline : r.sunken, width: Z(e) ? 1 : s, cap: "butt" });
    const u = B(l);
    u > 1e-3 && e.arc(t, i, f, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u, { stroke: h[d % h.length], width: s, cap: "round" });
  });
}
function w1(e, t, i, n = {}) {
  const o = i.filter((w) => Number.isFinite(w)), a = P(n.bins, 12, 1, 200), s = j(o), c = n.min ?? s?.[0] ?? 0;
  let h = n.max ?? s?.[1] ?? 1;
  h > c || (h = c + 1);
  const l = (w) => Math.min(a - 1, Math.max(0, Math.floor((w - c) / (h - c) * a))), d = new Array(a).fill(0);
  for (const w of o) w >= c && w <= h && d[l(w)]++;
  let f = 1;
  for (const w of d) w > f && (f = w);
  const u = n.highlight !== void 0 && Number.isFinite(n.highlight) ? l(n.highlight) : -1, M = 1, m = (t.width - M * (a - 1)) / a, L = k(t);
  d.forEach((w, y) => {
    if (w === 0) return;
    const H = Math.max(1, w / f * (t.height - 1)), g = { x: t.x + y * (m + M), y: L - H, width: m, height: H };
    y === u ? e.rect(g, { fill: r.max }) : Z(e) && m >= 4 ? e.rect(g, { stroke: n.gray ?? r.secondary, width: 1 }) : e.rect(g, { fill: n.gray ?? r.secondary });
  }), e.hline(t.x, V(t), L, r.border);
}
function L1(e, t, i, n, o = {}) {
  const a = Math.min(i.length, n.length);
  if (a < 2) return;
  const s = j([...i.slice(0, a), ...n.slice(0, a), ...o.mid ?? []]);
  if (!s) return;
  let c = o.min ?? s[0], h = o.max ?? s[1];
  h === c && (c -= 1, h += 1);
  const l = it(e, t, c, h, o), d = [], f = [];
  for (let u = 0; u < a; u++) {
    if (!Number.isFinite(i[u]) || !Number.isFinite(n[u])) continue;
    const M = l.x + u / (a - 1) * l.width;
    d.push({ x: M, y: q(n[u], c, h, k(l), l.y) }), f.push({ x: M, y: q(i[u], c, h, k(l), l.y) });
  }
  if (d.length >= 2) {
    const u = [...d, ...[...f].reverse()];
    e.scoped((M) => {
      M.clipRect(l), Z(e) ? (M.scoped((m) => {
        m.ctx.beginPath(), u.forEach((L, w) => w === 0 ? m.ctx.moveTo(L.x, L.y) : m.ctx.lineTo(L.x, L.y)), m.ctx.closePath(), m.ctx.clip(), m.hatch(l, 5, r.hairline, Math.PI / 4, 1);
      }), M.polyline(d, { stroke: r.secondary, width: 1 }), M.polyline(f, { stroke: r.secondary, width: 1 })) : M.polygon(u, { fill: r.raised });
    });
  }
  if (o.mid) {
    const u = yt([...o.mid], l, c, h).filter((M) => Number.isFinite(M.y));
    u.length >= 2 && e.polyline(u, { stroke: o.gray ?? r.max, width: 1.5 });
  }
}
function H1(e, t, i, n = {}) {
  const o = i.filter((u) => [u.open, u.high, u.low, u.close].every((M) => Number.isFinite(M)));
  if (o.length === 0) return;
  const a = j(o.flatMap((u) => [u.high, u.low, u.open, u.close]));
  let s = n.min ?? a[0], c = n.max ?? a[1];
  c === s && (s -= 1, c += 1);
  const h = it(e, t, s, c, { ...n, baseline: n.baseline ?? !1 }), l = h.width / o.length, d = Math.max(1, l - Math.max(1, C(n.gap, l * 0.35))), f = (u) => q(u, s, c, k(h), h.y);
  o.forEach((u, M) => {
    const m = Math.round(h.x + (M + 0.5) * l) + 0.5, L = u.close >= u.open, w = f(Math.max(u.open, u.close)), y = { x: m - d / 2, y: w, width: d, height: Math.max(1, f(Math.min(u.open, u.close)) - w) };
    e.line(m, f(u.high), m, f(u.low), { stroke: L ? r.strong : r.secondary, width: 1, cap: "butt" }), L ? (e.rect(y, { fill: r.off }), e.rect(y, { stroke: r.max, width: 1 })) : e.rect(y, { fill: r.secondary });
  });
}
function g1(e, t, i, n = {}) {
  const o = i.length, a = j([...i]);
  if (o === 0 || !a) return;
  const s = n.min ?? Math.min(0, a[0]);
  let c = n.max ?? a[1];
  c > s || (c = s + 1);
  const h = Math.max(0, C(n.gap, 1)), l = Math.max(1, (t.width - h * (o - 1)) / o);
  i.forEach((d, f) => {
    if (!Number.isFinite(d)) return;
    const u = Math.max(1, q(d, s, c, 0, t.height)), M = f === o - 1 && n.highlightLast !== !1;
    e.rect({ x: t.x + f * (l + h), y: k(t) - u, width: l, height: u }, { fill: M ? r.max : n.gray ?? r.tertiary });
  });
}
function V1(e, t, i, n, o, a, s = {}) {
  const c = o.length, h = C(n);
  if (c < 3 || !(h > 0)) return;
  const l = P(s.rings, 3, 1, 6), d = (u) => -Math.PI / 2 + u * Math.PI * 2 / c, f = (u, M) => F(t, i, h * M, d(u));
  for (let u = 1; u <= l; u++)
    e.polygon(o.map((M, m) => f(m, u / l)), { stroke: u === l ? r.border : r.hairline, width: 1, join: "miter" });
  o.forEach((u, M) => {
    const m = f(M, 1);
    e.line(t, i, m.x, m.y, { stroke: r.hairline, width: 1, cap: "butt" });
  });
  for (const u of a) {
    const M = o.map((L, w) => f(w, B(u.values[w]))), m = u.gray ?? r.max;
    if (e.polygon(M, { stroke: m, width: 1.5, dash: u.dash }), !u.dash) for (const L of M) e.circle(L.x, L.y, 1.8, { fill: m });
  }
  s.labels !== !1 && o.forEach((u, M) => {
    const m = d(M), L = Math.cos(m), w = Math.abs(L) < 0.3 ? "center" : L > 0 ? "left" : "right";
    e.text(u, t + L * (h + 6), i + Math.sin(m) * (h + 8), x.micro, r.tertiary, w, "middle");
  });
}
function C1(e, t, i, n, o, a = {}) {
  const s = o.length, c = C(n);
  if (s === 0 || !(c > 0)) return;
  const h = j([...o]), l = Math.max(a.max ?? h?.[1] ?? 1, Number.EPSILON), d = P(a.rings, 2, 1, 6);
  for (let m = 1; m <= d; m++)
    e.circle(t, i, c * m / d, { stroke: m === d ? r.border : r.hairline, width: 1, dash: m === d ? void 0 : [2, 3] });
  let f = -1;
  o.forEach((m, L) => {
    Number.isFinite(m) && (f < 0 || m > o[f]) && (f = L);
  });
  const u = Math.PI * 2 / s;
  o.forEach((m, L) => {
    if (!Number.isFinite(m) || m <= 0) return;
    const w = c * T(m / l, 0, 1), y = -Math.PI / 2 + L * u, H = y - u * 0.42, g = y + u * 0.42;
    L === f ? e.sector(t, i, w, H, g, { fill: a.gray ?? r.max }) : Z(e) ? e.sector(t, i, w, H, g, { stroke: r.secondary, width: 1, join: "miter" }) : e.sector(t, i, w, H, g, { fill: r.disabled });
  });
  const M = a.labels ?? [];
  M.forEach((m, L) => {
    const w = -Math.PI / 2 + L * Math.PI * 2 / M.length;
    e.text(m, t + Math.cos(w) * (c + 8), i + Math.sin(w) * (c + 8), x.micro, r.tertiary, "center", "middle");
  });
}
function Rt(e, t, i = {}) {
  const n = i.radius ?? A.lg, o = Z(e), a = i.fill ?? (o ? void 0 : r.surface), s = i.stroke ?? (o ? r.border : void 0);
  return a !== void 0 && e.roundRect(t, n, { fill: a }), i.texture && !o && e.scoped((c) => {
    c.clipRound(t, n), c.dots(t, 5, r.sunken, 0.5);
  }), s !== void 0 && e.roundRect(t, n, { stroke: s, width: i.strokeWidth ?? 1 }), U(t, z.md);
}
function b1(e, t, i, n = {}) {
  Rt(e, t, { fill: n.fill, stroke: n.stroke, radius: n.radius ?? A.lg, texture: n.texture });
  const o = t.y + 13;
  let a = t.x + z.md;
  n.icon && (E(e, n.icon, a + 5, o, 12, r.tertiary), a += 17);
  const s = n.accessory ? e.measure(n.accessory, x.micro) + z.sm : 0, c = V(t) - z.md - s - a;
  return e.text(S(e.measure, i, x.label, c), a, o, x.label, r.secondary, "left", "middle"), n.accessory && e.text(n.accessory, V(t) - z.md, o, x.micro, r.tertiary, "right", "middle"), e.hline(t.x + z.md, V(t) - z.md, t.y + 24, r.hairline), U({ x: t.x, y: t.y + 26, width: t.width, height: t.height - 26 }, { left: z.md, right: z.md, bottom: z.md });
}
function k1(e, t, i, n = r.hairline) {
  const o = I(t);
  if (!i) {
    e.hline(t.x, V(t), o, n);
    return;
  }
  const a = e.measure(i, x.micro), s = 6;
  e.hline(t.x, N(t) - a / 2 - s, o, n), e.hline(N(t) + a / 2 + s, V(t), o, n), e.text(i, N(t), o, x.micro, r.tertiary, "center", "middle");
}
function p1(e, t, i, n = {}) {
  const o = n.align ?? "left", a = n.valueStyle ?? x.numeralLg, s = o === "left" ? t.x : o === "right" ? V(t) : N(t), c = k(t) - 5, h = !!n.label, l = h ? k(t) - 18 : I(t);
  let d = s;
  n.icon && o === "left" && (E(e, n.icon, t.x + 7, t.y + 8, 14, r.tertiary), d = t.x + 18);
  const f = n.unit ? e.measure(n.unit, x.caption) + 6 : 0, u = bt(
    e.measure,
    i,
    a,
    Math.max(24, V(t) - d - f),
    h ? t.height - 24 : t.height
  ), M = e.measure(i, u);
  if (e.text(i, d, l, u, n.gray ?? r.max, o, "bottom"), n.unit) {
    const m = o === "right" ? d - M - 3 : o === "center" ? d + M / 2 + 3 : d + M + 3;
    e.text(n.unit, m, l - 1, x.caption, r.tertiary, o === "right" ? "right" : "left", "bottom");
  }
  if (n.label && e.text(n.label, s, c, x.label, r.secondary, o, "bottom"), n.delta !== void 0 && n.delta !== 0) {
    const m = n.delta > 0;
    E(e, m ? "caret-up" : "caret-down", V(t) - 8, t.y + 9, 12, r.strong), n.deltaText && e.text(n.deltaText, V(t) - 17, t.y + 9, x.micro, r.secondary, "right", "middle");
  }
}
function ne(e, t, i, n, o = {}) {
  const a = o.align ?? "left", s = a === "left" ? t.x : a === "right" ? V(t) : N(t);
  e.text(i, s, t.y, x.micro, r.tertiary, a, "top"), e.text(n, s, t.y + 12, o.style ?? x.numeral, o.gray ?? r.primary, a, "top");
}
function v1(e, t, i, n, o = {}) {
  const a = I(t);
  if (e.text(i, t.x, a, x.caption, r.secondary, "left", "middle"), e.text(n, V(t), a, x.numeral, o.gray ?? r.primary, "right", "middle"), o.leader) {
    const s = e.measure(i, x.caption), c = e.measure(n, x.numeral), h = t.x + s + 5, l = V(t) - c - 5;
    l > h && e.line(h, a + 2, l, a + 2, { stroke: r.hairline, width: 1, dash: [1, 3], cap: "butt" });
  }
}
function Z1(e, t, i) {
  i.selected && (Z(e) ? (e.roundRect({ x: t.x, y: t.y + 2, width: 2.5, height: t.height - 4 }, 1.5, { fill: r.max }), e.roundRect(t, A.md, { stroke: r.hairline, width: 1 })) : e.roundRect(t, A.md, { fill: r.raised }));
  const n = I(t);
  let o = t.x + z.md;
  i.checked !== void 0 && (E(e, i.checked ? "check-square" : "square", o + 7, n, 15, i.checked ? r.max : r.disabled), o += 24), i.icon && (E(e, i.icon, o + 8, n, 16, i.selected ? r.max : r.strong), o += 26);
  const a = V(t) - z.md - (i.chevron ? 14 : 0), s = i.value ? e.measure(i.value, x.numeral) + 10 : 0, c = a - o - s;
  i.subtitle ? (e.textBox(i.title, { x: o, y: n - 15, width: c, height: 16 }, x.bodyStrong, i.selected ? r.max : r.primary, { wrap: !1, vAlign: "middle" }), e.textBox(i.subtitle, { x: o, y: n + 1, width: c, height: 14 }, x.caption, r.tertiary, { wrap: !1, vAlign: "middle" })) : e.textBox(i.title, { x: o, y: t.y, width: c, height: t.height }, x.body, i.selected ? r.max : r.primary, { wrap: !1, vAlign: "middle" }), i.value && e.text(i.value, a, n, x.numeral, i.selected ? r.max : r.secondary, "right", "middle"), i.chevron && E(e, "chevron-right", V(t) - z.md, n, 12, r.disabled);
}
function oe(e, t, i, n = {}) {
  const o = Number.isFinite(i) ? T(i, 0, 1) : 0, a = n.radius ?? t.height / 2;
  n.track !== void 0 ? e.roundRect(t, a, { fill: n.track }) : Z(e) ? e.roundRect(t, a, { stroke: r.hairline, width: 1 }) : e.roundRect(t, a, { fill: r.sunken }), o > 5e-3 && e.roundRect({ ...t, width: Math.min(t.width, Math.max(t.height, t.width * o)) }, a, { fill: n.fill ?? r.max });
  const s = n.ticks && Number.isFinite(n.ticks) ? Math.min(64, Math.floor(n.ticks)) : 0, c = Z(e) && n.track === void 0, h = o > 5e-3 ? t.x + Math.min(t.width, Math.max(t.height, t.width * o)) : t.x;
  for (let l = 1; l < s; l++) {
    const d = t.x + t.width * l / s;
    d < h - 1 || !c ? e.vline(d, t.y + (c ? 1 : 0), k(t) - (c ? 1 : 0), r.off) : e.vline(d, t.y + 2, k(t) - 2, r.hairline);
  }
}
function O1(e, t, i, n, o = {}) {
  if (!Number.isFinite(i) || i <= 0) return;
  i = Math.min(128, Math.floor(i)), n = Number.isFinite(n) ? Math.max(0, Math.min(i, n)) : 0;
  const a = o.gap ?? 3, s = Math.max(0, (t.width - a * (i - 1)) / i);
  for (let c = 0; c < i; c++) {
    const h = { x: t.x + c * (s + a), y: t.y, width: s, height: t.height }, l = Math.min(2, t.height / 2);
    c < n ? e.roundRect(h, l, { fill: o.fill ?? r.max }) : Z(e) && o.track === void 0 ? e.roundRect(h, l, { stroke: r.hairline, width: 1 }) : e.roundRect(h, l, { fill: o.track ?? r.sunken });
  }
}
function ae(e, t, i, n, o = {}) {
  const a = o.width ?? 22, s = o.height ?? 11, c = Number.isFinite(n) ? T(n, 0, 1) : 0;
  e.roundRect({ x: t, y: i - s / 2, width: a, height: s }, 2.5, { stroke: o.gray ?? r.secondary, width: 1 }), e.roundRect({ x: t + a + 1, y: i - 2.5, width: 2, height: 5 }, 1, { fill: o.gray ?? r.secondary });
  const h = a - 4;
  c > 0.02 && e.roundRect({ x: t + 2, y: i - s / 2 + 2, width: Math.max(1.5, h * c), height: s - 4 }, 1, { fill: c < 0.15 ? r.strong : r.max });
}
function re(e, t, i, n, o = 4, a = {}) {
  const s = a.height ?? 11;
  for (let c = 0; c < o; c++) {
    const h = (c + 1) / o * s;
    e.rect({ x: t + c * 4, y: i + s / 2 - h, width: 2.5, height: h }, { fill: c < n ? r.max : r.hairline });
  }
}
function R1(e, t, i = {}) {
  const n = I(t);
  i.title && e.text(i.title, t.x, n, x.label, r.secondary, "left", "middle");
  let o = V(t);
  i.battery !== void 0 && (ae(e, o - 24, n, i.battery), o -= 34), i.signal !== void 0 && (re(e, o - 14, n, i.signal), o -= 24);
  for (const a of i.icons ?? [])
    E(e, a, o - 7, n, 13, r.secondary), o -= 18;
  i.time && e.text(i.time, o - 4, n, x.numeral, r.primary, "right", "middle");
}
function S1(e, t, i, n, o) {
  const s = t - (n - 1) * 9 / 2;
  for (let c = 0; c < n; c++)
    c === o ? e.circle(s + c * 9, i, 2.6, { fill: r.max }) : e.circle(s + c * 9, i, 2.2, { fill: r.border });
}
function E1(e, t, i, n) {
  if (i.length === 0) return;
  const o = t.width / i.length;
  i.forEach((a, s) => {
    const c = t.x + s * o + o / 2, h = s === n;
    e.text(a, c, I(t) - 2, x.micro, h ? r.max : r.disabled, "center", "middle"), h && e.roundRect({ x: c - 12, y: k(t) - 4, width: 24, height: 2 }, 1, { fill: r.max });
  });
}
function se(e, t, i, n, o) {
  if (!(o > 0) || o <= n) return;
  Z(e) || e.roundRect(t, t.width / 2, { fill: r.sunken });
  const a = Math.max(10, n / o * t.height), s = t.y + i / o * t.height;
  e.roundRect({ x: t.x, y: Math.min(s, k(t) - a), width: t.width, height: a }, t.width / 2, { fill: r.border });
}
function I1(e, t, i, n, o = {}) {
  const a = o.style ?? x.micro, s = o.height ?? 17, c = o.icon ? 14 : 0, h = e.measure(n, a) + 16 + c, l = { x: t, y: i - s / 2, width: h, height: s };
  return o.fill !== void 0 ? e.roundRect(l, s / 2, { fill: o.fill }) : Z(e) ? e.roundRect(l, s / 2, { stroke: r.border, width: 1 }) : e.roundRect(l, s / 2, { fill: r.raised }), o.icon && E(e, o.icon, t + 12, i, 11, o.gray ?? r.secondary), e.text(n, t + 8 + c, i, a, o.gray ?? r.primary, "left", "middle"), h;
}
function T1(e, t, i, n, o = {}) {
  const a = o.height ?? 16, s = e.measure(n, x.micro) + 14;
  return e.roundRect({ x: t, y: i - a / 2, width: s, height: a }, A.xs, { stroke: o.gray ?? r.border, width: 1 }), e.text(n, t + s / 2, i, x.micro, o.gray ?? r.secondary, "center", "middle"), s;
}
function A1(e, t, i, n) {
  if (n === void 0) {
    e.circle(t, i, 3, { fill: r.max });
    return;
  }
  const o = n > 99 ? "99+" : String(n), a = Math.max(15, e.measure(o, x.micro) + 9);
  e.roundRect({ x: t - a / 2, y: i - 7.5, width: a, height: 15 }, 7.5, { fill: r.max }), e.text(o, t, i, { ...x.micro, size: 9 }, r.off, "center", "middle");
}
function ce(e, t, i, n = {}) {
  const o = Z(e), a = o ? void 0 : n.primary ? r.max : r.raised, s = o ? n.primary ? r.max : r.secondary : n.primary ? r.off : r.primary;
  a !== void 0 && e.roundRect(t, A.md, { fill: a }), o && e.roundRect(t, A.md, { stroke: n.primary ? r.max : r.border, width: n.primary ? 1.5 : 1 }), n.focused && e.roundRect(U(t, -2.5), A.md + 2, { stroke: r.max, width: 1.5 });
  const c = n.icon ? 18 : 0, h = e.measure(i, x.bodyStrong), l = N(t) - (h + c) / 2;
  n.icon && E(e, n.icon, l + 7, I(t), 14, s), e.text(i, l + c, I(t), x.bodyStrong, s, "left", "middle");
}
function he(e, t, i, n, o = 32) {
  const a = o * 0.56;
  Z(e) ? (e.roundRect({ x: t, y: i - a / 2, width: o, height: a }, a / 2, { stroke: n ? r.max : r.border, width: 1 }), e.circle(n ? t + o - a / 2 : t + a / 2, i, a / 2 - 3, { fill: n ? r.max : r.disabled })) : (e.roundRect({ x: t, y: i - a / 2, width: o, height: a }, a / 2, { fill: n ? r.max : r.border }), e.circle(n ? t + o - a / 2 : t + a / 2, i, a / 2 - 2.5, { fill: n ? r.off : r.surface }));
}
function F1(e, t, i, n = {}) {
  e.scoped((o) => {
    Z(e) || o.roundRect(t, A.pill, { fill: r.raised, alpha: n.alpha ?? 1 }), o.roundRect(t, A.pill, { stroke: r.border, width: 1, alpha: n.alpha ?? 1 });
    let a = t.x + 16;
    n.icon && (E(o, n.icon, a + 7, I(t), 14, r.max), a += 24), o.text(i, a, I(t), x.body, r.primary, "left", "middle");
  });
}
function P1(e, t, i, n, o) {
  const a = I(t) - (o ? 10 : 4);
  E(e, i, N(t), a - 18, 30, r.disabled), e.text(n, N(t), a + 10, x.title, r.secondary, "center", "middle"), o && e.textBox(o, { x: t.x + 40, y: a + 22, width: t.width - 80, height: 32 }, x.caption, r.tertiary, { hAlign: "center" });
}
function N1(e, t, i = 0.5) {
  e.rect(t, { fill: r.off, alpha: i });
}
function $1(e, t, i, n, o, a = {}) {
  if (e.circle(t, i, n, { stroke: r.border, width: 1 }), a.ticks !== !1)
    for (let c = 0; c < 360; c += 15) {
      const h = Y(c - o), l = c % 45 === 0, d = F(t, i, n - (l ? 7 : 4), h), f = F(t, i, n - 1, h);
      e.line(d.x, d.y, f.x, f.y, { stroke: l ? r.secondary : r.hairline, width: l ? 1.5 : 1, cap: "butt" });
    }
  const s = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  for (const [c, h] of s) {
    const l = F(t, i, n - 16, Y(h - o));
    e.text(c, l.x, l.y, c === "N" ? x.bodyStrong : x.caption, c === "N" ? r.max : r.secondary, "center", "middle");
  }
  if (a.pointer !== void 0) {
    const c = Y(a.pointer - o), h = F(t, i, n - 22, c), l = F(t, i, n - 33, c - 0.16), d = F(t, i, n - 33, c + 0.16);
    if (e.polygon([h, l, d], { fill: r.strong }), a.pointerLabel) {
      const f = F(t, i, n - 40, c);
      e.text(a.pointerLabel, f.x, f.y, x.micro, r.tertiary, "center", "middle");
    }
  }
  e.polygon(
    [{ x: t, y: i - n + 2 }, { x: t - 5, y: i - n - 7 }, { x: t + 5, y: i - n - 7 }],
    { fill: r.max }
  ), a.showValue !== !1 && e.text(`${Math.round(o).toString().padStart(3, "0")}°`, t, i, x.numeralLg, r.max, "center", "middle");
}
function z1(e, t, i, n, o, a) {
  e.scoped((s) => {
    s.clipCircle(t, i, n), s.rotateAbout(t, i, -a * Math.PI / 180);
    const c = i + o * 2, h = { x: t - n * 2, y: c, width: n * 4, height: n * 2 };
    Z(e) || s.rect(h, { fill: r.sunken }), s.hatch(h, 5, Z(e) ? r.hairline : r.border), s.hline(t - n * 1.4, t + n * 1.4, c, r.max, 1.5);
    for (const l of [-20, -10, 10, 20]) {
      const d = c - l * 2, f = l % 20 === 0 ? 16 : 9;
      s.hline(t - f, t + f, d, r.disabled);
    }
  }), e.line(t - n * 0.5, i, t - n * 0.15, i, { stroke: r.max, width: 2 }), e.line(t + n * 0.15, i, t + n * 0.5, i, { stroke: r.max, width: 2 }), e.circle(t, i, 2, { fill: r.max }), e.circle(t, i, n, { stroke: r.border, width: 1.5 });
}
function B1(e, t, i, n, o, a, s = "kn") {
  e.circle(t, i, n, { stroke: r.hairline, width: 1, dash: [2, 3] });
  const c = Y(o + 180), h = F(t, i, n, c), l = F(t, i, -n * 0.75, c);
  e.line(l.x, l.y, h.x, h.y, { stroke: r.strong, width: 2 });
  const d = F(h.x, h.y, n * 0.35, c + 2.5), f = F(h.x, h.y, n * 0.35, c - 2.5);
  e.polygon([h, d, f], { fill: r.max }), e.circle(t, i, n * 0.46, { fill: r.off }), e.text(String(a), t, i - 3, x.numeral, r.max, "center", "middle"), e.text(s, t, i + 8, { ...x.micro, size: 8 }, r.tertiary, "center", "middle");
}
function G1(e, t, i, n, o, a = !1) {
  a && e.circle(t, i, n + 4, { stroke: r.strong, width: 1.5, dash: [3, 4] }), Z(e) ? e.circle(t, i, n - 1.75, { stroke: r.max, width: 3.5 }) : (e.circle(t, i, n, { fill: r.max }), e.circle(t, i, n - 3.5, { fill: r.off })), e.text(String(o), t, i + 1, { ...x.numeralLg, size: n * 1.05 }, r.max, "center", "middle");
}
function W1(e, t, i, n, o) {
  E(e, o === "left" ? "corner-left" : o === "right" ? "corner-right" : o === "uturn" ? "u-turn" : o === "slight-left" ? "arrow-up-left" : o === "slight-right" ? "arrow-up-right" : "arrow-up", t, i, n, r.max, { width: Math.max(2, n / 12) });
}
class D1 {
  width;
  height;
  cell;
  cols;
  rows;
  previous = null;
  /** One (cols+1)x(rows+1) integral image per observed transition. */
  integrals = [];
  constructor(t = {}) {
    if (this.width = t.width ?? 576, this.height = t.height ?? 288, this.cell = t.cell ?? 8, this.width % this.cell || this.height % this.cell)
      throw new Error(`Glyph: change-map cell ${this.cell} does not divide ${this.width}x${this.height}.`);
    this.cols = this.width / this.cell, this.rows = this.height / this.cell;
  }
  get transitions() {
    return this.integrals.length;
  }
  /** Feed one resolved frame. The first call only establishes a baseline. */
  observe(t) {
    if (t.length !== this.width * this.height)
      throw new Error("Glyph: change map received a frame of the wrong size.");
    if (!this.previous) {
      this.previous = Uint8Array.from(t);
      return;
    }
    const { cols: i, rows: n, cell: o, width: a } = this, s = new Uint8Array(i * n), c = this.previous;
    for (let l = 0; l < this.height; l++) {
      const d = l * a, f = (l / o | 0) * i;
      for (let u = 0; u < a; u++)
        c[d + u] !== t[d + u] && (s[f + (u / o | 0)] = 1);
    }
    const h = new Int32Array((i + 1) * (n + 1));
    for (let l = 0; l < n; l++) {
      let d = 0;
      for (let f = 0; f < i; f++)
        d += s[l * i + f], h[(l + 1) * (i + 1) + (f + 1)] = h[l * (i + 1) + (f + 1)] + d;
    }
    this.integrals.push(h), this.previous.set(t);
  }
  reset() {
    this.previous = null, this.integrals = [];
  }
  /** How many recorded transitions touched this rectangle. */
  dirtyCount(t) {
    const i = Math.max(0, Math.floor(t.x / this.cell)), n = Math.max(0, Math.floor(t.y / this.cell)), o = Math.min(this.cols, Math.ceil((t.x + t.width) / this.cell)), a = Math.min(this.rows, Math.ceil((t.y + t.height) / this.cell));
    if (o <= i || a <= n) return 0;
    const s = this.cols + 1;
    let c = 0;
    for (const h of this.integrals)
      h[a * s + o] - h[n * s + o] - h[a * s + i] + h[n * s + i] > 0 && c++;
    return c;
  }
  /** Cost of one candidate tiling, in Gray4 bytes across every transition. */
  cost(t) {
    let i = 0, n = 0;
    for (const o of t.tiles) {
      const a = this.dirtyCount(o);
      n += a, i += a * (o.width * o.height >> 1);
    }
    return {
      layout: t,
      bytes: i,
      tilesPerFrame: this.transitions ? n / this.transitions : 0
    };
  }
  /**
   * Search every guillotine tiling on the step grid and return the cheapest.
   *
   * Guillotine tilings are the ones you can describe as "cut the rectangle, then
   * cut the pieces" — which is every tiling the four-container model can express
   * and, conveniently, exactly the ones a person would think to draw.
   */
  suggest(t = {}) {
    if (this.transitions === 0)
      throw new Error("Glyph: nothing recorded — call observe() with at least two frames.");
    const i = t.step ?? 16, n = t.minTile ?? 32, o = Math.min(t.tiles ?? Ht, Ht);
    if (i % 2 !== 0) throw new Error("Glyph: search step must be even — Gray4 needs even tile widths.");
    const a = /* @__PURE__ */ new Map(), s = this.width + 1, c = this.height + 1, h = (y) => {
      const H = ((y.x * c + y.y) * s + y.w) * c + y.h, g = a.get(H);
      if (g !== void 0) return g;
      const b = this.dirtyCount({ x: y.x, y: y.y, width: y.w, height: y.h }) * (y.w * y.h >> 1);
      return a.set(H, b), b;
    }, l = { cost: 1 / 0, boxes: null }, d = [], f = (y, H, g) => {
      if (!(g >= l.cost)) {
        if (H === 1) {
          const b = g + h(y);
          b < l.cost && (l.cost = b, l.boxes = [...d, y]);
          return;
        }
        for (let b = i; b <= y.w - i; b += i) {
          if (b < n || y.w - b < n) continue;
          const p = { x: y.x, y: y.y, w: b, h: y.h }, O = { x: y.x + b, y: y.y, w: y.w - b, h: y.h };
          for (let v = 1; v < H; v++) u(p, v, O, H - v, g);
        }
        for (let b = i; b <= y.h - i; b += i) {
          if (b < n || y.h - b < n) continue;
          const p = { x: y.x, y: y.y, w: y.w, h: b }, O = { x: y.x, y: y.y + b, w: y.w, h: y.h - b };
          for (let v = 1; v < H; v++) u(p, v, O, H - v, g);
        }
      }
    }, u = (y, H, g, b, p) => {
      if (H === 1) {
        const O = p + h(y);
        if (O >= l.cost) return;
        d.push(y), f(g, b, O), d.pop();
        return;
      }
      M(y, H, p, (O, v) => {
        if (v >= l.cost) return;
        const R = d.length;
        d.push(...O), f(g, b, v), d.length = R;
      });
    }, M = (y, H, g, b) => {
      if (H === 1) {
        b([y], g + h(y));
        return;
      }
      for (let p = i; p <= y.w - i; p += i) {
        if (p < n || y.w - p < n) continue;
        const O = { x: y.x, y: y.y, w: p, h: y.h }, v = { x: y.x + p, y: y.y, w: y.w - p, h: y.h };
        for (let R = 1; R < H; R++)
          M(O, R, g, ($, G) => M(v, H - R, G, (Q, ct) => b([...$, ...Q], ct)));
      }
      for (let p = i; p <= y.h - i; p += i) {
        if (p < n || y.h - p < n) continue;
        const O = { x: y.x, y: y.y, w: y.w, h: p }, v = { x: y.x, y: y.y + p, w: y.w, h: y.h - p };
        for (let R = 1; R < H; R++)
          M(O, R, g, ($, G) => M(v, H - R, G, (Q, ct) => b([...$, ...Q], ct)));
      }
    };
    f({ x: 0, y: 0, w: this.width, h: this.height }, o, 0);
    const m = l.boxes;
    if (!m) throw new Error("Glyph: no valid tiling found — try a smaller step or a smaller minTile.");
    const L = le(m, t.name ?? "measured"), w = Pt(L, this.width, this.height);
    if (w.length) throw new Error(`Glyph: search produced an invalid layout:
  ${w.join(`
  `)}`);
    return this.cost(L);
  }
}
function le(e, t) {
  const i = [...e].sort((a, s) => a.y - s.y || a.x - s.x), n = i.map((a, s) => ({
    id: 10 + s,
    name: `t${s}`,
    x: a.x,
    y: a.y,
    width: a.w,
    height: a.h,
    zOrder: s + 1
  })), o = i.map((a) => `${a.w}×${a.h}`).join(" + ");
  return { name: t, note: `measured — ${o}`, tiles: n };
}
function j1(e, t = "TILE_MEASURED") {
  const i = e.tiles.map((n) => `    { id: ${n.id}, name: "${n.name}", x: ${n.x}, y: ${n.y}, width: ${n.width}, height: ${n.height}, zOrder: ${n.zOrder} }`).join(`,
`);
  return `export const ${t}: TileLayout = {
  name: "${e.name}",
  note: ${JSON.stringify(e.note ?? "")},
  tiles: [
${i}
  ]
};
`;
}
class Y1 {
  frame;
  screens;
  index = 0;
  runtime = null;
  started = 0;
  dirty = !0;
  running = !1;
  lastPaint = 0;
  interval;
  transitionMs;
  onPaint;
  onSlowFrame;
  frameHandle = null;
  timerHandle = null;
  // Transition state. The two layers are allocated once and reused: a full
  // 576x288 raster at 2x supersampling is a 1152x576 canvas, and churning two
  // of those on every screen change is a lot of garbage for an animation the
  // wearer sees for a fifth of a second.
  fromLayer = null;
  toLayer = null;
  transition = null;
  /** Painted frames per second, averaged. Shown in the dev preview. */
  fps = 0;
  /**
   * How many tiles changed on the last paint. Tracked whether or not glasses
   * are attached, so you can see the transport cost of a design decision while
   * you are still making it.
   */
  lastDirtyTiles = 0;
  diff = new Nt();
  constructor(t) {
    if (t.screens.length === 0) throw new Error("Glyph: an app needs at least one screen.");
    this.screens = t.screens, this.frame = new $t({
      width: K.width,
      height: K.height,
      supersample: t.supersample ?? 2,
      tileLayout: t.tileLayout ?? zt,
      createCanvas: t.createCanvas,
      surface: t.surface,
      brightness: t.brightness
    }), t.font && this.frame.raster.useFont(t.font, t.fontMode ?? "auto"), this.interval = 1e3 / (t.fps ?? 20), this.transitionMs = t.transitionMs ?? 220, this.onPaint = t.onPaint, this.onSlowFrame = t.onSlowFrame;
  }
  get screen() {
    return this.screens[this.index];
  }
  get screenIndex() {
    return this.index;
  }
  get now() {
    return performance.now() - this.started;
  }
  /** How panels and tracks draw themselves. Changing it forces a repaint. */
  get surface() {
    return this.frame.raster.surface;
  }
  set surface(t) {
    this.frame.raster.surface = t, this.fromLayer && (this.fromLayer.surface = t), this.toLayer && (this.toLayer.surface = t), this.runtime?.invalidate(), this.diff.reset(), this.dirty = !0;
  }
  /** Global output scale, 0..1, applied at resolve. */
  get brightness() {
    return this.frame.raster.brightness;
  }
  set brightness(t) {
    this.frame.raster.brightness = t, this.runtime?.invalidate(), this.diff.reset(), this.dirty = !0;
  }
  /** Install a bitmap font set on this app's surface and its transition layers. */
  useFont(t, i = t ? "auto" : "canvas") {
    this.frame.raster.useFont(t, i), this.fromLayer?.useFont(t, i), this.toLayer?.useFont(t, i), this.runtime?.invalidate(), this.diff.reset(), this.dirty = !0;
  }
  /** Request a repaint on the next tick. */
  invalidate() {
    this.dirty = !0;
  }
  attachRuntime(t) {
    this.runtime = t, t?.invalidate(), this.dirty = !0;
  }
  /** What the transport is costing right now, if any is attached. */
  get transportStats() {
    return this.runtime?.isConnected ? this.runtime.stats : null;
  }
  goto(t, i) {
    const n = typeof t == "number" ? (t % this.screens.length + this.screens.length) % this.screens.length : this.screens.findIndex((a) => a.name === t);
    if (n < 0 || n === this.index) return;
    const o = i ?? (n > this.index ? 1 : -1);
    if (this.transitionMs > 0) {
      const a = this.ensureLayer("from");
      a.clear(0), a.drawRaster(this.frame.raster), this.ensureLayer("to"), this.transition = {
        tween: new Zt(0, this.transitionMs, vt.inOutCubic).to(1, this.now),
        direction: o
      };
    }
    this.screen.onExit?.(this), this.index = n, this.screen.onEnter?.(this), this.dirty = !0;
  }
  ensureLayer(t) {
    const i = t === "from" ? this.fromLayer : this.toLayer;
    if (i) return i;
    const n = this.frame.raster.layer();
    return t === "from" ? this.fromLayer = n : this.toLayer = n, n;
  }
  next() {
    this.goto(this.index + 1, 1);
  }
  previous() {
    this.goto(this.index - 1, -1);
  }
  handleInput(t) {
    if (t.type === "foreground-enter" && (this.runtime?.invalidate(), this.diff.reset()), this.screen.onInput?.(t, this) === !0) {
      this.dirty = !0;
      return;
    }
    t.type === "tap" || t.type === "scroll-down" ? this.next() : t.type === "scroll-up" && this.previous(), this.dirty = !0;
  }
  /** Paint one frame now, regardless of the dirty flag. */
  paint() {
    const t = performance.now(), i = this.now, n = (c) => ({
      g: c,
      now: i,
      screen: { x: 0, y: 0, ...K },
      safe: kt,
      app: this
    });
    if (this.transition && this.fromLayer && this.toLayer) {
      const c = T(this.transition.tween.valueAt(i), 0, 1), { direction: h } = this.transition;
      this.toLayer.clear(0), this.screen.render(n(this.toLayer));
      const l = this.frame.raster;
      l.clear(0), l.drawRaster(this.fromLayer, -h * K.width * c, 0), l.drawRaster(this.toLayer, h * K.width * (1 - c), 0), c >= 1 && (this.transition = null);
    } else
      this.frame.raster.clear(0), this.screen.render(n(this.frame.raster));
    const o = this.frame.toLevels(), a = this.frame.toFrame(o);
    this.lastDirtyTiles = this.diff.changed(a.tiles).length, this.onPaint?.(o, this), this.runtime?.isConnected && this.runtime.render(a).catch(() => {
    });
    const s = performance.now() - t;
    return this.onSlowFrame && s > this.interval && this.onSlowFrame({ screen: this.screen.name, ms: s, budgetMs: this.interval }, this), o;
  }
  /**
   * Arm the next tick.
   *
   * `requestAnimationFrame` is the right clock while the page is visible, and
   * no clock at all once it is not: browsers stop it for hidden pages. An Even
   * Hub app lives in a WebView on a phone that spends most of its life locked
   * in a pocket while the glasses are very much still being looked at, so a
   * hidden page falls back to a timer. Timers are throttled in the background
   * too — typically to about one a second — but a slow display beats a frozen
   * one.
   */
  schedule() {
    if (!this.running) return;
    typeof document < "u" && document.visibilityState === "hidden" || typeof requestAnimationFrame != "function" ? this.timerHandle = setTimeout(this.tick, this.interval) : this.frameHandle = requestAnimationFrame(this.tick);
  }
  cancelScheduled() {
    this.frameHandle !== null && cancelAnimationFrame(this.frameHandle), this.timerHandle !== null && clearTimeout(this.timerHandle), this.frameHandle = null, this.timerHandle = null;
  }
  /** The page was hidden or shown: move to the clock that works there. */
  onVisibility = () => {
    this.running && (this.cancelScheduled(), this.schedule());
  };
  tick = () => {
    if (this.frameHandle = null, this.timerHandle = null, !this.running) return;
    this.schedule();
    const t = performance.now();
    if (t - this.lastPaint < this.interval - 1) return;
    const i = this.screen.animated === !0 || this.transition !== null;
    if (!this.dirty && !i) return;
    const n = t - this.lastPaint;
    this.lastPaint = t, this.fps = this.fps === 0 ? 1e3 / n : this.fps * 0.9 + 1e3 / n * 0.1, this.dirty = !1, this.paint();
  };
  start() {
    this.running || (this.running = !0, this.started = performance.now(), this.lastPaint = performance.now() - this.interval, this.screen.onEnter?.(this), typeof document < "u" && document.addEventListener("visibilitychange", this.onVisibility), this.schedule());
  }
  stop() {
    this.running = !1, this.cancelScheduled(), typeof document < "u" && document.removeEventListener("visibilitychange", this.onVisibility);
  }
  /** Stop and release every canvas this app owns. */
  dispose() {
    this.stop(), this.fromLayer?.dispose(), this.toLayer?.dispose(), this.fromLayer = null, this.toLayer = null, this.transition = null, this.frame.dispose();
  }
}
class q1 {
  constructor(t, i) {
    this.total = t, this.visible = i;
  }
  total;
  visible;
  index = 0;
  offset = 0;
  move(t) {
    this.index = T(this.index + t, 0, Math.max(0, this.total - 1)), this.index < this.offset && (this.offset = this.index), this.index >= this.offset + this.visible && (this.offset = this.index - this.visible + 1);
  }
  setTotal(t) {
    this.total = t, this.index = T(this.index, 0, Math.max(0, t - 1)), this.offset = T(this.offset, 0, Math.max(0, t - this.visible));
  }
  /** Indices currently on screen. */
  window() {
    const t = [];
    for (let i = this.offset; i < Math.min(this.total, this.offset + this.visible); i++) t.push(i);
    return t;
  }
}
const et = (e, t, i) => Number.isFinite(e) ? Math.max(t, Math.min(i, e)) : t, X = (e) => e.y + e.height / 2;
function de(e, t, i, n = {}) {
  const o = n.gray ?? (n.selected ? r.max : r.secondary);
  e.roundRect(t, Math.min(t.height / 2, 8), Z(e) ? { stroke: o, width: 1 } : { fill: n.selected ? r.raised : r.surface, stroke: o, width: 1 }), e.textBox(i, { x: t.x + 5, y: t.y, width: Math.max(0, t.width - 10), height: t.height }, x.caption, o, { wrap: !1, hAlign: "center", vAlign: "middle" });
}
function _1(e, t, i, n = {}) {
  const o = Math.min(t.height, t.width / 1.8), a = X(t) - o / 2, s = n.disabled ? r.disabled : i ? r.max : r.secondary;
  e.roundRect({ x: t.x, y: a, width: t.width, height: o }, o / 2, { stroke: s, width: 1 });
  const c = Math.max(2, o - 6);
  e.circle(t.x + (i ? t.width - o / 2 : o / 2), X(t), c / 2, { fill: s });
}
function fe(e, t, i, n = {}) {
  const o = Math.min(t.width, t.height, 18), a = t.x + (t.width - o) / 2, s = X(t) - o / 2, c = n.disabled ? r.disabled : i ? r.max : r.secondary;
  e.roundRect({ x: a, y: s, width: o, height: o }, 3, { stroke: c, width: 1 }), i && (e.line(a + o * 0.23, s + o * 0.52, a + o * 0.43, s + o * 0.73, { stroke: c, width: 2 }), e.line(a + o * 0.43, s + o * 0.73, a + o * 0.8, s + o * 0.28, { stroke: c, width: 2 }));
}
function ue(e, t, i) {
  const n = Math.max(2, Math.min(t.width, t.height) / 2 - 2);
  e.circle(t.x + t.width / 2, X(t), n, { stroke: i ? r.max : r.secondary, width: 1 }), i && e.circle(t.x + t.width / 2, X(t), Math.max(1, n * 0.48), { fill: r.max });
}
function Me(e, t, i, n = {}) {
  const o = et(i, 0, 1), a = X(t);
  if (e.hline(t.x, t.x + t.width, a, r.border), n.steps && n.steps > 1 && n.steps <= 100)
    for (let s = 0; s < n.steps; s++) {
      const c = t.x + s * t.width / (n.steps - 1);
      e.vline(c, a - 3, a + 3, r.tertiary);
    }
  e.hline(t.x, t.x + t.width * o, a, r.max), e.circle(t.x + t.width * o, a, 4, { fill: r.max });
}
function X1(e, t, i, n) {
  const o = Math.min(32, Math.max(0, Math.floor(i)));
  if (!o) return;
  const a = Math.floor(et(n, 0, o - 1)), s = o === 1 ? 0 : (t.width - 12) / (o - 1), c = X(t);
  o > 1 && e.hline(t.x + 6, t.x + t.width - 6, c, r.border);
  for (let h = 0; h < o; h++) {
    const l = t.x + 6 + s * h;
    e.circle(l, c, 5, h <= a ? { fill: r.max } : { fill: r.off, stroke: r.secondary, width: 1 });
  }
}
function U1(e, t, i, n) {
  if (!i.length) return;
  const o = t.width / i.length;
  for (let a = 0; a < i.length; a++) {
    const s = t.x + a * o;
    e.textBox(i[a], { x: s + 3, y: t.y, width: Math.max(0, o - 6), height: Math.max(0, t.height - 3) }, x.caption, a === n ? r.max : r.tertiary, { wrap: !1, hAlign: "center", vAlign: "middle" }), a === n && e.hline(s + 4, s + o - 4, t.y + t.height - 1, r.max);
  }
}
function Q1(e, t, i, n) {
  e.roundRect(t, 7, { stroke: r.border, width: 1, ...Z(e) ? {} : { fill: r.surface } });
  const o = 9;
  n ? (e.textBox(i, { x: t.x + o, y: t.y + 3, width: Math.max(0, t.width - 2 * o), height: Math.max(0, t.height / 2) }, x.bodyStrong, r.max, { wrap: !1, vAlign: "middle" }), e.textBox(n, { x: t.x + o, y: t.y + t.height / 2, width: Math.max(0, t.width - 2 * o), height: Math.max(0, t.height / 2 - 3) }, x.caption, r.secondary, { wrap: !1, vAlign: "middle" })) : e.textBox(i, { x: t.x + o, y: t.y, width: Math.max(0, t.width - 2 * o), height: t.height }, x.bodyStrong, r.max, { wrap: !1, vAlign: "middle" });
}
function me(e, t, i, n = 8) {
  const o = Math.floor(et(n, 3, 24)), a = t.x + t.width / 2, s = X(t), c = Math.max(2, Math.min(t.width, t.height) / 2 - 3), h = Math.floor(et(i, 0, 1) * o) % o;
  for (let l = 0; l < o; l++) {
    const d = l * 2 * Math.PI / o - Math.PI / 2, f = 4 + Math.round(11 * (1 - (h - l + o) % o / o));
    e.line(a + Math.cos(d) * c * 0.55, s + Math.sin(d) * c * 0.55, a + Math.cos(d) * c, s + Math.sin(d) * c, { stroke: f, width: 2 });
  }
}
function K1(e, t, i = 3) {
  const n = Math.floor(et(i, 1, 12)), o = 5, a = Math.max(1, Math.min(5, (t.height - o * (n - 1)) / n));
  for (let s = 0; s < n; s++) {
    const c = t.y + s * (a + o), h = s === n - 1 ? t.width * 0.65 : t.width;
    e.roundRect({ x: t.x, y: c, width: h, height: a }, a / 2, { fill: r.border });
  }
}
function J1(e, t, i) {
  const n = i > 99 ? "99+" : String(Math.max(0, Math.floor(i)));
  e.roundRect(t, t.height / 2, { stroke: r.max, width: 1 }), e.textBox(n, { x: t.x + 3, y: t.y, width: Math.max(0, t.width - 6), height: t.height }, x.caption, r.max, { hAlign: "center", vAlign: "middle", wrap: !1 });
}
const tt = { ...x.micro, tracking: 0, uppercase: !1 }, St = { ...x.label, tracking: 0 }, Mt = { ...x.numeral, size: 12, leading: 14 }, xe = { 0: "N", 90: "E", 180: "S", 270: "W" };
function ti(e, t, i, n = {}) {
  const o = T(C(n.span, 90), 10, 360), a = W(n.minorEvery, 5), s = Math.max(a, W(n.labelEvery, 30)), c = dt(C(i)), h = t.width / o, l = N(t), d = Math.round(k(t) - 7), f = d - 15, u = n.showValue !== !1;
  if (e.scoped((M) => {
    M.clipRect(t), M.hline(t.x, V(t), d, r.border);
    const m = Math.ceil((c - o / 2) / a), L = Math.floor((c + o / 2) / a);
    for (let w = m; w <= L && w - m < 720; w++) {
      const y = w * a, H = l + (y - c) * h, g = dt(y), b = Vt(g, s), p = Vt(g, 10);
      if (M.vline(H, d - (b ? 8 : p ? 5 : 3), d, b ? r.secondary : r.disabled), b) {
        const O = xe[Math.round(g)];
        M.text(
          O ?? String(Math.round(g)),
          H,
          f,
          O ? St : tt,
          O ? r.max : r.secondary,
          "center",
          "middle"
        );
      }
    }
    if (n.bug !== void 0 && Number.isFinite(n.bug)) {
      const w = dt(n.bug - c + 180) - 180, y = l + w * h;
      if (y > t.x + 6 && y < V(t) - 6)
        M.polygon(
          [
            { x: y - 5, y: d },
            { x: y - 5, y: d - 6 },
            { x: y - 2, y: d - 6 },
            { x: y, y: d - 3 },
            { x: y + 2, y: d - 6 },
            { x: y + 5, y: d - 6 },
            { x: y + 5, y: d }
          ],
          { fill: r.off, stroke: r.max, width: 1.2, join: "miter" }
        );
      else {
        const H = y <= t.x + 6 ? t.x + 1 : V(t) - 1, g = y <= t.x + 6 ? 1 : -1;
        M.polygon(
          [{ x: H, y: f }, { x: H + g * 6, y: f - 4 }, { x: H + g * 6, y: f + 4 }],
          { fill: r.strong }
        );
      }
    }
  }), e.polygon([{ x: l, y: d + 1 }, { x: l - 5, y: d + 7 }, { x: l + 5, y: d + 7 }], { fill: r.max }), u) {
    const M = { x: l - 24, y: t.height >= 42 ? t.y + 0.5 : f - 9, width: 48, height: 18 };
    e.roundRect(M, 3, { fill: r.off }), e.roundRect(M, 3, { stroke: r.max, width: 1 }), e.text(`${String(Math.round(c) % 360).padStart(3, "0")}°`, l, I(M), x.numeral, r.max, "center", "middle");
  }
}
function ei(e, t, i, n = {}) {
  const o = W(n.step, 1), a = P(n.labelEvery, 5, 1, 1e3), s = T(C(n.visible, 20), 2, 200), c = t.height / s / o, h = C(i), l = I(t), d = (n.edge ?? "right") === "right", f = d ? Math.round(V(t)) - 1 : Math.round(t.x), u = d ? -1 : 1, M = n.format ?? ((b) => String(Math.round(b))), m = n.min ?? -1 / 0, L = n.max ?? 1 / 0;
  e.scoped((b) => {
    b.clipRect(t), b.vline(f, t.y, k(t), r.border);
    const p = Math.ceil((h - s / 2 * o) / o), O = Math.floor((h + s / 2 * o) / o);
    for (let v = p; v <= O && v - p < 400; v++) {
      const R = v * o;
      if (R < m || R > L) continue;
      const $ = l - (R - h) * c, G = (v % a + a) % a === 0;
      b.hline(f, f + u * (G ? 8 : 4), $, G ? r.secondary : r.disabled), G && b.text(M(R), f + u * 12, $, Mt, r.secondary, d ? "right" : "left", "middle");
    }
    if (n.bug !== void 0 && Number.isFinite(n.bug)) {
      const v = T(l - (n.bug - h) * c, t.y + 5, k(t) - 5);
      b.rect({ x: d ? f - 2 : f, y: v - 5, width: 3, height: 10 }, { fill: r.max });
    }
  });
  const w = { x: (d ? t.x : t.x + 7) + 0.5, y: l - 10, width: Math.max(0, t.width - 8), height: 20 };
  e.roundRect(w, 3, { fill: r.off }), e.roundRect(w, 3, { stroke: r.max, width: 1 });
  const y = d ? V(w) : w.x;
  e.polygon([{ x: y, y: l - 4 }, { x: y - u * 5, y: l }, { x: y, y: l + 4 }], { fill: r.max });
  const H = M(h), g = e.measure(H, x.numeral) <= w.width - 6 ? x.numeral : Mt;
  e.text(H, N(w), l, g, r.max, "center", "middle");
}
function ii(e, t, i, n, o = {}) {
  const a = W(o.step, 10), s = W(o.pxPerDeg, t.height / 50), c = T(C(i), -90, 90), h = N(t), l = I(t), d = -C(n) * Math.PI / 180, f = Math.cos(d), u = Math.sin(d), M = (m, L) => ({ x: h + m * f - L * u, y: l + m * u + L * f });
  e.scoped((m) => {
    m.clipRect(t);
    const L = Math.hypot(t.width, t.height) / 2 / s, w = Math.ceil((c - L) / a), y = Math.floor((c + L) / a);
    for (let H = w; H <= y && H - w < 200; H++) {
      const g = H * a;
      if (Math.abs(g) > 90) continue;
      const b = (c - g) * s;
      if (g === 0) {
        const v = M(-t.width, b), R = M(t.width, b);
        m.line(v.x, v.y, R.x, R.y, { stroke: r.max, width: 1.5, cap: "butt" });
        continue;
      }
      const p = 16, O = 42;
      for (const v of [-1, 1]) {
        const R = M(v * p, b), $ = M(v * O, b);
        m.line(R.x, R.y, $.x, $.y, { stroke: r.strong, width: 1.2, cap: "butt", dash: g < 0 ? [4, 3] : void 0 });
        const G = M(v * O, b + (g > 0 ? 5 : -5));
        m.line($.x, $.y, G.x, G.y, { stroke: r.strong, width: 1.2, cap: "butt" });
        const Q = M(v * (O + 11), b);
        m.text(String(Math.abs(g)), Q.x, Q.y, tt, r.secondary, "center", "middle");
      }
    }
  }), e.polyline(
    [{ x: h - 22, y: l }, { x: h - 8, y: l }, { x: h, y: l + 6 }, { x: h + 8, y: l }, { x: h + 22, y: l }],
    { stroke: r.max, width: 2, join: "miter" }
  ), e.circle(h, l, 1.4, { fill: r.max });
}
function ni(e, t, i, n = 24, o = {}) {
  const a = Math.max(2, C(n, 24) / 2), s = o.gray ?? r.max, c = o.width ?? 1.5, h = o.style ?? "cross";
  if (h === "dot") {
    e.circle(t, i, a, { stroke: r.border, width: 1 }), e.circle(t, i, 1.6, { fill: s });
    return;
  }
  const l = a * 0.6, d = h === "circle" ? l : T(o.gap ?? a * 0.35, 0, a);
  h === "circle" && e.circle(t, i, l, { stroke: s, width: c });
  for (const [f, u] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
    e.line(t + f * d, i + u * d, t + f * a, i + u * a, { stroke: s, width: c, cap: "butt" });
  e.circle(t, i, 1.2, { fill: s });
}
function oi(e, t, i = {}) {
  const n = Math.max(2, Math.min(C(i.corner, 8), t.width / 2, t.height / 2)), a = { stroke: i.gray ?? (i.locked ? r.max : r.strong), width: i.locked ? 2 : 1.2, join: "miter", cap: "butt" }, s = t.x, c = t.y, h = V(t), l = k(t);
  if (e.polyline([{ x: s, y: c + n }, { x: s, y: c }, { x: s + n, y: c }], a), e.polyline([{ x: h - n, y: c }, { x: h, y: c }, { x: h, y: c + n }], a), e.polyline([{ x: h, y: l - n }, { x: h, y: l }, { x: h - n, y: l }], a), e.polyline([{ x: s + n, y: l }, { x: s, y: l }, { x: s, y: l - n }], a), i.locked) {
    const d = N(t), f = I(t), u = Math.min(5, t.width / 4, t.height / 4);
    e.line(d, c, d, c + u, a), e.line(d, l, d, l - u, a), e.line(s, f, s + u, f, a), e.line(h, f, h - u, f, a);
  }
  if (i.label) {
    const d = c >= 16;
    e.text(i.label, s, d ? c - 4 : l + 4, x.micro, i.locked ? r.max : r.secondary, "left", d ? "bottom" : "top");
  }
  i.detail && e.text(i.detail, h, l + 4, Mt, r.tertiary, "right", "top");
}
function ai(e, t, i, n = {}) {
  const o = P(n.dots, 2, 1, 5), a = C(i), s = N(t), c = I(t), h = Math.max(0, t.width / 2 - 7);
  for (let u = 1; u <= o; u++)
    for (const M of [-1, 1]) e.circle(s + M * h * u / o, c, 2.2, { stroke: r.secondary, width: 1 });
  e.vline(s, t.y, k(t), r.secondary);
  const l = s + T(a, -1, 1) * h, d = Math.max(3, Math.min(t.height / 2, 7)), f = [{ x: l, y: c - d }, { x: l + d * 0.7, y: c }, { x: l, y: c + d }, { x: l - d * 0.7, y: c }];
  Math.abs(a) > 1 ? e.polygon(f, { fill: r.off, stroke: n.gray ?? r.max, width: 1.5 }) : e.polygon(f, { fill: n.gray ?? r.max });
}
function ri(e, t, i, n, o = {}) {
  const a = Math.max(0, C(n));
  if (!(a > 0)) return;
  const s = P(o.rings, 3, 1, 8), c = C(o.heading);
  for (let l = 1; l <= s; l++) {
    const d = l === s;
    e.circle(t, i, a * l / s, { stroke: d ? r.border : r.hairline, width: 1, dash: d ? void 0 : [2, 3] });
  }
  for (let l = 0; l < 360; l += 30) {
    const d = Y(l - c), f = F(t, i, a - (l % 90 === 0 ? 5 : 3), d), u = F(t, i, a, d);
    e.line(f.x, f.y, u.x, u.y, { stroke: l % 90 === 0 ? r.secondary : r.border, width: 1, cap: "butt" });
  }
  const h = F(t, i, a - 12, Y(-c));
  if (e.text("N", h.x, h.y, St, r.secondary, "center", "middle"), o.sweep !== void 0 && Number.isFinite(o.sweep)) {
    const l = [15, 12, 10, 8, 6, 5, 4];
    for (let d = l.length - 1; d >= 0; d--) {
      const f = Y(o.sweep - c - d * 4), u = F(t, i, a * 0.1, f), M = F(t, i, a - 1, f);
      e.line(u.x, u.y, M.x, M.y, { stroke: l[d], width: d === 0 ? 1.5 : 1, cap: "butt" });
    }
  }
  for (const l of o.blips ?? []) {
    if (!Number.isFinite(l.bearing) || !Number.isFinite(l.range)) continue;
    const d = F(t, i, a * B(l.range), Y(l.bearing - c)), f = l.gray ?? r.max, u = l.kind ?? "dot";
    if (u === "square") e.rect({ x: d.x - 2.5, y: d.y - 2.5, width: 5, height: 5 }, { stroke: f, width: 1.2 });
    else if (u === "diamond")
      e.polygon([{ x: d.x, y: d.y - 4 }, { x: d.x + 3.5, y: d.y }, { x: d.x, y: d.y + 4 }, { x: d.x - 3.5, y: d.y }], { stroke: f, width: 1.2 });
    else if (u === "triangle") {
      const M = Y(C(l.course) - c), m = F(d.x, d.y, 5, M), L = F(d.x, d.y, 4, M + 2.5), w = F(d.x, d.y, 4, M - 2.5);
      e.polygon([m, L, w], { fill: f });
    } else e.circle(d.x, d.y, 2.2, { fill: f });
    if (l.label) {
      const M = d.x > t + a * 0.45;
      e.text(l.label, d.x + (M ? -7 : 7), d.y - 6, x.micro, r.tertiary, M ? "right" : "left", "middle");
    }
  }
  e.polygon([{ x: t, y: i - 5 }, { x: t - 4, y: i + 4 }, { x: t + 4, y: i + 4 }], { fill: r.off, stroke: r.max, width: 1.2 }), o.rangeLabel && e.text(o.rangeLabel, t, i + a + 9, x.micro, r.tertiary, "center", "middle");
}
function si(e, t, i, n, o, a = {}) {
  const s = Math.max(0, C(n));
  if (!(s > 0)) return;
  const c = o instanceof Date ? { hours: o.getHours(), minutes: o.getMinutes(), seconds: o.getSeconds() + o.getMilliseconds() / 1e3 } : o, h = C(c.hours) % 12, l = C(c.minutes), d = c.seconds === void 0 ? void 0 : C(c.seconds);
  e.circle(t, i, s, { stroke: r.border, width: 1 });
  const f = a.numerals === !0 && s >= 28;
  for (let M = 0; M < 12; M++) {
    const m = M % 3 === 0, L = Y(M * 30);
    if (m && f) {
      const H = F(t, i, s - 9, L);
      e.text(String(M === 0 ? 12 : M), H.x, H.y, tt, r.secondary, "center", "middle");
      continue;
    }
    const w = F(t, i, s - (m ? 6 : 3), L), y = F(t, i, s - 1.5, L);
    e.line(w.x, w.y, y.x, y.y, { stroke: m ? r.secondary : r.disabled, width: m ? 1.5 : 1, cap: "butt" });
  }
  const u = (M, m, L, w, y = 0) => {
    const H = Y(M), g = F(t, i, -s * y, H), b = F(t, i, s * m, H);
    e.line(g.x, g.y, b.x, b.y, { stroke: w, width: L });
  };
  u((h + l / 60) * 30, 0.5, 3, r.strong), u((l + (d ?? 0) / 60) * 6, 0.78, 2, r.max), d !== void 0 && a.seconds !== !1 && u(d * 6, 0.86, 1, r.secondary, 0.16), e.circle(t, i, 2.5, { fill: r.max }), e.circle(t, i, 1, { fill: r.off });
}
function ci(e, t, i, n = {}) {
  const o = P(n.segments, 12, 1, 64), a = B(i), s = B(n.hot ?? 0.8), c = n.vertical ?? t.height > t.width, h = Math.max(0, C(n.gap, 2)), d = ((c ? t.height : t.width) - h * (o - 1)) / o;
  if (!(d > 0)) return;
  const f = Math.round(a * o), u = n.peak === void 0 ? -1 : Math.ceil(B(n.peak) * o) - 1, M = Math.min(1.5, d / 2);
  for (let m = 0; m < o; m++) {
    const L = c ? { x: t.x, y: k(t) - (m + 1) * d - m * h, width: t.width, height: d } : { x: t.x + m * (d + h), y: t.y, width: d, height: t.height };
    m < f ? e.roundRect(L, M, { fill: (m + 1) / o > s ? r.max : r.primary }) : m === u ? e.roundRect(L, M, { fill: r.strong }) : Z(e) ? e.roundRect(L, M, { stroke: r.hairline, width: 1 }) : e.roundRect(L, M, { fill: r.sunken });
  }
}
function hi(e, t, i, n = {}) {
  const o = C(n.min, 0), a = C(n.max, 100), s = a - o > 0 ? a - o : 1, c = t.x + 5, h = V(t) - 5, l = Math.round(t.y + 10), d = (m) => c + (T(C(m, o), o, o + s) - o) / s * (h - c);
  for (const m of n.zones ?? []) {
    const L = d(m.from), w = d(m.to);
    e.rect({ x: Math.min(L, w), y: l - 1, width: Math.abs(w - L), height: 3 }, { fill: m.gray });
  }
  e.hline(c, h, l, r.border);
  const f = P(n.ticks, 5, 2, 50), u = P(n.minor, 4, 0, 20);
  for (let m = 0; m < f; m++) {
    const L = c + m / (f - 1) * (h - c);
    if (e.vline(L, l, l + 6, r.secondary), m < f - 1) {
      const w = c + (m + 1) / (f - 1) * (h - c);
      for (let y = 1; y < u; y++) e.vline(L + (w - L) * y / u, l, l + 3, r.disabled);
    }
    if (n.format) {
      const w = m === 0, y = m === f - 1;
      e.text(
        n.format(o + s * m / (f - 1)),
        w ? t.x : y ? V(t) : L,
        l + 9,
        tt,
        r.tertiary,
        w ? "left" : y ? "right" : "center",
        "top"
      );
    }
  }
  n.target !== void 0 && Number.isFinite(n.target) && e.rect({ x: d(n.target) - 1, y: l - 6, width: 2, height: 6 }, { fill: r.strong });
  const M = d(i);
  e.polygon([{ x: M, y: l - 1 }, { x: M - 4.5, y: l - 9 }, { x: M + 4.5, y: l - 9 }], { fill: r.max });
}
function li(e, t, i, n = {}) {
  const o = C(n.min, 0), a = C(n.max, 100), s = a - o > 0 ? a - o : 1, c = Math.max(4, Math.min(12, t.width * 0.4)), h = { x: t.x, y: t.y, width: c, height: t.height }, l = { x: h.x + 2.5, y: h.y + 2.5, width: c - 5, height: Math.max(0, h.height - 5) }, d = (m) => k(l) - (T(C(m, o), o, o + s) - o) / s * l.height;
  Z(e) ? e.roundRect(h, c / 2, { stroke: r.border, width: 1 }) : e.roundRect(h, c / 2, { fill: r.sunken });
  const f = d(i), u = k(l) - f;
  u > 0.5 && e.roundRect({ x: l.x, y: f, width: l.width, height: u }, l.width / 2, { fill: r.max });
  const M = P(n.ticks, 5, 0, 30);
  for (let m = 0; m < M; m++) {
    const L = M === 1 ? 0.5 : m / (M - 1), w = k(l) - L * l.height;
    e.hline(V(h) + 3, V(h) + 7, w, r.disabled), n.format && e.text(n.format(o + s * L), V(h) + 10, w, tt, r.tertiary, "left", "middle");
  }
  if (n.target !== void 0 && Number.isFinite(n.target)) {
    const m = d(n.target);
    e.polygon([{ x: V(h) + 1, y: m }, { x: V(h) + 7, y: m - 4 }, { x: V(h) + 7, y: m + 4 }], { fill: r.strong });
  }
}
function di(e, t, i, n, o, a = r.secondary) {
  const s = Math.max(0, C(n));
  e.hline(t, t + s, i, a), e.vline(t, i - 4, i + 1, a), e.vline(t + s - 1, i - 4, i + 1, a), e.text(o, t + s / 2, i - 5, tt, r.tertiary, "center", "bottom");
}
function Et(e, t, i, n, o = 1) {
  e.roundRect(t, i, { fill: Z(e) ? r.off : r.surface }), e.roundRect(t, i, { stroke: n, width: o });
}
function ye(e, t) {
  Z(e) ? (e.roundRect({ x: t.x, y: t.y + 2, width: 2.5, height: Math.max(0, t.height - 4) }, 1.5, { fill: r.max }), e.roundRect(t, A.md, { stroke: r.hairline, width: 1 })) : e.roundRect(t, A.md, { fill: r.raised });
}
function we(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = Math.max(0, C(n.gap, 8)), a = (t.width - o * (i.length - 1)) / i.length, s = n.primary ?? i.length - 1;
  i.forEach((c, h) => {
    ce(e, { x: t.x + h * (a + o), y: t.y, width: a, height: t.height }, c, {
      primary: h === s,
      focused: h === n.focused
    });
  });
}
function fi(e, t, i) {
  Et(e, t, A.lg, r.secondary, 1.5);
  const n = 14, o = i.actions?.length ? 26 : 0;
  let a = t.x + n, s = t.y + n;
  if (i.icon && (E(e, i.icon, a + 9, s + 9, 18, r.max), a += 26), e.text(S(e.measure, i.title, x.title, V(t) - n - a), a, s + 9, x.title, r.max, "left", "middle"), s += 24, i.message) {
    const c = k(t) - n - (o ? o + 8 : 0) - s;
    c >= J(x.body) && e.textBox(i.message, { x: t.x + n, y: s, width: t.width - n * 2, height: c }, x.body, r.secondary);
  }
  i.actions?.length && we(
    e,
    { x: t.x + n, y: k(t) - n - o, width: t.width - n * 2, height: o },
    i.actions,
    { focused: i.focused, primary: i.primary }
  );
}
function ui(e, t, i = {}) {
  const n = T(C(i.height, t.height / 2), 24, t.height), o = { x: t.x + 0.5, y: k(t) - n, width: Math.max(0, t.width - 1), height: n + A.lg + 2 };
  e.scoped((s) => {
    s.clipRect(t), s.roundRect(o, A.lg, { fill: Z(e) ? r.off : r.surface }), s.roundRect(o, A.lg, { stroke: r.secondary, width: 1 });
  });
  let a = o.y + 6;
  return i.handle !== !1 && (e.roundRect({ x: N(t) - 14, y: a, width: 28, height: 3 }, 1.5, { fill: r.disabled }), a += 9), i.title && (e.text(i.title, t.x + 14, a + 7, x.label, r.secondary, "left", "middle"), e.hline(t.x + 14, V(t) - 14, a + 17, r.hairline), a += 22), { x: t.x + 14, y: a, width: Math.max(0, t.width - 28), height: Math.max(0, k(t) - 8 - a) };
}
function Mi(e, t, i, n = {}) {
  const o = Math.max(14, C(n.rowHeight, 26)), a = Math.max(1, Math.floor(t.height / o)), s = n.cursor ? n.cursor.index : n.selected ?? -1, c = Math.max(0, i.length - a), h = T(
    Math.round(C(n.cursor ? n.cursor.offset : n.offset, s - Math.floor(a / 2))),
    0,
    c
  ), l = i.length > a, d = t.width - (l ? 8 : 0);
  for (let f = 0; f < a; f++) {
    const u = i[h + f];
    if (!u) break;
    const M = { x: t.x, y: t.y + f * o, width: d, height: o - 2 }, m = h + f === s;
    m && ye(e, M);
    const L = I(M), w = u.disabled ? r.disabled : m ? r.max : r.primary;
    let y = M.x + 10;
    u.icon && (E(e, u.icon, y + 7, L, 14, u.disabled ? r.disabled : m ? r.max : r.strong), y += 22);
    let H = V(M) - 10;
    u.chevron && (E(e, "chevron-right", H - 4, L, 11, r.disabled), H -= 14), u.checked && (E(e, "check", H - 6, L, 13, r.max), H -= 18), u.value && (e.text(u.value, H, L, x.caption, m ? r.primary : r.tertiary, "right", "middle"), H -= e.measure(u.value, x.caption) + 8), e.text(S(e.measure, u.label, x.body, H - y), y, L, x.body, w, "left", "middle");
  }
  return l && se(e, { x: V(t) - 3, y: t.y, width: 3, height: a * o - 2 }, h, a, i.length), a;
}
function mi(e, t, i, n = {}) {
  const o = n.pointer ?? "bottom", a = B(n.at ?? 0.5), s = 6, c = Math.min(A.md, t.width / 2, t.height / 2), h = n.gray ?? r.secondary, l = Z(e) ? r.off : r.surface;
  if (e.roundRect(t, c, { fill: l }), e.roundRect(t, c, { stroke: h, width: 1 }), o !== "none") {
    const f = (y, H) => H + T(y * a, c + s, Math.max(c + s, y - c - s));
    let u, M, m, L, w;
    if (o === "top" || o === "bottom") {
      const y = f(t.width, t.x), H = o === "top" ? t.y : k(t), g = o === "top" ? -1 : 1;
      u = { x: y - s, y: H }, M = { x: y + s, y: H }, m = { x: y, y: H + g * s }, L = { x: u.x, y: H - g * 1.5 }, w = { x: M.x, y: H - g * 1.5 };
    } else {
      const y = f(t.height, t.y), H = o === "left" ? t.x : V(t), g = o === "left" ? -1 : 1;
      u = { x: H, y: y - s }, M = { x: H, y: y + s }, m = { x: H + g * s, y }, L = { x: H - g * 1.5, y: u.y }, w = { x: H - g * 1.5, y: M.y };
    }
    e.polygon([L, u, m, M, w], { fill: l }), e.polyline([u, m, M], { stroke: h, width: 1, join: "miter" });
  }
  const d = { x: t.x + 9, y: t.y + 4, width: Math.max(0, t.width - 18), height: Math.max(0, t.height - 8) };
  n.title ? (e.text(S(e.measure, n.title, x.bodyStrong, d.width), d.x, d.y + 9, x.bodyStrong, r.max, "left", "middle"), e.textBox(i, { ...d, y: d.y + 19, height: Math.max(0, d.height - 19) }, x.caption, r.secondary)) : e.textBox(i, d, x.caption, r.primary, { vAlign: "middle" });
}
const Le = {
  info: { icon: "info", stroke: r.border, accent: r.secondary, width: 1 },
  success: { icon: "check-circle", stroke: r.border, accent: r.strong, width: 1 },
  warning: { icon: "alert-triangle", stroke: r.secondary, accent: r.max, width: 1 },
  error: { icon: "x-circle", stroke: r.max, accent: r.max, width: 1.5 }
};
function xi(e, t, i, n = {}) {
  const o = Le[n.kind ?? "info"];
  Z(e) || e.roundRect(t, A.sm, { fill: r.surface }), e.roundRect(t, A.sm, { stroke: o.stroke, width: o.width }), e.roundRect({ x: t.x + 3, y: t.y + 3, width: 2.5, height: Math.max(0, t.height - 6) }, 1.2, { fill: o.accent });
  const a = I(t);
  E(e, n.icon ?? o.icon, t.x + 19, a, 15, o.accent);
  const s = t.x + 33, c = V(t) - 10 - s;
  if (n.detail && t.height >= 34) {
    e.text(S(e.measure, i, x.bodyStrong, c), s, a - 8, x.bodyStrong, r.max, "left", "middle"), e.text(S(e.measure, n.detail, x.caption, c), s, a + 8, x.caption, r.secondary, "left", "middle");
    return;
  }
  const h = n.detail ? e.measure(n.detail, x.caption) + 10 : 0, l = !!n.detail && h < c * 0.5;
  e.text(S(e.measure, i, x.bodyStrong, c - (l ? h : 0)), s, a, x.bodyStrong, r.max, "left", "middle"), l && e.text(n.detail, V(t) - 10, a, x.caption, r.tertiary, "right", "middle");
}
function yi(e, t, i) {
  Et(e, t, A.lg, r.secondary);
  const n = 12, o = t.x + n, a = Math.max(0, t.width - n * 2);
  let s = t.y + 9;
  if (i.app || i.icon || i.time) {
    let h = o;
    i.icon && (E(e, i.icon, h + 6, s + 6, 13, r.secondary), h += 18), i.app && e.text(i.app, h, s + 6, x.label, r.secondary, "left", "middle"), i.time && e.text(i.time, V(t) - n, s + 6, x.micro, r.tertiary, "right", "middle"), s += 17;
  }
  e.text(S(e.measure, i.title, x.bodyStrong, a), o, s + 9, x.bodyStrong, r.max, "left", "middle"), s += 20;
  const c = k(t) - 8 - s;
  i.body && c >= J(x.caption) && e.textBox(i.body, { x: o, y: s, width: a, height: c }, x.caption, r.secondary);
}
function He(e, t, i, n, o = r.secondary, a = 12) {
  const s = a / 2;
  if (n === "tap" || n === "double-tap") {
    e.circle(t, i, s - 1, { stroke: o, width: 1 }), n === "tap" ? e.circle(t, i, 1.6, { fill: o }) : (e.circle(t - 2.2, i, 1.3, { fill: o }), e.circle(t + 2.2, i, 1.3, { fill: o }));
    return;
  }
  const c = n === "scroll-up" ? -1 : 1, h = i + c * (s - 1);
  e.line(t, i - c * (s - 1), t, h, { stroke: o, width: 1.4 }), e.polyline(
    [{ x: t - 3.5, y: h - c * 3.5 }, { x: t, y: h }, { x: t + 3.5, y: h - c * 3.5 }],
    { stroke: o, width: 1.4 }
  );
}
function wi(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = Math.max(0, C(n.gap, 14)), a = i.map((d) => 17 + e.measure(d.label, x.micro)), s = a.reduce((d, f) => d + f, 0) + o * (i.length - 1), c = n.align ?? "left";
  let h = c === "left" ? t.x : c === "right" ? V(t) - s : N(t) - s / 2;
  const l = I(t);
  i.forEach((d, f) => {
    He(e, h + 6, l, d.gesture, r.secondary), e.text(d.label, h + 17, l, x.micro, n.gray ?? r.tertiary, "left", "middle"), h += a[f] + o;
  });
}
const ft = (e) => e.replace(/\s+/g, "").length;
function ge(e, t) {
  if (t <= 0) return 0;
  let i = 0;
  for (let n = 0; n < e.length; n++)
    if (/\s/.test(e[n]) || i++, i >= t) return n + 1;
  return e.length;
}
function Li(e, t, i, n = {}) {
  const o = n.style ?? x.title, a = J(o), s = n.speaker ? 15 : 0, c = Math.max(1, Math.min(P(n.maxLines, 99, 1, 99), Math.floor((t.height - s) / a))), h = n.align ?? "left", l = i.trim(), d = n.interim ? `${l} ${n.interim}`.trim() : l;
  if (d === "") return;
  const f = rt(e.measure, d, o, t.width), u = f.slice(-c), M = ft(l);
  let m = ft(f.slice(0, f.length - u.length).join(""));
  const L = k(t) - u.length * a;
  n.speaker && e.text(n.speaker, h === "center" ? N(t) : t.x, L - 4, x.label, r.secondary, h, "bottom"), u.forEach((w, y) => {
    const H = u.length - 1 - y, g = H === 0 ? r.max : H === 1 ? r.primary : r.secondary, b = ft(w), p = T(M - m, 0, b);
    m += b;
    const O = h === "center" ? N(t) - e.measure(w, o) / 2 : t.x, v = L + y * a + a / 2;
    if (p >= b) {
      e.text(w, O, v, o, g, "left", "middle");
      return;
    }
    const R = ge(w, p), $ = w.slice(0, R);
    $ && e.text($, O, v, o, g, "left", "middle"), e.text(w.slice(R), O + e.measure($, o), v, o, r.tertiary, "left", "middle");
  });
}
function Hi(e, t, i, n, o = {}) {
  const a = o.style ?? x.title, s = J(a), c = rt(e.measure, i, a, t.width), h = T(C(n), 0, Math.max(0, c.length - 1)), l = Math.round(h), d = t.y + t.height * B(o.anchor ?? 0.4), f = o.align ?? "left";
  return e.scoped((u) => {
    u.clipRect(t), c.forEach((M, m) => {
      const L = d + (m - h) * s;
      if (L < t.y - s || L > k(t) + s) return;
      const w = m === l ? r.max : m < l ? r.disabled : m - l === 1 ? r.primary : r.secondary;
      u.text(M, f === "center" ? N(t) : t.x, L, a, w, f, "middle");
    });
  }), c.length;
}
function gi(e, t, i, n, o = {}) {
  const a = N(t), s = I(t) - (o.detail ? 16 : 9), c = (C(n) / 900 % 1 + 1) % 1;
  me(e, { x: a - 13, y: s - 13, width: 26, height: 26 }, c), e.text(S(e.measure, i, x.bodyStrong, t.width), a, s + 27, x.bodyStrong, r.primary, "center", "middle"), o.detail && e.text(S(e.measure, o.detail, x.caption, t.width), a, s + 44, x.caption, r.tertiary, "center", "middle");
}
function Vi(e, t, i, n = {}) {
  const o = t.height / 2;
  Z(e) ? e.roundRect(t, o, { stroke: r.hairline, width: 1 }) : e.roundRect(t, o, { fill: r.sunken });
  const a = W(n.period, 1400), s = (C(i) % a + a) % a / a, c = t.width * 0.3;
  e.scoped((h) => {
    h.clipRound(t, o), h.roundRect({ x: t.x - c + (t.width + c) * s, y: t.y, width: c, height: t.height }, o, { fill: n.gray ?? r.max });
  });
}
function Ci(e, t, i, n, o, a, s = {}) {
  const c = Math.max(8, C(n, 20)), h = s.state ?? "listening", l = c * 0.5, d = C(a);
  if (h === "listening") {
    const f = B(o);
    for (let u = 0; u < 3; u++) {
      const M = ((d / 1300 + u / 3) % 1 + 1) % 1, m = Math.round((10 - 7 * M) * (0.45 + 0.55 * f));
      m >= 3 && e.circle(t, i, l + (c - l) * M, { stroke: m, width: 1 });
    }
  } else if (h === "processing") {
    const f = d / 500 % (Math.PI * 2);
    e.arc(t, i, c * 0.78, f, f + 1.7, { stroke: r.strong, width: 1.5 });
  }
  e.circle(t, i, l, { fill: r.off }), e.circle(t, i, l, { stroke: h === "idle" ? r.border : r.max, width: 1.5 }), E(e, "mic", t, i, l * 1.25, h === "idle" ? r.disabled : r.max);
}
const D = { ...x.numeral, size: 12, leading: 14 }, ot = { ...x.micro, size: 8 }, mt = { ...x.micro, tracking: 0 };
function bi(e, t, i, n = {}) {
  const o = t.y + Math.min(t.height, 22) / 2;
  let a = t.x;
  n.back && (E(e, "chevron-left", a + 5, o, 13, r.secondary), a += 16), n.icon && (E(e, n.icon, a + 8, o, 15, r.strong), a += 22);
  const s = n.accessory ? e.measure(n.accessory, x.micro) + 10 : 0, c = V(t) - s - a, h = S(e.measure, i, x.title, c);
  if (e.text(h, a, o, x.title, r.max, "left", "middle"), n.subtitle) {
    const l = a + e.measure(h, x.title) + 9;
    V(t) - s - l > 24 && e.text(S(e.measure, n.subtitle, x.caption, V(t) - s - l), l, o + 2, x.caption, r.tertiary, "left", "middle");
  }
  n.accessory && e.text(n.accessory, V(t), o, x.micro, r.secondary, "right", "middle"), e.hline(t.x, V(t), k(t) - 1, r.hairline);
}
function ki(e, t, i = {}) {
  Rt(e, t, i.selected ? { stroke: r.max, strokeWidth: 1.5 } : {});
  let n = t.y + z.md;
  if (i.title || i.icon || i.accessory) {
    let o = t.x + z.md;
    const a = n + 8;
    i.icon && (E(e, i.icon, o + 8, a + (i.subtitle ? 7 : 0), 16, i.selected ? r.max : r.strong), o += 24);
    const s = i.accessory ? e.measure(i.accessory, x.micro) + 8 : 0;
    i.title && e.text(S(e.measure, i.title, x.bodyStrong, V(t) - z.md - s - o), o, a, x.bodyStrong, r.max, "left", "middle"), i.accessory && e.text(i.accessory, V(t) - z.md, a, x.micro, r.tertiary, "right", "middle"), i.subtitle && (e.text(S(e.measure, i.subtitle, x.caption, V(t) - z.md - o), o, a + 15, x.caption, r.tertiary, "left", "middle"), n += 15), n += 22;
  }
  return { x: t.x + z.md, y: n, width: Math.max(0, t.width - z.md * 2), height: Math.max(0, k(t) - z.md - n) };
}
function pi(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = P(n.columns, 2, 1, 6), a = Math.ceil(i.length / o), s = t.width / o, c = t.height / a;
  i.forEach((h, l) => {
    const d = l % o, f = Math.floor(l / o), u = t.x + d * s, M = t.y + f * c;
    d > 0 && e.vline(u, M + 3, M + c - 3, r.hairline), f > 0 && d === 0 && e.hline(t.x, V(t), M, r.hairline);
    const m = d > 0 ? 10 : 0;
    ne(e, { x: u + m, y: M + Math.max(3, (c - 28) / 2), width: s - m - 4 }, h.label, h.value);
  });
}
function Ve(e, t, i, n, o = 3.5) {
  const a = Math.max(1.5, C(o, 3.5));
  n === "online" ? e.circle(t, i, a, { fill: r.max }) : n === "busy" ? (e.circle(t, i, a, { fill: r.max }), e.rect({ x: t - a + 1.3, y: i - 0.75, width: Math.max(0, a * 2 - 2.6), height: 1.5 }, { fill: r.off })) : e.circle(t, i, a - 0.6, { stroke: n === "away" ? r.strong : r.disabled, width: 1.3 });
}
function Ce(e, t, i, n, o = {}) {
  const a = Math.max(4, C(n, 12));
  if (Z(e) || e.circle(t, i, a, { fill: r.raised }), e.circle(t, i, a, { stroke: o.selected ? r.max : r.border, width: o.selected ? 1.5 : 1 }), o.icon) E(e, o.icon, t, i, a * 1.1, r.strong);
  else {
    const s = (o.initials ?? "?").trim().slice(0, 2).toUpperCase(), c = a >= 13 ? x.bodyStrong : a >= 9 ? { ...x.label, tracking: 0 } : { ...ot, tracking: 0 };
    e.text(s, t, i + 0.5, c, o.selected ? r.max : r.primary, "center", "middle");
  }
  if (o.presence) {
    const s = t + a * 0.71, c = i + a * 0.71;
    e.circle(s, c, 5, { fill: r.off }), Ve(e, s, c, o.presence, 3.2);
  }
}
function vi(e, t, i, n, o, a = {}) {
  const s = P(a.max, 3, 1, 12), c = Math.max(4, C(n, 10)), h = o.slice(0, s), l = o.length - h.length, d = l > 0 ? [...h, `+${l}`] : h, f = c * 1.7 + 1;
  return d.forEach((u, M) => {
    const m = t + c + M * f;
    e.circle(m, i, c + 1.5, { fill: r.off }), Ce(e, m, i, c, { initials: u });
  }), d.length ? (d.length - 1) * f + c * 2 : 0;
}
function Zi(e, t, i, n = {}) {
  const o = n.from === "me", a = n.style ?? x.caption, s = J(a), c = 9, h = 5, l = Math.max(40, t.width * 0.84), d = rt(e.measure, i, a, l - c * 2), f = d.reduce((H, g) => Math.max(H, e.measure(g, a)), 0), u = Math.min(l, Math.max(28, f + c * 2)), M = d.length * s + h * 2;
  let m = t.y;
  n.name && (e.text(n.name, o ? V(t) : t.x, m + 5, x.micro, r.tertiary, o ? "right" : "left", "middle"), m += 12);
  const L = o ? V(t) - u : t.x, w = o ? [9, 9, 2, 9] : [9, 9, 9, 2], y = { x: L, y: m, width: u, height: M };
  return Z(e) ? e.roundRect(y, w, { stroke: o ? r.strong : r.border, width: 1 }) : e.roundRect(y, w, { fill: o ? r.raised : r.surface }), d.forEach((H, g) => {
    e.text(H, L + c, m + h + g * s + s / 2, a, o ? r.max : r.primary, "left", "middle");
  }), n.time && e.text(n.time, o ? L - 6 : L + u + 6, m + M - 7, ot, r.tertiary, o ? "right" : "left", "middle"), m + M - t.y;
}
function Oi(e, t, i, n, o = {}) {
  if (i.length === 0) return 0;
  const a = Math.max(12, C(o.rowHeight, 20)), s = o.header === !1 ? 0 : 18, c = 6, h = i.reduce((w, y) => w + (y.width !== void 0 ? Math.max(0, C(y.width)) : 0), 0), l = i.reduce((w, y) => w + (y.width === void 0 ? W(y.weight, 1) : 0), 0), d = Math.max(0, t.width - h), f = i.map((w) => w.width !== void 0 ? Math.max(0, C(w.width)) : d * W(w.weight, 1) / (l || 1)), u = [];
  f.reduce((w, y) => (u.push(w), w + y), t.x);
  const M = (w) => {
    const y = i[w].align ?? (i[w].numeric ? "right" : "left");
    return { x: y === "left" ? u[w] + c : y === "right" ? u[w] + f[w] - c : u[w] + f[w] / 2, align: y };
  };
  s && (i.forEach((w, y) => {
    const { x: H, align: g } = M(y);
    e.text(S(e.measure, w.label, x.micro, f[y] - c * 2), H, t.y + 7, x.micro, r.tertiary, g, "middle");
  }), e.hline(t.x, V(t), t.y + s - 3, r.hairline));
  const m = Math.max(0, Math.floor((t.height - s) / a)), L = P(o.offset, 0, 0, Math.max(0, n.length - m));
  for (let w = 0; w < m; w++) {
    const y = n[L + w];
    if (!y) break;
    const H = t.y + s + w * a, g = L + w === o.selected;
    g ? Z(e) ? e.roundRect({ x: t.x, y: H + 3, width: 2.5, height: Math.max(0, a - 6) }, 1.2, { fill: r.max }) : e.roundRect({ x: t.x, y: H, width: t.width, height: a }, A.xs, { fill: r.raised }) : o.dividers && w > 0 && e.hline(t.x, V(t), H, r.hairline), i.forEach((b, p) => {
      const { x: O, align: v } = M(p), R = b.numeric ? D : x.caption, $ = g ? r.max : p === 0 ? r.primary : r.secondary;
      e.text(S(e.measure, y[p] ?? "", R, f[p] - c * 2), O, H + a / 2, R, $, v, "middle");
    });
  }
  return m;
}
function Ri(e, t, i, n = {}) {
  if (i.length === 0) return 0;
  const o = i.some((d) => d.detail), a = Math.max(16, C(n.rowHeight, o ? 32 : 22)), s = i.reduce((d, f) => Math.max(d, f.time ? e.measure(f.time, D) : 0), 0), c = Math.round(t.x + (s ? s + 10 : 5)) + 0.5, h = c + 12, l = Math.min(i.length, Math.max(1, Math.floor(t.height / a)));
  for (let d = 0; d < l; d++) {
    const f = i[d], u = f.state ?? "upcoming", M = t.y + d * a + 9;
    if (d < l - 1) {
      const w = u === "done";
      e.line(c, M + 6, c, M + a - 6, {
        stroke: w ? r.secondary : r.border,
        width: 1,
        cap: "butt",
        dash: w ? void 0 : [2, 3]
      });
    }
    u === "done" ? e.circle(c, M, 3, { fill: r.strong }) : u === "current" ? (e.circle(c, M, 5, { stroke: r.max, width: 1.5 }), e.circle(c, M, 2, { fill: r.max })) : e.circle(c, M, 3, { stroke: r.tertiary, width: 1 }), f.time && e.text(f.time, c - 9, M, D, u === "current" ? r.max : r.tertiary, "right", "middle");
    const m = u === "current" ? x.bodyStrong : x.body, L = u === "current" ? r.max : u === "done" ? r.tertiary : r.primary;
    e.text(S(e.measure, f.title, m, V(t) - h), h, M, m, L, "left", "middle"), f.detail && a >= 28 && e.text(S(e.measure, f.detail, x.caption, V(t) - h), h, M + 14, x.caption, r.tertiary, "left", "middle");
  }
  return l;
}
function Si(e, t, i, n, o = {}) {
  const a = Math.round(C(i, 2e3)), s = P(n, 1, 1, 12), c = o.weekStart ?? 1, h = o.weekdays ?? (c === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"]), l = (new Date(a, s - 1, 1).getDay() - c + 7) % 7, d = new Date(a, s, 0).getDate(), f = Math.ceil((l + d) / 7);
  let u = t.y;
  o.title && (e.text(o.title, t.x, u + 6, x.label, r.secondary, "left", "middle"), u += 17);
  const M = 12, m = t.width / 7, L = (k(t) - u - M) / f;
  if (!(L > 0)) return;
  h.slice(0, 7).forEach((g, b) => {
    e.text(g, t.x + (b + 0.5) * m, u + 5, mt, r.tertiary, "center", "middle");
  });
  const w = new Set(o.marked ?? []), y = Math.min(m - 2, 20), H = Math.min(L - 1, 15);
  for (let g = 1; g <= d; g++) {
    const b = l + g - 1, p = b % 7, O = t.x + (p + 0.5) * m, v = u + M + (Math.floor(b / 7) + 0.5) * L, R = (p + c) % 7, $ = R === 0 || R === 6, G = { x: O - y / 2, y: v - H / 2, width: y, height: H };
    if (g === o.today) {
      e.roundRect(G, 4, { fill: r.max }), e.text(String(g), O, v, D, r.off, "center", "middle");
      continue;
    }
    g === o.selected && e.roundRect(G, 4, { stroke: r.max, width: 1 }), e.text(String(g), O, v, D, g === o.selected ? r.max : $ ? r.tertiary : r.primary, "center", "middle"), w.has(g) && e.circle(O, v + H / 2 - 0.5, 1.1, { fill: r.strong });
  }
}
function Ei(e, t, i, n = {}) {
  const o = i.length;
  if (o === 0) return;
  const a = t.x + 6, s = V(t) - 6, c = Math.round(t.y + 11) + 0.5, h = T(C(n.current), 0, o - 1), l = (w) => o === 1 ? (a + s) / 2 : a + w / (o - 1) * (s - a), d = Math.abs(h - Math.round(h)) < 1e-3;
  if (e.line(a, c, s, c, { stroke: r.border, width: 1, dash: [2, 3], cap: "butt" }), h > 0 && e.line(a, c, l(h), c, { stroke: r.strong, width: 2, cap: "butt" }), i.forEach((w, y) => {
    const H = l(y);
    d && y === Math.round(h) ? (e.circle(H, c, 5.5, { fill: r.off }), e.circle(H, c, 5, { stroke: r.max, width: 1.5 }), e.circle(H, c, 2, { fill: r.max })) : y < h ? e.circle(H, c, 3, { fill: r.strong }) : (e.circle(H, c, 3, { fill: r.off }), e.circle(H, c, 3, { stroke: r.secondary, width: 1 }));
  }), !d) {
    const w = l(h);
    e.polygon([{ x: w, y: c - 3 }, { x: w - 4.5, y: c - 10 }, { x: w + 4.5, y: c - 10 }], { fill: r.max });
  }
  const f = Math.min(o - 1, Math.ceil(h - 1e-3)), u = (w) => w === f ? r.max : w < h ? r.tertiary : r.secondary, M = (w, y, H, g) => {
    e.text(g, y, c + 12, x.caption, u(w), H, "top");
    const b = i[w].time;
    b && e.text(b, y, c + 26, D, w === f ? r.primary : r.tertiary, H, "top");
  };
  if (n.labels === "all") {
    const w = o > 1 ? (s - a) / (o - 1) - 4 : t.width;
    i.forEach((y, H) => {
      const g = S(e.measure, y.name, x.caption, w);
      H === 0 ? M(H, t.x, "left", g) : H === o - 1 ? M(H, V(t), "right", g) : M(H, l(H), "center", g);
    });
    return;
  }
  const m = S(e.measure, i[0].name, x.caption, t.width * 0.4);
  M(0, t.x, "left", m);
  const L = o > 1 ? S(e.measure, i[o - 1].name, x.caption, t.width * 0.4) : "";
  if (o > 1 && M(o - 1, V(t), "right", L), f > 0 && f < o - 1) {
    const w = t.x + e.measure(m, x.caption) + 10, y = V(t) - e.measure(L, x.caption) - 10;
    if (y - w > 24) {
      const H = S(e.measure, i[f].name, x.caption, y - w), g = e.measure(H, x.caption) / 2;
      M(f, T(l(f), w + g, y - g), "center", H);
    }
  }
}
function Ii(e, t, i, n, o = {}) {
  const a = P(o.max, 5, 1, 10), s = W(o.size, 12), c = Math.max(0, C(o.gap, 3)), h = T(C(n), 0, a);
  for (let l = 0; l < a; l++) {
    const d = t + s / 2 + l * (s + c), f = i + s * 0.04, u = T(h - l, 0, 1);
    u > 0 && e.scoped((M) => {
      M.clipRect({ x: d - s / 2, y: i - s / 2 - 1, width: s * u, height: s + 2 }), M.star(d, f, s / 2, s * 0.21, 5, 0, { fill: r.max });
    }), e.star(d, f, s / 2, s * 0.21, 5, 0, { stroke: u >= 1 ? r.max : r.secondary, width: 1, join: "miter" });
  }
  return a * s + (a - 1) * c;
}
function Ti(e, t, i) {
  if (i.length === 0) return;
  const n = x.caption, o = 14, a = I(t), s = i.map((f) => e.measure(f, n)), c = e.measure("…", n) + o;
  let h = i.length - 1, l = s[h];
  for (; h > 0; ) {
    const f = l + o + s[h - 1];
    if (f + (h - 1 > 0 ? c : 0) > t.width) break;
    l = f, h--;
  }
  let d = t.x;
  h > 0 && (e.text("…", d, a, n, r.tertiary, "left", "middle"), d += e.measure("…", n), E(e, "chevron-right", d + o / 2, a, 9, r.disabled), d += o);
  for (let f = h; f < i.length; f++) {
    const u = f === i.length - 1, M = u ? S(e.measure, i[f], n, Math.max(0, V(t) - d)) : i[f];
    e.text(M, d, a, n, u ? r.max : r.tertiary, "left", "middle"), d += s[f], u || (E(e, "chevron-right", d + o / 2, a, 9, r.disabled), d += o);
  }
}
function Ai(e, t, i, n) {
  const o = P(n, 1, 1, 99999), a = P(i, 1, 1, o), s = N(t), c = I(t), h = `${a} / ${o}`, l = e.measure(h, x.numeral);
  e.text(h, s, c, x.numeral, r.primary, "center", "middle"), E(e, "chevron-left", s - l / 2 - 12, c, 12, a > 1 ? r.strong : r.border), E(e, "chevron-right", s + l / 2 + 12, c, 12, a < o ? r.strong : r.border);
}
function Fi(e, t, i, n = {}) {
  if (i.length === 0) return 0;
  const o = W(n.height, 20), a = Math.max(0, C(n.gap, 6)), s = new Set(typeof n.selected == "number" ? [n.selected] : n.selected ?? []);
  let c = t.x, h = t.y, l = 0;
  return i.forEach((d, f) => {
    const u = Math.min(t.width, e.measure(d, x.caption) + 18);
    c > t.x && c + u > V(t) + 0.5 && (c = t.x, h += o + a), !(h + o > k(t) + 0.5) && (de(e, { x: c, y: h, width: u, height: o }, d, { selected: s.has(f) }), l = h + o - t.y, c += u + a);
  }), l;
}
function Pi(e, t, i, n = {}) {
  const o = n.direction === "column", a = Math.max(0, C(n.gap, o ? 13 : 12));
  let s = t.x, c = o ? t.y + 5 : I(t);
  for (const h of i) {
    const l = h.gray ?? r.max, d = h.marker ?? "line";
    d === "dot" ? e.circle(s + 5, c, 2.5, { fill: l }) : d === "square" ? e.rect({ x: s + 1.5, y: c - 3.5, width: 7, height: 7 }, { fill: l }) : e.line(s, c, s + 10, c, { stroke: l, width: 1.5, dash: h.dash, cap: "butt" }), e.text(h.label, s + 15, c, x.micro, r.tertiary, "left", "middle"), o ? c += a : s += 15 + e.measure(h.label, x.micro) + a;
  }
}
function Ni(e, t, i, n, o = {}) {
  const a = C(n), s = o.text ?? (o.format ? o.format(a) : `${Math.abs(a).toFixed(1)}%`), c = a > 0 ? r.max : a < 0 ? r.secondary : r.tertiary;
  return a !== 0 ? Jt(e, a > 0 ? "caret-up" : "caret-down", t + 5, i, 12, c) : e.rect({ x: t + 2, y: i - 0.75, width: 6, height: 1.5 }, { fill: c }), e.text(s, t + 13, i, D, c, "left", "middle"), 13 + e.measure(s, D);
}
function $i(e, t, i, n, o = {}) {
  const a = W(o.height, 16), s = Math.max(a, e.measure(n, mt) + 10), c = { x: t, y: i - a / 2, width: s, height: a };
  return Z(e) || e.roundRect(c, 3, { fill: r.surface }), e.roundRect(c, 3, { stroke: r.border, width: 1 }), e.hline(t + 2, t + s - 2, i + a / 2 + 1, r.hairline), e.text(n, t + s / 2, i, mt, r.secondary, "center", "middle"), s;
}
function xt(e) {
  const t = Math.max(0, Math.floor(C(e))), i = Math.floor(t / 3600), n = Math.floor(t % 3600 / 60), o = String(t % 60).padStart(2, "0");
  return i > 0 ? `${i}:${String(n).padStart(2, "0")}:${o}` : `${n}:${o}`;
}
function zi(e, t, i) {
  let n = t.y;
  e.text(S(e.measure, i.title, x.bodyStrong, t.width), t.x, n + 8, x.bodyStrong, r.max, "left", "middle"), n += 17, i.artist && (e.text(S(e.measure, i.artist, x.caption, t.width), t.x, n + 6, x.caption, r.tertiary, "left", "middle"), n += 15);
  const o = Math.max(0, C(i.duration)), a = T(C(i.position), 0, o), s = xt(a), c = o > 0 ? `-${xt(o - a)}` : "--:--", h = n + 9, l = e.measure(s, D), d = e.measure(c, D);
  e.text(s, t.x, h, D, r.secondary, "left", "middle"), e.text(c, V(t), h, D, r.tertiary, "right", "middle");
  const f = t.width - l - d - 16;
  if (f > 8 && oe(e, { x: t.x + l + 8, y: h - 2, width: f, height: 4 }, o > 0 ? a / o : 0), k(t) - h >= 34) {
    const u = N(t), M = h + 24;
    E(e, "skip-back", u - 36, M, 14, r.secondary), e.circle(u, M, 13, { stroke: r.border, width: 1 }), E(e, i.playing ? "pause" : "play", u + (i.playing ? 0 : 1), M, 14, r.max), E(e, "skip-forward", u + 36, M, 14, r.secondary);
  }
}
function Bi(e, t, i, n = {}) {
  if (i.length === 0) return;
  const o = W(n.barWidth, 2), a = Math.max(0, C(n.gap, 1)), s = Math.max(1, Math.floor((t.width + a) / (o + a))), c = n.progress === void 0 ? s : Math.round(B(n.progress) * s), h = n.mirrored !== !1;
  for (let l = 0; l < s; l++) {
    const d = Math.floor(l * i.length / s), f = Math.max(d + 1, Math.floor((l + 1) * i.length / s));
    let u = 0;
    for (let m = d; m < f && m < i.length; m++) u = Math.max(u, B(Math.abs(i[m])));
    const M = Math.max(1, u * t.height);
    e.rect(
      { x: t.x + l * (o + a), y: h ? I(t) - M / 2 : k(t) - M, width: o, height: M },
      { fill: l < c ? r.max : r.disabled }
    );
  }
}
function Gi(e, t, i, n = {}) {
  const o = i.length;
  if (o === 0) return;
  const a = P(n.segments, 8, 1, 32), s = Math.max(0, C(n.gap, 2)), c = (t.width - s * (o - 1)) / o, h = (t.height - (a - 1)) / a;
  !(c > 0) || !(h > 0) || i.forEach((l, d) => {
    const f = t.x + d * (c + s), u = Math.round(B(l) * a);
    for (let m = 0; m < a; m++) {
      const L = k(t) - (m + 1) * h - m;
      m < u ? e.rect({ x: f, y: L, width: c, height: h }, { fill: m === u - 1 ? r.max : r.secondary }) : Z(e) || e.rect({ x: f, y: L, width: c, height: h }, { fill: r.sunken });
    }
    u === 0 && e.rect({ x: f, y: k(t) - 1, width: c, height: 1 }, { fill: r.border });
    const M = n.peaks?.[d];
    M !== void 0 && Number.isFinite(M) && e.rect({ x: f, y: k(t) - B(M) * t.height, width: c, height: 1 }, { fill: r.strong });
  });
}
function Wi(e, t, i, n, o, a, s = {}) {
  const c = Math.max(0, C(a)), h = T(C(o), 0, c), l = W(s.width, 5);
  ee(e, t, i, n, c > 0 ? h / c : 0, { width: l });
  const d = Math.max(0, (n - l / 2 - 4) * 1.9), f = xt(h);
  e.text(f, t, i - (s.label ? 5 : 0), at(e.measure, f, [x.numeralLg, x.numeral, D], d), r.max, "center", "middle"), s.label && e.text(S(e.measure, s.label, ot, d), t, i + 11, ot, r.tertiary, "center", "middle");
}
function Di(e, t, i, n, o = {}) {
  const a = o.style ?? x.body, s = o.gray ?? r.primary, c = I(t), h = e.measure(i, a);
  if (h <= t.width)
    return e.text(i, t.x, c, a, s, "left", "middle"), !1;
  const l = W(o.speed, 40), d = Math.max(8, C(o.gap, 32)), f = Math.max(0, C(o.pauseMs, 1200)), u = h + d, M = f + u / l * 1e3, m = (C(n) % M + M) % M, L = m < f ? 0 : (m - f) * l / 1e3;
  return e.scoped((w) => {
    w.clipRect(t), w.text(i, t.x - L, c, a, s, "left", "middle"), w.text(i, t.x - L + u, c, a, s, "left", "middle");
  }), !0;
}
function ji(e, t, i, n, o = {}) {
  const a = o.style ?? x.body, s = o.gray ?? r.primary, c = J(a), h = rt(e.measure, i, a, t.width).slice(0, Math.max(1, Math.floor(t.height / c))), l = h.reduce((M, m) => M + m.length, 0);
  let d = Math.round(B(n) * l), f = t.x, u = t.y + c / 2;
  for (let M = 0; M < h.length; M++) {
    const m = t.y + M * c + c / 2, L = h[M].slice(0, d);
    if (d -= L.length, L && e.text(L, t.x, m, a, s, "left", "middle"), f = t.x + e.measure(L, a), u = m, L.length < h[M].length || d <= 0) break;
  }
  if (o.caret !== !1) {
    const M = a.size ?? 16;
    e.rect({ x: f + 1, y: u - M * 0.45, width: Math.max(2, M * 0.45), height: M * 0.9 }, { fill: r.max });
  }
}
const wt = { ...x.numeral, size: 12, leading: 14 }, be = { ...x.micro, size: 8 }, ke = { ...x.label, tracking: 0 };
function It(e, t, i = A.md, n = 2.5) {
  e.roundRect(U(t, -n), i + n, { stroke: r.max, width: 1.5 });
}
function Lt(e, t) {
  Z(e) ? (e.roundRect({ x: t.x, y: t.y + 2, width: 2.5, height: Math.max(0, t.height - 4) }, 1.5, { fill: r.max }), e.roundRect(t, A.md, { stroke: r.hairline, width: 1 })) : e.roundRect(t, A.md, { fill: r.raised });
}
function Yi(e, t, i, n, o = {}) {
  if (i.length === 0) return;
  const a = Z(e), s = Math.min(A.md, t.height / 2), c = t.width / i.length;
  a || e.roundRect(t, s, { fill: r.sunken }), e.roundRect(t, s, { stroke: r.border, width: 1 }), i.forEach((h, l) => {
    const d = { x: t.x + l * c, y: t.y, width: c, height: t.height }, f = l === n;
    if (f) {
      const u = U(d, 2.5);
      a ? e.roundRect(u, Math.max(0, s - 2), { stroke: r.max, width: 1.2 }) : e.roundRect(u, Math.max(0, s - 2), { fill: r.max });
    } else l > 0 && l - 1 !== n && e.vline(d.x, t.y + 5, k(t) - 5, r.hairline);
    e.text(
      S(e.measure, h, x.label, c - 10),
      N(d),
      I(d),
      x.label,
      f ? a ? r.max : r.off : r.tertiary,
      "center",
      "middle"
    );
  }), o.focused && It(e, t, s);
}
function qi(e, t, i, n, o = {}) {
  if (i.length === 0) return;
  let a = P(o.visible, 5, 1, 9);
  a % 2 === 0 && (a += 1);
  const s = t.height / a, c = T(C(n), 0, i.length - 1), h = I(t), l = o.focused ? r.max : r.border;
  e.hline(t.x + 4, V(t) - 4, h - s / 2, l), e.hline(t.x + 4, V(t) - 4, h + s / 2, l), e.scoped((d) => {
    d.clipRect(t);
    const f = Math.max(0, Math.floor(c - a / 2 - 1)), u = Math.min(i.length - 1, Math.ceil(c + a / 2 + 1));
    for (let M = f; M <= u; M++) {
      const m = Math.abs(M - c), L = m < 0.5, w = L ? x.bodyStrong : x.body;
      d.text(
        S(e.measure, i[M], w, t.width - 12),
        N(t),
        h + (M - c) * s,
        w,
        L ? r.max : m < 1.5 ? r.secondary : r.disabled,
        "center",
        "middle"
      );
    }
  });
}
function Tt(e, t, i, n, o, a) {
  const s = Math.max(16, C(a.rowHeight, 22)), c = Math.min(i.length, Math.max(1, Math.floor(t.height / s)));
  for (let h = 0; h < c; h++) {
    const l = { x: t.x, y: t.y + h * s, width: t.width, height: s - 2 }, d = I(l), f = n(h);
    h === a.focused && Lt(e, l);
    const u = { x: t.x + 8, y: d - 8, width: 16, height: 16 };
    o === "radio" ? ue(e, u, f) : fe(e, u, f), e.text(S(e.measure, i[h], x.body, t.width - 40), t.x + 32, d, x.body, f ? r.max : r.secondary, "left", "middle");
  }
}
function _i(e, t, i, n, o = {}) {
  Tt(e, t, i, (a) => a === n, "radio", o);
}
function Xi(e, t, i, n, o = {}) {
  Tt(e, t, i, (a) => n[a] === !0, "check", o);
}
function Ui(e, t, i, n = {}) {
  const o = Math.min(A.md, t.height / 2), a = Math.min(t.height + 4, t.width / 3), s = I(t);
  Z(e) || e.roundRect(t, o, { fill: r.sunken }), e.roundRect(t, o, { stroke: r.border, width: 1 }), e.vline(t.x + a, t.y + 4, k(t) - 4, r.hairline), e.vline(V(t) - a, t.y + 4, k(t) - 4, r.hairline), E(e, "minus", t.x + a / 2, s, 12, n.canDecrement === !1 ? r.border : r.strong), E(e, "plus", V(t) - a / 2, s, 12, n.canIncrement === !1 ? r.border : r.strong);
  const c = at(e.measure, i, [x.numeral, wt], t.width - a * 2 - 8);
  e.text(i, N(t), s, c, r.max, "center", "middle"), n.focused && It(e, t, o);
}
function Qi(e, t, i, n, o = {}) {
  let a = B(i), s = B(n);
  a > s && ([a, s] = [s, a]);
  const c = Math.round(I(t)), h = t.x + 5, l = Math.max(0, t.width - 10);
  e.hline(h, h + l, c, r.border);
  const d = P(o.steps, 0, 0, 100);
  for (let f = 0; f < d && d > 1; f++) e.vline(h + f * l / (d - 1), c - 3, c + 4, r.tertiary);
  e.rect({ x: h + l * a, y: c - 1, width: l * (s - a), height: 3 }, { fill: r.max });
  for (const f of [a, s])
    e.circle(h + l * f, c + 0.5, 5, { fill: r.off }), e.circle(h + l * f, c + 0.5, 4, { fill: r.max });
}
function Ki(e, t, i, n, o, a = {}) {
  const s = Math.max(6, C(n, 20)), c = B(o), h = Math.PI * 0.75, l = Math.PI * 1.5, d = h + c * l;
  e.arc(t, i, s, h, h + l, {
    stroke: a.focused ? r.secondary : Z(e) ? r.border : r.sunken,
    width: Z(e) ? 1 : 3,
    cap: "round"
  }), c > 3e-3 && e.arc(t, i, s, h, d, { stroke: r.max, width: 3, cap: "round" });
  const f = P(a.ticks, 0, 0, 60);
  for (let M = 0; M < f; M++) {
    const m = h + (f === 1 ? 0.5 : M / (f - 1)) * l, L = F(t, i, s + 6, m), w = F(t, i, s + 9, m);
    e.line(L.x, L.y, w.x, w.y, { stroke: r.disabled, width: 1, cap: "butt" });
  }
  const u = F(t, i, s, d);
  if (e.circle(u.x, u.y, 5, { fill: r.off }), e.circle(u.x, u.y, 3.5, { fill: r.max }), a.valueText) {
    const M = at(e.measure, a.valueText, [x.numeral, wt], s * 1.4);
    e.text(a.valueText, t, i, M, r.max, "center", "middle");
  }
  a.label && e.text(a.label, t, i + s * 0.82, be, r.tertiary, "center", "middle");
}
function Ji(e, t, i, n = {}) {
  let o = t;
  n.label && t.height >= 36 && (e.text(n.label, t.x, t.y + 5, x.micro, r.tertiary, "left", "middle"), o = { x: t.x, y: t.y + 13, width: t.width, height: t.height - 13 }), o = { ...o, height: Math.min(o.height, 28) }, Z(e) || e.roundRect(o, A.sm, { fill: r.sunken }), e.roundRect(o, A.sm, { stroke: n.focused ? r.max : r.border, width: n.focused ? 1.5 : 1 });
  const a = I(o);
  let s = o.x + 9;
  n.icon && (E(e, n.icon, s + 6, a, 13, r.tertiary), s += 19);
  const c = Math.max(0, V(o) - 9 - s - (n.caret ? 5 : 0));
  let h = s;
  if (i === "")
    n.placeholder && e.text(S(e.measure, n.placeholder, x.body, c), s, a, x.body, r.tertiary, "left", "middle");
  else if (n.secure) {
    const l = Math.min([...i].length, Math.max(0, Math.floor(c / 9)));
    for (let d = 0; d < l; d++) e.circle(s + 3 + d * 9, a, 2.5, { fill: r.primary });
    h = s + l * 9;
  } else {
    let l = i;
    if (e.measure(l, x.body) > c) {
      const d = [...i];
      let f = "";
      for (let u = d.length - 1; u >= 0; u--) {
        const M = d[u] + f;
        if (e.measure(`…${M}`, x.body) > c) break;
        f = M;
      }
      l = `…${f}`;
    }
    e.text(l, s, a, x.body, r.primary, "left", "middle"), h = s + e.measure(l, x.body);
  }
  n.caret && e.vline(h + 2, a - 7, a + 7, r.max, 1.5);
}
function tn(e, t, i, n, o, a = {}) {
  const s = P(n, 4, 1, 16), c = W(a.radius, 4), h = Math.max(0, C(a.gap, 10)), l = c * 2 + h, d = t - (s - 1) * l / 2, f = P(o, 0, 0, s);
  for (let u = 0; u < s; u++)
    u < f ? e.circle(d + u * l, i, c, { fill: r.max }) : e.circle(d + u * l, i, c - 0.5, { stroke: r.secondary, width: 1 });
}
const pe = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["←", "0", "OK"]];
function en(e, t, i = {}) {
  const n = i.keys ?? pe, o = n.length, a = n.reduce((f, u) => Math.max(f, u.length), 0);
  if (o === 0 || a === 0) return;
  const s = Math.max(0, C(i.gap, 4)), c = (t.width - s * (a - 1)) / a, h = (t.height - s * (o - 1)) / o;
  if (!(c > 0) || !(h > 0)) return;
  const l = Math.min(A.sm, h / 2);
  let d = 0;
  n.forEach((f, u) => {
    f.forEach((M, m) => {
      const L = { x: t.x + m * (c + s), y: t.y + u * (h + s), width: c, height: h }, w = d === i.pressed, y = d === i.focused;
      d++, w ? e.roundRect(L, l, { fill: r.max }) : (Z(e) || e.roundRect(L, l, { fill: r.surface }), e.roundRect(L, l, { stroke: y ? r.max : r.border, width: y ? 1.5 : 1 })), e.text(
        M,
        N(L),
        I(L),
        [...M].length > 1 ? ke : x.numeral,
        w ? r.off : y ? r.max : r.primary,
        "center",
        "middle"
      );
    });
  });
}
function nn(e, t, i, n, o = {}) {
  o.focused && Lt(e, t);
  const a = I(t);
  let s = t.x + 10;
  o.icon && (E(e, o.icon, s + 7, a, 14, o.disabled ? r.disabled : r.strong), s += 22);
  const c = 28, h = V(t) - 10 - c - 8 - s, l = o.disabled ? r.disabled : o.focused ? r.max : r.primary;
  o.detail && t.height >= 30 ? (e.text(S(e.measure, i, x.body, h), s, a - 7, x.body, l, "left", "middle"), e.text(S(e.measure, o.detail, x.caption, h), s, a + 8, x.caption, r.tertiary, "left", "middle")) : e.text(S(e.measure, i, x.body, h), s, a, x.body, l, "left", "middle"), he(e, V(t) - 10 - c, a, n, c);
}
function on(e, t, i, n, o = {}) {
  o.focused && Lt(e, t);
  const a = t.x + 10, s = Math.max(0, t.width - 20);
  e.text(i, a, t.y + 9, x.caption, o.focused ? r.max : r.secondary, "left", "middle"), o.valueText && e.text(o.valueText, a + s, t.y + 9, wt, r.primary, "right", "middle"), Me(e, { x: a + 4, y: t.y + 17, width: Math.max(0, s - 8), height: Math.max(10, t.height - 20) }, n, { steps: o.steps });
}
export {
  e1 as AngleTween,
  sn as BAYER4,
  D1 as ChangeRecorder,
  q1 as Cursor,
  Y1 as GlyphApp,
  Wt as GlyphFont,
  Dt as GlyphFontSet,
  $t as GlyphFrame,
  Yt as GlyphPath,
  cn as GlyphRaster,
  hn as LEVELS,
  ln as LEVEL_STEP,
  Ht as MAX_IMAGE_CONTAINERS,
  dn as TILE_BANDS,
  fn as TILE_CHROME,
  un as TILE_COLUMNS,
  Mn as TILE_HERO,
  mn as TILE_LAYOUTS,
  zt as TILE_QUADRANTS,
  Nt as TileDiff,
  Zt as Tween,
  y1 as activityRings,
  jt as align,
  Be as aspectFit,
  z1 as attitudeIndicator,
  Je as auto,
  Ce as avatar,
  vi as avatarGroup,
  A1 as badge,
  xi as banner,
  c1 as barChart,
  li as barGauge,
  ae as battery,
  Y as bearingToAngle,
  k as bottom,
  ui as bottomSheet,
  Ti as breadcrumb,
  u1 as bulletChart,
  ce as button,
  we as buttonRow,
  xn as byteToGray,
  yn as cachedMeasurer,
  Si as calendarMonth,
  mi as callout,
  H1 as candlestickChart,
  Li as captions,
  ki as card,
  Te as center,
  N as centerX,
  I as centerY,
  it as chartFrame,
  Zi as chatBubble,
  fe as checkBox,
  Xi as checkGroup,
  de as chip,
  Fi as chipRow,
  T as clamp,
  wn as clampGray,
  si as clockFace,
  Kt as column,
  Qe as columnOf,
  U1 as compactTabs,
  _1 as compactToggle,
  $1 as compassRose,
  Pe as contains,
  J1 as countBadge,
  Wi as countdownRing,
  Ye as deg,
  ai as deviationBar,
  Ki as dial,
  fi as dialog,
  Ln as ditherGray,
  k1 as divider,
  M1 as donutChart,
  x1 as dotMatrix,
  vt as ease,
  P1 as emptyState,
  Gi as equalizer,
  Gt as familyOf,
  bt as fitStyle,
  It as focusRing,
  Oe as fontMetrics,
  Hn as fontString,
  xt as formatDuration,
  d1 as gaugeChart,
  He as gestureGlyph,
  r as gray,
  gn as grayToByte,
  Vn as grayToCss,
  Cn as grayToRgba,
  De as grid,
  Ke as grow,
  o1 as hasIcon,
  bn as hashBytes,
  ti as headingTape,
  f1 as heatStrip,
  wi as hintBar,
  w1 as histogram,
  E as icon,
  Jt as iconFilled,
  a1 as iconNames,
  st as iconPaths,
  Vi as indeterminateBar,
  _t as inkBudget,
  U as inset,
  Se as insets,
  $e as intersection,
  Ne as intersects,
  Z as isOutline,
  v1 as keyValue,
  $i as keycap,
  en as keypad,
  j1 as layoutToSource,
  J as leadingOf,
  Ee as left,
  Pi as legend,
  _e as lerp,
  ci as levelMeter,
  r1 as lineChart,
  hi as linearGauge,
  Z1 as listRow,
  Ci as listeningIndicator,
  Ze as loadFontSet,
  gi as loadingState,
  W1 as maneuverArrow,
  Di as marquee,
  zi as mediaTransport,
  Mi as menu,
  p1 as metric,
  Xt as minContrast,
  kn as mixGray,
  yi as notificationCard,
  Q1 as notificationToast,
  Ui as numberStepper,
  Fe as offset,
  Ae as outset,
  pn as packGray4,
  S1 as pageDots,
  Ai as pagination,
  Rt as panel,
  qt as parsePath,
  at as pickStyle,
  qi as pickerWheel,
  I1 as pill,
  tn as pinDots,
  ii as pitchLadder,
  F as polar,
  C1 as polarChart,
  Ft as prepare,
  oe as progressBar,
  i1 as pulse,
  qe as rad,
  V1 as radarChart,
  ri as radarScope,
  ue as radioButton,
  _i as radioGroup,
  A as radius,
  L1 as rangeChart,
  Qi as rangeSlider,
  h1 as rankChart,
  Ii as rating,
  Re as rect,
  n1 as registerIcon,
  q as remap,
  ni as reticle,
  V as right,
  ee as ringChart,
  Qt as row,
  Ue as rowOf,
  kt as safe,
  di as scaleBar,
  l1 as scatterChart,
  K as screen,
  bi as screenHeader,
  N1 as scrim,
  se as scrollbar,
  b1 as section,
  O1 as segmentedBar,
  Yi as segmentedControl,
  re as signalBars,
  K1 as skeleton,
  on as sliderRow,
  Me as sliderTrack,
  je as snap,
  z as space,
  g1 as sparkBars,
  s1 as sparkline,
  G1 as speedLimit,
  me as spinner,
  Ge as splitH,
  We as splitV,
  t1 as stack,
  m1 as stackedBar,
  ne as stat,
  pi as statGrid,
  R1 as statusBar,
  Ve as statusDot,
  X1 as stepper,
  Ei as stopLine,
  vn as styleKey,
  nn as switchRow,
  E1 as tabBar,
  Oi as table,
  T1 as tag,
  oi as targetBox,
  Hi as teleprompter,
  Ji as textField,
  Xe as theme,
  Ri as timeline,
  F1 as toast,
  he as toggle,
  Ie as top,
  Ni as trendBadge,
  S as truncate,
  x as type,
  ji as typewriter,
  ze as union,
  At as unpackGray4,
  Pt as validateLayout,
  ei as valueTape,
  Bi as waveform,
  B1 as windIndicator,
  rt as wrap,
  Zn as wrapClamped
};
