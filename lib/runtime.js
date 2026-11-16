import { waitForEvenAppBridge as b, ImageContainerProperty as v, TextContainerProperty as E, CreateStartUpPageContainer as x, StartUpPageCreateResult as m, ImageRawDataUpdate as S, ImageRawDataUpdateResult as y } from "@evenrealities/even_hub_sdk";
import { T, b as C, v as D, M as I } from "./chunks/frame.js";
const d = {
  click: 0,
  scrollUp: 1,
  scrollDown: 2,
  doubleTap: 3,
  foregroundEnter: 4,
  foregroundExit: 5
};
function P(l) {
  switch (l) {
    case void 0:
    case null:
    case d.click:
      return { type: "tap" };
    case d.scrollUp:
      return { type: "scroll-up" };
    case d.scrollDown:
      return { type: "scroll-down" };
    case d.doubleTap:
      return { type: "double-tap" };
    case d.foregroundEnter:
      return { type: "foreground-enter" };
    case d.foregroundExit:
      return { type: "foreground-exit" };
    default:
      return null;
  }
}
function B(l, t, n) {
  return new Promise((e, r) => {
    const i = setTimeout(() => r(new Error(n)), t);
    l.then(
      (a) => {
        clearTimeout(i), e(a);
      },
      (a) => {
        clearTimeout(i), r(a);
      }
    );
  });
}
function w(l, t) {
  if (l.length === 0) return 0;
  const n = Math.min(l.length - 1, Math.floor((l.length - 1) * t));
  return l[n];
}
class $ {
  tileLayout;
  bridge = null;
  suppliedBridge;
  started = !1;
  starting = null;
  diff = new T();
  listener = null;
  onState;
  debug;
  timeoutMs;
  diffing;
  makeCanvas;
  pending = null;
  draining = null;
  /** Tiles of the batch on the wire that have not been acknowledged yet. */
  inFlight = /* @__PURE__ */ new Set();
  /** Bumped by stop(), so a drain from a previous session cannot keep writing. */
  session = 0;
  encoders = /* @__PURE__ */ new Map();
  durations = [];
  sampleStart = 0;
  counters = { sent: 0, dropped: 0, bytes: 0, encodedBytes: 0 };
  /** Tiles sent on the most recent flush — useful for a stats readout. */
  lastTilesSent = 0;
  constructor(t = {}) {
    this.tileLayout = t.tileLayout ?? C;
    const n = D(this.tileLayout);
    if (n.length > 0)
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":
  ${n.join(`
  `)}`);
    this.debug = t.debug ?? !1, this.timeoutMs = t.timeoutMs ?? 12e3, this.diffing = !t.disableDiffing, this.suppliedBridge = t.bridge ?? null, this.makeCanvas = t.createCanvas ?? ((e, r) => {
      const i = document.createElement("canvas");
      return i.width = e, i.height = r, i;
    });
  }
  get isConnected() {
    return this.started;
  }
  setOnStateChange(t) {
    this.onState = t;
  }
  emit(t) {
    this.onState?.(t);
  }
  /** Connect and create the page. Safe to call twice: the second call joins the first. */
  start() {
    if (this.started) return Promise.resolve();
    if (!this.starting) {
      const t = this.connect().finally(() => {
        this.starting === t && (this.starting = null);
      });
      this.starting = t;
    }
    return this.starting;
  }
  async connect() {
    const t = this.session;
    this.emit({ connected: !1, message: "Waiting for Even Hub bridge…" });
    let n;
    try {
      n = this.suppliedBridge ?? await B(b(), this.timeoutMs, "Bridge timeout");
    } catch (s) {
      const o = `No G2 bridge available (${s instanceof Error ? s.message : s})`;
      throw this.emit({ connected: !1, message: o }), new Error(o);
    }
    if (t !== this.session) throw new Error("Glyph: runtime stopped while connecting.");
    const e = this.tileLayout.tiles.map((s) => new v({
      xPosition: s.x,
      yPosition: s.y,
      width: s.width,
      height: s.height,
      containerID: s.id,
      containerName: s.name,
      zOrderIndex: s.zOrder
    })), r = e.reduce((s, o) => Math.max(s, o.zOrderIndex ?? 0), 0), i = new E({
      xPosition: 0,
      yPosition: 0,
      width: 576,
      height: 288,
      borderWidth: 0,
      paddingLength: 0,
      containerID: 1,
      containerName: "events",
      content: "",
      isEventCapture: 1,
      zOrderIndex: r + 1
    }), a = await n.createStartUpPageContainer(
      new x({
        containerTotalNum: e.length + 1,
        textObject: [i],
        imageObject: e
      })
    );
    if (t !== this.session) throw new Error("Glyph: runtime stopped while connecting.");
    if (a !== m.success) {
      const s = `createStartUpPageContainer failed: ${m[a] ?? a}. Sent ${e.length} image containers (hardware limit is ${I}) plus one event layer.`;
      throw this.emit({ connected: !1, message: s }), new Error(s);
    }
    this.bridge = n, this.started = !0, this.diff.reset(), this.resetStats(), this.emit({ connected: !0, message: `Connected · ${e.length} tiles` });
  }
  /** Forget which tiles were sent, so the next render is a full repaint. */
  invalidate() {
    this.diff.reset();
  }
  /**
   * Queue a frame. Resolves once the transport has drained past it — but the
   * frame itself may have been superseded and never sent, which is the point.
   */
  async render(t) {
    if (!this.bridge || !this.started) return;
    const n = this.diffing ? t.tiles.filter((e) => this.inFlight.has(e.id) || this.diff.differs(e)) : t.tiles;
    if (this.pending && (this.counters.dropped += this.pending.length, this.pending = null), n.length === 0) {
      this.draining || (this.lastTilesSent = 0);
      return;
    }
    if (this.pending = n.map((e) => {
      const r = Uint8Array.from(e.pixels);
      return { tile: { ...e, pixels: r }, pixels: r };
    }), !this.draining) {
      const e = this.drain(this.session);
      this.draining = e, e.catch(() => {
      }).finally(() => {
        this.draining === e && (this.draining = null);
      });
    }
    await this.draining;
  }
  async drain(t) {
    const n = () => t === this.session && this.started && this.bridge !== null;
    for (; this.pending && n(); ) {
      const e = this.pending;
      this.pending = null, this.inFlight = new Set(e.map((i) => i.tile.id));
      let r = 0;
      for (const { tile: i, pixels: a } of e) {
        if (!n()) return;
        if (this.diffing && !this.diff.differs(i)) {
          this.inFlight.delete(i.id);
          continue;
        }
        const s = g();
        try {
          const o = await this.encodeTile(a, i.rect.width, i.rect.height);
          if (!n()) return;
          const h = await this.bridge.updateImageRawData(
            new S({ containerID: i.id, containerName: i.name, imageData: o })
          );
          if (!n()) return;
          h === y.success ? (this.diff.accept(i), r++, this.counters.sent++, this.counters.bytes += a.length, this.counters.encodedBytes += o.length) : (this.diff.reject(i), this.debug && console.warn(`Glyph: tile ${i.name} update failed (${y[h] ?? h})`));
        } catch (o) {
          if (!n()) return;
          this.diff.reject(i), this.debug && console.warn(`Glyph: tile ${i.name} threw`, o);
        } finally {
          t === this.session && (this.inFlight.delete(i.id), this.record(g() - s));
        }
      }
      this.lastTilesSent = r;
    }
  }
  // ── stats ────────────────────────────────────────────────────────────────
  record(t) {
    this.durations.push(t), this.durations.length > 256 && this.durations.shift();
  }
  resetStats() {
    this.durations = [], this.counters = { sent: 0, dropped: 0, bytes: 0, encodedBytes: 0 }, this.sampleStart = g();
  }
  get stats() {
    const t = [...this.durations].sort((e, r) => e - r), n = Math.max(1, g() - this.sampleStart) / 1e3;
    return {
      sent: this.counters.sent,
      dropped: this.counters.dropped,
      bytes: this.counters.bytes,
      encodedBytes: this.counters.encodedBytes,
      p50: w(t, 0.5),
      p95: w(t, 0.95),
      last: this.durations[this.durations.length - 1] ?? 0,
      rate: this.counters.sent / n
    };
  }
  // ── input ────────────────────────────────────────────────────────────────
  /**
   * Subscribe to input. Taps, double taps and scrolls arrive as they happen;
   * `foreground-enter` also forgets what was sent, because a page that was
   * away may not be showing what it showed when it left.
   */
  onInput(t) {
    if (!this.bridge) throw new Error("Glyph: call start() before onInput().");
    this.listener?.();
    const n = this.bridge.onEvenHubEvent((e) => {
      const r = e.sysEvent ?? e.textEvent ?? e.listEvent;
      if (!r) return;
      const i = P(r.eventType);
      i && (i.type === "foreground-enter" && this.invalidate(), t(i));
    });
    return this.listener = n, n;
  }
  async stop() {
    this.session++, this.listener?.(), this.listener = null, this.bridge = null, this.started = !1, this.starting = null, this.pending = null, this.draining = null, this.inFlight.clear(), this.diff.reset();
    for (const { canvas: t } of this.encoders.values())
      t.width = 0, t.height = 0;
    this.encoders.clear(), this.emit({ connected: !1, message: "Disconnected" });
  }
  /**
   * Tiles are carried as PNG because that is what the image containers accept
   * today. The Gray4 packing upstream is not wasted work — it is the diffing
   * key and the wire format the moment raw uploads are exposed.
   *
   * The encoding canvas and its ImageData are cached per tile size. Allocating
   * them per tile per frame is four canvases twenty times a second, which the
   * garbage collector notices even if you do not.
   */
  async encodeTile(t, n, e) {
    const { canvas: r, ctx: i, image: a } = this.encoderFor(n, e), s = a.data, o = n * e;
    for (let c = 0, u = 0; c < o; c++, u += 4) {
      const p = t[c >> 1], f = ((c & 1) === 0 ? p >> 4 : p & 15) * 17;
      s[u] = f, s[u + 1] = f, s[u + 2] = f, s[u + 3] = 255;
    }
    i.putImageData(a, 0, 0);
    const h = await new Promise((c) => r.toBlob(c, "image/png"));
    if (!h) throw new Error("Glyph: PNG encoding failed.");
    return new Uint8Array(await h.arrayBuffer());
  }
  encoderFor(t, n) {
    const e = `${t}x${n}`, r = this.encoders.get(e);
    if (r) return r;
    const i = this.makeCanvas(t, n);
    i.width = t, i.height = n;
    const a = i.getContext("2d", { alpha: !1 });
    if (!a) throw new Error("Glyph: Canvas 2D unavailable for tile encoding.");
    const s = { canvas: i, ctx: a, image: a.createImageData(t, n) };
    return this.encoders.set(e, s), s;
  }
}
function g() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
export {
  $ as GlyphRuntime,
  P as inputFromEventType
};
