import {
  checkGroup, countdownRing, dial, equalizer, gray as G, keypad, mediaTransport, numberStepper, pickerWheel, pinDots,
  radioGroup, rangeSlider, segmentedControl, sliderRow, stopLine, switchRow, textField, type as T, waveform
} from "../glyph/index.js";
import type { GlyphRaster, Screen } from "../glyph/index.js";
import { caption, footer, header, rect } from "./kit.js";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Inputs — controls for an interface with four gestures and no pointer. */
export const inputsScreen: Screen = {
  name: "Inputs",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    const focus = Math.floor(t / 2) % 4;
    header(g, "Inputs", "FOCUS · SCROLL · TAP");

    segmentedControl(g, rect(24, 54, 172, 24), ["DAY", "WEEK", "MONTH"], Math.floor(t / 3) % 3, { focused: focus === 0 });
    numberStepper(g, rect(24, 92, 104, 26), String(8 + (Math.floor(t) % 6)), { focused: focus === 1, canDecrement: Math.floor(t) % 6 !== 0 });
    pinDots(g, 166, 105, 4, Math.floor(t) % 5, { radius: 3.5, gap: 7 });

    textField(g, rect(24, 128, 172, 40), "Portofino outer mark".slice(0, 6 + (Math.floor(t * 2) % 15)), {
      label: "DESTINATION", icon: "search", focused: focus === 2, caret: Math.floor(t * 2) % 2 === 0
    });
    rangeSlider(g, rect(24, 176, 172, 16), 0.2 + 0.1 * Math.sin(t * 0.7), 0.7 + 0.1 * Math.cos(t * 0.5), { steps: 6 });
    dial(g, 52, 232, 22, 0.5 + 0.4 * Math.sin(t * 0.5), { valueText: String(Math.round(50 + 40 * Math.sin(t * 0.5))), label: "VOL", focused: focus === 3 });
    dial(g, 116, 232, 22, 0.3, { valueText: "30", label: "DIM", ticks: 7 });
    textField(g, rect(152, 220, 44, 24), "2468", { secure: true });

    switchRow(g, rect(212, 52, 176, 26), "Night mode", true, { icon: "moon", focused: focus === 0 });
    switchRow(g, rect(212, 82, 176, 32), "Wake on glance", Math.floor(t / 2) % 2 === 0, { detail: "Lift your head to wake" });
    sliderRow(g, rect(212, 120, 176, 34), "Brightness", 0.6 + 0.3 * Math.sin(t * 0.6), { valueText: `${Math.round(60 + 30 * Math.sin(t * 0.6))}%` });
    radioGroup(g, rect(212, 162, 176, 44), ["Metric", "Nautical"], Math.floor(t / 4) % 2, { focused: focus === 1 ? 1 : undefined });
    checkGroup(g, rect(212, 212, 176, 44), ["Show traffic", "Avoid tolls"], [true, Math.floor(t / 3) % 2 === 0]);

    caption(g, 404, 54, "PICKER WHEELS");
    const minute = (t * 0.6) % MINUTES.length;
    pickerWheel(g, rect(404, 62, 44, 92), HOURS, 19 + 0.5 - 0.5 * Math.cos(Math.min(1, (t % 6) / 1.2) * Math.PI), { focused: focus === 2 });
    g.text(":", 454, 107, T.bodyStrong, G.max, "center", "middle");
    pickerWheel(g, rect(460, 62, 44, 92), MINUTES, Math.min(MINUTES.length - 1, minute));
    caption(g, 520, 54, "CODE");
    pinDots(g, 536, 108, 3, Math.floor(t) % 4, { radius: 4, gap: 6 });

    keypad(g, rect(404, 166, 150, 92), { focused: Math.floor(t * 1.5) % 12, pressed: Math.floor(t * 1.5) % 12 === 4 ? 4 : undefined });

    footer(ctx, "FOCUS IS DRAWN THE SAME WAY ON EVERY CONTROL");
  }
};

