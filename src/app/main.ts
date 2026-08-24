import "./style.css";

import {
  GlyphFrame,
  TILE_LAYOUT_288,
  TILE_LAYOUT_144,
  TILE_LAYOUT_192_96,
} from "../glyph/frame";

import { renderDemo } from "./demo";
import { GlyphRuntime } from "../glyph/runtime";

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════

const app =
  document.querySelector<HTMLDivElement>("#app")!;

// ═══════════════════════════════════════════════════════════════
// PREVIEW
// ═══════════════════════════════════════════════════════════════

const wrap =
  document.createElement("div");

wrap.className =
  "preview-wrap";

const preview =
  document.createElement("canvas");

preview.width = 576;
preview.height = 288;

preview.className =
  "g2-preview";

wrap.appendChild(preview);

app.appendChild(wrap);

// ═══════════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════════

const bar =
  document.createElement("div");

bar.className = "bar";

bar.innerHTML = `
  <div class="bar-left">
    <button
      class="nav"
      data-action="prev"
      aria-label="Previous page"
    >‹</button>

    <span
      class="page-label"
      id="page-label"
    >Navigation</span>

    <button
      class="nav"
      data-action="next"
      aria-label="Next page"
    >›</button>
  </div>

  <div class="bar-right">
    <select id="layout">
      <option value="288">
        288×144
      </option>

      <option value="144">
        144×144
      </option>

      <option value="192" selected>
        192×96
      </option>
    </select>
  </div>
`;

app.appendChild(bar);

// ═══════════════════════════════════════════════════════════════
// REFERENCES
// ═══════════════════════════════════════════════════════════════

const pageLabel =
  bar.querySelector<HTMLSpanElement>(
    "#page-label"
  )!;

const layoutSel =
  bar.querySelector<HTMLSelectElement>(
    "#layout"
  )!;

// ═══════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════

const pageNames = [
  "Navigation",
  "Markets",
  "Weather",
  "Flight",
];

const PAGE_COUNT =
  pageNames.length;

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

function getLayout() {
  switch (layoutSel.value) {
    case "144":
      return TILE_LAYOUT_144;

    case "192":
      return TILE_LAYOUT_192_96;

    case "288":
    default:
      return TILE_LAYOUT_288;
  }
}

// ═══════════════════════════════════════════════════════════════
// RUNTIME STATE
// ═══════════════════════════════════════════════════════════════

let frame =
  new GlyphFrame({
    supersample: 2,
    background: 0,
    tileLayout: getLayout(),
  });

let page = 0;
let tick = 0;

let runtime:
  | GlyphRuntime
  | null = null;

let connected = false;

let connecting = false;

// ═══════════════════════════════════════════════════════════════
// DRAW
// ═══════════════════════════════════════════════════════════════

function redraw() {
  renderDemo(
    frame,
    page,
    tick
  );

  /*
   * Convert the internal 4-bit grayscale framebuffer
   * into a regular 8-bit canvas image.
   */

  const gray =
    frame.raster.toGray4();

  const ctx =
    preview.getContext("2d")!;

  const rgba =
    new Uint8ClampedArray(
      gray.length * 4
    );

  for (
    let i = 0;
    i < gray.length;
    i++
  ) {
    const value =
      gray[i] * 17;

    const offset =
      i * 4;

    rgba[offset] =
      value;

    rgba[offset + 1] =
      value;

    rgba[offset + 2] =
      value;

    rgba[offset + 3] =
      255;
  }

  ctx.putImageData(
    new ImageData(
      rgba,
      576,
      288
    ),
    0,
    0
  );

  /*
   * If a real G2 runtime is connected,
   * send the exact same framebuffer to it.
   */

  if (
    connected &&
    runtime
  ) {
    runtime
      .render(
        frame.toFrame(gray)
      )
      .catch(() => {
        connected = false;
      });
  }
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

function setPage(
  nextPage: number
) {
  page =
    ((nextPage % PAGE_COUNT) +
      PAGE_COUNT) %
    PAGE_COUNT;

  pageLabel.textContent =
    pageNames[page];

  redraw();
}

// ═══════════════════════════════════════════════════════════════
// CLOCK / ANIMATION
// ═══════════════════════════════════════════════════════════════

redraw();

setInterval(() => {
  tick++;

  redraw();
}, 1000);

// ═══════════════════════════════════════════════════════════════
// G2 CONNECTION
// ═══════════════════════════════════════════════════════════════

async function tryConnect() {
  if (
    connected ||
    connecting
  ) {
    return;
  }

  connecting = true;

  const layout =
    getLayout();

  const nextRuntime =
    new GlyphRuntime({
      tileLayout: layout,
      debug: true,
    });

  nextRuntime.setOnStateChange(
    (state) => {
      connected =
        state.connected;
    }
  );

  try {
    await nextRuntime.start();

    runtime =
      nextRuntime;

    connected = true;

    await runtime.render(
      frame.toFrame()
    );

    runtime.onInput(
      (event) => {
        switch (event.type) {
          case "tap":
            setPage(page + 1);
            break;

          case "scroll-down":
            setPage(page + 1);
            break;

          case "scroll-up":
            setPage(page - 1);
            break;
        }
      }
    );
  } catch {
    if (
      runtime ===
      nextRuntime
    ) {
      runtime = null;
    }

    connected = false;
  } finally {
    connecting = false;
  }
}

// Try immediately.
void tryConnect();

// Retry connection every 3 seconds.
setInterval(
  () => {
    void tryConnect();
  },
  3000
);

// ═══════════════════════════════════════════════════════════════
// DESKTOP CONTROLS
// ═══════════════════════════════════════════════════════════════

bar.addEventListener(
  "click",
  (event) => {
    const target =
      event.target as HTMLElement;

    const action =
      target.dataset.action;

    if (
      action === "prev"
    ) {
      setPage(page - 1);
    }

    if (
      action === "next"
    ) {
      setPage(page + 1);
    }
  }
);

// Click preview to advance.
preview.addEventListener(
  "click",
  () => {
    setPage(page + 1);
  }
);

// Keyboard navigation.
window.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "ArrowRight" ||
      event.key === " "
    ) {
      event.preventDefault();
      setPage(page + 1);
    }

    if (
      event.key === "ArrowLeft"
    ) {
      event.preventDefault();
      setPage(page - 1);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// LAYOUT SWITCHING
// ═══════════════════════════════════════════════════════════════

layoutSel.addEventListener(
  "change",
  () => {
    frame =
      new GlyphFrame({
        supersample: 2,
        background: 0,
        tileLayout: getLayout(),
      });

    /*
     * Force the runtime to be recreated with the new
     * tile layout. This avoids sending a framebuffer
     * encoded for the old layout.
     */

    if (runtime) {
      try {
        void runtime.stop();
      } catch {
        // Ignore runtime shutdown errors.
      }
    }

    runtime = null;
    connected = false;

    redraw();

    void tryConnect();
  }
);