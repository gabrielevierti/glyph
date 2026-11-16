import {
  activityRings, avatar, avatarGroup, breadcrumb, calendarMonth, candlestickChart, card, chipRow, donutChart,
  dotMatrix, gray as G, histogram, icon, iconNames, legend, pagination, polarChart, radarChart, rangeChart, rating,
  sparkBars, stackedBar, statGrid, statusDot, table, timeline, trendBadge
} from "../glyph/index.js";
import type { Candle, Screen } from "../glyph/index.js";
import { caption, footer, header, rect } from "./kit.js";

/** Data — tables, schedules, calendars, people. */
export const dataScreen: Screen = {
  name: "Data",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "Data", "TABLE · CALENDAR · TIMELINE");

    table(g, rect(22, 48, 228, 100), [
      { label: "Flight", width: 60 },
      { label: "From" },
      { label: "Alt", width: 52, numeric: true },
      { label: "NM", width: 46, numeric: true }
    ], [
      ["AZ204", "Roma Fiumicino", "FL340", "42.1"],
      ["I-GLYF", "Bresso", "3450", "4.2"],
      ["EJU21KP", "London Gatwick", "FL380", "18.7"],
      ["RYR4TC", "Bergamo", "9200", "11.3"]
    ], { selected: 1 + (Math.floor(t / 3) % 2) });

    const inner = card(g, rect(22, 156, 228, 106), { title: "I-GLYF", subtitle: "Cessna 172 · VFR", icon: "plane", accessory: "LIVE" });
    statGrid(g, inner, [
      { label: "SPEED", value: "104 kt" },
      { label: "TRACK", value: "248°" },
      { label: "SQUAWK", value: "7000" }
    ], { columns: 3 });

    calendarMonth(g, rect(266, 48, 138, 124), 2026, 11, { title: "NOVEMBER 2026", today: 16, selected: 21, marked: [4, 12, 27] });

    avatar(g, 280, 196, 13, { initials: "GV", presence: "online", selected: true });
    avatar(g, 314, 196, 13, { initials: "AL", presence: "busy" });
    avatar(g, 348, 196, 13, { icon: "user", presence: "away" });
    avatarGroup(g, 370, 196, 9, ["MR", "TS", "LB", "KD", "PN"], { max: 1 });

    rating(g, 266, 226, 3.5 + 0.5 * Math.sin(t * 0.5));
    trendBadge(g, 350, 226, 2.4);
    trendBadge(g, 350, 244, -0.8);
    statusDot(g, 270, 245, "online"); statusDot(g, 284, 245, "busy"); statusDot(g, 298, 245, "away"); statusDot(g, 312, 245, "offline");

    timeline(g, rect(420, 50, 134, 112), [
      { time: "07:10", title: "Cast off", state: "done" },
      { time: "08:45", title: "Outer mark", state: "done" },
      { time: "10:20", title: "Portofino", state: "current" },
      { time: "13:00", title: "Lunch" },
      { time: "17:30", title: "Return" }
    ]);

    breadcrumb(g, rect(420, 170, 134, 14), ["Fleet", "Liguria", "Portofino"]);
    chipRow(g, rect(420, 190, 134, 46), ["VFR", "IFR", "MIL", "HELI"], { selected: [0, 3] });
    pagination(g, rect(420, 242, 134, 18), 2 + (Math.floor(t / 2) % 3), 12);

    footer(ctx, "STATE IS SHAPE AND WEIGHT · NOT COLOUR");
  }
};

const CANDLES: Candle[] = Array.from({ length: 16 }, (_, i) => {
  const base = 50 + 14 * Math.sin(i * 0.5) + i * 1.2;
  const open = base + 4 * Math.sin(i * 1.7);
  const close = base + 4 * Math.cos(i * 1.3);
  return { open, close, high: Math.max(open, close) + 3 + (i % 3), low: Math.min(open, close) - 3 - (i % 2) };
});

const SPREAD = Array.from({ length: 220 }, (_, i) => {
  // A deterministic bell: the sum of a few out-of-phase waves.
  return 50 + 14 * (Math.sin(i * 12.9898) + Math.sin(i * 78.233) + Math.sin(i * 37.719));
});

