/** Easing curves, all mapping 0..1 to 0..1. */
export declare const ease: {
    linear: (t: number) => number;
    inQuad: (t: number) => number;
    outQuad: (t: number) => number;
    inOutQuad: (t: number) => number;
    inCubic: (t: number) => number;
    outCubic: (t: number) => number;
    inOutCubic: (t: number) => number;
    outBack: (t: number) => number;
    outElastic: (t: number) => number;
    outBounce: (t: number) => number;
};
export type Easing = (t: number) => number;
/**
 * A value that animates toward a target over time.
 * Deliberately pull-based: you ask for the value during a paint, rather than
 * having the tween push frames at you. Nothing animates unless something draws.
 */
export declare class Tween {
    private startValue;
    private targetValue;
    private startedAt;
    private duration;
    private easing;
    constructor(value: number, duration?: number, easing?: Easing);
    /** Animate toward a new target from wherever the value currently is. */
    to(target: number, now: number, duration?: number): this;
    /** Jump immediately, with no animation. */
    set(value: number): this;
    valueAt(now: number): number;
    isSettled(now: number): boolean;
    get target(): number;
}
/** Angular tween that always takes the short way round a circle. */
export declare class AngleTween extends Tween {
    toBearing(target: number, now: number, duration?: number): this;
}
/** 0..1 triangle wave — for pulsing emphasis without a state machine. */
export declare function pulse(now: number, period?: number): number;
