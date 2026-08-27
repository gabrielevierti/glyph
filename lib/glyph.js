import { u as st, p as at, f as U, t as K, M as X, v as ot, T as ht, G as ct, a as lt } from "./frame-CT1__Sfi.js";
import { B as _e, b as Xe, L as Qe, c as Ue, d as Ke, e as Je, g as t1, h as e1, i as i1, j as n1, k as r1, l as s1, m as a1, n as o1, o as h1, q as c1, r as l1, s as f1, w as d1, x as u1, y as m1, z as M1, A as y1, C as w1 } from "./frame-CT1__Sfi.js";
function ft(e) {
  if (typeof atob == "function") {
    const i = atob(e), n = new Uint8Array(i.length);
    for (let r = 0; r < i.length; r++) n[r] = i.charCodeAt(r);
    return n;
  }
  const t = globalThis.Buffer;
  if (!t) throw new Error("Glyph: no base64 decoder available.");
  return t.from(e, "base64");
}
function dt(e) {
  return ((e.font ?? "Inter").split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase();
}
function Q(e, t, i, n) {
  return `${e}|${t}|${i}|${n ? 1 : 0}`;
}
class ut {
  face;
  /** One byte of coverage (0..15) per pixel of the atlas. */
  coverage;
  tinted = /* @__PURE__ */ new Map();
  constructor(t) {
    this.face = t, this.coverage = st(ft(t.data), t.width, t.height);
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
    let n = 0, r = 0;
    for (const s of t)
      n += this.advanceOf(s), r++;
    return n + (r > 1 ? i * (r - 1) : 0);
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
    const { width: r, height: s } = this.face, a = i(r, s);
    a.width = r, a.height = s;
    const o = a.getContext("2d", { alpha: !0 });
    if (!o) throw new Error("Glyph: Canvas 2D unavailable for font tinting.");
    const c = o.createImageData(r, s), l = Math.round(Math.max(0, Math.min(15, t)) * 17);
    for (let f = 0; f < this.coverage.length; f++) {
      const u = f * 4;
      c.data[u] = l, c.data[u + 1] = l, c.data[u + 2] = l, c.data[u + 3] = this.coverage[f] * 17;
    }
    return o.putImageData(c, 0, 0), this.tinted.set(t, a), a;
  }
  dispose() {
    this.tinted.clear();
  }
}
class mt {
  faces = /* @__PURE__ */ new Map();
  constructor(t) {
    for (const i of t.faces)
      this.faces.set(Q(i.family, i.weight, i.size, i.italic ?? !1), new ut(i));
  }
  /** The face for a style, or null if this set was not built for that style. */
  find(t) {
    const i = Number(t.weight ?? 500), n = Math.round(t.size ?? 16);
    return this.faces.get(Q(dt(t), i, n, t.italic ?? !1)) ?? null;
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
async function Zt(e) {
  const t = await fetch(e);
  if (!t.ok) throw new Error(`Glyph: could not load font atlas ${e} (${t.status}).`);
  const i = await t.json();
  if (i.version !== 1) throw new Error(`Glyph: unsupported font atlas version ${i.version}.`);
  return new mt(i);
}
function Rt(e, t, i) {
  return {
    width: e.measure(at(i, t), t.tracking ?? 0),
    height: t.leading ?? e.lineHeight
  };
}
function Tt(e, t, i, n) {
  return { x: e, y: t, width: i, height: n };
}
function Et(e, t = e, i = e, n = t) {
  return { top: e, right: t, bottom: i, left: n };
}
const At = (e) => e.x, w = (e) => e.x + e.width, St = (e) => e.y, H = (e) => e.y + e.height, I = (e) => e.x + e.width / 2, T = (e) => e.y + e.height / 2, It = (e) => ({ x: I(e), y: T(e) });
function B(e, t) {
  const i = typeof t == "number" ? { top: t, right: t, bottom: t, left: t } : { top: 0, right: 0, bottom: 0, left: 0, ...t };
  return {
    x: e.x + i.left,
    y: e.y + i.top,
    width: Math.max(0, e.width - i.left - i.right),
    height: Math.max(0, e.height - i.top - i.bottom)
  };
}
function Gt(e, t) {
  return B(e, -t);
}
function Pt(e, t, i) {
  return { x: e.x + t, y: e.y + i, width: e.width, height: e.height };
}
function zt(e, t) {
  return t.x >= e.x && t.x <= w(e) && t.y >= e.y && t.y <= H(e);
}
function Ft(e, t) {
  return !(w(e) <= t.x || w(t) <= e.x || H(e) <= t.y || H(t) <= e.y);
}
function $t(e, t) {
  const i = Math.max(e.x, t.x), n = Math.max(e.y, t.y);
  return {
    x: i,
    y: n,
    width: Math.max(0, Math.min(w(e), w(t)) - i),
    height: Math.max(0, Math.min(H(e), H(t)) - n)
  };
}
function Bt(e, t) {
  const i = Math.min(e.x, t.x), n = Math.min(e.y, t.y);
  return { x: i, y: n, width: Math.max(w(e), w(t)) - i, height: Math.max(H(e), H(t)) - n };
}
function Mt(e, t, i = "center", n = "middle") {
  const r = i === "left" ? e.x : i === "right" ? w(e) - t.width : e.x + (e.width - t.width) / 2, s = n === "top" ? e.y : n === "bottom" ? H(e) - t.height : e.y + (e.height - t.height) / 2;
  return { x: r, y: s, width: t.width, height: t.height };
}
function Wt(e, t) {
  const i = Math.min(e.width, e.height * t), n = i / t;
  return Mt(e, { width: i, height: n });
}
function qt(e, t, i = 0) {
  const n = t.reduce((o, c) => o + c, 0) || 1, r = e.width - i * (t.length - 1), s = [];
  let a = e.x;
  for (const o of t) {
    const c = r * o / n;
    s.push({ x: a, y: e.y, width: c, height: e.height }), a += c + i;
  }
  return s;
}
function Nt(e, t, i = 0) {
  const n = t.reduce((o, c) => o + c, 0) || 1, r = e.height - i * (t.length - 1), s = [];
  let a = e.y;
  for (const o of t) {
    const c = r * o / n;
    s.push({ x: e.x, y: a, width: e.width, height: c }), a += c + i;
  }
  return s;
}
function jt(e, t, i, n = 0, r = n) {
  const s = (e.width - n * (t - 1)) / t, a = (e.height - r * (i - 1)) / i, o = [];
  for (let c = 0; c < i; c++)
    for (let l = 0; l < t; l++)
      o.push({ x: e.x + l * (s + n), y: e.y + c * (a + r), width: s, height: a });
  return o;
}
function Dt(e) {
  const t = Math.round(e.x), i = Math.round(e.y);
  return { x: t, y: i, width: Math.round(e.x + e.width) - t, height: Math.round(e.y + e.height) - i };
}
function E(e, t, i, n) {
  return { x: e + Math.cos(n) * i, y: t + Math.sin(n) * i };
}
function q(e) {
  return (e - 90) * Math.PI / 180;
}
const Yt = (e) => e * 180 / Math.PI, _t = (e) => e * Math.PI / 180;
function Z(e, t, i) {
  return e < t ? t : e > i ? i : e;
}
function Xt(e, t, i) {
  return e + (t - e) * i;
}
function z(e, t, i, n, r) {
  return i === t ? n : Z(n + (e - t) / (i - t) * (r - n), Math.min(n, r), Math.max(n, r));
}
class yt {
  commands = [];
  moveTo(t, i) {
    return this.commands.push({ op: "M", x: t, y: i }), this;
  }
  lineTo(t, i) {
    return this.commands.push({ op: "L", x: t, y: i }), this;
  }
  quadTo(t, i, n, r) {
    return this.commands.push({ op: "Q", cx: t, cy: i, x: n, y: r }), this;
  }
  curveTo(t, i, n, r, s, a) {
    return this.commands.push({ op: "C", c1x: t, c1y: i, c2x: n, c2y: r, x: s, y: a }), this;
  }
  arc(t, i, n, r, s, a = !1) {
    return this.commands.push({ op: "A", cx: t, cy: i, r: n, start: r, end: s, ccw: a }), this;
  }
  close() {
    return this.commands.push({ op: "Z" }), this;
  }
  /** Append a run of points as a polyline. */
  polyline(t) {
    return t.forEach((i, n) => n === 0 ? this.moveTo(i.x, i.y) : this.lineTo(i.x, i.y)), this;
  }
  /** Replay into a 2D context, optionally translated and scaled. */
  apply(t, i = 0, n = 0, r = 1) {
    t.beginPath();
    for (const s of this.commands)
      switch (s.op) {
        case "M":
          t.moveTo(i + s.x * r, n + s.y * r);
          break;
        case "L":
          t.lineTo(i + s.x * r, n + s.y * r);
          break;
        case "Q":
          t.quadraticCurveTo(i + s.cx * r, n + s.cy * r, i + s.x * r, n + s.y * r);
          break;
        case "C":
          t.bezierCurveTo(
            i + s.c1x * r,
            n + s.c1y * r,
            i + s.c2x * r,
            n + s.c2y * r,
            i + s.x * r,
            n + s.y * r
          );
          break;
        case "A":
          t.arc(i + s.cx * r, n + s.cy * r, s.r * r, s.start, s.end, s.ccw);
          break;
        case "Z":
          t.closePath();
          break;
      }
  }
  /** Axis-aligned bounds of the control points. Approximate for curves. */
  bounds() {
    let t = 1 / 0, i = 1 / 0, n = -1 / 0, r = -1 / 0;
    const s = (a, o) => {
      a < t && (t = a), a > n && (n = a), o < i && (i = o), o > r && (r = o);
    };
    for (const a of this.commands)
      if (a.op !== "Z") {
        if (a.op === "A") {
          s(a.cx - a.r, a.cy - a.r), s(a.cx + a.r, a.cy + a.r);
          continue;
        }
        a.op === "C" && (s(a.c1x, a.c1y), s(a.c2x, a.c2y)), a.op === "Q" && s(a.cx, a.cy), s(a.x, a.y);
      }
    return t === 1 / 0 ? { x: 0, y: 0, width: 0, height: 0 } : { x: t, y: i, width: n - t, height: r - i };
  }
}
function wt(e) {
  const t = new yt(), i = e.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  let n = 0, r = 0, s = 0;
  const a = () => Number(i[n++]);
  for (; n < i.length; )
    switch (i[n++]) {
      case "M":
        r = a(), s = a(), t.moveTo(r, s);
        break;
      case "L":
        r = a(), s = a(), t.lineTo(r, s);
        break;
      case "H":
        r = a(), t.lineTo(r, s);
        break;
      case "V":
        s = a(), t.lineTo(r, s);
        break;
      case "Q": {
        const c = a(), l = a();
        r = a(), s = a(), t.quadTo(c, l, r, s);
        break;
      }
      case "C": {
        const c = a(), l = a(), f = a(), u = a();
        r = a(), s = a(), t.curveTo(c, l, f, u, r, s);
        break;
      }
      case "O": {
        const c = a(), l = a(), f = a();
        t.moveTo(c + f, l), t.arc(c, l, f, 0, Math.PI * 2);
        break;
      }
      case "Z":
        t.close();
        break;
    }
  return t;
}
const h = {
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
}, S = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif", j = "SF Mono, ui-monospace, Menlo, Consolas, monospace", m = {
  hero: { font: S, size: 64, weight: 800, leading: 62 },
  display: { font: S, size: 46, weight: 800, leading: 46 },
  displaySm: { font: S, size: 34, weight: 800, leading: 34 },
  headline: { font: S, size: 22, weight: 700, leading: 26 },
  title: { font: S, size: 17, weight: 700, leading: 21 },
  body: { font: S, size: 14, weight: 500, leading: 18 },
  bodyStrong: { font: S, size: 14, weight: 700, leading: 18 },
  caption: { font: S, size: 11, weight: 500, leading: 14 },
  label: { font: S, size: 10, weight: 700, tracking: 1.1, uppercase: !0, leading: 13 },
  micro: { font: S, size: 9, weight: 700, tracking: 0.8, uppercase: !0, leading: 11 },
  numeral: { font: j, size: 15, weight: 600, leading: 18 },
  numeralLg: { font: j, size: 24, weight: 700, leading: 28 },
  numeralXl: { font: j, size: 40, weight: 700, leading: 42 }
}, O = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }, A = { none: 0, xs: 3, sm: 5, md: 8, lg: 12, xl: 18, pill: 999 }, $ = { width: 576, height: 288 }, J = { x: 14, y: 12, width: 548, height: 264 };
function v(e) {
  return e.surface === "outline";
}
const gt = 0.18, Lt = 4, Qt = { gray: h, type: m, space: O, radius: A, screen: $, safe: J, inkBudget: gt, minContrast: Lt };
function xt(e, t, i) {
  const n = e.intrinsic;
  if (typeof n == "number") return n;
  if (typeof n == "function") return n(t);
  throw new Error(
    `Glyph: flex item ${i} has size "auto" but no \`intrinsic\`. Give it a number, or a (crossSize) => number, so it can report its own size.`
  );
}
function D(e, t) {
  let i = e;
  return t.min !== void 0 && (i = Math.max(i, t.min)), t.max !== void 0 && (i = Math.min(i, t.max)), Math.max(0, i);
}
function tt(e, t, i, n) {
  const r = i.padding !== void 0 ? B(e, i.padding) : e, s = i.gap ?? 0, a = n ? r.width : r.height, o = n ? r.height : r.width, c = s * Math.max(0, t.length - 1);
  let l = 0, f = 0;
  const u = t.map((M, p) => {
    const g = M.size ?? { grow: 1 };
    if (typeof g == "number") {
      const k = D(g, M);
      return l += k, k;
    }
    if (g === "auto") {
      const k = D(xt(M, o, p), M);
      return l += k, k;
    }
    return f += g.grow, null;
  }), L = Math.max(0, a - l - c), x = u.map((M, p) => {
    if (M !== null) return M;
    const g = t[p].size;
    return D(f > 0 ? L * g.grow / f : 0, t[p]);
  }), b = x.reduce((M, p) => M + p, 0) + c, d = Math.max(0, a - b), C = i.justify ?? "start";
  let V = (n ? r.x : r.y) + (C === "center" ? d / 2 : C === "end" ? d : 0);
  const y = C === "between" && t.length > 1 ? d / (t.length - 1) : C === "around" && t.length > 0 ? d / t.length : 0;
  return C === "around" && (V += y / 2), t.map((M, p) => {
    const g = x[p], k = M.cross ?? o, P = M.align ?? i.align ?? "stretch", G = P === "stretch" && M.cross === void 0 ? o : k, F = P === "center" ? (o - G) / 2 : P === "end" ? o - G : 0, W = n ? { x: V, y: r.y + F, width: g, height: G } : { x: r.x + F, y: V, width: G, height: g };
    return V += g + s + y, W;
  });
}
function Ct(e, t, i = {}) {
  return tt(e, t, i, !0);
}
function Ht(e, t, i = {}) {
  return tt(e, t, i, !1);
}
function Ut(e, t, i = {}) {
  return Ct(e, t.map((n) => ({ size: n })), i);
}
function Kt(e, t, i = {}) {
  return Ht(e, t.map((n) => ({ size: n })), i);
}
const Jt = (e = 1) => ({ grow: e }), te = (e, t = {}) => ({ size: "auto", intrinsic: e, ...t });
function ee(e, t = 0) {
  return B(e, t);
}
const et = {
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
class it {
  startValue;
  targetValue;
  startedAt = 0;
  duration;
  easing;
  constructor(t, i = 300, n = et.outCubic) {
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
class ie extends it {
  toBearing(t, i, n) {
    let r = ((t - this.target) % 360 + 540) % 360 - 180;
    return this.to(this.target + r, i, n);
  }
}
function ne(e, t = 1e3) {
  const i = e % t / t;
  return i < 0.5 ? i * 2 : 2 - i * 2;
}
const N = {
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
  glasses: "O6.5 15 4.5 O17.5 15 4.5 M11 15C11 13.5 13 13.5 13 15 M2 15C2 10 3.5 7 6 6 M22 15C22 10 20.5 7 18 6"
}, Y = /* @__PURE__ */ new Map();
function nt(e) {
  const t = Y.get(e);
  if (t) return t;
  const i = N[e];
  if (!i) return null;
  const n = wt(i);
  return Y.set(e, n), n;
}
function re(e, t) {
  N[e] = t, Y.delete(e);
}
function se(e) {
  return e in N;
}
function ae() {
  return Object.keys(N).sort();
}
function R(e, t, i, n, r = 24, s = 15, a = {}) {
  const o = nt(t);
  if (!o) return;
  const c = r / 24, l = a.width ?? Math.max(1, Math.min(2.6, r / 11));
  e.path(o, i - r / 2, n - r / 2, c, {
    stroke: s,
    width: l,
    cap: "round",
    join: "round",
    fill: void 0,
    ...a
  });
}
function oe(e, t, i, n, r = 24, s = 15) {
  const a = nt(t);
  if (!a) return;
  const o = r / 24;
  e.path(a, i - r / 2, n - r / 2, o, { fill: s });
}
function Vt(e, t) {
  const i = e.flatMap((s) => s.values), n = t.min ?? (i.length ? Math.min(...i) : 0), r = t.max ?? (i.length ? Math.max(...i) : 1);
  return r === n ? [n - 1, r + 1] : [n, r];
}
function rt(e, t, i, n) {
  return e.length === 0 ? [] : e.length === 1 ? [{ x: t.x + t.width / 2, y: z(e[0], i, n, H(t), t.y) }] : e.map((r, s) => ({
    x: t.x + s / (e.length - 1) * t.width,
    y: z(r, i, n, H(t), t.y)
  }));
}
function _(e, t, i, n, r = {}) {
  const s = r.gutter ?? 0, a = r.labels?.length ? 12 : 0, o = {
    x: t.x + s,
    y: t.y,
    width: t.width - s,
    height: t.height - a
  }, c = r.gridLines ?? 0;
  for (let l = 0; l < c; l++) {
    const f = c === 1 ? 0.5 : l / (c - 1), u = Math.round(H(o) - f * o.height);
    e.hline(o.x, w(o), u, r.gridGray ?? h.hairline), s > 0 && r.format && e.text(r.format(i + (n - i) * f), t.x + s - 5, u, m.micro, r.labelGray ?? h.tertiary, "right", "middle");
  }
  return r.baseline !== !1 && e.hline(o.x, w(o), H(o), h.border), r.labels?.length && r.labels.forEach((l, f) => {
    const u = r.labels.length === 1 ? 0.5 : f / (r.labels.length - 1);
    e.text(
      l,
      o.x + u * o.width,
      H(o) + 4,
      m.micro,
      r.labelGray ?? h.tertiary,
      f === 0 ? "left" : f === r.labels.length - 1 ? "right" : "center",
      "top"
    );
  }), o;
}
function he(e, t, i, n = {}) {
  const [r, s] = Vt(i, n), a = _(e, t, r, s, n);
  for (const o of i) {
    const c = rt(o.values, a, r, s);
    if (c.length < 2) continue;
    o.fill !== void 0 && e.scoped((f) => {
      f.clipRect(a);
      const u = [{ x: c[0].x, y: H(a) }, ...c, { x: c[c.length - 1].x, y: H(a) }];
      v(e) ? f.scoped((L) => {
        L.ctx.beginPath(), u.forEach((x, b) => b === 0 ? L.ctx.moveTo(x.x, x.y) : L.ctx.lineTo(x.x, x.y)), L.ctx.closePath(), L.ctx.clip(), L.hatch(a, 6, h.hairline, Math.PI / 4, 1);
      }) : f.polygon(u, { fill: o.fill });
    });
    const l = { stroke: o.gray ?? h.max, width: o.width ?? 1.5, dash: o.dash };
    if (o.smooth ? e.spline(c, l) : e.polyline(c, l), o.markers) for (const f of c) e.circle(f.x, f.y, 1.6, { fill: o.gray ?? h.max });
  }
}
function ce(e, t, i, n = {}) {
  if (i.length < 2) return;
  const r = n.min ?? Math.min(...i), s = n.max ?? Math.max(...i), a = rt(i, t, r, s === r ? r + 1 : s);
  n.fill !== void 0 && !v(e) && e.polygon([{ x: a[0].x, y: H(t) }, ...a, { x: a[a.length - 1].x, y: H(t) }], { fill: n.fill });
  const o = { stroke: n.gray ?? h.strong, width: n.width ?? 1.5 };
  if (n.smooth ? e.spline(a, o) : e.polyline(a, o), n.dot !== !1) {
    const c = a[a.length - 1];
    e.circle(c.x, c.y, 2.2, { fill: h.off }), e.circle(c.x, c.y, 2.2, { stroke: n.gray ?? h.max, width: 1.2 });
  }
}
function le(e, t, i, n = {}) {
  const r = n.min ?? Math.min(0, ...i), s = n.max ?? Math.max(...i, 0), a = _(e, t, r, s, { ...n, baseline: n.baseline ?? !1 }), o = n.gap ?? 2, c = (a.width - o * (i.length - 1)) / i.length, l = z(0, r, s, H(a), a.y);
  i.forEach((f, u) => {
    const L = z(f, r, s, H(a), a.y), x = a.x + u * (c + o), b = Math.abs(L - l), d = { x, y: Math.min(L, l), width: c, height: Math.max(1, b) }, C = n.radius ?? Math.min(2, c / 3), V = u === n.highlight;
    v(e) && !V ? e.roundRect(d, C, { stroke: n.gray ?? h.border, width: 1 }) : e.roundRect(d, C, { fill: V ? n.highlightGray ?? h.max : n.gray ?? h.secondary });
  }), r < 0 && e.hline(a.x, w(a), l, h.border);
}
function fe(e, t, i, n = {}) {
  const r = n.max ?? Math.max(...i.map((c) => c.value), 1), s = n.labelWidth ?? 60, a = n.gap ?? 4, o = (t.height - a * (i.length - 1)) / i.length;
  i.forEach((c, l) => {
    const f = t.y + l * (o + a);
    e.text(c.label, t.x, f + o / 2, m.caption, h.secondary, "left", "middle");
    const u = { x: t.x + s, y: f + o / 2 - 3, width: t.width - s - 34, height: 6 };
    v(e) ? e.roundRect(u, 3, { stroke: h.hairline, width: 1 }) : e.roundRect(u, 3, { fill: h.sunken }), e.roundRect({ ...u, width: Math.max(2, u.width * Z(c.value, 0, r) / r) }, 3, { fill: c.gray ?? h.strong }), e.text(n.format ? n.format(c.value) : String(c.value), w(t), f + o / 2, m.numeral, h.primary, "right", "middle");
  });
}
function de(e, t, i, n = {}) {
  const r = i.map((u) => u.y), s = n.min ?? Math.min(...r), a = n.max ?? Math.max(...r), o = _(e, t, s, a, n), c = i.map((u) => u.x), l = n.xMin ?? Math.min(...c), f = n.xMax ?? Math.max(...c);
  for (const u of i)
    e.circle(
      z(u.x, l, f, o.x, w(o)),
      z(u.y, s, a, H(o), o.y),
      n.radius ?? 2,
      { fill: n.gray ?? h.strong }
    );
}
function ue(e, t, i, n, r, s = {}) {
  const a = s.width ?? 6, o = s.startAngle ?? -Math.PI / 2, c = Z(r, 0, 1);
  e.arc(t, i, n, 0, Math.PI * 2, { stroke: s.trackGray ?? (v(e) ? h.hairline : h.sunken), width: v(e) ? 1 : a, cap: "butt" }), c > 1e-3 && e.arc(t, i, n, o, o + Math.PI * 2 * c, { stroke: s.gray ?? h.max, width: a, cap: "round" });
  const l = n - a / 2 - 4;
  if (s.value) {
    const f = U(e.measure, s.value, m.numeralLg, l * 1.9, l * 1.3);
    e.text(s.value, t, i - (s.label ? 5 : 0), f, h.max, "center", "middle");
  }
  s.label && e.text(K(e.measure, s.label, m.micro, l * 1.9), t, i + 11, { ...m.micro, size: 8 }, h.tertiary, "center", "middle");
}
function me(e, t, i, n, r, s = {}) {
  const a = s.min ?? 0, o = s.max ?? 100, c = Math.PI * 0.75, l = Math.PI * 1.5, f = (x) => c + (Z(x, a, o) - a) / (o - a) * l;
  for (const x of s.zones ?? [])
    e.arc(t, i, n, f(x.from), f(x.to), { stroke: x.gray, width: 5, cap: "butt" });
  e.arc(t, i, n, c, c + l, { stroke: h.border, width: 1.5, cap: "round" });
  const u = s.ticks ?? 5;
  for (let x = 0; x < u; x++) {
    const b = c + x / (u - 1) * l, d = n - 6;
    e.line(
      t + Math.cos(b) * d,
      i + Math.sin(b) * d,
      t + Math.cos(b) * (n - 1),
      i + Math.sin(b) * (n - 1),
      { stroke: h.disabled, width: 1.5, cap: "butt" }
    );
  }
  const L = f(r);
  e.line(t, i, t + Math.cos(L) * (n - 9), i + Math.sin(L) * (n - 9), { stroke: s.gray ?? h.max, width: 2.5 }), e.circle(t, i, 3, { fill: h.max }), s.format && e.text(s.format(r), t, i + n * 0.52, m.numeralLg, h.max, "center", "top"), s.label && e.text(s.label, t, i + n * 0.52 + 22, { ...m.micro, size: 8 }, h.tertiary, "center", "top");
}
function Me(e, t, i, n = {}) {
  const r = n.min ?? Math.min(...i), s = n.max ?? Math.max(...i), a = n.gap ?? 1, o = (t.width - a * (i.length - 1)) / i.length;
  i.forEach((c, l) => {
    const f = z(c, r, s, n.low ?? h.sunken, n.high ?? h.max);
    e.rect({ x: t.x + l * (o + a), y: t.y, width: o, height: t.height }, { fill: Math.round(f) });
  });
}
function ye(e, t, i, n, r = {}) {
  const s = r.max ?? Math.max(i, n) * 1.15;
  v(e) ? e.roundRect(t, t.height / 2, { stroke: h.hairline, width: 1 }) : e.roundRect(t, t.height / 2, { fill: h.sunken }), e.roundRect({ ...t, width: Math.max(2, t.width * Z(i, 0, s) / s) }, t.height / 2, { fill: r.gray ?? h.strong });
  const a = t.x + t.width * Z(n, 0, s) / s;
  e.vline(a, t.y - 2, H(t) + 2, h.max, 2);
}
function pt(e, t, i = {}) {
  const n = i.radius ?? A.lg, r = v(e), s = i.fill ?? (r ? void 0 : h.surface), a = i.stroke ?? (r ? h.border : void 0);
  return s !== void 0 && e.roundRect(t, n, { fill: s }), i.texture && !r && e.scoped((o) => {
    o.clipRound(t, n), o.dots(t, 5, h.sunken, 0.5);
  }), a !== void 0 && e.roundRect(t, n, { stroke: a, width: i.strokeWidth ?? 1 }), B(t, O.md);
}
function we(e, t, i, n = {}) {
  pt(e, t, { fill: n.fill, stroke: n.stroke, radius: n.radius ?? A.lg, texture: n.texture });
  const r = t.y + 13;
  let s = t.x + O.md;
  n.icon && (R(e, n.icon, s + 5, r, 12, h.tertiary), s += 17);
  const a = n.accessory ? e.measure(n.accessory, m.micro) + O.sm : 0, o = w(t) - O.md - a - s;
  return e.text(K(e.measure, i, m.label, o), s, r, m.label, h.secondary, "left", "middle"), n.accessory && e.text(n.accessory, w(t) - O.md, r, m.micro, h.tertiary, "right", "middle"), e.hline(t.x + O.md, w(t) - O.md, t.y + 24, h.hairline), B({ x: t.x, y: t.y + 26, width: t.width, height: t.height - 26 }, { left: O.md, right: O.md, bottom: O.md });
}
function ge(e, t, i, n = h.hairline) {
  const r = T(t);
  if (!i) {
    e.hline(t.x, w(t), r, n);
    return;
  }
  const s = e.measure(i, m.micro), a = 6;
  e.hline(t.x, I(t) - s / 2 - a, r, n), e.hline(I(t) + s / 2 + a, w(t), r, n), e.text(i, I(t), r, m.micro, h.tertiary, "center", "middle");
}
function Le(e, t, i, n = {}) {
  const r = n.align ?? "left", s = n.valueStyle ?? m.numeralLg, a = r === "left" ? t.x : r === "right" ? w(t) : I(t), o = H(t) - 5, c = !!n.label, l = c ? H(t) - 18 : T(t);
  let f = a;
  n.icon && r === "left" && (R(e, n.icon, t.x + 7, t.y + 8, 14, h.tertiary), f = t.x + 18);
  const u = n.unit ? e.measure(n.unit, m.caption) + 6 : 0, L = U(
    e.measure,
    i,
    s,
    Math.max(24, w(t) - f - u),
    c ? t.height - 24 : t.height
  ), x = e.measure(i, L);
  if (e.text(i, f, l, L, n.gray ?? h.max, r, "bottom"), n.unit) {
    const b = r === "right" ? f - x - 3 : r === "center" ? f + x / 2 + 3 : f + x + 3;
    e.text(n.unit, b, l - 1, m.caption, h.tertiary, r === "right" ? "right" : "left", "bottom");
  }
  if (n.label && e.text(n.label, a, o, m.label, h.secondary, r, "bottom"), n.delta !== void 0 && n.delta !== 0) {
    const b = n.delta > 0;
    R(e, b ? "caret-up" : "caret-down", w(t) - 8, t.y + 9, 12, h.strong), n.deltaText && e.text(n.deltaText, w(t) - 17, t.y + 9, m.micro, h.secondary, "right", "middle");
  }
}
function xe(e, t, i, n, r = {}) {
  const s = r.align ?? "left", a = s === "left" ? t.x : s === "right" ? w(t) : I(t);
  e.text(i, a, t.y, m.micro, h.tertiary, s, "top"), e.text(n, a, t.y + 12, r.style ?? m.numeral, r.gray ?? h.primary, s, "top");
}
function Ce(e, t, i, n, r = {}) {
  const s = T(t);
  if (e.text(i, t.x, s, m.caption, h.secondary, "left", "middle"), e.text(n, w(t), s, m.numeral, r.gray ?? h.primary, "right", "middle"), r.leader) {
    const a = e.measure(i, m.caption), o = e.measure(n, m.numeral), c = t.x + a + 5, l = w(t) - o - 5;
    l > c && e.line(c, s + 2, l, s + 2, { stroke: h.hairline, width: 1, dash: [1, 3], cap: "butt" });
  }
}
function He(e, t, i) {
  i.selected && (v(e) ? (e.roundRect({ x: t.x, y: t.y + 2, width: 2.5, height: t.height - 4 }, 1.5, { fill: h.max }), e.roundRect(t, A.md, { stroke: h.hairline, width: 1 })) : e.roundRect(t, A.md, { fill: h.raised }));
  const n = T(t);
  let r = t.x + O.md;
  i.checked !== void 0 && (R(e, i.checked ? "check-square" : "square", r + 7, n, 15, i.checked ? h.max : h.disabled), r += 24), i.icon && (R(e, i.icon, r + 8, n, 16, i.selected ? h.max : h.strong), r += 26);
  const s = w(t) - O.md - (i.chevron ? 14 : 0), a = i.value ? e.measure(i.value, m.numeral) + 10 : 0, o = s - r - a;
  i.subtitle ? (e.textBox(i.title, { x: r, y: n - 15, width: o, height: 16 }, m.bodyStrong, i.selected ? h.max : h.primary, { wrap: !1, vAlign: "middle" }), e.textBox(i.subtitle, { x: r, y: n + 1, width: o, height: 14 }, m.caption, h.tertiary, { wrap: !1, vAlign: "middle" })) : e.textBox(i.title, { x: r, y: t.y, width: o, height: t.height }, m.body, i.selected ? h.max : h.primary, { wrap: !1, vAlign: "middle" }), i.value && e.text(i.value, s, n, m.numeral, i.selected ? h.max : h.secondary, "right", "middle"), i.chevron && R(e, "chevron-right", w(t) - O.md, n, 12, h.disabled);
}
function Ve(e, t, i, n = {}) {
  const r = Z(i, 0, 1), s = n.radius ?? t.height / 2;
  if (n.track !== void 0 ? e.roundRect(t, s, { fill: n.track }) : v(e) ? e.roundRect(t, s, { stroke: h.hairline, width: 1 }) : e.roundRect(t, s, { fill: h.sunken }), n.ticks)
    for (let a = 1; a < n.ticks; a++) e.vline(t.x + t.width * a / n.ticks, t.y, H(t), h.off);
  r > 5e-3 && e.roundRect({ ...t, width: Math.max(t.height, t.width * r) }, s, { fill: n.fill ?? h.max });
}
function pe(e, t, i, n, r = {}) {
  const s = r.gap ?? 3, a = (t.width - s * (i - 1)) / i;
  for (let o = 0; o < i; o++) {
    const c = { x: t.x + o * (a + s), y: t.y, width: a, height: t.height }, l = Math.min(2, t.height / 2);
    o < n ? e.roundRect(c, l, { fill: r.fill ?? h.max }) : v(e) && r.track === void 0 ? e.roundRect(c, l, { stroke: h.hairline, width: 1 }) : e.roundRect(c, l, { fill: r.track ?? h.sunken });
  }
}
function kt(e, t, i, n, r = {}) {
  const s = r.width ?? 22, a = r.height ?? 11, o = Z(n, 0, 1);
  e.roundRect({ x: t, y: i - a / 2, width: s, height: a }, 2.5, { stroke: r.gray ?? h.secondary, width: 1 }), e.roundRect({ x: t + s + 1, y: i - 2.5, width: 2, height: 5 }, 1, { fill: r.gray ?? h.secondary });
  const c = s - 4;
  o > 0.02 && e.roundRect({ x: t + 2, y: i - a / 2 + 2, width: Math.max(1.5, c * o), height: a - 4 }, 1, { fill: o < 0.15 ? h.strong : h.max });
}
function vt(e, t, i, n, r = 4, s = {}) {
  const a = s.height ?? 11;
  for (let o = 0; o < r; o++) {
    const c = (o + 1) / r * a;
    e.rect({ x: t + o * 4, y: i + a / 2 - c, width: 2.5, height: c }, { fill: o < n ? h.max : h.hairline });
  }
}
function ke(e, t, i = {}) {
  const n = T(t);
  i.title && e.text(i.title, t.x, n, m.label, h.secondary, "left", "middle");
  let r = w(t);
  i.battery !== void 0 && (kt(e, r - 24, n, i.battery), r -= 34), i.signal !== void 0 && (vt(e, r - 14, n, i.signal), r -= 24);
  for (const s of i.icons ?? [])
    R(e, s, r - 7, n, 13, h.secondary), r -= 18;
  i.time && e.text(i.time, r - 4, n, m.numeral, h.primary, "right", "middle");
}
function ve(e, t, i, n, r) {
  const a = t - (n - 1) * 9 / 2;
  for (let o = 0; o < n; o++)
    o === r ? e.circle(a + o * 9, i, 2.6, { fill: h.max }) : e.circle(a + o * 9, i, 2.2, { fill: h.border });
}
function be(e, t, i, n) {
  const r = t.width / i.length;
  i.forEach((s, a) => {
    const o = t.x + a * r + r / 2, c = a === n;
    e.text(s, o, T(t) - 2, m.micro, c ? h.max : h.disabled, "center", "middle"), c && e.roundRect({ x: o - 12, y: H(t) - 4, width: 24, height: 2 }, 1, { fill: h.max });
  });
}
function Oe(e, t, i, n, r) {
  if (r <= n) return;
  v(e) || e.roundRect(t, t.width / 2, { fill: h.sunken });
  const s = Math.max(10, n / r * t.height), a = t.y + i / r * t.height;
  e.roundRect({ x: t.x, y: Math.min(a, H(t) - s), width: t.width, height: s }, t.width / 2, { fill: h.border });
}
function Ze(e, t, i, n, r = {}) {
  const s = r.style ?? m.micro, a = r.height ?? 17, o = r.icon ? 14 : 0, c = e.measure(n, s) + 16 + o, l = { x: t, y: i - a / 2, width: c, height: a };
  return r.fill !== void 0 ? e.roundRect(l, a / 2, { fill: r.fill }) : v(e) ? e.roundRect(l, a / 2, { stroke: h.border, width: 1 }) : e.roundRect(l, a / 2, { fill: h.raised }), r.icon && R(e, r.icon, t + 12, i, 11, r.gray ?? h.secondary), e.text(n, t + 8 + o, i, s, r.gray ?? h.primary, "left", "middle"), c;
}
function Re(e, t, i, n, r = {}) {
  const s = r.height ?? 16, a = e.measure(n, m.micro) + 14;
  return e.roundRect({ x: t, y: i - s / 2, width: a, height: s }, A.xs, { stroke: r.gray ?? h.border, width: 1 }), e.text(n, t + a / 2, i, m.micro, r.gray ?? h.secondary, "center", "middle"), a;
}
function Te(e, t, i, n) {
  if (n === void 0) {
    e.circle(t, i, 3, { fill: h.max });
    return;
  }
  const r = n > 99 ? "99+" : String(n), s = Math.max(15, e.measure(r, m.micro) + 9);
  e.roundRect({ x: t - s / 2, y: i - 7.5, width: s, height: 15 }, 7.5, { fill: h.max }), e.text(r, t, i, { ...m.micro, size: 9 }, h.off, "center", "middle");
}
function Ee(e, t, i, n = {}) {
  const r = v(e), s = r ? void 0 : n.primary ? h.max : h.raised, a = r ? n.primary ? h.max : h.secondary : n.primary ? h.off : h.primary;
  s !== void 0 && e.roundRect(t, A.md, { fill: s }), r && e.roundRect(t, A.md, { stroke: n.primary ? h.max : h.border, width: n.primary ? 1.5 : 1 }), n.focused && e.roundRect(B(t, -2.5), A.md + 2, { stroke: h.max, width: 1.5 });
  const o = n.icon ? 18 : 0, c = e.measure(i, m.bodyStrong), l = I(t) - (c + o) / 2;
  n.icon && R(e, n.icon, l + 7, T(t), 14, a), e.text(i, l + o, T(t), m.bodyStrong, a, "left", "middle");
}
function Ae(e, t, i, n, r = 32) {
  const s = r * 0.56;
  v(e) ? (e.roundRect({ x: t, y: i - s / 2, width: r, height: s }, s / 2, { stroke: n ? h.max : h.border, width: 1 }), e.circle(n ? t + r - s / 2 : t + s / 2, i, s / 2 - 3, { fill: n ? h.max : h.disabled })) : (e.roundRect({ x: t, y: i - s / 2, width: r, height: s }, s / 2, { fill: n ? h.max : h.border }), e.circle(n ? t + r - s / 2 : t + s / 2, i, s / 2 - 2.5, { fill: n ? h.off : h.surface }));
}
function Se(e, t, i, n = {}) {
  e.scoped((r) => {
    v(e) || r.roundRect(t, A.pill, { fill: h.raised, alpha: n.alpha ?? 1 }), r.roundRect(t, A.pill, { stroke: h.border, width: 1, alpha: n.alpha ?? 1 });
    let s = t.x + 16;
    n.icon && (R(r, n.icon, s + 7, T(t), 14, h.max), s += 24), r.text(i, s, T(t), m.body, h.primary, "left", "middle");
  });
}
function Ie(e, t, i, n, r) {
  const s = T(t) - (r ? 10 : 4);
  R(e, i, I(t), s - 18, 30, h.disabled), e.text(n, I(t), s + 10, m.title, h.secondary, "center", "middle"), r && e.textBox(r, { x: t.x + 40, y: s + 22, width: t.width - 80, height: 32 }, m.caption, h.tertiary, { hAlign: "center" });
}
function Ge(e, t, i = 0.5) {
  e.rect(t, { fill: h.off, alpha: i });
}
function Pe(e, t, i, n, r, s = {}) {
  if (e.circle(t, i, n, { stroke: h.border, width: 1 }), s.ticks !== !1)
    for (let o = 0; o < 360; o += 15) {
      const c = q(o - r), l = o % 45 === 0, f = E(t, i, n - (l ? 7 : 4), c), u = E(t, i, n - 1, c);
      e.line(f.x, f.y, u.x, u.y, { stroke: l ? h.secondary : h.hairline, width: l ? 1.5 : 1, cap: "butt" });
    }
  const a = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  for (const [o, c] of a) {
    const l = E(t, i, n - 16, q(c - r));
    e.text(o, l.x, l.y, o === "N" ? m.bodyStrong : m.caption, o === "N" ? h.max : h.secondary, "center", "middle");
  }
  if (s.pointer !== void 0) {
    const o = q(s.pointer - r), c = E(t, i, n - 22, o), l = E(t, i, n - 33, o - 0.16), f = E(t, i, n - 33, o + 0.16);
    if (e.polygon([c, l, f], { fill: h.strong }), s.pointerLabel) {
      const u = E(t, i, n - 40, o);
      e.text(s.pointerLabel, u.x, u.y, m.micro, h.tertiary, "center", "middle");
    }
  }
  e.polygon(
    [{ x: t, y: i - n + 2 }, { x: t - 5, y: i - n - 7 }, { x: t + 5, y: i - n - 7 }],
    { fill: h.max }
  ), s.showValue !== !1 && e.text(`${Math.round(r).toString().padStart(3, "0")}°`, t, i, m.numeralLg, h.max, "center", "middle");
}
function ze(e, t, i, n, r, s) {
  e.scoped((a) => {
    a.clipCircle(t, i, n), a.rotateAbout(t, i, -s * Math.PI / 180);
    const o = i + r * 2, c = { x: t - n * 2, y: o, width: n * 4, height: n * 2 };
    v(e) || a.rect(c, { fill: h.sunken }), a.hatch(c, 5, v(e) ? h.hairline : h.border), a.hline(t - n * 1.4, t + n * 1.4, o, h.max, 1.5);
    for (const l of [-20, -10, 10, 20]) {
      const f = o - l * 2, u = l % 20 === 0 ? 16 : 9;
      a.hline(t - u, t + u, f, h.disabled);
    }
  }), e.line(t - n * 0.5, i, t - n * 0.15, i, { stroke: h.max, width: 2 }), e.line(t + n * 0.15, i, t + n * 0.5, i, { stroke: h.max, width: 2 }), e.circle(t, i, 2, { fill: h.max }), e.circle(t, i, n, { stroke: h.border, width: 1.5 });
}
function Fe(e, t, i, n, r, s, a = "kn") {
  e.circle(t, i, n, { stroke: h.hairline, width: 1, dash: [2, 3] });
  const o = q(r + 180), c = E(t, i, n, o), l = E(t, i, -n * 0.75, o);
  e.line(l.x, l.y, c.x, c.y, { stroke: h.strong, width: 2 });
  const f = E(c.x, c.y, n * 0.35, o + 2.5), u = E(c.x, c.y, n * 0.35, o - 2.5);
  e.polygon([c, f, u], { fill: h.max }), e.circle(t, i, n * 0.46, { fill: h.off }), e.text(String(s), t, i - 3, m.numeral, h.max, "center", "middle"), e.text(a, t, i + 8, { ...m.micro, size: 8 }, h.tertiary, "center", "middle");
}
function $e(e, t, i, n, r, s = !1) {
  s && e.circle(t, i, n + 4, { stroke: h.strong, width: 1.5, dash: [3, 4] }), v(e) ? e.circle(t, i, n - 1.75, { stroke: h.max, width: 3.5 }) : (e.circle(t, i, n, { fill: h.max }), e.circle(t, i, n - 3.5, { fill: h.off })), e.text(String(r), t, i + 1, { ...m.numeralLg, size: n * 1.05 }, h.max, "center", "middle");
}
function Be(e, t, i, n, r) {
  R(e, r === "left" ? "corner-left" : r === "right" ? "corner-right" : r === "uturn" ? "u-turn" : r === "slight-left" ? "arrow-up-left" : r === "slight-right" ? "arrow-up-right" : "arrow-up", t, i, n, h.max, { width: Math.max(2, n / 12) });
}
class We {
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
    const { cols: i, rows: n, cell: r, width: s } = this, a = new Uint8Array(i * n), o = this.previous;
    for (let l = 0; l < this.height; l++) {
      const f = l * s, u = (l / r | 0) * i;
      for (let L = 0; L < s; L++)
        o[f + L] !== t[f + L] && (a[u + (L / r | 0)] = 1);
    }
    const c = new Int32Array((i + 1) * (n + 1));
    for (let l = 0; l < n; l++) {
      let f = 0;
      for (let u = 0; u < i; u++)
        f += a[l * i + u], c[(l + 1) * (i + 1) + (u + 1)] = c[l * (i + 1) + (u + 1)] + f;
    }
    this.integrals.push(c), this.previous.set(t);
  }
  reset() {
    this.previous = null, this.integrals = [];
  }
  /** How many recorded transitions touched this rectangle. */
  dirtyCount(t) {
    const i = Math.max(0, Math.floor(t.x / this.cell)), n = Math.max(0, Math.floor(t.y / this.cell)), r = Math.min(this.cols, Math.ceil((t.x + t.width) / this.cell)), s = Math.min(this.rows, Math.ceil((t.y + t.height) / this.cell));
    if (r <= i || s <= n) return 0;
    const a = this.cols + 1;
    let o = 0;
    for (const c of this.integrals)
      c[s * a + r] - c[n * a + r] - c[s * a + i] + c[n * a + i] > 0 && o++;
    return o;
  }
  /** Cost of one candidate tiling, in Gray4 bytes across every transition. */
  cost(t) {
    let i = 0, n = 0;
    for (const r of t.tiles) {
      const s = this.dirtyCount(r);
      n += s, i += s * (r.width * r.height >> 1);
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
    const i = t.step ?? 16, n = t.minTile ?? 32, r = Math.min(t.tiles ?? X, X);
    if (i % 2 !== 0) throw new Error("Glyph: search step must be even — Gray4 needs even tile widths.");
    const s = /* @__PURE__ */ new Map(), a = (d) => {
      const C = ((d.x * 577 + d.y) * 577 + d.w) * 289 + d.h, V = s.get(C);
      if (V !== void 0) return V;
      const y = this.dirtyCount({ x: d.x, y: d.y, width: d.w, height: d.h }) * (d.w * d.h >> 1);
      return s.set(C, y), y;
    }, o = { cost: 1 / 0, boxes: null }, c = [], l = (d, C, V) => {
      if (!(V >= o.cost)) {
        if (C === 1) {
          const y = V + a(d);
          y < o.cost && (o.cost = y, o.boxes = [...c, d]);
          return;
        }
        for (let y = i; y <= d.w - i; y += i) {
          if (y < n || d.w - y < n) continue;
          const M = { x: d.x, y: d.y, w: y, h: d.h }, p = { x: d.x + y, y: d.y, w: d.w - y, h: d.h };
          for (let g = 1; g < C; g++) f(M, g, p, C - g, V);
        }
        for (let y = i; y <= d.h - i; y += i) {
          if (y < n || d.h - y < n) continue;
          const M = { x: d.x, y: d.y, w: d.w, h: y }, p = { x: d.x, y: d.y + y, w: d.w, h: d.h - y };
          for (let g = 1; g < C; g++) f(M, g, p, C - g, V);
        }
      }
    }, f = (d, C, V, y, M) => {
      if (C === 1) {
        const p = M + a(d);
        if (p >= o.cost) return;
        c.push(d), l(V, y, p), c.pop();
        return;
      }
      u(d, C, M, (p, g) => {
        if (g >= o.cost) return;
        const k = c.length;
        c.push(...p), l(V, y, g), c.length = k;
      });
    }, u = (d, C, V, y) => {
      if (C === 1) {
        y([d], V + a(d));
        return;
      }
      for (let M = i; M <= d.w - i; M += i) {
        if (M < n || d.w - M < n) continue;
        const p = { x: d.x, y: d.y, w: M, h: d.h }, g = { x: d.x + M, y: d.y, w: d.w - M, h: d.h };
        for (let k = 1; k < C; k++)
          u(p, k, V, (P, G) => u(g, C - k, G, (F, W) => y([...P, ...F], W)));
      }
      for (let M = i; M <= d.h - i; M += i) {
        if (M < n || d.h - M < n) continue;
        const p = { x: d.x, y: d.y, w: d.w, h: M }, g = { x: d.x, y: d.y + M, w: d.w, h: d.h - M };
        for (let k = 1; k < C; k++)
          u(p, k, V, (P, G) => u(g, C - k, G, (F, W) => y([...P, ...F], W)));
      }
    };
    l({ x: 0, y: 0, w: this.width, h: this.height }, r, 0);
    const L = o.boxes;
    if (!L) throw new Error("Glyph: no valid tiling found — try a smaller step or a smaller minTile.");
    const x = bt(L, t.name ?? "measured"), b = ot(x, this.width, this.height);
    if (b.length) throw new Error(`Glyph: search produced an invalid layout:
  ${b.join(`
  `)}`);
    return this.cost(x);
  }
}
function bt(e, t) {
  const i = [...e].sort((s, a) => s.y - a.y || s.x - a.x), n = i.map((s, a) => ({
    id: 10 + a,
    name: `t${a}`,
    x: s.x,
    y: s.y,
    width: s.w,
    height: s.h,
    zOrder: a + 1
  })), r = i.map((s) => `${s.w}×${s.h}`).join(" + ");
  return { name: t, note: `measured — ${r}`, tiles: n };
}
function qe(e, t = "TILE_MEASURED") {
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
class Ne {
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
  diff = new ht();
  constructor(t) {
    if (t.screens.length === 0) throw new Error("Glyph: an app needs at least one screen.");
    this.screens = t.screens, this.frame = new ct({
      width: $.width,
      height: $.height,
      supersample: t.supersample ?? 2,
      tileLayout: t.tileLayout ?? lt,
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
    const n = typeof t == "number" ? (t % this.screens.length + this.screens.length) % this.screens.length : this.screens.findIndex((s) => s.name === t);
    if (n < 0 || n === this.index) return;
    const r = i ?? (n > this.index ? 1 : -1);
    if (this.transitionMs > 0) {
      const s = this.ensureLayer("from");
      s.clear(0), s.drawRaster(this.frame.raster), this.ensureLayer("to"), this.transition = {
        tween: new it(0, this.transitionMs, et.inOutCubic).to(1, this.now),
        direction: r
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
    if (this.screen.onInput?.(t, this) === !0) {
      this.dirty = !0;
      return;
    }
    t.type === "tap" || t.type === "scroll-down" ? this.next() : t.type === "scroll-up" && this.previous(), this.dirty = !0;
  }
  /** Paint one frame now, regardless of the dirty flag. */
  paint() {
    const t = performance.now(), i = this.now, n = (o) => ({
      g: o,
      now: i,
      screen: { x: 0, y: 0, ...$ },
      safe: J,
      app: this
    });
    if (this.transition && this.fromLayer && this.toLayer) {
      const o = Z(this.transition.tween.valueAt(i), 0, 1), { direction: c } = this.transition;
      this.toLayer.clear(0), this.screen.render(n(this.toLayer));
      const l = this.frame.raster;
      l.clear(0), l.drawRaster(this.fromLayer, -c * $.width * o, 0), l.drawRaster(this.toLayer, c * $.width * (1 - o), 0), o >= 1 && (this.transition = null);
    } else
      this.frame.raster.clear(0), this.screen.render(n(this.frame.raster));
    const r = this.frame.toLevels(), s = this.frame.toFrame(r);
    this.lastDirtyTiles = this.diff.changed(s.tiles).length, this.onPaint?.(r, this), this.runtime?.isConnected && this.runtime.render(s).catch(() => {
    });
    const a = performance.now() - t;
    return this.onSlowFrame && a > this.interval && this.onSlowFrame({ screen: this.screen.name, ms: a, budgetMs: this.interval }, this), r;
  }
  tick = () => {
    if (!this.running) return;
    this.frameHandle = requestAnimationFrame(this.tick);
    const t = performance.now();
    if (t - this.lastPaint < this.interval) return;
    const i = this.screen.animated === !0 || this.transition !== null;
    if (!this.dirty && !i) return;
    const n = t - this.lastPaint;
    this.lastPaint = t, this.fps = this.fps === 0 ? 1e3 / n : this.fps * 0.9 + 1e3 / n * 0.1, this.dirty = !1, this.paint();
  };
  start() {
    this.running || (this.running = !0, this.started = performance.now(), this.lastPaint = performance.now() - this.interval, this.screen.onEnter?.(this), this.frameHandle = requestAnimationFrame(this.tick));
  }
  stop() {
    this.running = !1, this.frameHandle !== null && cancelAnimationFrame(this.frameHandle), this.frameHandle = null;
  }
  /** Stop and release every canvas this app owns. */
  dispose() {
    this.stop(), this.fromLayer?.dispose(), this.toLayer?.dispose(), this.fromLayer = null, this.toLayer = null, this.transition = null, this.frame.dispose();
  }
}
class je {
  constructor(t, i) {
    this.total = t, this.visible = i;
  }
  total;
  visible;
  index = 0;
  offset = 0;
  move(t) {
    this.index = Z(this.index + t, 0, Math.max(0, this.total - 1)), this.index < this.offset && (this.offset = this.index), this.index >= this.offset + this.visible && (this.offset = this.index - this.visible + 1);
  }
  setTotal(t) {
    this.total = t, this.index = Z(this.index, 0, Math.max(0, t - 1)), this.offset = Z(this.offset, 0, Math.max(0, t - this.visible));
  }
  /** Indices currently on screen. */
  window() {
    const t = [];
    for (let i = this.offset; i < Math.min(this.total, this.offset + this.visible); i++) t.push(i);
    return t;
  }
}
export {
  ie as AngleTween,
  _e as BAYER4,
  We as ChangeRecorder,
  je as Cursor,
  Ne as GlyphApp,
  ut as GlyphFont,
  mt as GlyphFontSet,
  ct as GlyphFrame,
  yt as GlyphPath,
  Xe as GlyphRaster,
  Qe as LEVELS,
  Ue as LEVEL_STEP,
  X as MAX_IMAGE_CONTAINERS,
  Ke as TILE_BANDS,
  Je as TILE_CHROME,
  t1 as TILE_COLUMNS,
  e1 as TILE_HERO,
  i1 as TILE_LAYOUTS,
  lt as TILE_QUADRANTS,
  ht as TileDiff,
  it as Tween,
  Mt as align,
  Wt as aspectFit,
  ze as attitudeIndicator,
  te as auto,
  Te as badge,
  le as barChart,
  kt as battery,
  q as bearingToAngle,
  H as bottom,
  ye as bulletChart,
  Ee as button,
  n1 as byteToGray,
  r1 as cachedMeasurer,
  It as center,
  I as centerX,
  T as centerY,
  _ as chartFrame,
  Z as clamp,
  s1 as clampGray,
  Ht as column,
  Kt as columnOf,
  Pe as compassRose,
  zt as contains,
  Yt as deg,
  a1 as ditherGray,
  ge as divider,
  et as ease,
  Ie as emptyState,
  dt as familyOf,
  U as fitStyle,
  Rt as fontMetrics,
  o1 as fontString,
  me as gaugeChart,
  h as gray,
  h1 as grayToByte,
  c1 as grayToCss,
  l1 as grayToRgba,
  jt as grid,
  Jt as grow,
  se as hasIcon,
  f1 as hashBytes,
  Me as heatStrip,
  R as icon,
  oe as iconFilled,
  ae as iconNames,
  N as iconPaths,
  gt as inkBudget,
  B as inset,
  Et as insets,
  $t as intersection,
  Ft as intersects,
  v as isOutline,
  Ce as keyValue,
  qe as layoutToSource,
  d1 as leadingOf,
  At as left,
  Xt as lerp,
  he as lineChart,
  He as listRow,
  Zt as loadFontSet,
  Be as maneuverArrow,
  Le as metric,
  Lt as minContrast,
  u1 as mixGray,
  Pt as offset,
  Gt as outset,
  m1 as packGray4,
  ve as pageDots,
  pt as panel,
  wt as parsePath,
  Ze as pill,
  E as polar,
  at as prepare,
  Ve as progressBar,
  ne as pulse,
  _t as rad,
  A as radius,
  fe as rankChart,
  Tt as rect,
  re as registerIcon,
  z as remap,
  w as right,
  ue as ringChart,
  Ct as row,
  Ut as rowOf,
  J as safe,
  de as scatterChart,
  $ as screen,
  Ge as scrim,
  Oe as scrollbar,
  we as section,
  pe as segmentedBar,
  vt as signalBars,
  Dt as snap,
  O as space,
  ce as sparkline,
  $e as speedLimit,
  qt as splitH,
  Nt as splitV,
  ee as stack,
  xe as stat,
  ke as statusBar,
  M1 as styleKey,
  be as tabBar,
  Re as tag,
  Qt as theme,
  Se as toast,
  Ae as toggle,
  St as top,
  K as truncate,
  m as type,
  Bt as union,
  st as unpackGray4,
  ot as validateLayout,
  Fe as windIndicator,
  y1 as wrap,
  w1 as wrapClamped
};
