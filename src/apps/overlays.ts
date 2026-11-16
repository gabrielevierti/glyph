import {
  banner, bottomSheet, callout, captions, chatBubble, dialog, gray as G, hintBar, indeterminateBar, keycap,
  listeningIndicator, loadingState, marquee, menu, notificationCard, skeleton, teleprompter, type as T, typewriter, wrap
} from "../glyph/index.js";
import type { MenuItem, Screen } from "../glyph/index.js";
import { caption, footer, header, rect } from "./kit.js";

/** Overlays — things that arrive on top of a screen and ask for attention. */
export const overlaysScreen: Screen = {
  name: "Overlays",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "Overlays", "DIALOG · ALERTS · HINTS");

    dialog(g, rect(22, 50, 256, 128), {
      icon: "alert-triangle",
      title: "Delete route?",
      message: "Portofino via the outer mark will be removed from this device.",
      actions: ["Cancel", "Delete"],
      focused: Math.floor(t / 2) % 2
    });

    callout(g, rect(22, 186, 176, 56), "Double tap to send a notification away.", { pointer: "right", title: "Tip" });
    keycap(g, 214, 203, "DOUBLE TAP");
    keycap(g, 214, 225, "SCROLL");

    notificationCard(g, rect(292, 50, 262, 86), {
      app: "MESSAGES", icon: "message", time: "NOW",
      title: "Marta",
      body: "Leaving the harbour office now. Ten minutes, I will bring the charts."
    });

    banner(g, rect(292, 144, 262, 24), "Firmware 2.1 is ready", { kind: "info", detail: "INSTALL" });
    banner(g, rect(292, 173, 262, 24), "Shoal ahead", { kind: "warning", detail: "0.3 NM" });
    banner(g, rect(292, 202, 262, 36), "Connection lost", { kind: "error", detail: "Trying again in 5 seconds" });

    hintBar(g, rect(22, 246, 532, 14), [
      { gesture: "tap", label: "SELECT" },
      { gesture: "double-tap", label: "BACK" },
      { gesture: "scroll-up", label: "PREVIOUS" },
      { gesture: "scroll-down", label: "NEXT" }
    ], { align: "right" });

    footer(ctx, "OVERLAYS CLEAR THEIR OWN AREA · NO SCRIM NEEDED");
  }
};

const ROUTE_OPTIONS: MenuItem[] = [
  { label: "Avoid tolls", icon: "ban", checked: true },
  { label: "Voice guidance", icon: "volume", value: "On" },
  { label: "Units", icon: "ruler", value: "Nautical", chevron: true },
  { label: "Share position", icon: "share", chevron: true },
  { label: "Night mode", icon: "moon", value: "Auto" },
  { label: "Offline maps", icon: "download", disabled: true },
  { label: "End route", icon: "x-circle" }
];

/** Sheets and waiting — a sheet with a menu, and the ways of saying "not yet". */
export const sheetsScreen: Screen = {
  name: "Sheets · Waiting",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "Sheets · Waiting", "SHEET · MENU · PROGRESS");

    // A screen with something on it, so the sheet has something to cover.
    const area = rect(22, 48, 300, 214);
    g.roundRect(area, 12, { stroke: G.hairline, width: 1 });
    g.text("Route to Portofino", 38, 66, T.bodyStrong, G.secondary, "left", "middle");
    skeleton(g, rect(38, 82, 250, 32), 3);

    const content = bottomSheet(g, area, { height: 154, title: "Route options" });
    const selected = Math.floor(t / 1.4) % ROUTE_OPTIONS.length;
    menu(g, content, ROUTE_OPTIONS, { selected, rowHeight: 26 });

    caption(g, 342, 52, "LOADING STATE");
    loadingState(g, rect(342, 60, 212, 82), "Finding satellites", now, { detail: "7 of 12 in view" });
    indeterminateBar(g, rect(372, 148, 152, 5), now);

    caption(g, 342, 172, "LISTENING");
    listeningIndicator(g, 384, 222, 32, 0.5 + 0.5 * Math.sin(t * 3), now);
    listeningIndicator(g, 462, 222, 32, 0, now, { state: "processing" });
    listeningIndicator(g, 528, 222, 24, 0, now, { state: "idle" });

    footer(ctx, "SCROLL MOVES THE HIGHLIGHT · TAP CHOOSES");
  }
};

const SPEECH =
  "the tide turns at half past six so we should be past the outer mark before then " +
  "otherwise it is a long beat back against the current and nobody wants that";

const SCRIPT =
  "Good evening and welcome aboard. Tonight we cover three things: where the display " +
  "is useful, where it gets in the way, and how to tell the difference before you " +
  "ship. The first rule is simple. Whatever you draw sits on top of the world, so " +
  "draw less than you think you need.";

/** Reading — text that arrives over time: captions, a prompter, a conversation. */
export const readingScreen: Screen = {
  name: "Reading",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    header(g, "Reading", "CAPTIONS · PROMPTER · CHAT");

    caption(g, 22, 52, "LIVE CAPTIONS");
    const words = SPEECH.split(" ");
    const said = 4 + (Math.floor(t * 2.2) % (words.length - 4));
    captions(g, rect(22, 60, 262, 82), words.slice(0, Math.max(0, said - 2)).join(" "), {
      speaker: "SKIPPER", interim: words.slice(Math.max(0, said - 2), said).join(" ")
    });

    caption(g, 22, 158, "TELEPROMPTER");
    const lines = wrap(g.measure, SCRIPT, T.body, 262).length;
    teleprompter(g, rect(22, 166, 262, 96), SCRIPT, (t * 0.45) % Math.max(1, lines), { style: T.body });

    caption(g, 304, 52, "CONVERSATION");
    let y = 60;
    y += chatBubble(g, rect(304, y, 250, 60), "Are you close? They are holding the table.", { from: "them", name: "MARTA", time: "19:42" }) + 6;
    y += chatBubble(g, rect(304, y, 250, 60), "Ten minutes. Just passing the lighthouse.", { from: "me", time: "19:43" }) + 6;
    chatBubble(g, rect(304, y, 250, 30), "Perfect.", { from: "them" });

    caption(g, 304, 190, "MARQUEE");
    marquee(g, rect(304, 197, 250, 20), "Now playing · Harbour Lights · The Evening Tide · from the album Slack Water", now, { gray: G.primary });

    caption(g, 304, 228, "TYPEWRITER");
    typewriter(g, rect(304, 234, 250, 28), "Course set for the outer mark.", ((t * 0.35) % 1.4) / 1.0, { style: T.body });

    footer(ctx, "NEWEST WORDS BRIGHTEST · OLDER LINES FADE");
  }
};
