# Component catalog

Generated from the source by `npm run catalog` — do not edit by hand.

**123 components** and **279 icons**. Every one is imported from `@gabrielevierti/glyph`, takes the raster as its first argument, and draws in both surface styles. Each is shown on a reference screen in the preview (`npm run dev`).

A trailing `?` marks an optional parameter. `g` is a `GlyphRaster`; `r` and `box` are rects; `cx`, `cy` are a centre. Options and their types are in the source and in your editor's hover.

## Core components

Surfaces, data display, indicators, buttons and the original instruments. — `src/glyph/components.ts`

| Component | What it is |
|---|---|
| `attitudeIndicator(g, cx, cy, radius, pitch, roll)` | Artificial horizon. |
| `badge(g, x, y, count?)` | A count in a bright pill, or a plain dot when no count is given. |
| `battery(g, x, y, level, opts?)` | A battery outline that fills with its charge, 0..1. |
| `button(g, r, text, opts?)` | A labelled button. |
| `compassRose(g, cx, cy, radius, heading, opts?)` | A proper compass rose: cardinal letters, minor ticks, a fixed lubber line and an optional second pointer (wind, next waypoint) that rotates with the card. |
| `divider(g, r, label?, gray?)` | Full-width label with rules on either side. |
| `emptyState(g, r, iconName, title, subtitle?)` | Centred placeholder for "nothing here yet". |
| `keyValue(g, r, key, value, opts?)` | Key on the left, value on the right, aligned across a stack of rows. |
| `listRow(g, r, opts)` | One row of a list. |
| `maneuverArrow(g, cx, cy, size, kind)` | Big directional maneuver arrow for navigation. |
| `metric(g, r, value, opts?)` | The workhorse: one number, read at a glance, with its unit and a caption. |
| `pageDots(g, cx, y, count, active)` | One dot per page, the current one bright — where you are in a set of screens. |
| `panel(g, r, opts?)` | The base container. |
| `pill(g, x, y, text, opts?)` | A small rounded tag. |
| `progressBar(g, r, value, opts?)` | A determinate bar, 0..1, optionally cut into segments by `ticks`. |
| `scrim(g, r, level?)` | Dim everything behind a foreground panel. |
| `scrollbar(g, r, offset, visible, total)` | Vertical scroll indicator for lists that overflow. |
| `section(g, r, label, opts?)` | A panel with a label strip along the top. |
| `segmentedBar(g, r, segments, filled, opts?)` | Discrete segments — better than a smooth bar when the count matters. |
| `signalBars(g, x, y, level, bars?, opts?)` | Signal strength as rising bars. |
| `speedLimit(g, cx, cy, radius, limit, over?)` | Speed roundel — the European sign, which reads instantly. |
| `stat(g, r, label, value, opts?)` | Label above, value below — for dense readouts where the label leads. |
| `statusBar(g, r, opts?)` | The top strip. |
| `tabBar(g, r, tabs, active)` | Labelled tabs with an underline under the active one. |
| `tag(g, x, y, text, opts?)` | Outlined variant — reads as "state" rather than "chip". |
| `toast(g, r, text, opts?)` | Transient message strip. |
| `toggle(g, x, y, on, width?)` | An on/off switch. |
| `windIndicator(g, cx, cy, radius, direction, speed, unit?)` | Wind arrow with speed, drawn as a barb pointing the way the wind is going. |

## Compact controls

Small, stroke-only controls. Marked experimental: check them on hardware. — `src/glyph/extended.ts`

| Component | What it is |
|---|---|
| `checkBox(g, r, checked, opts?)` | Checkbox with a clear, scalable check mark. |
| `chip(g, r, label, opts?)` | Small outlined status token; avoids occluding the view in waveguide mode. |
| `compactTabs(g, r, labels, active)` | Compact tab navigation with underline active state. |
| `compactToggle(g, r, checked, opts?)` | A compact on/off switch, with a stroke-only track on transparent displays. |
| `countBadge(g, r, count)` | Inline badge for unread counts and compact alerts. |
| `notificationToast(g, r, message, detail?)` | Toast notification with optional secondary line. |
| `radioButton(g, r, selected)` | Radio button; never fills a large opaque surface. |
| `skeleton(g, r, lines?)` | Horizontal skeleton placeholder, useful while async content is loading. |
| `sliderTrack(g, r, value, opts?)` | Range input visualization; values are normalized to [0,1]. |
| `spinner(g, r, phase, spokes?)` | Indeterminate loader: render with phase in [0,1] from the app animation clock. |
| `stepper(g, r, count, current)` | A multi-step workflow indicator. |

