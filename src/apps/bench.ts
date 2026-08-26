import {
  bottom, centerX, centerY, column, gray as G, grow, keyValue,
  panel, right, row, section, space as S, type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/**
 * Transport benchmark.
 *
 * Bytes per second is a proxy. What actually caps your frame rate is the round
 * trip for one image-container update over BLE, and that number is not in any
 * datasheet — so this screen measures it on the hardware and shows you.
 *
 * The left half deliberately animates every tile: a moving wash is the worst
 * case, four dirty tiles every paint, which is the number you want when the
 * question is "what is the ceiling". The right half reports what came back.
 *
 * Reachable at `?bench` in the preview and via `npm run bench` on device. It is
 * not in the default screen set — it is an instrument, not a design.
 */
export const benchScreen: Screen = {
  name: "Bench",
  animated: true,

  render({ g, now, safe, app }: RenderContext) {
    const [head, body, foot] = column(safe, [{ size: 16 }, { size: grow(1) }, { size: 14 }], { gap: S.sm });

    g.text("TRANSPORT BENCHMARK", head.x, centerY(head), T.label, G.secondary, "left", "middle");
    g.text(app.frame.tileLayout.name.toUpperCase(), right(head), centerY(head), T.micro, G.tertiary, "right", "middle");

    const [stress, report] = row(body, [{ size: grow(1) }, { size: 246 }], { gap: S.md });

    // ── Worst case: something moving in every tile ────────────────────────
    panel(g, stress);
    const phase = (now / 900) % 1;
    g.scoped((layer) => {
      layer.clipRound(stress, 12);
      layer.hatch(stress, 14, G.hairline, Math.PI / 4 + phase * Math.PI, 1);
    });
    g.vline(stress.x + 8 + phase * (stress.width - 16), stress.y + 8, bottom(stress) - 8, G.strong, 2);
    g.text("ALL TILES DIRTY", centerX(stress), centerY(stress), T.label, G.max, "center", "middle");

    // ── What the glasses actually managed ─────────────────────────────────
    const inner = section(g, report, "Round trip", { icon: "activity" });
    const stats = app.transportStats;

    if (!stats) {
      g.text("NOT CONNECTED", centerX(inner), centerY(inner) - 7, T.label, G.disabled, "center", "middle");
      g.text("run on device to measure", centerX(inner), centerY(inner) + 8, T.caption, G.tertiary, "center", "middle");
    } else {
      const rows = column(inner, Array.from({ length: 6 }, () => ({ size: grow(1) })));
      const ms = (v: number) => `${v.toFixed(1)} ms`;
      keyValue(g, rows[0], "p50", ms(stats.p50));
      keyValue(g, rows[1], "p95", ms(stats.p95));
      keyValue(g, rows[2], "last", ms(stats.last));
      keyValue(g, rows[3], "tiles/s", stats.rate.toFixed(1));
      keyValue(g, rows[4], "dropped", String(stats.dropped));
      keyValue(g, rows[5], "sent", `${(stats.bytes / 1024).toFixed(0)} KB`);
    }

    // The ceiling that falls out of p50: every tile, every frame, at that latency.
    const tiles = app.frame.tileLayout.tiles.length;
    const ceiling = stats && stats.p50 > 0 ? 1000 / (stats.p50 * tiles) : 0;
    g.text(
      stats ? `CEILING ≈ ${ceiling.toFixed(1)} FPS AT ${tiles} TILES/FRAME` : "ATTACH GLASSES TO MEASURE",
      foot.x, centerY(foot), T.micro, G.tertiary, "left", "middle"
    );
    g.text(`${app.lastDirtyTiles} DIRTY`, right(foot), centerY(foot), T.micro, G.secondary, "right", "middle");
  }
};
