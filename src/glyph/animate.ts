/** Easing curves, all mapping 0..1 to 0..1. */
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outElastic: (t: number) =>
    t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1,
  outBounce: (t: number) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  }
};

export type Easing = (t: number) => number;

/**
 * A value that animates toward a target over time.
 * Deliberately pull-based: you ask for the value during a paint, rather than
 * having the tween push frames at you. Nothing animates unless something draws.
 */
export class Tween {
  private startValue: number;
  private targetValue: number;
  private startedAt = 0;
  private duration: number;
  private easing: Easing;

  constructor(value: number, duration = 300, easing: Easing = ease.outCubic) {
    this.startValue = value;
    this.targetValue = value;
    this.duration = duration;
    this.easing = easing;
  }

  /** Animate toward a new target from wherever the value currently is. */
  to(target: number, now: number, duration = this.duration): this {
    if (target === this.targetValue) return this;
    this.startValue = this.valueAt(now);
    this.targetValue = target;
    this.startedAt = now;
    this.duration = duration;
    return this;
  }

  /** Jump immediately, with no animation. */
  set(value: number): this {
    this.startValue = value;
    this.targetValue = value;
    this.duration = 0;
    return this;
  }

  valueAt(now: number): number {
    if (this.duration <= 0) return this.targetValue;
    const t = (now - this.startedAt) / this.duration;
    if (t >= 1) return this.targetValue;
    if (t <= 0) return this.startValue;
    return this.startValue + (this.targetValue - this.startValue) * this.easing(t);
  }

  isSettled(now: number): boolean {
    return this.duration <= 0 || now - this.startedAt >= this.duration;
  }

  get target(): number { return this.targetValue; }
}

/** Angular tween that always takes the short way round a circle. */
export class AngleTween extends Tween {
  toBearing(target: number, now: number, duration?: number): this {
    let delta = ((target - this.target) % 360 + 540) % 360 - 180;
    return this.to(this.target + delta, now, duration);
  }
}

/** 0..1 triangle wave — for pulsing emphasis without a state machine. */
export function pulse(now: number, period = 1000): number {
  const t = (now % period) / period;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}