/** A stand-in photograph, built in code so the demo needs no image files. */
let picture: HTMLCanvasElement | null = null;
function samplePicture(): HTMLCanvasElement {
  if (picture) return picture;
  const c = document.createElement("canvas");
  c.width = 240; c.height = 240;
  const x = c.getContext("2d")!;
  const sky = x.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, "#111"); sky.addColorStop(1, "#bbb");
  x.fillStyle = sky; x.fillRect(0, 0, 240, 150);
  const sun = x.createRadialGradient(150, 112, 4, 150, 112, 70);
  sun.addColorStop(0, "#fff"); sun.addColorStop(0.25, "#eee"); sun.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = sun; x.fillRect(0, 0, 240, 150);
  const sea = x.createLinearGradient(0, 150, 0, 240);
  sea.addColorStop(0, "#777"); sea.addColorStop(1, "#080808");
  x.fillStyle = sea; x.fillRect(0, 150, 240, 90);
  x.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 9; i++) x.fillRect(150 - 34 + i * 3, 156 + i * 9, 68 - i * 6, 2);
  x.fillStyle = "#050505";
  x.beginPath(); x.moveTo(0, 150); x.lineTo(46, 96); x.lineTo(82, 132); x.lineTo(110, 150); x.fill();
  x.beginPath(); x.moveTo(58, 176); x.lineTo(98, 176); x.lineTo(90, 188); x.lineTo(64, 188); x.fill();
  x.beginPath(); x.moveTo(78, 174); x.lineTo(78, 126); x.lineTo(100, 170); x.fill();
  picture = c;
  return c;
}

function photo(g: GlyphRaster, x: number, label: string, dither: "ordered" | "diffusion" | "none"): void {
  caption(g, x, 54, label);
  g.image(samplePicture(), rect(x, 62, 80, 80), { dither, radius: 6, maxLevel: 13 });
}

const BANDS = [0.5, 0.8, 0.65, 0.9, 0.55, 0.7, 0.4, 0.6, 0.3, 0.45];
const ENVELOPE = Array.from({ length: 160 }, (_, i) => 0.15 + 0.8 * Math.abs(Math.sin(i * 0.21) * Math.sin(i * 0.047 + 1)));

/** Media · Transit — playback, images, and a route as a line of stops. */
export const mediaScreen: Screen = {
  name: "Media · Transit",
  animated: true,

  render(ctx) {
    const { g, now } = ctx;
    const t = now / 1000;
    const duration = 214;
    const position = (84 + t * 4) % duration;
    header(g, "Media · Transit", "PLAYBACK · IMAGES · ROUTES");

    mediaTransport(g, rect(24, 52, 240, 92), {
      title: "Harbour Lights", artist: "The Evening Tide · Slack Water", position, duration, playing: Math.floor(t / 5) % 2 === 0
    });
    waveform(g, rect(24, 154, 240, 30), ENVELOPE, { progress: position / duration });

    caption(g, 24, 198, "EQUALIZER");
    equalizer(g, rect(24, 208, 118, 50), BANDS.map((v, i) => v * (0.6 + 0.4 * Math.abs(Math.sin(t * (1.5 + i * 0.23) + i)))), { segments: 8 });
    caption(g, 164, 198, "COUNTDOWN");
    countdownRing(g, 236, 233, 27, 272 - (t % 272), 300, { label: "TACK" });

    photo(g, 288, "ORDERED", "ordered");
    photo(g, 381, "DIFFUSION", "diffusion");
    photo(g, 474, "NEAREST", "none");

    caption(g, 288, 158, "STOP LINE");
    stopLine(g, rect(288, 166, 266, 52), [
      { name: "Cadorna", time: "08:02" }, { name: "Cairoli" }, { name: "Cordusio" }, { name: "Duomo", time: "08:09" },
      { name: "San Babila" }, { name: "Palestro" }, { name: "Porta Venezia", time: "08:16" }
    ], { current: (t * 0.25) % 6 });

    stopLine(g, rect(288, 226, 266, 34), [{ name: "Home" }, { name: "Gym" }, { name: "Office" }, { name: "Dock" }], { current: 2, labels: "all" });

    footer(ctx, "PHOTOGRAPHS DITHERED TO 16 LEVELS · NO IMAGE FILES");
  }
};
