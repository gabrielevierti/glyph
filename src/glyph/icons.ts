import { GlyphPath, parsePath } from "./path.js";
import type { Gray, Paint } from "./types.js";
import type { GlyphRaster } from "./raster.js";

/**
 * Icons are authored as path data on a 24x24 grid and stroked, not filled.
 * A stroked path holds up at 10px on a low-level display in a way that a
 * filled silhouette does not — the strokes stay separable when the whole
 * glyph is only a handful of gray levels wide.
 */
export const iconPaths: Record<string, string> = {
  // arrows & direction
  "arrow-up": "M12 20V4 M5 11L12 4L19 11",
  "arrow-down": "M12 4V20 M5 13L12 20L19 13",
  "arrow-left": "M20 12H4 M11 5L4 12L11 19",
  "arrow-right": "M4 12H20 M13 5L20 12L13 19",
  "arrow-up-right": "M7 17L17 7 M8 7H17V16",
  "arrow-up-left": "M17 17L7 7 M16 7H7V16",
  "chevron-up": "M5 15L12 8L19 15",
  "chevron-down": "M5 9L12 16L19 9",
  "chevron-left": "M15 5L8 12L15 19",
  "chevron-right": "M9 5L16 12L9 19",
  "chevrons-right": "M6 5L13 12L6 19 M13 5L20 12L13 19",
  "chevrons-left": "M18 5L11 12L18 19 M11 5L4 12L11 19",
  "caret-up": "M6 15L12 9L18 15Z",
  "caret-down": "M6 9L12 15L18 9Z",
  "corner-left": "M20 6H10C7 6 6 8 6 10V19 M11 14L6 19L1 14",
  "corner-right": "M4 6H14C17 6 18 8 18 10V19 M23 14L18 19L13 14",
  "u-turn": "M8 20V10C8 6 11 4 14 4C17 4 20 6 20 10V14 M15 9L20 14L25 9",

  // status & feedback
  "plus": "M12 5V19 M5 12H19",
  "minus": "M5 12H19",
  "x": "M6 6L18 18 M18 6L6 18",
  "check": "M4 13L9 18L20 6",
  "check-circle": "O12 12 9 M8 12L11 15L16 9",
  "x-circle": "O12 12 9 M9 9L15 15 M15 9L9 15",
  "alert-triangle": "M12 4L22 20H2Z M12 10V15 M12 17.5V18.5",
  "alert-circle": "O12 12 9 M12 7V13 M12 16V17",
  "info": "O12 12 9 M12 11V17 M12 7V8",
  "help": "O12 12 9 M9 9.5C9 7.5 10.5 6.5 12 6.5C13.8 6.5 15 7.7 15 9.2C15 11.5 12 11.5 12 14 M12 17V18",
  "square": "M5 5H19V19H5Z",
  "check-square": "M19 11V19H5V5H15 M9 11L12 14L20 5",
  "circle": "O12 12 8",
  "dot": "O12 12 3",
  "target": "O12 12 9 O12 12 4.5 O12 12 1",
  "shield": "M12 3L20 6V12C20 17 16 20 12 21C8 20 4 17 4 12V6Z",
  "zap": "M13 2L4 14H11L10 22L20 10H13Z",
  "star": "M12 3L15 9.5L22 10.4L17 15.2L18.2 22L12 18.8L5.8 22L7 15.2L2 10.4L9 9.5Z",
  "bookmark": "M6 3H18V21L12 16L6 21Z",
  "flag": "M5 21V4 M5 5H18L15 9.5L18 14H5",

  // time
  "clock": "O12 12 9 M12 7V12L15.5 14",
  "alarm": "O12 13 8 M12 9V13L15 15 M5 4L2 7 M19 4L22 7",
  "timer": "M9 2H15 M12 6V13 M12 13L16 16 O12 13 8",
  "hourglass": "M7 3H17 M7 21H17 M7 3C7 8 12 10 12 12C12 14 7 16 7 21 M17 3C17 8 12 10 12 12C12 14 17 16 17 21",
  "calendar": "M4 6H20V21H4Z M4 11H20 M8 3V7 M16 3V7",
  "history": "M4 12C4 7.5 7.5 4 12 4C16.5 4 20 7.5 20 12C20 16.5 16.5 20 12 20C9 20 6.5 18.5 5 16 M12 8V12L15 14 M5 12H1 M3 9L1 12L5 12",

  // power & connectivity
  "battery": "M2 8H18V16H2Z M20 11V13",
  "battery-half": "M2 8H18V16H2Z M20 11V13 M4 10H10V14H4Z",
  "battery-low": "M2 8H18V16H2Z M20 11V13 M4 10H7V14H4Z",
  "battery-charging": "M2 8H18V16H2Z M20 11V13 M11 7L7 13H11L9 17",
  "bluetooth": "M7 8L17 16L12 20V4L17 8L7 16",
  "wifi": "M2 9C7.5 4 16.5 4 22 9 M5.5 12.5C9 9.2 15 9.2 18.5 12.5 M9 16C10.7 14.4 13.3 14.4 15 16 M11.7 19.2L12.3 19.2",
  "wifi-off": "M2 9C4 7.2 6.4 6 9 5.4 M15.5 6.3C17.9 7 20.1 8.2 22 10 M9 16C10.7 14.4 13.3 14.4 15 16 M12 19.2V19.3 M3 3L21 21",
  "signal": "M3 20V17 M9 20V13 M15 20V9 M21 20V4",
  "signal-low": "M3 20V17 M9 20V13 M15 20V16 M21 20V16",
  "power": "M12 3V12 M18 6.5C19.9 8.3 21 10.8 21 13.5C21 18.2 17 22 12 22C7 22 3 18.2 3 13.5C3 10.8 4.1 8.3 6 6.5",
  "plug": "M9 2V8 M15 2V8 M6 8H18V12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12Z M12 18V22",

  // weather
  "sun": "O12 12 5 M12 1V4 M12 20V23 M4.2 4.2L6.4 6.4 M17.6 17.6L19.8 19.8 M1 12H4 M20 12H23 M4.2 19.8L6.4 17.6 M17.6 6.4L19.8 4.2",
  "moon": "M20 14.5C18.9 15.5 17.3 16 15.7 16C11.7 16 8.5 12.8 8.5 8.8C8.5 6.9 9.2 5.2 10.4 4C6.2 4.8 3 8.5 3 13C3 18 7 22 12 22C15.8 22 19.1 19 20 14.5Z",
  "cloud": "M6.5 19C4 19 2 17 2 14.5C2 12.2 3.7 10.3 6 10.1C6.6 6.6 9.5 4 13 4C16.9 4 20 7.1 20 11C21.7 11.6 23 13.2 23 15C23 17.2 21.2 19 19 19Z",
  "cloud-rain": "M6.5 16C4 16 2 14 2 11.5C2 9.3 3.6 7.4 5.8 7.1C6.5 4.2 9 2 12 2C15.6 2 18.5 4.9 18.5 8.5C20.4 8.9 22 10.6 22 12.7C22 14.5 20.5 16 18.7 16 M8 18L7 22 M13 18L12 22 M18 18L17 22",
  "cloud-snow": "M6.5 16C4 16 2 14 2 11.5C2 9.3 3.6 7.4 5.8 7.1C6.5 4.2 9 2 12 2C15.6 2 18.5 4.9 18.5 8.5C20.4 8.9 22 10.6 22 12.7C22 14.5 20.5 16 18.7 16 M8 19V20 M13 19V20 M18 19V20 M10.5 21.5V22.5 M15.5 21.5V22.5",
  "wind": "M3 8H13C15 8 16.5 6.7 16.5 5C16.5 3.3 15.3 2 13.7 2C12.3 2 11.2 2.9 11 4 M2 13H17C19 13 20.5 14.3 20.5 16C20.5 17.7 19.3 19 17.7 19C16.3 19 15.2 18.1 15 17 M3 18H9",
  "droplet": "M12 3C12 3 5 11 5 15C5 18.9 8.1 22 12 22C15.9 22 19 18.9 19 15C19 11 12 3 12 3Z",
  "thermometer": "M14 14.5V4.5C14 3.1 13 2 11.5 2C10 2 9 3.1 9 4.5V14.5C7.8 15.4 7 16.8 7 18.5C7 20.9 9 23 11.5 23C14 23 16 20.9 16 18.5C16 16.8 15.2 15.4 14 14.5Z M11.5 18.5V7",
  "umbrella": "M12 12V19C12 20.6 13.3 22 15 22C16.7 22 18 20.6 18 19 M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12Z",
  "sunrise": "M12 3V9 M8 6L12 2L16 6 M2 18H22 M5 14L7 15.5 M19 14L17 15.5 O12 17 4",
  "sunset": "M12 9V3 M8 6L12 10L16 6 M2 18H22 O12 17 4",

  // marine & navigation
  "compass": "O12 12 9.5 M15.5 8.5L13.5 13.5L8.5 15.5L10.5 10.5Z",
  "navigation": "M12 2L21 21L12 17L3 21Z",
  "map-pin": "M12 22C12 22 20 15.5 20 9.5C20 5.4 16.4 2 12 2C7.6 2 4 5.4 4 9.5C4 15.5 12 22 12 22Z O12 9.5 3",
  "map": "M2 6L9 3L15 6L22 3V18L15 21L9 18L2 21Z M9 3V18 M15 6V21",
  "route": "O5 19 3 O19 5 3 M8 19H14C16.8 19 19 16.8 19 14V8",
  "anchor": "M12 8V22 O12 5 3 M4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14 M2 14H6 M18 14H22",
  "boat": "M3 18L12 21L21 18 M4 14H20L18 18H6Z M12 14V4L18 10",
  "waves": "M2 8C4 5.5 6 5.5 8 8C10 10.5 12 10.5 14 8C16 5.5 18 5.5 20 8 M2 14C4 11.5 6 11.5 8 14C10 16.5 12 16.5 14 14C16 11.5 18 11.5 20 14 M2 20C4 17.5 6 17.5 8 20C10 22.5 12 22.5 14 20C16 17.5 18 17.5 20 20",
  "depth": "M12 2V16 M7 11L12 16L17 11 M2 20H22",
  "buoy": "O12 12 9.5 M12 2.5V21.5 M2.5 12H21.5 M5.5 5.5L18.5 18.5 M18.5 5.5L5.5 18.5",
  "helm": "O12 12 4 O12 12 9.5 M12 2.5V7.5 M12 16.5V21.5 M2.5 12H7.5 M16.5 12H21.5",

  // movement
  "car": "M5 17H19 M4 17V11L6.5 5H17.5L20 11V17 M4 11H20 M7 17V20H4V17 M17 17V20H20V17 O7.5 14 1 O16.5 14 1",
  "bike": "O5.5 17.5 4.5 O18.5 17.5 4.5 M5.5 17.5L9 8H14 M9 8L14.5 17.5 M14.5 17.5L18.5 17.5 M12 8H16",
  "walk": "O13 4 2 M11 21L12 15L9 12L10 8L14 9L16 12L19 13 M9 12L7 15 M12 15L15 21",
  "run": "O15 4 2 M8 21L12 16L9.5 12L10.5 8L15 9.5L17 13L21 13 M9.5 12L6 13 M12 16L16 20",
  "train": "M6 3H18V15H6Z M6 15L4 21 M18 15L20 21 M6 9H18 O9 12.5 1 O15 12.5 1",
  "bus": "M4 4H20V16H4Z M4 16V20H7V16 M17 16V20H20V16 M4 10H20 O7.5 13.5 1 O16.5 13.5 1",
  "plane": "M2 13L22 4L18 22L13 16L9 20V15Z",
  "fuel": "M4 21V4H13V21 M3 21H14 M13 10H17V17C17 18.5 18 19 19 19C20 19 21 18.5 21 17V8L18 5 M7 8H10",
  "gauge": "M4 18C2.7 16.3 2 14.2 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12C22 14.2 21.3 16.3 20 18 M12 12L17 8 O12 12 1.5",

  // body & activity
  "heart": "M12 21C12 21 3 15 3 8.8C3 5.6 5.4 3 8.5 3C10.3 3 11.5 4 12 5C12.5 4 13.7 3 15.5 3C18.6 3 21 5.6 21 8.8C21 15 12 21 12 21Z",
  "heart-pulse": "M2 12H7L9 8L12 16L14.5 12H22",
  "footprints": "M6 3C7.7 3 9 4.5 9 7C9 9.5 8 12 6 12C4 12 3 9.5 3 7C3 4.5 4.3 3 6 3Z M18 9C19.7 9 21 10.5 21 13C21 15.5 20 18 18 18C16 18 15 15.5 15 13C15 10.5 16.3 9 18 9Z M3.5 15H8.5V19H3.5Z M15.5 21H20.5",
  "flame": "M12 22C16 22 19 19 19 15C19 10 13 7 14 2C11 4 9 7 9 9C9 11 10 12 10 12C10 12 8 11 7 9C6 11 5 13 5 15C5 19 8 22 12 22Z",
  "activity": "M2 12H6L9 4L15 20L18 12H22",
  "moon-sleep": "M4 8H12L4 16H12 M14 3H20L14 9H20",

  // media
  "music": "M9 18V4L20 2V16 O6 18 3 O17 16 3",
  "play": "M7 4L20 12L7 20Z",
  "pause": "M8 4V20 M16 4V20",
  "stop": "M6 6H18V18H6Z",
  "skip-forward": "M5 4L15 12L5 20Z M19 4V20",
  "skip-back": "M19 4L9 12L19 20Z M5 4V20",
  "volume": "M3 9H7L12 4V20L7 15H3Z M16 9C17.2 10 17.8 11 17.8 12C17.8 13 17.2 14 16 15 M19 6C21 8 21.8 10 21.8 12C21.8 14 21 16 19 18",
  "volume-x": "M3 9H7L12 4V20L7 15H3Z M17 9L22 15 M22 9L17 15",
  "mic": "M12 2C10.3 2 9 3.3 9 5V12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12V5C15 3.3 13.7 2 12 2Z M5 11C5 15 8 18 12 18C16 18 19 15 19 11 M12 18V22 M8 22H16",
  "headphones": "M4 16V12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12V16 M4 14H7V21H4Z M17 14H20V21H17Z",

  // comms
  "bell": "M12 3C8.7 3 6 5.7 6 9V14L4 17H20L18 14V9C18 5.7 15.3 3 12 3Z M10 20C10.5 21 11.2 21.5 12 21.5C12.8 21.5 13.5 21 14 20",
  "bell-off": "M9 4.5C9.9 3.6 11 3 12 3C15.3 3 18 5.7 18 9V14L20 17H8 M6 9V14L4 17 M10 20C10.5 21 11.2 21.5 12 21.5C12.8 21.5 13.5 21 14 20 M3 3L21 21",
  "message": "M4 4H20V16H12L7 20V16H4Z",
  "mail": "M2 5H22V19H2Z M2 6L12 13L22 6",
  "phone": "M6 3H10L12 8L9.5 10C10.5 12.5 12 14 14 15L16 12.5L21 14.5V18.5C21 20 20 21 18.5 21C10 20 4 14 3 5.5C3 4 4 3 5.5 3Z",
  "user": "O12 8 4.5 M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21",
  "users": "O9 8 4 M2 21C2 16.8 5 14 9 14C13 14 16 16.8 16 21 M16 4.5C18 5 19.5 6.6 19.5 8.5C19.5 10.4 18 12 16 12.5 M18 14.5C20.8 15.5 22 18 22 21",

  // ui
  "settings": "O12 12 3.2 M12 2.5V5 M12 19V21.5 M4.5 7.2L6.7 8.5 M17.3 15.5L19.5 16.8 M4.5 16.8L6.7 15.5 M17.3 8.5L19.5 7.2",
  "sliders": "M4 6H14 M18 6H20 M4 12H8 M12 12H20 M4 18H16 M20 18H20.5 O16 6 2 O10 12 2 O18 18 2",
  "search": "O10.5 10.5 7.5 M16 16L21 21",
  "filter": "M3 4H21L14 12V20L10 18V12Z",
  "home": "M3 11L12 3L21 11 M5 9.5V20H19V9.5 M10 20V14H14V20",
  "menu": "M3 6H21 M3 12H21 M3 18H21",
  "more-horizontal": "O5 12 1.5 O12 12 1.5 O19 12 1.5",
  "more-vertical": "O12 5 1.5 O12 12 1.5 O12 19 1.5",
  "grid": "M3 3H10V10H3Z M14 3H21V10H14Z M3 14H10V21H3Z M14 14H21V21H14Z",
  "list": "M8 6H21 M8 12H21 M8 18H21 M3 6H4 M3 12H4 M3 18H4",
  "layers": "M12 2L22 7.5L12 13L2 7.5Z M2 12.5L12 18L22 12.5 M2 17L12 22.5L22 17",
  "columns": "M3 4H21V20H3Z M9 4V20 M15 4V20",
  "maximize": "M3 9V3H9 M15 3H21V9 M21 15V21H15 M9 21H3V15",
  "minimize": "M9 3V9H3 M21 9H15V3 M15 21V15H21 M3 15H9V21",
  "lock": "M6 11H18V21H6Z M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11 M12 15V17",
  "unlock": "M6 11H18V21H6Z M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7 M12 15V17",
  "key": "O7 15 4.5 M10.2 11.8L20 2 M17 5L20 8 M14 8L17 11",
  "eye": "M2 12C4.5 7.5 8 5.5 12 5.5C16 5.5 19.5 7.5 22 12C19.5 16.5 16 18.5 12 18.5C8 18.5 4.5 16.5 2 12Z O12 12 3.2",
  "eye-off": "M4 6C2.8 7.5 2 9.5 2 12C4.5 16.5 8 18.5 12 18.5C13.6 18.5 15.1 18.2 16.5 17.5 M9 5.9C9.9 5.6 11 5.5 12 5.5C16 5.5 19.5 7.5 22 12C21.2 13.6 20.2 14.9 19 16 M3 3L21 21 M9.5 9.5C9 10.2 8.8 11 8.8 12C8.8 13.8 10.2 15.2 12 15.2C13 15.2 13.8 14.9 14.5 14.3",
  "trash": "M4 6H20 M9 6V4H15V6 M6 6L7 21H17L18 6 M10 10V17 M14 10V17",
  "download": "M12 3V15 M6 10L12 16L18 10 M4 20H20",
  "upload": "M12 16V4 M6 9L12 3L18 9 M4 20H20",
  "refresh": "M20 12C20 16.4 16.4 20 12 20C8.6 20 5.7 17.9 4.6 15 M4 12C4 7.6 7.6 4 12 4C15.4 4 18.3 6.1 19.4 9 M19.4 4V9H14.4 M4.6 20V15H9.6",
  "link": "M10 14C11.5 15.5 13.5 15.5 15 14L19 10C20.5 8.5 20.5 6 19 4.5C17.5 3 15 3 13.5 4.5L12 6 M14 10C12.5 8.5 10.5 8.5 9 10L5 14C3.5 15.5 3.5 18 5 19.5C6.5 21 9 21 10.5 19.5L12 18",
  "camera": "M3 7H7L9 4H15L17 7H21V20H3Z O12 13 4.5",
  "image": "M3 4H21V20H3Z O8 9 2 M3 17L9 12L14 16L18 13L21 15.5",
  "file": "M6 2H14L19 7V22H6Z M14 2V7H19",
  "folder": "M3 5H9L11 8H21V20H3Z",
  "tag": "M2 2H11L22 13L13 22L2 11Z O6.5 6.5 1.5",
  "shopping-bag": "M4 7H20L19 21H5Z M8 7V5C8 3 9.8 2 12 2C14.2 2 16 3 16 5V7",
  "coffee": "M3 8H17V15C17 18 15 20 12 20H8C5 20 3 18 3 15Z M17 10H19C20.7 10 22 11.3 22 13C22 14.7 20.7 16 19 16H17 M7 2V5 M11 2V5",
  "glasses": "O6.5 15 4.5 O17.5 15 4.5 M11 15C11 13.5 13 13.5 13 15 M2 15C2 10 3.5 7 6 6 M22 15C22 10 20.5 7 18 6"
};

