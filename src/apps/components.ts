import {
  badge, bottom, button, centerX, centerY, column, emptyState, gray as G,
  grow, keyValue, listRow, pageDots, pill, progressBar, right, row, section, segmentedBar,
  space as S, tag, toast, toggle, type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/** Components — the convenience layer, on one screen. */

export const componentsScreen: Screen = {
  name: "Components",
  animated: true,

  render({ g, now, safe, app }: RenderContext) {
    const t = now / 1000;
    const [header, body, footer] = column(safe, [{ size: 14 }, { size: grow(1) }, { size: 16 }], { gap: S.sm });

    g.text("GLYPH · COMPONENTS", header.x, centerY(header), T.label, G.secondary, "left", "middle");
    g.hline(header.x, right(header), header.y + 13, G.hairline);

    const [leftCol, midCol, rightCol] = row(body, [{ size: grow(1) }, { size: grow(1) }, { size: grow(1) }], { gap: S.sm });

    // ── Lists ─────────────────────────────────────────────────────────────
    const listInner = section(g, leftCol, "List rows", { icon: "list" });
    const items = [
      { icon: "anchor" as const, title: "Ormeggio", value: "18m", selected: false },
      { icon: "route" as const, title: "Rotta attiva", value: "14.2", selected: true },
      { icon: "boat" as const, title: "Motore", value: "OK", selected: false }
    ];
    items.forEach((item, i) => {
      listRow(g, { x: listInner.x - 6, y: listInner.y + i * 30, width: listInner.width + 12, height: 30 }, {
        ...item, chevron: true
      });
    });
    keyValue(g, { x: listInner.x, y: listInner.y + 94, width: listInner.width, height: 16 }, "Batteria", "72%", { leader: true });
    keyValue(g, { x: listInner.x, y: listInner.y + 112, width: listInner.width, height: 16 }, "Serbatoio", "41 L", { leader: true });

    // ── Controls ──────────────────────────────────────────────────────────
    const controlsInner = section(g, midCol, "Controls", { icon: "sliders" });
    button(g, { x: controlsInner.x, y: controlsInner.y, width: 82, height: 26 }, "Salva", { primary: true, icon: "check" });
    button(g, { x: controlsInner.x + 90, y: controlsInner.y, width: 72, height: 26 }, "Annulla", { focused: true });

    toggle(g, controlsInner.x, controlsInner.y + 44, Math.sin(t) > 0);
    g.text("Ancora", controlsInner.x + 40, controlsInner.y + 44, T.caption, G.secondary, "left", "middle");
    toggle(g, controlsInner.x + 96, controlsInner.y + 44, Math.sin(t) <= 0);

    progressBar(g, { x: controlsInner.x, y: controlsInner.y + 64, width: controlsInner.width, height: 8 },
      0.5 + Math.sin(t / 2) * 0.45);
    segmentedBar(g, { x: controlsInner.x, y: controlsInner.y + 80, width: controlsInner.width, height: 9 }, 8,
      Math.floor(4 + Math.sin(t) * 3));

    let px = controlsInner.x;
    px += pill(g, px, controlsInner.y + 106, "ATTIVO", { icon: "check-circle" }) + 6;
    px += tag(g, px, controlsInner.y + 106, "BETA") + 8;
    badge(g, px + 8, controlsInner.y + 106, 12);

    // ── Overlays ──────────────────────────────────────────────────────────
    const overlayInner = section(g, rightCol, "Overlays", { icon: "layers" });
    toast(g, { x: overlayInner.x, y: overlayInner.y, width: overlayInner.width, height: 28 }, "Rotta salvata", { icon: "check" });
    emptyState(g, { x: overlayInner.x, y: overlayInner.y + 34, width: overlayInner.width, height: 78 },
      "search", "Nessun risultato", "Prova un altro termine di ricerca");

    g.text("TOAST · EMPTY STATE · SCRIM", overlayInner.x, bottom(overlayInner) - 2, T.micro, G.tertiary, "left", "bottom");

    pageDots(g, centerX(footer), centerY(footer) + 2, app.screens.length, app.screenIndex);
  }
};
