import {
  barGauge, clockFace, deviationBar, gray as G, headingTape, levelMeter, linearGauge, pageDots, pitchLadder,
  radarScope, reticle, scaleBar, targetBox, type as T, valueTape
} from "../glyph/index.js";
import type { Screen } from "../glyph/index.js";
import { caption, footer, header } from "./kit.js";

/**
 * HUD · Flight — what the instruments are for.
 *
 * No panels, no header, no chrome: a heading tape across the top, a tape down
 * each side, a pitch ladder in the middle, and everything else left empty so
 * the wearer can see where they are going. This is the layout the display was
 * made for, and the whole screen is under four percent ink.
 */
export const hudFlightScreen: Screen = {
  name: "HUD · Flight",
  animated: true,

  render({ g, now, app }) {
    const t = now / 1000;
    const heading = 250 + 18 * Math.sin(t * 0.21);
    const speed = 142 + 7 * Math.sin(t * 0.33);
    const altitude = 3450 + 60 * Math.sin(t * 0.17);
    const pitch = 4 + 3 * Math.sin(t * 0.45);
    const roll = 9 * Math.sin(t * 0.38);

    headingTape(g, { x: 148, y: 10, width: 280, height: 46 }, heading, { bug: 262 });

    g.text("KT", 51, 62, T.micro, G.tertiary, "center", "middle");
    valueTape(g, { x: 22, y: 72, width: 58, height: 168 }, speed, { step: 2, labelEvery: 5, visible: 24, edge: "right", bug: 150 });

    g.text("FT", 525, 62, T.micro, G.tertiary, "center", "middle");
    valueTape(g, { x: 496, y: 72, width: 58, height: 168 }, altitude, {
      step: 20, labelEvery: 5, visible: 22, edge: "left", bug: 3500
    });

    pitchLadder(g, { x: 168, y: 68, width: 240, height: 150 }, pitch, roll);

    // Traffic, bracketed rather than drawn over.
    targetBox(g, { x: 424, y: 100, width: 40, height: 28 }, { label: "I-GLYF", detail: "4.2", locked: Math.sin(t * 0.8) > 0 });

    deviationBar(g, { x: 208, y: 236, width: 160, height: 14 }, 0.75 * Math.sin(t * 0.5));
    g.text("GS 138", 22, 256, T.micro, G.secondary, "left", "middle");
    g.text("VS +250", 554, 256, T.micro, G.secondary, "right", "middle");
    pageDots(g, 288, 277, app.screens.length, app.screenIndex);
  }
};

/** HUD · Instruments — the rest of the instrument set, one of each. */
export const hudInstrumentsScreen: Screen = {
  name: "HUD · Instruments",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "HUD · Instruments", "SCOPES · METERS · MARKS");

    caption(g, 22, 52, "RADAR SCOPE");
    radarScope(g, 90, 160, 68, {
      sweep: (t * 50) % 360,
      rangeLabel: "10 NM",
      blips: [
        { bearing: 40, range: 0.62, label: "AZ204", kind: "triangle", course: 220 },
        { bearing: 295, range: 0.78, kind: "diamond" },
        { bearing: 170, range: 0.4, kind: "square", gray: G.secondary },
        { bearing: 110 + t * 2, range: 0.86, kind: "dot" }
      ]
    });

    caption(g, 180, 52, "CLOCK");
    const seconds = 10 * 3600 + 8 * 60 + 30 + t;
    clockFace(g, 226, 108, 44, { hours: Math.floor(seconds / 3600) % 12, minutes: (seconds / 60) % 60, seconds: seconds % 60 }, { numerals: true });

    caption(g, 180, 168, "RETICLES");
    reticle(g, 196, 192, 26, { style: "cross" });
    reticle(g, 232, 192, 26, { style: "circle" });
    reticle(g, 266, 192, 22, { style: "dot" });

    caption(g, 300, 52, "TARGET BOX");
    targetBox(g, { x: 304, y: 74, width: 54, height: 38 }, { label: "BUOY 7", detail: "0.4" });
    targetBox(g, { x: 378, y: 74, width: 40, height: 38 }, { label: "LOCK", locked: true });

    caption(g, 300, 138, "LEVEL METERS");
    const level = 0.55 + 0.4 * Math.sin(t * 2.3) * Math.sin(t * 0.7);
    levelMeter(g, { x: 300, y: 148, width: 122, height: 7 }, level, { segments: 16, peak: 0.9 });
    levelMeter(g, { x: 300, y: 160, width: 122, height: 7 }, 0.5 + 0.35 * Math.sin(t * 1.7 + 1), { segments: 16 });

    caption(g, 300, 182, "DEVIATION");
    deviationBar(g, { x: 300, y: 190, width: 122, height: 14 }, 1.25 * Math.sin(t * 0.4));

    caption(g, 180, 222, "LINEAR GAUGE");
    linearGauge(g, { x: 180, y: 228, width: 242, height: 32 }, 55 + 30 * Math.sin(t * 0.5), {
      min: 0, max: 100, ticks: 5, format: (v) => String(Math.round(v)), target: 80,
      zones: [{ from: 80, to: 100, gray: G.max }]
    });

    caption(g, 444, 52, "BAR GAUGE");
    barGauge(g, { x: 444, y: 64, width: 60, height: 112 }, 21 + 6 * Math.sin(t * 0.3), {
      min: 0, max: 40, ticks: 5, format: (v) => `${Math.round(v)}°`, target: 26
    });
    levelMeter(g, { x: 524, y: 64, width: 7, height: 112 }, level, { segments: 14 });
    levelMeter(g, { x: 536, y: 64, width: 7, height: 112 }, 0.5 + 0.4 * Math.sin(t * 1.9), { segments: 14 });

    caption(g, 444, 196, "ARROW · SCALE BAR");
    const a = t * 0.6;
    g.arrow(470 - Math.cos(a) * 14, 224 - Math.sin(a) * 14, 470 + Math.cos(a) * 14, 224 + Math.sin(a) * 14, { stroke: G.max, width: 2 }, 8);
    scaleBar(g, 496, 252, 56, "200 m");

    footer(ctx, "STROKES ONLY · NOTHING HERE FILLS THE VIEW");
  }
};