export type GlyphIconName = keyof typeof iconPaths | (string & {});

const cache = new Map<string, GlyphPath>();

function pathFor(name: string): GlyphPath | null {
  const cached = cache.get(name);
  if (cached) return cached;
  const d = iconPaths[name];
  if (!d) return null;
  const parsed = parsePath(d);
  cache.set(name, parsed);
  return parsed;
}

/** Add or override an icon at runtime. Path data is on the same 24x24 grid. */
export function registerIcon(name: string, d: string): void {
  iconPaths[name] = d;
  cache.delete(name);
}

export function hasIcon(name: string): boolean {
  return name in iconPaths;
}

export function iconNames(): string[] {
  return Object.keys(iconPaths).sort();
}

/**
 * Draw an icon centred on (cx, cy) at the given size.
 * Stroke width scales with size but is clamped so icons stay legible when
 * small — a hairline-stroked 10px icon reads as noise on this display.
 */
export function icon(
  r: GlyphRaster, name: GlyphIconName, cx: number, cy: number,
  size = 24, gray: Gray = 15, paint: Paint = {}
): void {
  const p = pathFor(name);
  if (!p) return;
  const scale = size / 24;
  const width = paint.width ?? Math.max(1, Math.min(2.6, size / 11));
  r.path(p, cx - size / 2, cy - size / 2, scale, {
    stroke: gray, width, cap: "round", join: "round", fill: undefined, ...paint
  });
}

/** Draw an icon filled rather than stroked. Good for solid arrows and markers. */
export function iconFilled(
  r: GlyphRaster, name: GlyphIconName, cx: number, cy: number,
  size = 24, gray: Gray = 15
): void {
  const p = pathFor(name);
  if (!p) return;
  const scale = size / 24;
  r.path(p, cx - size / 2, cy - size / 2, scale, { fill: gray });
}
