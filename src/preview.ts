import {
  GlyphApp, TILE_LAYOUTS, grayToRgba, screen as SCREEN, setSurfaceStyle,
  type SurfaceStyle, type TileLayoutName
} from "./glyph/index.js";
import { GlyphRuntime } from "./glyph/runtime.js";
import { screens } from "./apps/index.js";

/**
 * Development harness.
 *
 * The preview is not a simulator — it paints the same framebuffer the G2 gets,
 * at the same 16 levels, then scales it up with nearest-neighbour so you are
 * looking at real pixels rather than an interpolation of them.
 */

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
            ${Object.keys(TILE_LAYOUTS).map((k) => `<option value="${k}"${k === "192x96" ? " selected" : ""}>${k}</option>`).join("")}
          </select>
        </label>
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
        <label class="check"><input type="checkbox" id="gridToggle"> Pixel grid</label>
      </div>
      <div class="group stats">
        <span id="conn" class="dot">offline</span>
        <span id="stats">—</span>
      </div>
    </div>
  </div>
`;

const screenCanvas = document.querySelector<HTMLCanvasElement>("#screen")!;
const overlay = document.querySelector<HTMLCanvasElement>("#overlay")!;
const stage = document.querySelector<HTMLDivElement>(".stage")!;
const nameLabel = document.querySelector<HTMLSpanElement>("#screen-name")!;
const layoutSelect = document.querySelector<HTMLSelectElement>("#layout")!;
const zoomSelect = document.querySelector<HTMLSelectElement>("#zoom")!;
const gridToggle = document.querySelector<HTMLInputElement>("#gridToggle")!;
const surfaceSelect = document.querySelector<HTMLSelectElement>("#surface")!;
const connLabel = document.querySelector<HTMLSpanElement>("#conn")!;
const statsLabel = document.querySelector<HTMLSpanElement>("#stats")!;

const ctx = screenCanvas.getContext("2d")!;
const imageData = ctx.createImageData(SCREEN.width, SCREEN.height);

let runtime: GlyphRuntime | null = null;
let connecting = false;

function currentLayout() {
  return TILE_LAYOUTS[layoutSelect.value as TileLayoutName];
}

let app = createApp();

function createApp(): GlyphApp {
  const instance = new GlyphApp({
    screens,
    tileLayout: currentLayout(),
    supersample: 2,
    fps: 20,
    onPaint: (levels, a) => {
      imageData.data.set(grayToRgba(levels));
      ctx.putImageData(imageData, 0, 0);
      nameLabel.textContent = a.screen.name;
      statsLabel.textContent =
        `${a.fps.toFixed(0)} fps · ${runtime?.isConnected ? `${runtime.lastTilesSent}/${currentLayout().tiles.length} tiles sent` : `${currentLayout().tiles.length} tiles`}`;
    }
  });
  instance.start();
  return instance;
}

// ── Zoom and pixel grid ────────────────────────────────────────────────────

function applyZoom() {
  const zoom = Number(zoomSelect.value);
  stage.style.width = `${SCREEN.width * zoom}px`;
  stage.style.height = `${SCREEN.height * zoom}px`;
  overlay.width = SCREEN.width * zoom;
  overlay.height = SCREEN.height * zoom;
  drawGrid();
}

function drawGrid() {
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
  const layout = currentLayout();
  octx.strokeStyle = "rgba(255,180,120,0.4)";
  for (const tile of layout.tiles) {
    octx.strokeRect(tile.x * zoom + 0.5, tile.y * zoom + 0.5, layout.width * zoom, layout.height * zoom);
  }
}

surfaceSelect.addEventListener("change", () => {
  setSurfaceStyle(surfaceSelect.value as SurfaceStyle);
  runtime?.invalidate();
  app.invalidate();
});

zoomSelect.addEventListener("change", applyZoom);
gridToggle.addEventListener("change", drawGrid);
applyZoom();

// ── Controls ───────────────────────────────────────────────────────────────

document.querySelector(".bar")!.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).dataset.action;
  if (action === "next") app.next();
  if (action === "prev") app.previous();
});

screenCanvas.addEventListener("click", () => app.next());

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); app.next(); }
  if (event.key === "ArrowLeft") { event.preventDefault(); app.previous(); }
  if (event.key === "ArrowDown") { event.preventDefault(); app.handleInput({ type: "scroll-down" }); }
  if (event.key === "ArrowUp") { event.preventDefault(); app.handleInput({ type: "scroll-up" }); }
  if (/^[1-9]$/.test(event.key)) app.goto(Number(event.key) - 1);
});

layoutSelect.addEventListener("change", () => {
  const index = app.screenIndex;
  app.stop();
  void runtime?.stop();
  runtime = null;
  connecting = false;
  connLabel.textContent = "offline";
  connLabel.classList.remove("on");
  app = createApp();
  app.goto(index);
  drawGrid();
  void connect();
});

// ── G2 connection ──────────────────────────────────────────────────────────

async function connect() {
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