## HUD instruments

Moving scales, aiming marks, scopes and meters — the shapes a see-through display is best at. — `src/glyph/hud.ts`

| Component | What it is |
|---|---|
| `barGauge(g, r, value, opts?)` | A vertical column that fills from the bottom, with its scale alongside — temperature, tank, battery. |
| `clockFace(g, cx, cy, radius, time, opts?)` | Analog clock. |
| `deviationBar(g, r, deviation, opts?)` | Lateral deviation: a fixed centre, dots at regular offsets, and a diamond that is you. |
| `headingTape(g, r, heading, opts?)` | A compass as a strip: the scale slides, the pointer stays put. |
| `levelMeter(g, r, level, opts?)` | Segmented level meter — audio level, signal, throttle. |
| `linearGauge(g, r, value, opts?)` | A horizontal scale with a pointer riding above it. |
| `pitchLadder(g, r, pitch, roll, opts?)` | Pitch ladder: the horizon and its rungs, rotated by roll, behind a fixed aircraft symbol. |
| `radarScope(g, cx, cy, radius, opts?)` | Range rings, bearing ticks and contacts around your own position. |
| `reticle(g, cx, cy, size?, opts?)` | An aiming mark. |
| `scaleBar(g, x, y, width, label, gray?)` | Map scale: a measured line with its distance written above it. |
| `targetBox(g, r, opts?)` | Corner brackets around something in the world, with a caption — the way to mark a thing without covering it. |
| `valueTape(g, r, value, opts?)` | A vertical moving scale with the current value boxed at its centre — speed on one side, altitude or depth on the other. |

## Overlays and feedback

Dialogs, sheets, menus, alerts, gesture hints, captions, and ways of saying "not yet". — `src/glyph/overlays.ts`

| Component | What it is |
|---|---|
| `banner(g, r, text, opts?)` | An inline alert strip. |
| `bottomSheet(g, area, opts?)` | A sheet rising from the bottom of an area. |
| `buttonRow(g, r, labels, opts?)` | A row of equal-width buttons. |
| `callout(g, r, text, opts?)` | A bubble with a tail — a tooltip, a label pointing at something on screen. |
| `captions(g, r, text, opts?)` | Live captions. |
| `dialog(g, r, opts)` | A modal question: title, a sentence or two, and the choices. |
| `gestureGlyph(g, cx, cy, gesture, gray?, size?)` | A small pictogram for one gesture. |
| `hintBar(g, r, hints, opts?)` | A legend of what each gesture does on this screen. |
| `indeterminateBar(g, r, now, opts?)` | Progress of unknown length: a segment that keeps crossing the track. |
| `listeningIndicator(g, cx, cy, radius, level, now, opts?)` | The microphone is open. |
| `loadingState(g, r, label, now, opts?)` | A spinner with a caption, for a screen that has nothing to show yet. |
| `menu(g, r, items, opts?)` | A scrolling list of choices. |
| `notificationCard(g, r, opts)` | An incoming notification: who it is from, one bold line, and as much of the body as fits. |
| `teleprompter(g, r, text, position, opts?)` | A script that scrolls under a fixed reading line. |

## Content

People, messages, tables, schedules, media, and text in motion. — `src/glyph/content.ts`

| Component | What it is |
|---|---|
| `avatar(g, cx, cy, radius, opts?)` | A person as a circle with initials or an icon, and optionally whether they are around. |
| `avatarGroup(g, x, cy, radius, initials, opts?)` | Several people, overlapping, with a "+N" for the ones that do not fit. |
| `breadcrumb(g, r, parts)` | Where you are in a hierarchy. |
| `calendarMonth(g, r, year, month, opts?)` | One month as a grid. |
| `card(g, r, opts?)` | A panel with a heading. |
| `chatBubble(g, r, text, opts?)` | One message in a conversation. |
| `chipRow(g, r, labels, opts?)` | Chips that flow onto as many lines as they need. |
| `countdownRing(g, cx, cy, radius, remaining, total, opts?)` | A timer as a ring that empties, with the time left written inside it. |
| `equalizer(g, r, levels, opts?)` | Frequency bands as stacks of segments. |
| `formatDuration(seconds)` | Seconds as "m:ss", or "h:mm:ss" once there are hours. |
| `keycap(g, x, cy, label, opts?)` | A key, for writing "press this" — or, here, "say this". |
| `legend(g, r, items, opts?)` | What each mark on a chart means. |
| `marquee(g, r, text, now, opts?)` | One line that scrolls if — and only if — it does not fit. |
| `mediaTransport(g, r, opts)` | Now playing: what, by whom, how far through, and the transport. |
| `pagination(g, r, page, total)` | "3 / 12", with chevrons that go dim at either end. |
| `rating(g, x, cy, value, opts?)` | Stars, with fractions. |
| `screenHeader(g, r, title, opts?)` | The title strip of a screen: where you are, optionally how to go back, and one accessory. |
| `statGrid(g, r, items, opts?)` | A grid of labelled figures, ruled apart — a spec sheet. |
| `statusDot(g, cx, cy, state, radius?)` | Presence as a shape, since it cannot be a colour: solid, barred, ring, dim ring. |
| `stopLine(g, r, stops, opts?)` | A route as a line of stops — a transit line, a delivery, the stages of a trip. |
| `table(g, r, columns, rows, opts?)` | Rows and columns. |
| `timeline(g, r, events, opts?)` | A sequence down the page: what has happened, what is happening, what is next. |
| `trendBadge(g, x, cy, delta, opts?)` | A change, with its direction: up is bright, down is dim, flat is a dash. |
| `typewriter(g, r, text, progress, opts?)` | Text that appears a character at a time. |
| `waveform(g, r, samples, opts?)` | An amplitude envelope as bars. |

