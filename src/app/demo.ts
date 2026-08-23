import { GlyphFrame } from "../glyph/frame";
import { GlyphRaster } from "../glyph/raster";
import { glyphTheme as T } from "../glyph/theme";
import {
  divider,
  label,
  caption,
  pill,
  pageDots,
} from "../glyph/components";
import { icon } from "../glyph/icons";

export function renderDemo(
  frame: GlyphFrame,
  page: number,
  tick: number
) {
  frame.draw((r) => {
    r.clear(T.colors.off);

    switch (page) {
      case 0:
        navigation(r, tick);
        break;

      case 1:
        markets(r, tick);
        break;

      case 2:
        weather(r, tick);
        break;

      case 3:
        flight(r, tick);
        break;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// COMMON HEADER
// ═══════════════════════════════════════════════════════════════

function header(
  r: GlyphRaster,
  name: string,
  iconName: string
) {
  label(
    r,
    name,
    16,
    18,
    T.colors.secondary
  );

  icon(
    r,
    iconName,
    20 + name.length * 7.5,
    18,
    11,
    T.colors.bright
  );

  // No statusBar().
  // This intentionally removes the unwanted "g:57" element.

  r.text(
    currentTime(),
    560,
    18,
    {
      ...T.typography.mono,
      size: 11,
      weight: 700,
      align: "right",
    },
    T.colors.secondary
  );

  divider(
    r,
    16,
    28,
    560,
    T.colors.divider
  );
}

function currentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════════
// PAGE 0 — NAVIGATION
// ═══════════════════════════════════════════════════════════════

function navigation(
  r: GlyphRaster,
  tick: number
) {
  header(r, "NAVIGATION", "navigation");

  const leftX = 16;
  const leftRight = 300;

  // ─────────────────────────────────────────────────────────────
  // CURRENT STREET
  // ─────────────────────────────────────────────────────────────

  label(
    r,
    "CURRENT STREET",
    leftX,
    48,
    T.colors.secondary
  );

  r.text(
    "VIA TORINO",
    leftX,
    72,
    {
      ...T.typography.headline,
      size: 18,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "towards Piazza Duomo",
    leftX,
    89,
    T.colors.muted
  );

  divider(
    r,
    leftX,
    101,
    leftRight,
    T.colors.divider
  );

  // ─────────────────────────────────────────────────────────────
  // NEXT TURN
  // ─────────────────────────────────────────────────────────────

  label(
    r,
    "NEXT TURN",
    leftX,
    118,
    T.colors.secondary
  );

  drawTurnArrow(
    r,
    49,
    162,
    "right"
  );

  r.text(
    "RIGHT",
    91,
    148,
    {
      ...T.typography.headline,
      size: 16,
      weight: 800,
    },
    T.colors.bright
  );

  r.text(
    "240 m",
    91,
    177,
    {
      ...T.typography.displaySm,
      size: 24,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "Corso Buenos Aires",
    91,
    195,
    T.colors.secondary
  );

  // ─────────────────────────────────────────────────────────────
  // ROUTE INFO
  // ─────────────────────────────────────────────────────────────

  divider(
    r,
    leftX,
    208,
    leftRight,
    T.colors.divider
  );

  label(
    r,
    "ROUTE",
    leftX,
    225,
    T.colors.secondary
  );

  r.text(
    "1.2 km",
    leftX,
    249,
    {
      ...T.typography.monoLg,
      size: 15,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "remaining",
    leftX,
    265,
    T.colors.muted
  );

  r.text(
    "05:42",
    122,
    249,
    {
      ...T.typography.monoLg,
      size: 15,
      weight: 800,
    },
    T.colors.bright
  );

  caption(
    r,
    "ETA",
    122,
    265,
    T.colors.muted
  );

  // ─────────────────────────────────────────────────────────────
  // MAP
  // ─────────────────────────────────────────────────────────────

  drawNavigationMap(
    r,
    {
      x: 320,
      y: 42,
      width: 240,
      height: 178,
    },
    tick
  );

  // ─────────────────────────────────────────────────────────────
  // BOTTOM NAV DATA
  // ─────────────────────────────────────────────────────────────

  divider(
    r,
    16,
    231,
    560,
    T.colors.divider
  );

  const speed = simulatedSpeed(tick);

  const cameraDistance = Math.max(
    0,
    180 - Math.floor((tick * 2) % 181)
  );

  navStat(
    r,
    68,
    speed.toFixed(1),
    "KM/H"
  );

  navStat(
    r,
    205,
    "50",
    "LIMIT"
  );

  navStat(
    r,
    342,
    `${cameraDistance}m`,
    "CAMERA"
  );

  navStat(
    r,
    480,
    speed <= 50 ? "OK" : "SLOW",
    "STATUS"
  );

  pageDots(r, 0, 4);
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION MAP
// ═══════════════════════════════════════════════════════════════

function drawNavigationMap(
  r: GlyphRaster,
  map: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  tick: number
) {
  const { x, y, width, height } = map;

  const cx = x + width / 2;
  const cy = y + height / 2;

  /*
   * The vehicle stays fixed.
   * The road network moves underneath it.
   *
   * This creates a simple top-down navigation effect
   * without needing a real map engine.
   */

  const phase = (tick * 2.2) % 240;

  // Map boundary.
  r.line(
    x,
    y,
    x + width,
    y,
    T.colors.divider
  );

  r.line(
    x,
    y + height,
    x + width,
    y + height,
    T.colors.divider
  );

  r.line(
    x,
    y,
    x,
    y + height,
    T.colors.divider
  );

  r.line(
    x + width,
    y,
    x + width,
    y + height,
    T.colors.divider
  );

  // Main route.
  const mainRoad: Array<[number, number]> = [
    [-30, 190 - phase],
    [20, 170 - phase],
    [64, 150 - phase],
    [100, 130 - phase],
    [120, 106 - phase],
    [122, 82 - phase],
    [140, 59 - phase],
    [174, 42 - phase],
    [220, 32 - phase],
    [270, 36 - phase],
  ];

  drawMapPath(
    r,
    mainRoad,
    x,
    y,
    T.colors.secondary
  );

  // Secondary road.
  const secondaryRoad: Array<[number, number]> = [
    [40, 200 - phase],
    [67, 174 - phase],
    [87, 148 - phase],
    [92, 120 - phase],
    [88, 94 - phase],
    [71, 69 - phase],
    [48, 45 - phase],
  ];

  drawMapPath(
    r,
    secondaryRoad,
    x,
    y,
    T.colors.muted
  );

  // Cross street.
  const crossRoad: Array<[number, number]> = [
    [-20, 76 - phase],
    [30, 79 - phase],
    [82, 86 - phase],
    [138, 94 - phase],
    [190, 108 - phase],
    [260, 124 - phase],
  ];

  drawMapPath(
    r,
    crossRoad,
    x,
    y,
    T.colors.muted
  );

  // Upper cross street.
  const upperRoad: Array<[number, number]> = [
    [0, 38 - phase],
    [58, 45 - phase],
    [116, 51 - phase],
    [178, 59 - phase],
    [250, 67 - phase],
  ];

  drawMapPath(
    r,
    upperRoad,
    x,
    y,
    T.colors.muted
  );

  // Route overlay.
  drawMapPath(
    r,
    mainRoad,
    x,
    y,
    T.colors.bright
  );

  // Destination marker.
  const destinationY = y + 34 - phase;

  if (
    destinationY > y + 8 &&
    destinationY < y + height - 8
  ) {
    drawDestinationMarker(
      r,
      x + 220,
      destinationY
    );
  }

  // Street label.
  const streetLabelY =
    y + 108 - phase;

  if (
    streetLabelY > y + 15 &&
    streetLabelY < y + height - 12
  ) {
    r.text(
      "VIA TORINO",
      x + 132,
      streetLabelY,
      {
        ...T.typography.mono,
        size: 8,
        weight: 600,
      },
      T.colors.muted
    );
  }

  // Vehicle.
  drawVehicleMarker(
    r,
    cx,
    cy
  );

  // North indicator.
  r.text(
    "N",
    x + width - 14,
    y + 15,
    {
      ...T.typography.mono,
      size: 8,
      weight: 800,
      align: "center",
    },
    T.colors.secondary
  );

  r.line(
    x + width - 14,
    y + 21,
    x + width - 14,
    y + 29,
    T.colors.secondary
  );
}

function drawMapPath(
  r: GlyphRaster,
  points: Array<[number, number]>,
  offsetX: number,
  offsetY: number,
  gray: number
) {
  for (
    let i = 0;
    i < points.length - 1;
    i++
  ) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    r.line(
      offsetX + x1,
      offsetY + y1,
      offsetX + x2,
      offsetY + y2,
      gray
    );
  }
}

function drawVehicleMarker(
  r: GlyphRaster,
  x: number,
  y: number
) {
  // Simple directional vehicle triangle.
  r.line(
    x,
    y - 15,
    x - 7,
    y + 7,
    T.colors.bright
  );

  r.line(
    x,
    y - 15,
    x + 7,
    y + 7,
    T.colors.bright
  );

  r.line(
    x - 7,
    y + 7,
    x,
    y + 3,
    T.colors.bright
  );

  r.line(
    x + 7,
    y + 7,
    x,
    y + 3,
    T.colors.bright
  );

  r.circle(
    x,
    y,
    2,
    T.colors.bright
  );
}

function drawDestinationMarker(
  r: GlyphRaster,
  x: number,
  y: number
) {
  r.circle(
    x,
    y,
    5,
    T.colors.bright
  );

  r.circle(
    x,
    y,
    2,
    T.colors.off
  );
}

// ═══════════════════════════════════════════════════════════════
// TURN ARROW
// ═══════════════════════════════════════════════════════════════

function drawTurnArrow(
  r: GlyphRaster,
  x: number,
  y: number,
  direction:
    | "left"
    | "right"
    | "straight"
) {
  const c = T.colors.bright;

  if (direction === "right") {
    r.line(
      x,
      y + 25,
      x,
      y - 5,
      c
    );

    r.line(
      x,
      y - 5,
      x + 10,
      y - 14,
      c
    );

    r.line(
      x + 10,
      y - 14,
      x + 24,
      y - 14,
      c
    );

    r.line(
      x + 24,
      y - 14,
      x + 14,
      y - 22,
      c
    );

    r.line(
      x + 24,
      y - 14,
      x + 14,
      y - 6,
      c
    );
  }

  if (direction === "left") {
    r.line(
      x,
      y + 25,
      x,
      y - 5,
      c
    );

    r.line(
      x,
      y - 5,
      x - 10,
      y - 14,
      c
    );

    r.line(
      x - 10,
      y - 14,
      x - 24,
      y - 14,
      c
    );

    r.line(
      x - 24,
      y - 14,
      x - 14,
      y - 22,
      c
    );

    r.line(
      x - 24,
      y - 14,
      x - 14,
      y - 6,
      c
    );
  }

  if (direction === "straight") {
    r.line(
      x,
      y + 25,
      x,
      y - 19,
      c
    );

    r.line(
      x,
      y - 19,
      x - 8,
      y - 10,
      c
    );

    r.line(
      x,
      y - 19,
      x + 8,
      y - 10,
      c
    );
  }
}

function navStat(
  r: GlyphRaster,
  x: number,
  value: string,
  title: string
) {
  r.text(
    value,
    x,
    249,
    {
      ...T.typography.monoLg,
      size: 14,
      weight: 800,
      align: "center",
    },
    T.colors.white
  );

  caption(
    r,
    title,
    x,
    265,
    T.colors.muted,
    {
      align: "center",
    }
  );
}

function simulatedSpeed(
  tick: number
): number {
  return (
    5 +
    Math.sin(tick / 4) * 1.8
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — MARKETS
// ═══════════════════════════════════════════════════════════════

function markets(
  r: GlyphRaster,
  tick: number
) {
  header(
    r,
    "MARKETS",
    "chart-line"
  );

  pill(
    r,
    460,
    5,
    "OPEN",
    T.colors.dark
  );

  label(
    r,
    "VWCE",
    16,
    52,
    T.colors.secondary
  );

  r.text(
    "€142.36",
    16,
    81,
    {
      ...T.typography.displaySm,
      size: 27,
      weight: 800,
    },
    T.colors.white
  );

  r.text(
    "+0.84%",
    151,
    79,
    {
      ...T.typography.mono,
      size: 12,
      weight: 800,
    },
    T.colors.bright
  );

  drawSparkline(
    r,
    285,
    45,
    260,
    42,
    tick
  );

  divider(
    r,
    16,
    100,
    560,
    T.colors.divider
  );

  marketRow(
    r,
    116,
    "SWDA",
    "€112.81",
    "+0.42%"
  );

  marketRow(
    r,
    151,
    "GOLD",
    "$3,341",
    "-0.18%"
  );

  marketRow(
    r,
    186,
    "BTC",
    "$117.2K",
    "+1.24%"
  );

  divider(
    r,
    16,
    216,
    560,
    T.colors.divider
  );

  label(
    r,
    "PORTFOLIO",
    16,
    234,
    T.colors.secondary
  );

  r.text(
    "€18,420",
    16,
    258,
    {
      ...T.typography.monoLg,
      size: 16,
      weight: 800,
    },
    T.colors.white
  );

  r.text(
    "+€142",
    142,
    258,
    {
      ...T.typography.mono,
      size: 12,
      weight: 700,
    },
    T.colors.bright
  );

  pageDots(r, 1, 4);
}

function marketRow(
  r: GlyphRaster,
  y: number,
  name: string,
  price: string,
  change: string
) {
  r.text(
    name,
    16,
    y + 12,
    {
      ...T.typography.mono,
      size: 12,
      weight: 800,
    },
    T.colors.white
  );

  r.text(
    price,
    105,
    y + 12,
    {
      ...T.typography.mono,
      size: 12,
      weight: 700,
    },
    T.colors.secondary
  );

  r.text(
    change,
    540,
    y + 12,
    {
      ...T.typography.mono,
      size: 11,
      weight: 700,
      align: "right",
    },
    change.startsWith("-")
      ? T.colors.secondary
      : T.colors.bright
  );
}

function drawSparkline(
  r: GlyphRaster,
  x: number,
  y: number,
  width: number,
  height: number,
  tick: number
) {
  const values = [
    0.38,
    0.44,
    0.40,
    0.51,
    0.47,
    0.57,
    0.53,
    0.62,
    0.58,
    0.68,
    0.64,
    0.73,
    0.69,
    0.80,
    0.76,
    0.88,
  ];

  const shift =
    Math.sin(tick / 6) * 2;

  for (
    let i = 0;
    i < values.length - 1;
    i++
  ) {
    const x1 =
      x +
      (i / (values.length - 1)) *
        width;

    const x2 =
      x +
      ((i + 1) / (values.length - 1)) *
        width;

    const y1 =
      y +
      height -
      values[i] * height +
      shift;

    const y2 =
      y +
      height -
      values[i + 1] * height +
      shift;

    r.line(
      x1,
      y1,
      x2,
      y2,
      T.colors.bright
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — WEATHER
// ═══════════════════════════════════════════════════════════════

function weather(
  r: GlyphRaster,
  tick: number
) {
  header(
    r,
    "WEATHER",
    ""
  );

  // ─────────────────────────────────────────────────────────────
  // MAIN CURRENT WEATHER
  // ─────────────────────────────────────────────────────────────

  label(
    r,
    "MILAN",
    16,
    51,
    T.colors.secondary
  );

  // Icon is intentionally separated from temperature.
  drawPartlyCloudyIcon(
    r,
    42,
    91
  );

  r.text(
    "24°",
    96,
    91,
    {
      ...T.typography.display,
      size: 40,
      weight: 800,
    },
    T.colors.white
  );

  // Description starts beneath the temperature,
  // not to its side.
  r.text(
    "PARTLY CLOUDY",
    96,
    113,
    {
      ...T.typography.body,
      size: 12,
      weight: 700,
    },
    T.colors.secondary
  );

  caption(
    r,
    "FEELS LIKE 25°",
    96,
    129,
    T.colors.muted
  );

  // ─────────────────────────────────────────────────────────────
  // RIGHT CONDITIONS
  // ─────────────────────────────────────────────────────────────

  weatherStat(
    r,
    330,
    58,
    "28°",
    "HIGH"
  );

  weatherStat(
    r,
    440,
    58,
    "18°",
    "LOW"
  );

  weatherStat(
    r,
    330,
    101,
    "12",
    "WIND KM/H"
  );

  weatherStat(
    r,
    440,
    101,
    "57%",
    "HUMIDITY"
  );

  divider(
    r,
    16,
    147,
    560,
    T.colors.divider
  );

  // ─────────────────────────────────────────────────────────────
  // HOURLY FORECAST
  // ─────────────────────────────────────────────────────────────

  label(
    r,
    "TODAY",
    16,
    166,
    T.colors.secondary
  );

  const hours = [
    ["22", "23°"],
    ["00", "22°"],
    ["01", "21°"],
    ["02", "20°"],
    ["03", "20°"],
  ];

  for (
    let i = 0;
    i < hours.length;
    i++
  ) {
    const x =
      78 + i * 95;

    r.text(
      hours[i][0],
      x,
      189,
      {
        ...T.typography.mono,
        size: 10,
        weight: 700,
        align: "center",
      },
      T.colors.secondary
    );

    drawSmallCloud(
      r,
      x,
      211
    );

    r.text(
      hours[i][1],
      x,
      234,
      {
        ...T.typography.mono,
        size: 11,
        weight: 700,
        align: "center",
      },
      T.colors.white
    );
  }

  pageDots(r, 2, 4);
}

function weatherStat(
  r: GlyphRaster,
  x: number,
  y: number,
  value: string,
  title: string
) {
  r.text(
    value,
    x,
    y,
    {
      ...T.typography.monoLg,
      size: 15,
      weight: 800,
      align: "center",
    },
    T.colors.white
  );

  caption(
    r,
    title,
    x,
    y + 16,
    T.colors.muted,
    {
      align: "center",
    }
  );
}

function drawPartlyCloudyIcon(
  r: GlyphRaster,
  x: number,
  y: number
) {
  // Sun.
  r.circle(
    x + 5,
    y - 10,
    5,
    T.colors.bright
  );

  r.line(
    x + 5,
    y - 19,
    x + 5,
    y - 16,
    T.colors.bright
  );

  r.line(
    x - 4,
    y - 10,
    x - 1,
    y - 10,
    T.colors.bright
  );

  r.line(
    x + 14,
    y - 10,
    x + 17,
    y - 10,
    T.colors.bright
  );

  // Cloud.
  r.circle(
    x,
    y + 4,
    8,
    T.colors.white
  );

  r.circle(
    x + 9,
    y + 2,
    7,
    T.colors.white
  );

  r.line(
    x - 7,
    y + 4,
    x + 15,
    y + 4,
    T.colors.white
  );
}

function drawSmallCloud(
  r: GlyphRaster,
  x: number,
  y: number
) {
  r.circle(
    x - 4,
    y,
    4,
    T.colors.secondary
  );

  r.circle(
    x + 3,
    y - 2,
    5,
    T.colors.secondary
  );

  r.line(
    x - 8,
    y + 2,
    x + 9,
    y + 2,
    T.colors.secondary
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — FLIGHT
// ═══════════════════════════════════════════════════════════════

function flight(
  r: GlyphRaster,
  tick: number
) {
  header(
    r,
    "FLIGHT",
    ""
  );

  pill(
    r,
    460,
    5,
    "ON TIME",
    T.colors.dark
  );

  label(
    r,
    "MILAN → LONDON",
    16,
    52,
    T.colors.secondary
  );

  r.text(
    "FR 274",
    16,
    81,
    {
      ...T.typography.displaySm,
      size: 26,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "Ryanair",
    16,
    98,
    T.colors.muted
  );

  // Departure / arrival.
  r.text(
    "07:25",
    184,
    75,
    {
      ...T.typography.monoLg,
      size: 17,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "MXP",
    184,
    92,
    T.colors.secondary
  );

  r.text(
    "09:00",
    280,
    75,
    {
      ...T.typography.monoLg,
      size: 17,
      weight: 800,
    },
    T.colors.white
  );

  caption(
    r,
    "STN",
    280,
    92,
    T.colors.secondary
  );

  divider(
    r,
    16,
    111,
    560,
    T.colors.divider
  );

  // Progress line.
  label(
    r,
    "FLIGHT STATUS",
    16,
    130,
    T.colors.secondary
  );

  r.line(
    34,
    153,
    542,
    153,
    T.colors.border
  );

  r.line(
    34,
    153,
    300 + Math.sin(tick / 10) * 10,
    153,
    T.colors.bright
  );

  r.circle(
    300 + Math.sin(tick / 10) * 10,
    153,
    4,
    T.colors.bright
  );

  r.text(
    "BOARDING",
    16,
    180,
    {
      ...T.typography.body,
      size: 13,
      weight: 800,
    },
    T.colors.bright
  );

  caption(
    r,
    "Gate B12",
    16,
    197,
    T.colors.secondary
  );

  // Bottom information.
  flightStat(
    r,
    120,
    "B12",
    "GATE"
  );

  flightStat(
    r,
    290,
    "07:00",
    "BOARDING"
  );

  flightStat(
    r,
    430,
    "14",
    "MIN"
  );

  pageDots(r, 3, 4);
}

function flightStat(
  r: GlyphRaster,
  x: number,
  value: string,
  title: string
) {
  r.text(
    value,
    x,
    237,
    {
      ...T.typography.monoLg,
      size: 15,
      weight: 800,
      align: "center",
    },
    T.colors.white
  );

  caption(
    r,
    title,
    x,
    254,
    T.colors.muted,
    {
      align: "center",
    }
  );
}