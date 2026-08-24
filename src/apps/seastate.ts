import {
  bottom, centerX, compassRose, gray as G, inset,
  metric, pageDots, pill, right, row, column, section, space as S, sparkline, statusBar,
  type as T, windIndicator, grow, remap
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/**
 * SeaState — marine conditions.
 *
 * The design brief for a boat instrument: the three numbers you steer by
 * (speed, heading, depth) must be readable in one glance, in spray, at an
 * angle. Everything else is secondary and is allowed to be small.
 */

function conditions(now: number) {
  const t = now / 1000;
  return {
    sog: 11.8 + Math.sin(t / 3) * 1.4,
    cog: 247 + Math.sin(t / 7) * 6,
    heading: 244 + Math.sin(t / 5) * 8,
    depth: 18.4 + Math.sin(t / 4) * 2.2,
    windSpeed: Math.round(14 + Math.sin(t / 6) * 3),
    windDir: 310 + Math.sin(t / 9) * 12,
    waypoint: 265,
    tide: Array.from({ length: 28 }, (_, i) => 1.6 + Math.sin((i / 27) * Math.PI * 2 - 0.6) * 1.1)
  };
}

export const seaStateScreen: Screen = {
  name: "SeaState",
  animated: true,

  render({ g, now, safe, app }: RenderContext) {
    const c = conditions(now);

    const [bar, body, footer] = column(safe, [{ size: 15 }, { size: grow(1) }, { size: 22 }], { gap: S.sm });
    statusBar(g, bar, { title: "SeaState", time: "14:32", battery: 0.72, signal: 3, icons: ["anchor"] });

    const [leftCol, centre, rightCol] = row(body, [{ size: 166 }, { size: grow(1) }, { size: 166 }], { gap: S.sm });

    // ── Speed and depth: the primary instruments ──────────────────────────
    const [speedBox, depthBox] = column(leftCol, [{ size: grow(1.35) }, { size: grow(1) }], { gap: S.sm });

    const speedInner = section(g, speedBox, "Speed", { accessory: "SOG · GPS" });
    metric(g, speedInner, c.sog.toFixed(1), {
      unit: "kn", label: "SOG", valueStyle: { ...T.numeralXl, size: 46 }
    });

    const depthInner = section(g, depthBox, "Depth", { accessory: c.depth < 12 ? "SHOAL" : "" });
    metric(g, depthInner, c.depth.toFixed(1), { unit: "m", label: "Below keel", valueStyle: T.numeralXl });

    // ── Compass: the thing you actually steer by ──────────────────────────
    const rose = inset(centre, 2);
    compassRose(g, centerX(rose), rose.y + 92, 84, c.heading, {
      pointer: c.waypoint,
      pointerLabel: "WPT",
      showValue: true
    });
    g.text("HDG", centerX(rose), rose.y + 92 + 22, T.micro, G.tertiary, "center", "middle");
    g.text(
      `COG ${Math.round(c.cog).toString().padStart(3, "0")}°`,
      centerX(rose), bottom(rose) - 6, T.caption, G.secondary, "center", "bottom"
    );

    // ── Wind and tide ─────────────────────────────────────────────────────
    const [windBox, tideBox] = column(rightCol, [{ size: grow(1) }, { size: grow(1) }], { gap: S.sm });

    const windInner = section(g, windBox, "Wind", { accessory: "TRUE" });
    windIndicator(g, windInner.x + 42, windInner.y + 38, 34, c.windDir, c.windSpeed);
    const windText = { x: windInner.x + 84, y: windInner.y + 4, width: windInner.width - 84, height: 62 };
    const readout = { ...T.numeral, size: 13 };
    [["DIR", `${Math.round(c.windDir)}°`], ["GUST", String(c.windSpeed + 5)], ["SEA", "1.2m"]]
      .forEach(([key, value], i) => {
        const line = { ...windText, y: windText.y + i * 19, height: 17 };
        g.text(key, line.x, line.y + 8, { ...T.micro, size: 8 }, G.tertiary, "left", "middle");
        g.text(value, right(line), line.y + 8, readout, G.primary, "right", "middle");
      });

    const tideInner = section(g, tideBox, "Tide", { accessory: "+4h12" });
    sparkline(g, { ...tideInner, height: tideInner.height - 14 }, c.tide, {
      gray: G.strong, fill: G.sunken, smooth: true
    });
    const nowIndex = Math.floor(remap(now % 60000, 0, 60000, 6, 22));
    const markerX = tideInner.x + (nowIndex / 27) * tideInner.width;
    g.vline(markerX, tideInner.y, bottom(tideInner) - 14, G.border, 1);
    g.text("LW 18:40", tideInner.x, bottom(tideInner) - 4, T.micro, G.tertiary, "left", "bottom");
    g.text("2.7m", right(tideInner), bottom(tideInner) - 4, T.micro, G.tertiary, "right", "bottom");

    // ── Footer: where we are going ────────────────────────────────────────
    g.hline(footer.x, right(footer), footer.y, G.hairline);
    const cy = footer.y + 13;
    let x = footer.x;
    x += pill(g, x, cy, "PORTOFINO", { icon: "map-pin", fill: G.raised }) + S.sm;
    g.text("14.2 NM", x + 4, cy, T.numeral, G.primary, "left", "middle");
    g.text("ETA 15:47", right(footer), cy, T.numeral, G.secondary, "right", "middle");
    pageDots(g, centerX(footer), cy, app.screens.length, app.screenIndex);
  }
};
