import type { CanvasFactory, Frame, TileLayout } from "./types.js";
export type GlyphInputEvent = {
    type: "tap";
} | {
    type: "double-tap";
} | {
    type: "scroll-up";
} | {
    type: "scroll-down";
};
export interface RuntimeState {
    connected: boolean;
    message: string;
}
/**
 * What the transport actually cost.
 *
 * Bytes per second is a proxy. What caps your frame rate is the round trip for
 * one image-container update over BLE, and that number is not in any datasheet
 * — so measure it. `npm run bench` puts these on the glasses.
 */
export interface TransportStats {
    /** Tiles handed to the bridge since the last reset. */
    sent: number;
    /** Tiles that were superseded by a newer frame before they went out. */
    dropped: number;
    bytes: number;
    /** Per-tile round trip, milliseconds. */
    p50: number;
    p95: number;
    last: number;
    /** Tile updates per second, averaged over the sample window. */
    rate: number;
}
export interface GlyphRuntimeOptions {
    tileLayout?: TileLayout;
    debug?: boolean;
    /** How long to wait for the Even Hub bridge before giving up. */
    timeoutMs?: number;
    /** Send every tile every frame instead of only the changed ones. */
    disableDiffing?: boolean;
    createCanvas?: CanvasFactory;
}
/**
 * Transport. Turns resolved frames into image-container updates.
 *
 * Three things matter here.
 *
 * First, only tiles whose contents actually changed are sent — a clock screen
 * touches one tile a second, not four.
 *
 * Second, **the newest frame wins**. An earlier version of this queued every
 * render behind its predecessor, which is correct right up until the transport
 * is slower than the paint loop: then the queue grows without bound and the
 * glasses fall further behind forever, displaying frames from ten seconds ago.
 * A display has no use for a stale frame. At most one frame is ever waiting,
 * and a superseded one is counted rather than sent.
 *
 * Third, tile writes are serialised, so a slow frame cannot interleave with the
 * next one and tear.
 */
export declare class GlyphRuntime {
    readonly tileLayout: TileLayout;
    private bridge;
    private started;
    private diff;
    private listener;
    private onState?;
    private readonly debug;
    private readonly timeoutMs;
    private readonly diffing;
    private readonly makeCanvas;
    private pending;
    private draining;
    private encoders;
    private durations;
    private sampleStart;
    private counters;
    /** Tiles sent on the most recent flush — useful for a stats readout. */
    lastTilesSent: number;
    constructor(options?: GlyphRuntimeOptions);
    get isConnected(): boolean;
    setOnStateChange(cb: (state: RuntimeState) => void): void;
    private emit;
    start(): Promise<void>;
    /** Forget which tiles were sent, so the next render is a full repaint. */
    invalidate(): void;
    /**
     * Queue a frame. Resolves once the transport has drained past it — but the
     * frame itself may have been superseded and never sent, which is the point.
     */
    render(frame: Frame): Promise<void>;
    private drain;
    private record;
    resetStats(): void;
    get stats(): TransportStats;
    onInput(handler: (event: GlyphInputEvent) => void): () => void;
    stop(): Promise<void>;
    /**
     * Tiles are carried as PNG because that is what the image containers accept
     * today. The Gray4 packing upstream is not wasted work — it is the diffing
     * key and the wire format the moment raw uploads are exposed.
     *
     * The encoding canvas is cached per tile size. Allocating one per tile per
     * frame is four canvases twenty times a second, which the garbage collector
     * notices even if you do not.
     */
    private encodeTile;
    private encoderFor;
}