## Inputs

Controls for four gestures and no pointer. Each has a focused state. — `src/glyph/inputs.ts`

| Component | What it is |
|---|---|
| `checkGroup(g, r, labels, checked, opts?)` | Any of several, stacked. |
| `dial(g, cx, cy, radius, value, opts?)` | A rotary control: the natural partner of a scroll gesture. |
| `focusRing(g, r, radius?, gap?)` | The one way focus is shown on a boxed control: a bright outline standing just off it. |
| `keypad(g, r, opts?)` | A grid of keys. |
| `numberStepper(g, r, value, opts?)` | A value with a step down on its left and a step up on its right. |
| `pickerWheel(g, r, options, index, opts?)` | A wheel of options, scrolled through the middle. |
| `pinDots(g, cx, cy, length, filled, opts?)` | How many digits of a code have been entered. |
| `radioGroup(g, r, labels, selected, opts?)` | One of several, stacked. |
| `rangeSlider(g, r, low, high, opts?)` | A range within a range: two thumbs on one track. |
| `segmentedControl(g, r, labels, active, opts?)` | A handful of mutually exclusive options, side by side. |
| `sliderRow(g, r, label, value, opts?)` | A setting on a scale: its name, its current value, and a slider beneath. |
| `switchRow(g, r, label, on, opts?)` | A setting that is on or off: its name, optionally what it does, and a switch. |
| `textField(g, r, value, opts?)` | A single-line field — for dictated text, a search term, a code. |

## Charts

Line, bar and scatter; parts of a whole; distributions; radial and polar. — `src/glyph/charts.ts`

| Component | What it is |
|---|---|
| `activityRings(g, cx, cy, radius, values, opts?)` | Several progress rings, one inside the next. |
| `barChart(g, box, values, opts?)` | Vertical bars. |
| `bulletChart(g, box, value, target, opts?)` | Target-vs-actual in one line. |
| `candlestickChart(g, box, candles, opts?)` | Open, high, low, close. |
| `chartFrame(g, box, min, max, axis?)` | Grid, gutter labels and baseline. |
| `donutChart(g, cx, cy, radius, segments, opts?)` | Shares of a total as arcs of a ring, with room in the middle for the total itself. |
| `dotMatrix(g, r, value, total, opts?)` | A count out of a total, as dots you could actually count. |
| `gaugeChart(g, cx, cy, radius, value, opts?)` | Half-circle gauge with a needle. |
| `heatStrip(g, box, values, opts?)` | A dense band of levels — 24 hours of something, at a glance. |
| `histogram(g, box, values, opts?)` | How values are spread: counts per bin. |
| `lineChart(g, box, series, axis?)` | Multi-series line or area chart. |
| `polarChart(g, cx, cy, radius, values, opts?)` | Values by direction — a wind rose. |
| `radarChart(g, cx, cy, radius, axes, series, opts?)` | Several measures of one thing on spokes from a centre. |
| `rangeChart(g, box, low, high, opts?)` | A band between a low and a high series, with an optional line through it — a forecast and its uncertainty. |
| `rankChart(g, box, rows, opts?)` | Horizontal bars with labels — a ranking, not a time series. |
| `ringChart(g, cx, cy, radius, progress, opts?)` | Circular progress ring with an optional centred readout. |
| `scatterChart(g, box, points, opts?)` | Scatter plot. |
| `sparkBars(g, box, values, opts?)` | Tiny bars with no axes, the newest one bright. |
| `sparkline(g, box, values, opts?)` | Compact trend line with no axes. |
| `stackedBar(g, r, segments, opts?)` | Shares of a total along one bar. |

