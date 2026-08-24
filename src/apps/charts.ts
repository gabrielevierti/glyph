import {
  attitudeIndicator, barChart, bulletChart, centerX, centerY, column,
  gaugeChart, gray as G, grow, heatStrip, lineChart, pageDots, rankChart, right, ringChart,
  row, section, space as S, type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/** Charts — data primitives, all driven from the same 16-level palette. */

const revenue = Array.from({ length: 32 }, (_, i) => 40 + Math.sin(i / 4) * 18 + i * 0.9);
const forecast = revenue.map((v, i) => v * 0.85 + Math.cos(i / 3) * 6);
const weekly = [12, 19, 8, 24, 31, 22, 17];
const load = Array.from({ length: 24 }, (_, i) => Math.sin((i / 24) * Math.PI * 2 - 1.2) * 40 + 55);

export const chartsScreen: Screen = {
  name: "Charts",
  animated: true,

  render({ g, now, safe, app }: RenderContext) {
    const t = now / 1000;
    const [header, body, footer] = column(safe, [{ size: 14 }, { size: grow(1) }, { size: 16 }], { gap: S.sm });

    g.text("GLYPH · DATA", header.x, centerY(header), T.label, G.secondary, "left", "middle");
    g.text("CHARTS BUILT FROM PRIMITIVES", right(header), centerY(header), T.micro, G.tertiary, "right", "middle");
    g.hline(header.x, right(header), header.y + 13, G.hairline);

    const [topRow, bottomRow] = column(body, [{ size: grow(1.15) }, { size: grow(1) }], { gap: S.sm });
    const [lineBox, gaugeBox, ringBox] = row(topRow, [{ size: grow(1.7) }, { size: 132 }, { size: 108 }], { gap: S.sm });

    const lineInner = section(g, lineBox, "Throughput", { accessory: "32 SAMPLES" });
    lineChart(g, lineInner, [
      { values: forecast, gray: G.border, width: 1, dash: [3, 3] },
      { values: revenue, gray: G.max, width: 1.5, fill: G.sunken, smooth: true }
    ], { gridLines: 4, gutter: 24, format: (v) => String(Math.round(v)), labels: ["-8h", "-4h", "now"] });

    const gaugeInner = section(g, gaugeBox, "Load");
    gaugeChart(g, centerX(gaugeInner), centerY(gaugeInner) - 14, 30, 55 + Math.sin(t / 2) * 30, {
      min: 0, max: 100, ticks: 6, label: "CPU %",
      format: (v) => String(Math.round(v)),
      zones: [{ from: 80, to: 100, gray: G.border }]
    });

    const ringInner = section(g, ringBox, "Goal");
    ringChart(g, centerX(ringInner), centerY(ringInner), 30, 0.5 + Math.sin(t / 3) * 0.35, {
      width: 7, value: String(Math.round((0.5 + Math.sin(t / 3) * 0.35) * 100)), label: "TARGET"
    });

    const [barBox, rankBox, miscBox] = row(bottomRow, [{ size: grow(1) }, { size: grow(1.15) }, { size: 126 }], { gap: S.sm });

    const barInner = section(g, barBox, "Weekly");
    barChart(g, barInner, weekly, {
      gray: G.border, highlight: 4, highlightGray: G.max,
      labels: ["L", "M", "M", "G", "V", "S", "D"]
    });

    const rankInner = section(g, rankBox, "By source");
    rankChart(g, rankInner, [
      { label: "Direct", value: 82 },
      { label: "Search", value: 61, gray: G.secondary },
      { label: "Social", value: 34, gray: G.border }
    ], { labelWidth: 48, format: (v) => `${v}%` });

    const miscInner = section(g, miscBox, "Attitude");
    attitudeIndicator(g, centerX(miscInner), centerY(miscInner) - 4, 30, Math.sin(t / 2) * 8, Math.sin(t / 3) * 14);

    // A dense strip beneath everything: 24 hours in 12 pixels of height.
    heatStrip(g, { x: footer.x, y: footer.y - 2, width: 200, height: 8 }, load, { low: G.sunken, high: G.max });
    bulletChart(g, { x: footer.x + 212, y: footer.y, width: 120, height: 6 }, 68, 80);
    pageDots(g, centerX(footer), centerY(footer) + 2, app.screens.length, app.screenIndex);
  }
};
