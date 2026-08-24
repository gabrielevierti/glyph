import {
  Cursor, bottom, centerX, centerY, column, gray as G, grow, icon, inset,
  listRow, panel, pageDots, radius as R, right, ringChart, row, section, space as S,
  sparkline, statusBar, tag, type as T
} from "../glyph/index.js";
import type { RenderContext, Screen } from "../glyph/index.js";

/**
 * Dashboard — the home screen.
 *
 * A scrolling notification list next to fixed widgets. The list is the only
 * interactive region, so scroll events are consumed here and taps are allowed
 * to fall through to the app's page navigation.
 */

const notifications = [
  { icon: "message" as const, title: "Giada", subtitle: "sto arrivando, 10 min", value: "now" },
  { icon: "calendar" as const, title: "Turno scorte", subtitle: "Piazza Duomo · briefing", value: "16:00" },
  { icon: "mail" as const, title: "Even Realities", subtitle: "Re: Glyph framework", value: "12:04" },
  { icon: "bell" as const, title: "Bucato", subtitle: "ciclo terminato", value: "11:30" },
  { icon: "phone" as const, title: "Chiamata persa", subtitle: "+39 02 ···· 41", value: "10:58" }
];

const cursor = new Cursor(notifications.length, 3);

export const dashboardScreen: Screen = {
  name: "Dashboard",
  animated: true,

  onInput(event) {
    if (event.type === "scroll-down") { cursor.move(1); return true; }
    if (event.type === "scroll-up") { cursor.move(-1); return true; }
    return false;
  },

  render({ g, now, safe, app }: RenderContext) {
    const seconds = Math.floor(now / 1000) % 60;

    const [bar, body, footer] = column(safe, [{ size: 15 }, { size: grow(1) }, { size: 18 }], { gap: S.sm });
    statusBar(g, bar, { title: "Milano", battery: 0.72, signal: 4, icons: ["bluetooth"] });

    const [leftCol, rightCol] = row(body, [{ size: 262 }, { size: grow(1) }], { gap: S.md });
    const [clockBox, weatherBox, activityBox] =
      column(leftCol, [{ size: grow(1) }, { size: 44 }, { size: 46 }], { gap: S.sm });

    // ── Clock ─────────────────────────────────────────────────────────────
    panel(g, clockBox, { fill: G.surface, radius: R.xl, texture: true });
    g.text("14:32", clockBox.x + 18, centerY(clockBox) - 6, { ...T.hero, size: 62 }, G.max, "left", "middle");
    const timeWidth = g.measure("14:32", { ...T.hero, size: 62 });
    g.text(String(seconds).padStart(2, "0"), clockBox.x + 22 + timeWidth, centerY(clockBox) - 16, T.numeral, G.tertiary, "left", "middle");
    g.text("LUNEDÌ 24 AGOSTO", clockBox.x + 20, bottom(clockBox) - 14, T.label, G.secondary, "left", "middle");

    // ── Weather: one line, because that is all it deserves here ───────────
    panel(g, weatherBox, { fill: G.surface, radius: R.lg });
    icon(g, "sun", weatherBox.x + 22, centerY(weatherBox), 22, G.max);
    g.text("29°", weatherBox.x + 40, centerY(weatherBox), T.numeralLg, G.max, "left", "middle");
    g.text("Sereno", weatherBox.x + 84, centerY(weatherBox), T.caption, G.tertiary, "left", "middle");
    g.text("31° / 22°", right(weatherBox) - 14, centerY(weatherBox), { ...T.numeral, size: 12 }, G.secondary, "right", "middle");
    sparkline(g, { x: weatherBox.x + 138, y: weatherBox.y + 12, width: 50, height: 20 },
      [24, 25, 27, 29, 31, 30, 28, 26, 24], { gray: G.border, smooth: true, dot: false });

    // ── Activity: three rings, each with its own readout ──────────────────
    panel(g, activityBox, { fill: G.surface, radius: R.lg });
    const goals: Array<[string, string, number]> = [["PASSI", "8 420", 0.68], ["KCAL", "612", 0.44], ["PIANI", "14", 0.9]];
    const cells = row(inset(activityBox, S.sm), goals.map(() => ({ size: grow(1) })), { gap: S.xs });
    goals.forEach(([goalLabel, value, progress], i) => {
      const cell = cells[i];
      ringChart(g, cell.x + 15, centerY(cell), 13, progress, { width: 3.5 });
      g.text(value, cell.x + 34, centerY(cell) - 6, { ...T.numeral, size: 13 }, G.max, "left", "middle");
      g.text(goalLabel, cell.x + 34, centerY(cell) + 7, { ...T.micro, size: 8 }, G.tertiary, "left", "middle");
    });

    // ── Notifications ─────────────────────────────────────────────────────
    const listInner = section(g, rightCol, "Notifiche", { accessory: `${notifications.length}` });
    const rowHeight = 40;
    cursor.window().forEach((index, slot) => {
      const item = notifications[index];
      listRow(g, { x: listInner.x - 4, y: listInner.y + slot * rowHeight, width: listInner.width + 4, height: rowHeight }, {
        icon: item.icon,
        title: item.title,
        subtitle: item.subtitle,
        value: item.value,
        selected: index === cursor.index
      });
    });
    if (notifications.length > 3) {
      const trackHeight = 3 * rowHeight - 8;
      g.roundRect({ x: right(listInner) + 2, y: listInner.y + 4, width: 2, height: trackHeight }, 1, { fill: G.sunken });
      const thumb = (3 / notifications.length) * trackHeight;
      g.roundRect(
        { x: right(listInner) + 2, y: listInner.y + 4 + (cursor.offset / notifications.length) * trackHeight, width: 2, height: thumb },
        1, { fill: G.border }
      );
    }

    // ── Footer ────────────────────────────────────────────────────────────
    tag(g, footer.x, centerY(footer), "SCROLL PER NOTIFICHE");
    pageDots(g, centerX(footer), centerY(footer), app.screens.length, app.screenIndex);
    g.text("TAP → NEXT", right(footer), centerY(footer), T.micro, G.tertiary, "right", "middle");
  }
};
