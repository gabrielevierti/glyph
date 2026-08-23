import type { GlyphRaster } from "./raster";

export type GlyphIconName =
  | "arrow-up" | "arrow-down" | "arrow-left" | "arrow-right"
  | "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right"
  | "location" | "anchor" | "boat" | "wind" | "wave"
  | "warning" | "check" | "x" | "settings" | "plus" | "minus"
  | "clock" | "calendar" | "bell" | "battery" | "battery-half" | "battery-low"
  | "sun" | "cloud" | "rain" | "snow" | "thermometer"
  | "heart" | "heart-pulse" | "footprints" | "flame"
  | "music" | "play" | "pause" | "skip-forward" | "skip-back"
  | "map-pin" | "navigation" | "compass" | "route"
  | "train" | "bus" | "car" | "bike" | "walk"
  | "shopping-bag" | "list" | "check-square" | "square"
  | "user" | "users" | "message" | "mail" | "phone"
  | "wifi" | "bluetooth" | "signal" | "signal-low"
  | "eye" | "eye-off" | "lock" | "unlock"
  | "home" | "search" | "menu" | "more" | "trash";

export function icon(r: GlyphRaster, name: GlyphIconName, cx: number, cy: number, size = 24, gray = 15) {
  const s = size / 24;
  const x = cx - 12 * s;
  const y = cy - 12 * s;
  const p = (n: number) => x + n * s;
  const q = (n: number) => y + n * s;
  const w = Math.max(1, 1.8 * s);

  switch (name) {
    // ── Arrows ──
    case "arrow-up":
      r.line(p(12), q(21), p(12), q(4), gray, w);
      r.line(p(12), q(4), p(5), q(11), gray, w);
      r.line(p(12), q(4), p(19), q(11), gray, w);
      break;
    case "arrow-down":
      r.line(p(12), q(3), p(12), q(20), gray, w);
      r.line(p(12), q(20), p(5), q(13), gray, w);
      r.line(p(12), q(20), p(19), q(13), gray, w);
      break;
    case "arrow-left":
      r.line(p(21), q(12), p(4), q(12), gray, w);
      r.line(p(4), q(12), p(11), q(5), gray, w);
      r.line(p(4), q(12), p(11), q(19), gray, w);
      break;
    case "arrow-right":
      r.line(p(3), q(12), p(20), q(12), gray, w);
      r.line(p(20), q(12), p(13), q(5), gray, w);
      r.line(p(20), q(12), p(13), q(19), gray, w);
      break;

    // ── Chevrons ──
    case "chevron-up":
      r.line(p(6), q(15), p(12), q(9), gray, w);
      r.line(p(12), q(9), p(18), q(15), gray, w);
      break;
    case "chevron-down":
      r.line(p(6), q(9), p(12), q(15), gray, w);
      r.line(p(12), q(15), p(18), q(9), gray, w);
      break;
    case "chevron-left":
      r.line(p(15), q(6), p(9), q(12), gray, w);
      r.line(p(9), q(12), p(15), q(18), gray, w);
      break;
    case "chevron-right":
      r.line(p(9), q(6), p(15), q(12), gray, w);
      r.line(p(15), q(12), p(9), q(18), gray, w);
      break;

    // ── Location / Navigation ──
    case "location":
      r.circle(cx, q(9), 4, undefined, gray, w);
      r.polygon([{x:p(7),y:q(12)},{x:p(12),y:q(21)},{x:p(17),y:q(12)}], undefined, gray, w);
      break;
    case "map-pin":
      r.circle(cx, q(9), 4, undefined, gray, w);
      r.polygon([{x:p(7),y:q(12)},{x:p(12),y:q(21)},{x:p(17),y:q(12)}], undefined, gray, w);
      r.circle(cx, q(9), 1.5, gray);
      break;
    case "navigation":
      r.polygon([{x:p(12),y:q(3)},{x:p(21),y:q(18)},{x:p(12),y:q(15)},{x:p(3),y:q(18)}], gray);
      break;
    case "compass":
      r.circle(cx, cy, 10, undefined, gray, w);
      r.polygon([{x:p(12),y:q(5)},{x:p(16),y:q(14)},{x:p(12),y:q(12)},{x:p(8),y:q(14)}], gray);
      break;
    case "route":
      r.circle(p(6), q(6), 2, gray);
      r.circle(p(18), q(18), 2, gray);
      r.line(p(6), q(6), p(12), q(12), gray, w);
      r.line(p(12), q(12), p(18), q(18), gray, w);
      r.circle(p(12), q(12), 1.5, gray);
      break;

    // ── Transport ──
    case "train":
      r.roundRect(p(4), q(6), 16, 12, 3, undefined, gray, w);
      r.line(p(4), q(14), p(20), q(14), gray, w);
      r.line(p(8), q(18), p(8), q(21), gray, w);
      r.line(p(16), q(18), p(16), q(21), gray, w);
      r.line(p(6), q(21), p(18), q(21), gray, w);
      break;
    case "bus":
      r.roundRect(p(3), q(5), 18, 12, 3, undefined, gray, w);
      r.line(p(3), q(13), p(21), q(13), gray, w);
      r.circle(p(7), q(19), 2.5, undefined, gray, w);
      r.circle(p(17), q(19), 2.5, undefined, gray, w);
      break;
    case "car":
      r.roundRect(p(3), q(8), 18, 8, 3, undefined, gray, w);
      r.line(p(5), q(8), p(7), q(5), gray, w);
      r.line(p(17), q(8), p(15), q(5), gray, w);
      r.line(p(7), q(5), p(15), q(5), gray, w);
      r.circle(p(7), q(19), 2.5, undefined, gray, w);
      r.circle(p(17), q(19), 2.5, undefined, gray, w);
      break;
    case "bike":
      r.circle(p(6), q(16), 5, undefined, gray, w);
      r.circle(p(18), q(16), 5, undefined, gray, w);
      r.line(p(6), q(16), p(12), q(10), gray, w);
      r.line(p(12), q(10), p(18), q(16), gray, w);
      r.line(p(10), q(10), p(14), q(10), gray, w);
      break;
    case "walk":
      r.circle(p(12), q(5), 2.5, gray);
      r.line(p(12), q(8), p(12), q(14), gray, w);
      r.line(p(12), q(14), p(8), q(20), gray, w);
      r.line(p(12), q(14), p(16), q(20), gray, w);
      r.line(p(12), q(10), p(8), q(12), gray, w);
      r.line(p(12), q(10), p(16), q(12), gray, w);
      break;

    // ── Weather ──
    case "sun":
      r.circle(cx, cy, 5, undefined, gray, w);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        r.line(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, gray, w);
      }
      break;
    case "cloud":
      r.arc(p(12), q(14), 7, Math.PI, 0, gray, w);
      r.arc(p(7), q(14), 4, Math.PI, 0, gray, w);
      r.arc(p(17), q(14), 4, Math.PI, 0, gray, w);
      r.line(p(5), q(14), p(19), q(14), gray, w);
      break;
    case "rain":
      r.arc(p(12), q(12), 6, Math.PI, 0, gray, w);
      r.line(p(5), q(12), p(19), q(12), gray, w);
      r.line(p(8), q(16), p(7), q(20), gray, w);
      r.line(p(12), q(16), p(11), q(20), gray, w);
      r.line(p(16), q(16), p(15), q(20), gray, w);
      break;
    case "snow":
      r.arc(p(12), q(12), 6, Math.PI, 0, gray, w);
      r.line(p(5), q(12), p(19), q(12), gray, w);
      r.circle(p(8), q(17), 1, gray);
      r.circle(p(12), q(19), 1, gray);
      r.circle(p(16), q(17), 1, gray);
      break;
    case "thermometer":
      r.roundRect(p(10), q(4), 4, 14, 2, undefined, gray, w);
      r.circle(p(12), q(19), 4, gray);
      r.line(p(12), q(10), p(12), q(16), gray, w);
      break;

    // ── Health ──
    case "heart":
      r.polygon([
        {x:p(12),y:q(19)},{x:p(5),y:q(12)},{x:p(5),y:q(8)},
        {x:p(9),y:q(5)},{x:p(12),y:q(8)},{x:p(15),y:q(5)},{x:p(19),y:q(8)},{x:p(19),y:q(12)}
      ], gray);
      break;
    case "heart-pulse":
      r.polygon([
        {x:p(12),y:q(17)},{x:p(5),y:q(11)},{x:p(5),y:q(8)},
        {x:p(9),y:q(5)},{x:p(12),y:q(8)},{x:p(15),y:q(5)},{x:p(19),y:q(8)},{x:p(19),y:q(11)}
      ], gray);
      r.line(p(3), q(12), p(7), q(12), gray, w);
      r.line(p(7), q(12), p(9), q(8), gray, w);
      r.line(p(9), q(8), p(11), q(16), gray, w);
      r.line(p(11), q(16), p(13), q(10), gray, w);
      r.line(p(13), q(10), p(15), q(12), gray, w);
      r.line(p(15), q(12), p(21), q(12), gray, w);
      break;
    case "footprints":
      r.circle(p(9), q(10), 3, gray);
      r.circle(p(15), q(16), 3, gray);
      break;
    case "flame":
      r.polygon([
        {x:p(12),y:q(4)},{x:p(16),y:q(10)},{x:p(18),y:q(16)},
        {x:p(15),y:q(20)},{x:p(12),y:q(18)},{x:p(9),y:q(20)},{x:p(6),y:q(16)},{x:p(8),y:q(10)}
      ], gray);
      break;

    // ── Media ──
    case "music":
      r.line(p(16), q(5), p(16), q(15), gray, w);
      r.line(p(8), q(8), p(8), q(18), gray, w);
      r.line(p(8), q(8), p(16), q(5), gray, w);
      r.circle(p(6), q(19), 2.5, gray);
      r.circle(p(14), q(16), 2.5, gray);
      break;
    case "play":
      r.polygon([{x:p(6),y:q(5)},{x:p(19),y:q(12)},{x:p(6),y:q(19)}], gray);
      break;
    case "pause":
      r.line(p(9), q(5), p(9), q(19), gray, w);
      r.line(p(15), q(5), p(15), q(19), gray, w);
      break;
    case "skip-forward":
      r.polygon([{x:p(5),y:q(5)},{x:p(14),y:q(12)},{x:p(5),y:q(19)}], gray);
      r.line(p(16), q(5), p(16), q(19), gray, w);
      break;
    case "skip-back":
      r.polygon([{x:p(19),y:q(5)},{x:p(10),y:q(12)},{x:p(19),y:q(19)}], gray);
      r.line(p(8), q(5), p(8), q(19), gray, w);
      break;

    // ── System ──
    case "clock":
      r.circle(cx, cy, 10, undefined, gray, w);
      r.line(cx, cy, cx, cy - 6, gray, w);
      r.line(cx, cy, cx + 5, cy, gray, w);
      break;
    case "calendar":
      r.roundRect(p(4), q(6), 16, 14, 2, undefined, gray, w);
      r.line(p(4), q(10), p(20), q(10), gray, w);
      r.line(p(8), q(3), p(8), q(6), gray, w);
      r.line(p(16), q(3), p(16), q(6), gray, w);
      break;
    case "bell":
      r.polygon([{x:p(12),y:q(4)},{x:p(18),y:q(10)},{x:p(18),y:q(16)},{x:p(6),y:q(16)},{x:p(6),y:q(10)}], undefined, gray, w);
      r.line(p(10), q(16), p(9), q(19), gray, w);
      r.line(p(14), q(16), p(15), q(19), gray, w);
      r.line(p(9), q(19), p(15), q(19), gray, w);
      r.circle(p(12), q(6), 1.5, gray);
      break;
    case "battery":
      r.roundRect(p(4), q(6), 14, 10, 2, undefined, gray, w);
      r.fillRect(p(18), q(9), 2, 4, gray);
      r.roundRect(p(6), q(8), 10, 6, 1, gray);
      break;
    case "battery-half":
      r.roundRect(p(4), q(6), 14, 10, 2, undefined, gray, w);
      r.fillRect(p(18), q(9), 2, 4, gray);
      r.roundRect(p(6), q(8), 5, 6, 1, gray);
      break;
    case "battery-low":
      r.roundRect(p(4), q(6), 14, 10, 2, undefined, gray, w);
      r.fillRect(p(18), q(9), 2, 4, gray);
      r.roundRect(p(6), q(8), 3, 6, 1, gray);
      break;

    // ── Connectivity ──
    case "wifi":
      r.line(p(12), q(18), p(12), q(16), gray, w);
      r.arc(p(12), q(18), 4, Math.PI, 0, gray, w);
      r.arc(p(12), q(18), 7, Math.PI, 0, gray, w);
      r.arc(p(12), q(18), 10, Math.PI, 0, gray, w);
      break;
    case "bluetooth":
      r.polygon([{x:p(12),y:q(4)},{x:p(17),y:q(9)},{x:p(12),y:q(14)},{x:p(17),y:q(19)},{x:p(7),y:q(9)},{x:p(12),y:q(14)},{x:p(7),y:q(19)}], gray);
      break;
    case "signal":
      r.line(p(6), q(18), p(6), q(12), gray, w);
      r.line(p(10), q(18), p(10), q(8), gray, w);
      r.line(p(14), q(18), p(14), q(5), gray, w);
      r.line(p(18), q(18), p(18), q(3), gray, w);
      break;
    case "signal-low":
      r.line(p(6), q(18), p(6), q(14), gray, w);
      r.line(p(10), q(18), p(10), q(14), gray, w);
      r.line(p(14), q(18), p(14), q(14), gray, w);
      r.line(p(18), q(18), p(18), q(5), gray, w);
      break;

    // ── UI ──
    case "check":
      r.line(p(4), q(12), p(9), q(17), gray, w);
      r.line(p(9), q(17), p(20), q(6), gray, w);
      break;
    case "x":
      r.line(p(5), q(5), p(19), q(19), gray, w);
      r.line(p(19), q(5), p(5), q(19), gray, w);
      break;
    case "settings":
      r.circle(cx, cy, 5, undefined, gray, w);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        r.line(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, gray, w);
      }
      break;
    case "menu":
      r.line(p(4), q(7), p(20), q(7), gray, w);
      r.line(p(4), q(12), p(20), q(12), gray, w);
      r.line(p(4), q(17), p(20), q(17), gray, w);
      break;
    case "more":
      r.circle(p(8), q(12), 1.5, gray);
      r.circle(p(12), q(12), 1.5, gray);
      r.circle(p(16), q(12), 1.5, gray);
      break;
    case "search":
      r.circle(p(10), q(10), 6, undefined, gray, w);
      r.line(p(14), q(14), p(19), q(19), gray, w);
      break;
    case "home":
      r.polygon([{x:p(12),y:q(4)},{x:p(4),y:q(12)},{x:p(20),y:q(12)}], undefined, gray, w);
      r.line(p(7), q(12), p(7), q(20), gray, w);
      r.line(p(17), q(12), p(17), q(20), gray, w);
      r.line(p(7), q(20), p(17), q(20), gray, w);
      break;
    case "user":
      r.circle(p(12), q(8), 4, undefined, gray, w);
      r.arc(p(12), q(22), 7, Math.PI, 0, gray, w);
      break;
    case "users":
      r.circle(p(9), q(7), 3, undefined, gray, w);
      r.arc(p(9), q(20), 5, Math.PI, 0, gray, w);
      r.circle(p(16), q(7), 3, undefined, gray, w);
      r.arc(p(16), q(20), 5, Math.PI, 0, gray, w);
      break;
    case "message":
      r.roundRect(p(3), q(5), 18, 13, 3, undefined, gray, w);
      r.line(p(12), q(18), p(12), q(22), gray, w);
      r.line(p(8), q(22), p(16), q(22), gray, w);
      break;
    case "mail":
      r.roundRect(p(3), q(6), 18, 12, 2, undefined, gray, w);
      r.line(p(3), q(6), p(12), q(13), gray, w);
      r.line(p(21), q(6), p(12), q(13), gray, w);
      break;
    case "phone":
      r.roundRect(p(8), q(3), 8, 18, 4, undefined, gray, w);
      r.line(p(10), q(18), p(14), q(18), gray, w);
      break;

    // ── List / Todo ──
    case "list":
      r.line(p(4), q(7), p(20), q(7), gray, w);
      r.line(p(4), q(12), p(20), q(12), gray, w);
      r.line(p(4), q(17), p(20), q(17), gray, w);
      break;
    case "check-square":
      r.roundRect(p(4), q(4), 16, 16, 2, undefined, gray, w);
      r.line(p(8), q(12), p(11), q(15), gray, w);
      r.line(p(11), q(15), p(16), q(9), gray, w);
      break;
    case "square":
      r.roundRect(p(4), q(4), 16, 16, 2, undefined, gray, w);
      break;
    case "shopping-bag":
      r.roundRect(p(5), q(8), 14, 12, 2, undefined, gray, w);
      r.arc(p(12), q(8), 4, Math.PI, 0, gray, w);
      break;
    case "trash":
      r.line(p(8), q(4), p(16), q(4), gray, w);
      r.line(p(10), q(4), p(10), q(2), gray, w);
      r.line(p(14), q(4), p(14), q(2), gray, w);
      r.line(p(8), q(2), p(16), q(2), gray, w);
      r.roundRect(p(6), q(6), 12, 14, 1, undefined, gray, w);
      r.line(p(10), q(10), p(10), q(16), gray, w);
      r.line(p(14), q(10), p(14), q(16), gray, w);
      break;

    // ── Eye / Lock ──
    case "eye":
      r.arc(p(12), q(12), 8, 0, Math.PI, gray, w);
      r.arc(p(12), q(12), 8, Math.PI, Math.PI * 2, gray, w);
      r.circle(p(12), q(12), 3, undefined, gray, w);
      break;
    case "eye-off":
      r.arc(p(12), q(12), 8, 0, Math.PI, gray, w);
      r.line(p(5), q(5), p(19), q(19), gray, w);
      break;
    case "lock":
      r.roundRect(p(6), q(10), 12, 10, 2, undefined, gray, w);
      r.arc(p(12), q(10), 4, Math.PI, 0, gray, w);
      r.circle(p(12), q(15), 1.5, gray);
      break;
    case "unlock":
      r.roundRect(p(6), q(10), 12, 10, 2, undefined, gray, w);
      r.arc(p(12), q(10), 4, Math.PI * 0.7, 0, gray, w);
      r.circle(p(12), q(15), 1.5, gray);
      break;

    // ── Originals ──
    case "anchor":
      r.circle(cx, q(5), 2, undefined, gray, w);
      r.line(p(12), q(7), p(12), q(19), gray, w);
      r.line(p(7), q(12), p(17), q(12), gray, w);
      r.arc(cx, q(13), 8, 0.15, Math.PI - 0.15, gray, w);
      break;
    case "boat":
      r.polygon([{x:p(3),y:q(13)},{x:p(21),y:q(13)},{x:p(17),y:q(19)},{x:p(7),y:q(19)}], undefined, gray, w);
      r.line(p(12), q(13), p(12), q(4), gray, w);
      r.polygon([{x:p(13),y:q(5)},{x:p(19),y:q(11)},{x:p(13),y:q(11)}], undefined, gray, w);
      break;
    case "wind":
      r.arc(p(10), q(12), 8, -1.2, 1.3, gray, w);
      r.line(p(10), q(4), p(10), q(20), gray, w);
      r.line(p(10), q(4), p(18), q(4), gray, w);
      break;
    case "wave":
      r.arc(p(7), q(13), 6, Math.PI, Math.PI * 2, gray, w);
      r.arc(p(17), q(13), 6, Math.PI, Math.PI * 2, gray, w);
      r.line(p(2), q(13), p(22), q(13), gray, w);
      break;
    case "warning":
      r.polygon([{x:p(12),y:q(3)},{x:p(22),y:q(21)},{x:p(2),y:q(21)}], undefined, gray, w);
      r.line(p(12), q(9), p(12), q(15), gray, w);
      r.circle(p(12), q(18), 0.8, gray);
      break;
    case "plus":
      r.line(p(5), q(12), p(19), q(12), gray, w);
      r.line(p(12), q(5), p(12), q(19), gray, w);
      break;
    case "minus":
      r.line(p(5), q(12), p(19), q(12), gray, w);
      break;
  }
}