## Icons

279 stroked icons on a 24px grid, drawn with `icon(g, name, cx, cy, size, gray)`. Add your own with `registerIcon(name, pathData)`.

`activity` · `alarm` · `alert-circle` · `alert-octagon` · `alert-triangle` · `altitude` · `anchor` · `antenna` · `apple` · `archive` · `arrow-down` · `arrow-down-left` · `arrow-down-right` · `arrow-left` · `arrow-right` · `arrow-up` · `arrow-up-left` · `arrow-up-right` · `arrows-horizontal` · `arrows-vertical` · `at-sign` · `ban` · `battery` · `battery-charging` · `battery-half` · `battery-low` · `bed` · `bell` · `bell-off` · `bell-ring` · `bike` · `bluetooth` · `boat` · `book-open` · `bookmark` · `bot` · `briefcase` · `brightness` · `bug` · `building` · `buoy` · `bus` · `calculator` · `calendar` · `calendar-check` · `camera` · `captions` · `car` · `caret-down` · `caret-up` · `cart` · `cast` · `chart-bar` · `chart-line` · `chart-pie` · `chat-dots` · `check` · `check-circle` · `check-square` · `chevron-down` · `chevron-left` · `chevron-right` · `chevron-up` · `chevrons-left` · `chevrons-right` · `circle` · `clipboard` · `clock` · `cloud` · `cloud-lightning` · `cloud-off` · `cloud-rain` · `cloud-snow` · `cloud-sun` · `code` · `coffee` · `columns` · `compass` · `contactless` · `contrast` · `copy` · `corner-left` · `corner-right` · `cpu` · `credit-card` · `crosshair` · `crown` · `cup` · `currency-dollar` · `currency-euro` · `database` · `depth` · `dice` · `dot` · `download` · `drone` · `droplet` · `dumbbell` · `enter` · `exit` · `external-link` · `eye` · `eye-off` · `fast-forward` · `file` · `filter` · `fish` · `flag` · `flame` · `fog` · `folder` · `footprints` · `fork` · `fork-knife` · `fuel` · `gamepad` · `gauge` · `gift` · `glasses` · `globe` · `grid` · `hash` · `headphones` · `heart` · `heart-pulse` · `helicopter` · `helm` · `help` · `history` · `home` · `hourglass` · `id-card` · `image` · `inbox` · `info` · `keep-left` · `keep-right` · `key` · `laptop` · `layers` · `leaf` · `lifebuoy` · `lightbulb` · `lighthouse` · `link` · `list` · `loader` · `locate` · `lock` · `mail` · `map` · `map-pin` · `maximize` · `menu` · `merge` · `message` · `metro` · `mic` · `mic-off` · `minimize` · `minus` · `monitor` · `moon` · `moon-sleep` · `more-horizontal` · `more-vertical` · `mountain` · `music` · `navigation` · `package` · `paperclip` · `parachute` · `parking` · `pause` · `paw` · `pencil` · `percent` · `phone` · `pill` · `pin` · `plane` · `play` · `playlist` · `plug` · `plus` · `power` · `printer` · `qr` · `radar` · `radio` · `record` · `redo` · `refresh` · `repeat` · `reply` · `rewind` · `ring` · `rocket` · `rotate-ccw` · `rotate-cw` · `roundabout` · `route` · `ruler` · `run` · `save` · `scale` · `scan` · `search` · `send` · `settings` · `share` · `shield` · `shopping-bag` · `shuffle` · `sidebar` · `signal` · `signal-low` · `signpost` · `skip-back` · `skip-forward` · `sliders` · `smartphone` · `smile` · `snowflake` · `sort` · `sparkles` · `speaker` · `square` · `stairs` · `star` · `stop` · `stopwatch` · `sun` · `sunrise` · `sunset` · `table` · `tag` · `target` · `tent` · `terminal` · `text-size` · `thermometer` · `thumbs-up` · `ticket` · `timer` · `traffic-light` · `train` · `tram` · `translate` · `trash` · `tree` · `trending-down` · `trending-up` · `trophy` · `truck` · `u-turn` · `umbrella` · `undo` · `unlock` · `upload` · `user` · `users` · `video` · `voicemail` · `volume` · `volume-low` · `volume-x` · `walk` · `wallet` · `watch` · `waves` · `wifi` · `wifi-off` · `wind` · `x` · `x-circle` · `zap` · `zoom-in` · `zoom-out`
