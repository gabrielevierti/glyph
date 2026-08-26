import {
  GlyphPath, bottom, centerX, centerY, column, divider, gray as G,
  grid, grow, icon, iconNames, pageDots, right, row, space as S, type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/**
 * Primitives — the drawing surface, shown rather than described.
 *
 * Every panel on this screen is one or two calls. If something you want to
 * design is not expressible here, the primitive layer is missing something.
 */

const wave = new GlyphPath()
  .moveTo(0, 12)
  .curveTo(8, 0, 16, 24, 24, 12)
  .curveTo(32, 0, 40, 24, 48, 12);

export const primitivesScreen: Screen = {
  name: "Primitives",
  animated: true,

  render({ g, now, safe, app }: RenderContext) {
    const t = now / 1000;
    const [header, body, footer] = column(safe, [{ size: 14 }, { size: grow(1) }, { size: 16 }], { gap: S.sm });

    g.text("GLYPH · PRIMITIVES", header.x, centerY(header), T.label, G.secondary, "left", "middle");
    g.text("576 × 288 · 16 LEVELS", right(header), centerY(header), T.micro, G.tertiary, "right", "middle");
    g.hline(header.x, right(header), bottom(header), G.hairline);

    const [topRow, midRow, bottomRow] = column(body, [{ size: grow(1) }, { size: grow(1) }, { size: grow(1) }], { gap: S.sm });

    // ── Row 1: shapes ─────────────────────────────────────────────────────
    const shapes = row(topRow, [{ size: grow(1) }, { size: grow(1) }, { size: grow(1) }, { size: grow(1) }], { gap: S.sm });

    label(g, shapes[0], "SHAPES");
    g.roundRect({ x: shapes[0].x, y: shapes[0].y + 14, width: 30, height: 30 }, 7, { fill: G.raised, stroke: G.border });
    g.circle(shapes[0].x + 48, shapes[0].y + 29, 15, { stroke: G.strong, width: 1.5 });
    g.regularPolygon(shapes[0].x + 82, shapes[0].y + 29, 16, 6, t / 4, { fill: G.surface, stroke: G.secondary });
    g.star(shapes[0].x + 116, shapes[0].y + 29, 16, 7, 5, -t / 5, { fill: G.strong });

    label(g, shapes[1], "STROKES");
    [1, 1.5, 2.5, 4].forEach((w, i) => {
      const y = shapes[1].y + 20 + i * 9;
      g.line(shapes[1].x, y, shapes[1].x + 52, y, { stroke: G.primary, width: w });
      g.line(shapes[1].x + 62, y, shapes[1].x + 124, y, { stroke: G.secondary, width: w, dash: [6, 4], dashOffset: -t * 8 });
    });

    label(g, shapes[2], "CURVES");
    g.path(wave, shapes[2].x + 4, shapes[2].y + 16, 1.5, { stroke: G.strong, width: 1.5 });
    g.spline(
      Array.from({ length: 8 }, (_, i) => ({
        x: shapes[2].x + 4 + i * 14,
        y: shapes[2].y + 46 + Math.sin(i * 0.8 + t) * 9
      })),
      { stroke: G.max, width: 1.5 }
    );

    label(g, shapes[3], "ARCS");
    const cx = shapes[3].x + 30;
    const cy = shapes[3].y + 35;
    g.ring(cx, cy, 20, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.3, { fill: G.strong });
    g.arc(cx, cy, 24, 0, Math.PI * 2, { stroke: G.hairline, width: 1 });
    g.sector(shapes[3].x + 78, cy, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.7, { fill: G.raised, stroke: G.border });

    // ── Row 2: tone ───────────────────────────────────────────────────────
    const tones = row(midRow, [{ size: grow(1.3) }, { size: grow(1) }, { size: grow(1) }, { size: grow(1) }], { gap: S.sm });

    label(g, tones[0], "16 LEVELS · DITHERED RAMP");
    for (let i = 0; i < 16; i++) {
      const w = tones[0].width / 16;
      g.rect({ x: tones[0].x + i * w, y: tones[0].y + 14, width: w, height: 18 }, { fill: i });
    }
    g.gradient({ x: tones[0].x, y: tones[0].y + 34, width: tones[0].width, height: 22 }, 0, 15, 0);

    label(g, tones[1], "PATTERNS");
    g.hatch({ x: tones[1].x, y: tones[1].y + 14, width: 44, height: 42 }, 4, G.disabled);
    g.dots({ x: tones[1].x + 50, y: tones[1].y + 14, width: 44, height: 42 }, 5, G.secondary, 0.8);
    g.gridLines({ x: tones[1].x + 100, y: tones[1].y + 14, width: 44, height: 42 }, 7, 7, G.hairline);

    label(g, tones[2], "RADIAL");
    g.radialGradient(centerX(tones[2]), tones[2].y + 36, 26, 15, 0);

    label(g, tones[3], "ALPHA");
    [1, 0.66, 0.33].forEach((a, i) => {
      g.roundRect({ x: tones[3].x + i * 22, y: tones[3].y + 18, width: 40, height: 34 }, 6, { fill: G.max, alpha: a });
    });

    // ── Row 3: type and icons ─────────────────────────────────────────────
    const [typeBox, iconBox] = row(bottomRow, [{ size: 236 }, { size: grow(1) }], { gap: S.md });

    label(g, typeBox, "TYPE SCALE");
    g.text("46", typeBox.x, typeBox.y + 16, { ...T.display, size: 40 }, G.max, "left", "top");
    g.text("Headline", typeBox.x + 60, typeBox.y + 18, T.headline, G.primary, "left", "top");
    g.text("Body text at fourteen", typeBox.x + 60, typeBox.y + 40, T.body, G.secondary, "left", "top");
    g.text("CAPTION · LABEL · MICRO", typeBox.x + 60, typeBox.y + 56, T.micro, G.tertiary, "left", "top");

    label(g, iconBox, `ICONS · ${iconNames().length} IN THE SET`);
    const names = iconNames().slice(0, 44);
    grid({ x: iconBox.x, y: iconBox.y + 16, width: iconBox.width, height: 44 }, 22, 2, 2, 4)
      .forEach((cell, i) => {
        if (names[i]) icon(g, names[i], centerX(cell), centerY(cell), 14, i % 3 === 0 ? G.max : G.secondary);
      });

    divider(g, { x: footer.x, y: footer.y - 2, width: footer.width, height: 1 });
    pageDots(g, centerX(footer), centerY(footer) + 2, app.screens.length, app.screenIndex);
  }
};

function label(g: Parameters<Screen["render"]>[0]["g"], r: { x: number; y: number }, text: string) {
  g.text(text, r.x, r.y + 4, T.micro, G.tertiary, "left", "middle");
}
