/** Lightweight, allocation-conscious UI primitives for the G2 waveguide. */
import type { GlyphRaster } from './raster.js';
import type { Rect, Gray } from './types.js';
import { gray as G, type as T, isOutline } from './theme.js';

const bound = (v: number, lo: number, hi: number) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
const center = (r: Rect) => r.y + r.height / 2;

/** Small outlined status token; avoids occluding the view in waveguide mode. */
export function chip(g: GlyphRaster, r: Rect, label: string, opts: { selected?: boolean; gray?: Gray } = {}): void {
  const c = opts.gray ?? (opts.selected ? G.max : G.secondary);
  g.roundRect(r, Math.min(r.height / 2, 8), isOutline(g) ? { stroke: c, width: 1 } : { fill: opts.selected ? G.raised : G.surface, stroke: c, width: 1 });
  g.textBox(label, { x: r.x + 5, y: r.y, width: Math.max(0, r.width - 10), height: r.height }, T.caption, c, { wrap: false, hAlign: 'center', vAlign: 'middle' });
}

/** A compact on/off switch, with a stroke-only track on transparent displays. */
export function compactToggle(g: GlyphRaster, r: Rect, checked: boolean, opts: { disabled?: boolean } = {}): void {
  const h = Math.min(r.height, r.width / 1.8);
  const y = center(r) - h / 2;
  const c = opts.disabled ? G.disabled : checked ? G.max : G.secondary;
  g.roundRect({ x: r.x, y, width: r.width, height: h }, h / 2, { stroke: c, width: 1 });
  const d = Math.max(2, h - 6);
  g.circle(r.x + (checked ? r.width - h / 2 : h / 2), center(r), d / 2, { fill: c });
}

/** Checkbox with a clear, scalable check mark. */
export function checkBox(g: GlyphRaster, r: Rect, checked: boolean, opts: { disabled?: boolean } = {}): void {
  const d = Math.min(r.width, r.height, 18);
  const x = r.x + (r.width - d) / 2, y = center(r) - d / 2;
  const c = opts.disabled ? G.disabled : checked ? G.max : G.secondary;
  g.roundRect({ x, y, width: d, height: d }, 3, { stroke: c, width: 1 });
  if (checked) {
    g.line(x + d * .23, y + d * .52, x + d * .43, y + d * .73, { stroke: c, width: 2 });
    g.line(x + d * .43, y + d * .73, x + d * .80, y + d * .28, { stroke: c, width: 2 });
  }
}

/** Radio button; never fills a large opaque surface. */
export function radioButton(g: GlyphRaster, r: Rect, selected: boolean): void {
  const radius = Math.max(2, Math.min(r.width, r.height) / 2 - 2);
  g.circle(r.x + r.width / 2, center(r), radius, { stroke: selected ? G.max : G.secondary, width: 1 });
  if (selected) g.circle(r.x + r.width / 2, center(r), Math.max(1, radius * .48), { fill: G.max });
}

/** Range input visualization; values are normalized to [0,1]. */
export function sliderTrack(g: GlyphRaster, r: Rect, value: number, opts: { steps?: number } = {}): void {
  const v = bound(value, 0, 1), y = center(r);
  g.hline(r.x, r.x + r.width, y, G.border);
  if (opts.steps && opts.steps > 1 && opts.steps <= 100) {
    for (let i = 0; i < opts.steps; i++) {
      const x = r.x + i * r.width / (opts.steps - 1);
      g.vline(x, y - 3, y + 3, G.tertiary);
    }
  }
  g.hline(r.x, r.x + r.width * v, y, G.max);
  g.circle(r.x + r.width * v, y, 4, { fill: G.max });
}

