import {
  bottom, centerX, centerY, gray as G, grow, icon, inset, column,
  maneuverArrow, panel, progressBar, radius as R, right, row, space as S, speedLimit,
  type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/**
 * Navigator — turn-by-turn guidance.
 *
 * Hierarchy is everything here. At 60 km/h a rider gets roughly half a second
 * of attention: the maneuver and the distance to it own the screen, and the
 * street name is allowed to be the third thing you notice, not the first.
 */

interface Step {
  kind: "left" | "right" | "straight" | "uturn" | "slight-left" | "slight-right";
  distance: number;
  street: string;
  then?: "left" | "right" | "straight";
}

const route: Step[] = [
  { kind: "right", distance: 280, street: "Viale Certosa", then: "left" },
  { kind: "left", distance: 1400, street: "Via Gallarate", then: "straight" },
  { kind: "straight", distance: 3100, street: "SS33 del Sempione", then: "right" }
];

function formatDistance(metres: number): [string, string] {
  if (metres < 1000) return [String(Math.round(metres / 10) * 10), "m"];
  return [(metres / 1000).toFixed(1), "km"];
}

export const navigatorScreen: Screen = {
  name: "Navigator",
  animated: true,

  render({ g, now, safe }: RenderContext) {
    const elapsed = (now / 1000) % 18;
    const step = route[Math.floor(elapsed / 6) % route.length];
    const progress = (elapsed % 6) / 6;
    const remaining = step.distance * (1 - progress * 0.85);
    const [value, unit] = formatDistance(remaining);
    const speed = Math.round(52 + Math.sin(now / 1400) * 6);
    const limit = 50;

    const [main, strip] = column(safe, [{ size: grow(1) }, { size: 34 }], { gap: S.sm });
    const [guidance, side] = row(main, [{ size: grow(1) }, { size: 150 }], { gap: S.md });

    // ── The maneuver ──────────────────────────────────────────────────────
    panel(g, guidance, { fill: G.surface, radius: R.xl });
    const arrowBox = inset({ x: guidance.x, y: guidance.y, width: 138, height: guidance.height }, S.sm);
    maneuverArrow(g, centerX(arrowBox), centerY(arrowBox) - 6, 96, step.kind);

    const textX = guidance.x + 146;
    g.text(value, textX, guidance.y + 34, { ...T.hero, size: 76 }, G.max, "left", "top");
    const valueWidth = g.measure(value, { ...T.hero, size: 76 });
    g.text(unit, textX + valueWidth + 8, guidance.y + 82, T.headline, G.secondary, "left", "bottom");

    g.textBox(
      step.street,
      { x: textX, y: guidance.y + 108, width: guidance.width - 158, height: 30 },
      T.headline, G.primary, { wrap: false }
    );

    if (step.then) {
      const thenY = guidance.y + 144;
      g.text("THEN", textX, thenY + 8, T.micro, G.tertiary, "left", "middle");
      icon(g, step.then === "left" ? "corner-left" : step.then === "right" ? "corner-right" : "arrow-up",
        textX + 44, thenY + 8, 18, G.secondary);
    }

    // ── Speed, limit, arrival ─────────────────────────────────────────────
    const [speedBox, limitBox, etaBox] = column(side, [{ size: grow(1) }, { size: grow(1) }, { size: 52 }], { gap: S.sm });

    panel(g, speedBox, { fill: G.surface, radius: R.lg });
    g.text(String(speed), centerX(speedBox), centerY(speedBox) - 4, { ...T.numeralXl, size: 44 }, G.max, "center", "middle");
    g.text("KM/H", centerX(speedBox), bottom(speedBox) - 12, T.micro, G.tertiary, "center", "middle");

    panel(g, limitBox, { fill: G.surface, radius: R.lg });
    speedLimit(g, centerX(limitBox), centerY(limitBox) - 7, 23, limit, speed > limit + 2);
    g.text(speed > limit + 2 ? "OVER LIMIT" : "LIMIT", centerX(limitBox), bottom(limitBox) - 9, { ...T.micro, size: 8 },
      speed > limit + 2 ? G.max : G.tertiary, "center", "middle");

    panel(g, etaBox, { fill: G.raised, radius: R.lg });
    g.text("15:47", centerX(etaBox), etaBox.y + 18, T.numeralLg, G.max, "center", "middle");
    g.text("ARRIVAL · 24 MIN", centerX(etaBox), bottom(etaBox) - 13, T.micro, G.tertiary, "center", "middle");

    // ── Route progress ────────────────────────────────────────────────────
    const [label, bar, distance] = row(strip, [{ size: 92 }, { size: grow(1) }, { size: 92 }], { gap: S.md });
    g.text("TO DESTINATION", label.x, centerY(strip), T.micro, G.tertiary, "left", "middle");
    progressBar(g, { x: bar.x, y: centerY(strip) - 4, width: bar.width, height: 8 }, 0.42, { ticks: 4 });
    g.text("18.4 km", right(distance), centerY(strip), T.numeral, G.primary, "right", "middle");
  }
};
