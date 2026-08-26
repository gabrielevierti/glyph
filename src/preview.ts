import {
  ChangeRecorder, GlyphApp, GlyphFrame, TILE_LAYOUTS, grayToRgba, layoutToSource,
  loadFontSet, safe as SAFE, screen as SCREEN,
  type GlyphFontSet, type SurfaceStyle, type TileLayout, type TileLayoutName
} from "./glyph/index.js";
import { GlyphRuntime } from "./glyph/runtime.js";
import { benchScreen } from "./apps/bench.js";
import { screens } from "./apps/index.js";

/**
 * Development harness.
 *
 * The preview is not a simulator — it paints the same framebuffer the G2 gets,
 * at the same 16 levels, then scales it up with nearest-neighbour so you are
 * looking at real pixels rather than an interpolation of them.
 *
 * Everything here exists to make a cost visible while the design decision that
 * causes it is still being made: dirty tiles per paint, ink, contrast, and the
 * cheapest tile shape for whatever is currently on screen.
 */

const FONT_URL = "/fonts/inter.json";

const allScreens = new URLSearchParams(location.search).has("bench")
  ? [...screens, benchScreen]
  : screens;

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <div class="shell">
    <div class="stage">
      <canvas id="screen" width="${SCREEN.width}" height="${SCREEN.height}"></canvas>
      <canvas id="overlay" class="overlay"></canvas>
    </div>
    <div class="bar">
      <div class="group">
        <button data-action="prev" aria-label="Previous screen">‹</button>
        <span id="screen-name">—</span>
        <button data-action="next" aria-label="Next screen">›</button>
      </div>
      <div class="group">
        <label>Tiles
          <select id="layout">
            ${Object.entries(TILE_LAYOUTS).map(([k, v]) => `<option value="${k}" title="${v.note ?? ""}"${k === "quadrants" ? " selected" : ""}>${k}</option>`).join("")}
          </select>
        </label>
        <button data-action="optimise" title="Search for the cheapest tile shape for this screen" style="width:auto;padding:0 8px">optimise</button>
        <label>Zoom
          <select id="zoom">
            <option value="1">1×</option>
            <option value="2" selected>2×</option>
            <option value="3">3×</option>
          </select>
        </label>
        <label>Surface
          <select id="surface">
            <option value="outline" selected>outline</option>
            <option value="filled">filled</option>
          </select>
        </label>
        <label>Bright
          <input type="range" id="brightness" min="20" max="100" value="100" step="5">
        </label>
        <label class="check"><input type="checkbox" id="gridToggle"> Grid</label>
        <label class="check"><input type="checkbox" id="lintToggle"> Lint</label>
      </div>
      <div class="group stats">
        <span id="conn" class="dot">offline</span>
        <span id="stats">—</span>
      </div>
    </div>
    <div class="bar notes"><span id="note">—</span></div>
  </div>