/** A multi-step workflow indicator. Index is zero-based. */
export function stepper(g: GlyphRaster, r: Rect, count: number, current: number): void {
  const n = Math.min(32, Math.max(0, Math.floor(count)));
  if (!n) return;
  const selected = Math.floor(bound(current, 0, n - 1));
  const spacing = n === 1 ? 0 : (r.width - 12) / (n - 1);
  const y = center(r);
  if (n > 1) g.hline(r.x + 6, r.x + r.width - 6, y, G.border);
  for (let i = 0; i < n; i++) {
    const x = r.x + 6 + spacing * i;
    g.circle(x, y, 5, i <= selected ? { fill: G.max } : { fill: G.off, stroke: G.secondary, width: 1 });
  }
}

/** Compact tab navigation with underline active state. */
export function compactTabs(g: GlyphRaster, r: Rect, labels: readonly string[], active: number): void {
  if (!labels.length) return;
  const w = r.width / labels.length;
  for (let i = 0; i < labels.length; i++) {
    const x = r.x + i * w;
    g.textBox(labels[i], { x: x + 3, y: r.y, width: Math.max(0, w - 6), height: Math.max(0, r.height - 3) }, T.caption, i === active ? G.max : G.tertiary, { wrap: false, hAlign: 'center', vAlign: 'middle' });
    if (i === active) g.hline(x + 4, x + w - 4, r.y + r.height - 1, G.max);
  }
}

/** Toast notification with optional secondary line. */
export function notificationToast(g: GlyphRaster, r: Rect, message: string, detail?: string): void {
  g.roundRect(r, 7, { stroke: G.border, width: 1, ...(isOutline(g) ? {} : { fill: G.surface }) });
  const pad = 9;
  if (detail) {
    g.textBox(message, { x: r.x + pad, y: r.y + 3, width: Math.max(0, r.width - 2 * pad), height: Math.max(0, r.height / 2) }, T.bodyStrong, G.max, { wrap: false, vAlign: 'middle' });
    g.textBox(detail, { x: r.x + pad, y: r.y + r.height / 2, width: Math.max(0, r.width - 2 * pad), height: Math.max(0, r.height / 2 - 3) }, T.caption, G.secondary, { wrap: false, vAlign: 'middle' });
  } else g.textBox(message, { x: r.x + pad, y: r.y, width: Math.max(0, r.width - 2 * pad), height: r.height }, T.bodyStrong, G.max, { wrap: false, vAlign: 'middle' });
}

/** Indeterminate loader: render with phase in [0,1] from the app animation clock. */
export function spinner(g: GlyphRaster, r: Rect, phase: number, spokes = 8): void {
  const n = Math.floor(bound(spokes, 3, 24));
  const cx = r.x + r.width / 2, cy = center(r), radius = Math.max(2, Math.min(r.width, r.height) / 2 - 3);
  const head = Math.floor(bound(phase, 0, 1) * n) % n;
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n - Math.PI / 2;
    const level = 4 + Math.round(11 * (1 - ((head - i + n) % n) / n));
    g.line(cx + Math.cos(a) * radius * .55, cy + Math.sin(a) * radius * .55, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, { stroke: level, width: 2 });
  }
}

/** Horizontal skeleton placeholder, useful while async content is loading. */
export function skeleton(g: GlyphRaster, r: Rect, lines = 3): void {
  const n = Math.floor(bound(lines, 1, 12));
  const gap = 5, h = Math.max(1, Math.min(5, (r.height - gap * (n - 1)) / n));
  for (let i = 0; i < n; i++) {
    const y = r.y + i * (h + gap);
    const width = i === n - 1 ? r.width * .65 : r.width;
    g.roundRect({ x: r.x, y, width, height: h }, h / 2, { fill: G.border });
  }
}

/** Inline badge for unread counts and compact alerts. */
export function countBadge(g: GlyphRaster, r: Rect, count: number): void {
  const label = count > 99 ? '99+' : String(Math.max(0, Math.floor(count)));
  g.roundRect(r, r.height / 2, { stroke: G.max, width: 1 });
  g.textBox(label, { x: r.x + 3, y: r.y, width: Math.max(0, r.width - 6), height: r.height }, T.caption, G.max, { hAlign: 'center', vAlign: 'middle', wrap: false });
}