/** Charts · More — the chart types beyond lines and bars. */
export const moreChartsScreen: Screen = {
  name: "Charts · More",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "Charts · More", "PARTS · SPREAD · DIRECTION");

    caption(g, 22, 52, "DONUT");
    donutChart(g, 62, 104, 38, [{ value: 46 }, { value: 28 }, { value: 16 }, { value: 10 }], { value: "46%", label: "SAIL" });

    caption(g, 118, 52, "RINGS");
    activityRings(g, 156, 104, 38, [0.82, 0.6 + 0.2 * Math.sin(t * 0.6), 0.35], { width: 6, gap: 3 });

    caption(g, 212, 52, "RADAR");
    radarChart(g, 258, 106, 32, ["SPD", "RNG", "LOAD", "COST", "EASE"], [
      { values: [0.9, 0.55, 0.7, 0.4, 0.8] },
      { values: [0.5, 0.85, 0.45, 0.75, 0.6], gray: G.secondary, dash: [3, 2] }
    ]);

    caption(g, 318, 52, "POLAR");
    const wind = [3, 5, 9, 14, 8, 4, 2, 2].map((v, i) => v + 2 * Math.sin(t * 0.5 + i));
    polarChart(g, 362, 106, 30, wind, { labels: ["N", "E", "S", "W"] });

    caption(g, 418, 52, "DOT MATRIX");
    dotMatrix(g, rect(418, 62, 136, 54), 23 + (Math.floor(t) % 6), 60, { columns: 15 });
    legend(g, rect(418, 124, 136, 12), [{ label: "BERTHS TAKEN", marker: "dot" }, { label: "FREE", marker: "dot", gray: G.border }]);

    caption(g, 22, 158, "CANDLESTICK");
    candlestickChart(g, rect(22, 166, 168, 90), CANDLES, { gridLines: 3 });

    caption(g, 206, 158, "HISTOGRAM");
    histogram(g, rect(206, 168, 110, 88), SPREAD, { bins: 13, highlight: 50 + 20 * Math.sin(t * 0.4) });

    caption(g, 332, 158, "RANGE");
    const mid = Array.from({ length: 14 }, (_, i) => 12 + 5 * Math.sin(i * 0.5 + t * 0.3));
    rangeChart(g, rect(332, 168, 112, 88), mid.map((v, i) => v - 2 - i * 0.35), mid.map((v, i) => v + 2 + i * 0.35), { mid, gridLines: 2 });

    caption(g, 460, 158, "SPARK BARS");
    sparkBars(g, rect(460, 168, 94, 26), Array.from({ length: 18 }, (_, i) => 4 + 3 * Math.sin(i * 0.7 + t) + (i % 4)));

    caption(g, 460, 210, "STACKED BAR");
    stackedBar(g, rect(460, 220, 94, 9), [{ value: 52 }, { value: 27 }, { value: 13 }, { value: 8, pattern: "hatch" }]);
    legend(g, rect(460, 236, 94, 26), [{ label: "SAIL", marker: "square" }, { label: "MOTOR", marker: "square", gray: 11 }], { direction: "column", gap: 12 });

    footer(ctx, "FOUR LEVELS · THEN PATTERN · THEN A DIFFERENT CHART");
  }
};

/** Icons — the whole set, so a missing or broken one is something you can see. */
export const iconsScreen: Screen = {
  name: "Icons",
  animated: false,

  render(ctx) {
    const { g } = ctx;
    const names = iconNames();
    header(g, "Icons", `${names.length} IN THE SET · 24 PX GRID`);
    const cols = 31;
    const rows = Math.ceil(names.length / cols);
    const cellW = 532 / cols;
    const cellH = Math.min(24, 214 / rows);
    names.forEach((name, i) => {
      const cx = 22 + ((i % cols) + 0.5) * cellW;
      const cy = 50 + (Math.floor(i / cols) + 0.5) * cellH;
      icon(g, name, cx, cy, 13, (i + Math.floor(i / cols)) % 3 === 0 ? G.max : G.secondary);
    });
    footer(ctx, "STROKED PATHS · SHARP AT ANY SIZE");
  }
};