`;

const screenCanvas = document.querySelector<HTMLCanvasElement>("#screen")!;
const overlay = document.querySelector<HTMLCanvasElement>("#overlay")!;
const stage = document.querySelector<HTMLDivElement>(".stage")!;
const nameLabel = document.querySelector<HTMLSpanElement>("#screen-name")!;
const layoutSelect = document.querySelector<HTMLSelectElement>("#layout")!;
const zoomSelect = document.querySelector<HTMLSelectElement>("#zoom")!;
const gridToggle = document.querySelector<HTMLInputElement>("#gridToggle")!;
const lintToggle = document.querySelector<HTMLInputElement>("#lintToggle")!;
const surfaceSelect = document.querySelector<HTMLSelectElement>("#surface")!;
const brightnessInput = document.querySelector<HTMLInputElement>("#brightness")!;
const connLabel = document.querySelector<HTMLSpanElement>("#conn")!;
const statsLabel = document.querySelector<HTMLSpanElement>("#stats")!;
const noteLabel = document.querySelector<HTMLSpanElement>("#note")!;

const ctx = screenCanvas.getContext("2d")!;
const imageData = ctx.createImageData(SCREEN.width, SCREEN.height);

let runtime: GlyphRuntime | null = null;
let connecting = false;
let fontSet: GlyphFontSet | null = null;
let measuredLayout: TileLayout | null = null;
let slowFrames = 0;

function currentLayout(): TileLayout {
  if (layoutSelect.value === "measured" && measuredLayout) return measuredLayout;
  return TILE_LAYOUTS[layoutSelect.value as TileLayoutName] ?? TILE_LAYOUTS.quadrants;
}

let app = createApp();

function createApp(): GlyphApp {
  const instance = new GlyphApp({
    screens: allScreens,
    tileLayout: currentLayout(),
    supersample: 2,
    fps: 20,
    font: fontSet,
    brightness: Number(brightnessInput.value) / 100,
    surface: surfaceSelect.value as SurfaceStyle,
    onSlowFrame: () => { slowFrames++; },
    onPaint: (levels, a) => {
      imageData.data.set(grayToRgba(levels));
      ctx.putImageData(imageData, 0, 0);
      nameLabel.textContent = a.screen.name;

      const transport = a.transportStats;
      const parts = [
        `${a.fps.toFixed(0)} fps`,
        `${a.lastDirtyTiles}/${currentLayout().tiles.length} dirty`
      ];
      if (transport) parts.push(`${transport.p50.toFixed(0)}/${transport.p95.toFixed(0)} ms p50/p95`);
      if (slowFrames) parts.push(`${slowFrames} slow`);
      statsLabel.textContent = parts.join(" · ");

      if (lintToggle.checked) {
        const warnings = a.frame.raster.contrastWarnings;
        noteLabel.textContent = warnings.length === 0
          ? "contrast: clean"
          : `contrast: ${warnings.length} low-delta glyph${warnings.length === 1 ? "" : "s"} — ` +
            warnings.slice(0, 3).map((w) => `"${w.text}" ${w.gray} on ${w.background}`).join(", ");
        a.frame.raster.clearContrastWarnings();
      }
    }
  });
  instance.start();
  return instance;
}

function rebuild(): void {
  const index = app.screenIndex;
  app.dispose();
  void runtime?.stop();
  runtime = null;
  connecting = false;
  slowFrames = 0;
  connLabel.textContent = "offline";
  connLabel.classList.remove("on");
  app = createApp();
  if (lintToggle.checked) app.frame.raster.enableContrastLint();
  app.goto(index);
  drawGrid();
  void connect();
}

// ── Zoom and pixel grid ────────────────────────────────────────────────────

function applyZoom(): void {
  const zoom = Number(zoomSelect.value);
  stage.style.width = `${SCREEN.width * zoom}px`;
  stage.style.height = `${SCREEN.height * zoom}px`;
  overlay.width = SCREEN.width * zoom;
  overlay.height = SCREEN.height * zoom;
  drawGrid();
}

function drawGrid(): void {
  const octx = overlay.getContext("2d")!;
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (!gridToggle.checked) return;
  const zoom = Number(zoomSelect.value);
  octx.strokeStyle = "rgba(120,220,170,0.16)";
  octx.lineWidth = 1;
  const step = zoom >= 3 ? 1 : 8;
  for (let x = 0; x <= SCREEN.width; x += step) {
    octx.beginPath(); octx.moveTo(x * zoom + 0.5, 0); octx.lineTo(x * zoom + 0.5, overlay.height); octx.stroke();
  }
  for (let y = 0; y <= SCREEN.height; y += step) {
    octx.beginPath(); octx.moveTo(0, y * zoom + 0.5); octx.lineTo(overlay.width, y * zoom + 0.5); octx.stroke();
  }
  // Tile boundaries, so you can see what the transport actually sends.
  octx.strokeStyle = "rgba(255,180,120,0.45)";
  for (const tile of currentLayout().tiles) {
    octx.strokeRect(tile.x * zoom + 0.5, tile.y * zoom + 0.5, tile.width * zoom, tile.height * zoom);
  }
}

// ── Controls ───────────────────────────────────────────────────────────────

surfaceSelect.addEventListener("change", () => {
  app.surface = surfaceSelect.value as SurfaceStyle;
});

brightnessInput.addEventListener("input", () => {
  app.brightness = Number(brightnessInput.value) / 100;
});

lintToggle.addEventListener("change", () => {
  if (lintToggle.checked) {
    app.frame.raster.enableContrastLint();
    noteLabel.textContent = "contrast: measuring…";
  } else {
    noteLabel.textContent = "—";
  }
  app.invalidate();
});

zoomSelect.addEventListener("change", applyZoom);
gridToggle.addEventListener("change", drawGrid);
applyZoom();

document.querySelector(".bar")!.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).dataset.action;
  if (action === "next") app.next();
  if (action === "prev") app.previous();
  if (action === "optimise") void optimiseLayout();
});

screenCanvas.addEventListener("click", () => app.next());

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); app.next(); }
  if (event.key === "ArrowLeft") { event.preventDefault(); app.previous(); }
  if (event.key === "ArrowDown") { event.preventDefault(); app.handleInput({ type: "scroll-down" }); }
  if (event.key === "ArrowUp") { event.preventDefault(); app.handleInput({ type: "scroll-up" }); }
  if (/^[1-9]$/.test(event.key)) app.goto(Number(event.key) - 1);
});

layoutSelect.addEventListener("change", rebuild);

/**
 * Measure what actually changes on the current screen, then search every
 * guillotine tiling for the cheapest one. This is the rule from the tile table
 * — put the seams between regions that change at different rates — applied by
 * something that does not get bored counting.
 */
async function optimiseLayout(): Promise<void> {
  const screen = app.screen;
  noteLabel.textContent = `measuring ${screen.name}…`;
  await new Promise((r) => setTimeout(r, 0));

  const probe = new GlyphFrame({
    supersample: 2,
    surface: app.surface,
    brightness: app.brightness
  });
  if (fontSet) probe.raster.useFont(fontSet);
  const recorder = new ChangeRecorder();
  for (let step = 0; step <= 20; step++) {
    probe.raster.clear(0);
    screen.render({
      g: probe.raster, now: 4000 + step * 100,
      screen: { x: 0, y: 0, ...SCREEN }, safe: SAFE, app
    });
    recorder.observe(probe.toLevels());
  }

  const started = performance.now();
  const best = recorder.suggest({ step: 16, name: `measured-${screen.name.toLowerCase()}` });
  const baseline = recorder.cost(TILE_LAYOUTS.quadrants);
  const elapsed = performance.now() - started;
  probe.dispose();

  measuredLayout = best.layout;
  if (!Array.from(layoutSelect.options).some((o) => o.value === "measured")) {
    const option = document.createElement("option");
    option.value = "measured";
    layoutSelect.append(option);
  }
  const option = Array.from(layoutSelect.options).find((o) => o.value === "measured")!;
  option.textContent = `measured (${screen.name})`;
  option.title = best.layout.note ?? "";
  layoutSelect.value = "measured";

  const saving = baseline.bytes === 0 ? 0 : (1 - best.bytes / baseline.bytes) * 100;
  noteLabel.textContent =
    `${best.layout.note} — ${(best.bytes / 1024).toFixed(0)} KB vs ${(baseline.bytes / 1024).toFixed(0)} KB ` +
    `for quadrants (${saving >= 0 ? "-" : "+"}${Math.abs(saving).toFixed(0)}%), ` +
    `${best.tilesPerFrame.toFixed(2)} tiles/frame, searched in ${elapsed.toFixed(0)} ms. ` +
    "Source printed to the console.";
  console.log(layoutToSource(best.layout));
  rebuild();
}

// ── Fonts ──────────────────────────────────────────────────────────────────

/**
 * A bitmap atlas makes text host-independent. It is optional: without one the
 * preview falls back to canvas text, which looks the same on this machine and
 * subtly different on the next.
 */
async function loadFont(): Promise<void> {
  try {
    fontSet = await loadFontSet(FONT_URL);
    app.useFont(fontSet);
    noteLabel.textContent = `bitmap font: ${fontSet.keys().length} faces`;
  } catch {
    noteLabel.textContent = "bitmap font: not built — run `npm run font` for host-independent text";
  }
}

void loadFont();

// ── G2 connection ──────────────────────────────────────────────────────────

async function connect(): Promise<void> {
  if (connecting || runtime?.isConnected) return;
  connecting = true;
  const candidate = new GlyphRuntime({ tileLayout: currentLayout(), debug: true, timeoutMs: 8000 });
  candidate.setOnStateChange((state) => {
    connLabel.textContent = state.connected ? "on glasses" : "offline";
    connLabel.classList.toggle("on", state.connected);
  });
  try {
    await candidate.start();
    runtime = candidate;
    app.attachRuntime(candidate);
    candidate.onInput((event) => app.handleInput(event));
  } catch {
    runtime = null;
    app.attachRuntime(null);
  } finally {
    connecting = false;
  }
}

void connect();
setInterval(() => void connect(), 5000);
