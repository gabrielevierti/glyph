import { waitForEvenAppBridge as y, ImageContainerProperty as w, TextContainerProperty as b, CreateStartUpPageContainer as v, StartUpPageCreateResult as p, ImageRawDataUpdate as T, ImageRawDataUpdateResult as f } from "@evenrealities/even_hub_sdk";
import { T as x, a as E, v as S, M as C, u as D } from "./frame-CT1__Sfi.js";
const c = { scrollUp: 1, scrollDown: 2, doubleTap: 3 };
function I(r, t, n) {
  return new Promise((s, i) => {
    const e = setTimeout(() => i(new Error(n)), t);
    r.then(
      (a) => {
        clearTimeout(e), s(a);
      },
      (a) => {
        clearTimeout(e), i(a);
      }
    );
  });
}
function m(r, t) {
  if (r.length === 0) return 0;
  const n = Math.min(r.length - 1, Math.floor((r.length - 1) * t));
  return r[n];
}
class U {
  tileLayout;
  bridge = null;
  started = !1;
  diff = new x();
  listener = null;
  onState;
  debug;
  timeoutMs;
  diffing;
  makeCanvas;
  pending = null;
  draining = null;
  encoders = /* @__PURE__ */ new Map();
  durations = [];
  sampleStart = 0;
  counters = { sent: 0, dropped: 0, bytes: 0 };
  /** Tiles sent on the most recent flush — useful for a stats readout. */
  lastTilesSent = 0;
  constructor(t = {}) {
    this.tileLayout = t.tileLayout ?? E;
    const n = S(this.tileLayout);
    if (n.length > 0)
      throw new Error(`Glyph: invalid tile layout "${this.tileLayout.name}":
  ${n.join(`
  `)}`);
    this.debug = t.debug ?? !1, this.timeoutMs = t.timeoutMs ?? 12e3, this.diffing = !t.disableDiffing, this.makeCanvas = t.createCanvas ?? ((s, i) => {
      const e = document.createElement("canvas");
      return e.width = s, e.height = i, e;
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
  async start() {
    if (this.started) return;
    this.emit({ connected: !1, message: "Waiting for Even Hub bridge…" });
    try {
      this.bridge = await I(y(), this.timeoutMs, "Bridge timeout");
    } catch (e) {
      const a = `No G2 bridge available (${e instanceof Error ? e.message : e})`;
      throw this.emit({ connected: !1, message: a }), new Error(a);
    }
    const t = this.tileLayout.tiles.map((e) => new w({
      xPosition: e.x,
      yPosition: e.y,
      width: e.width,
      height: e.height,
      containerID: e.id,
      containerName: e.name,
      zOrderIndex: e.zOrder
    })), n = t.reduce((e, a) => Math.max(e, a.zOrderIndex ?? 0), 0), s = new b({
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
      zOrderIndex: n + 1
    }), i = await this.bridge.createStartUpPageContainer(
      new v({
        containerTotalNum: t.length + 1,
        textObject: [s],
        imageObject: t
      })
    );
    if (i !== p.success) {
      const e = `createStartUpPageContainer failed: ${p[i] ?? i}. Sent ${t.length} image containers (hardware limit is ${C}) plus one event layer.`;
      throw this.emit({ connected: !1, message: e }), new Error(e);
    }
    this.started = !0, this.diff.reset(), this.resetStats(), this.emit({ connected: !0, message: `Connected · ${t.length} tiles` });
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
    const n = this.diffing ? this.diff.peek(t.tiles) : t.tiles;
    if (n.length === 0) {
      this.lastTilesSent = 0;
      return;
    }
    const s = n.map((i) => ({ tile: i, pixels: Uint8Array.from(i.pixels) }));
    if (this.pending && (this.counters.dropped += this.pending.length), this.pending = s, !this.draining) {
      const i = this.drain();
      this.draining = i, i.catch(() => {
      }).finally(() => {
        this.draining === i && (this.draining = null);
      });
    }
    await this.draining;
  }
  async drain() {
    for (; this.pending; ) {
      const t = this.pending;
      this.pending = null, this.lastTilesSent = t.length;
      for (const { tile: n, pixels: s } of t) {
        if (!this.bridge || !this.started) return;
        const i = d();
        try {
          const e = await this.encodeTile(s, n.rect.width, n.rect.height), a = await this.bridge.updateImageRawData(
            new T({ containerID: n.id, containerName: n.name, imageData: e })
          );
          a === f.success ? (this.diff.accept(n), this.counters.sent++, this.counters.bytes += s.length) : (this.diff.reject(n), this.debug && console.warn(`Glyph: tile ${n.name} update failed (${f[a] ?? a})`));
        } catch (e) {
          this.diff.reject(n), this.debug && console.warn(`Glyph: tile ${n.name} threw`, e);
        } finally {
          this.record(d() - i);
        }
      }
    }
  }
  // ── stats ────────────────────────────────────────────────────────────────
  record(t) {
    this.durations.push(t), this.durations.length > 256 && this.durations.shift();
  }
  resetStats() {
    this.durations = [], this.counters = { sent: 0, dropped: 0, bytes: 0 }, this.sampleStart = d();
  }
  get stats() {
    const t = [...this.durations].sort((s, i) => s - i), n = Math.max(1, d() - this.sampleStart) / 1e3;
    return {
      sent: this.counters.sent,
      dropped: this.counters.dropped,
      bytes: this.counters.bytes,
      p50: m(t, 0.5),
      p95: m(t, 0.95),
      last: this.durations[this.durations.length - 1] ?? 0,
      rate: this.counters.sent / n
    };
  }
  // ── input ────────────────────────────────────────────────────────────────
  onInput(t) {
    if (!this.bridge) throw new Error("Glyph: call start() before onInput().");
    this.listener?.();
    const n = this.bridge.onEvenHubEvent((s) => {
      const i = s.sysEvent, e = s.textEvent;
      i && (i.eventType === c.doubleTap ? t({ type: "double-tap" }) : i.eventType === c.scrollUp ? t({ type: "scroll-up" }) : i.eventType === c.scrollDown ? t({ type: "scroll-down" }) : t({ type: "tap" })), e && (e.eventType === c.scrollUp ? t({ type: "scroll-up" }) : e.eventType === c.scrollDown && t({ type: "scroll-down" }));
    });
    return this.listener = n, n;
  }
  async stop() {
    this.listener?.(), this.listener = null, this.bridge = null, this.started = !1, this.pending = null, this.draining = null, this.diff.reset();
    for (const t of this.encoders.values())
      t.width = 0, t.height = 0;
    this.encoders.clear(), this.emit({ connected: !1, message: "Disconnected" });
  }
  /**
   * Tiles are carried as PNG because that is what the image containers accept
   * today. The Gray4 packing upstream is not wasted work — it is the diffing
   * key and the wire format the moment raw uploads are exposed.
   *
   * The encoding canvas is cached per tile size. Allocating one per tile per
   * frame is four canvases twenty times a second, which the garbage collector
   * notices even if you do not.
   */
  async encodeTile(t, n, s) {
    const i = D(t, n, s), e = this.encoderFor(n, s), a = e.getContext("2d", { alpha: !1 });
    if (!a) throw new Error("Glyph: Canvas 2D unavailable for tile encoding.");
    const l = a.createImageData(n, s);
    for (let o = 0; o < i.length; o++) {
      const u = i[o] * 17, h = o * 4;
      l.data[h] = u, l.data[h + 1] = u, l.data[h + 2] = u, l.data[h + 3] = 255;
    }
    a.putImageData(l, 0, 0);
    const g = await new Promise((o) => e.toBlob(o, "image/png"));
    if (!g) throw new Error("Glyph: PNG encoding failed.");
    return new Uint8Array(await g.arrayBuffer());
  }
  encoderFor(t, n) {
    const s = `${t}x${n}`, i = this.encoders.get(s);
    if (i) return i;
    const e = this.makeCanvas(t, n);
    return e.width = t, e.height = n, this.encoders.set(s, e), e;
  }
}
function d() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
export {
  U as GlyphRuntime
};
