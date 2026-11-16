import { chartsScreen } from "./charts.js";
import { componentsScreen } from "./components.js";
import { dashboardScreen } from "./dashboard.js";
import { navigatorScreen } from "./navigator.js";
import { primitivesScreen } from "./primitives.js";
import { seaStateScreen } from "./seastate.js";
import { showcaseControls, showcaseDashboard, showcaseStates } from "./showcase.js";
import { hudFlightScreen, hudInstrumentsScreen } from "./hud.js";
import { overlaysScreen, readingScreen, sheetsScreen } from "./overlays.js";
import { dataScreen, iconsScreen, moreChartsScreen } from "./data.js";
import { inputsScreen, mediaScreen } from "./inputs.js";
import type { Screen } from "../glyph/index.js";

/**
 * Applications first, then the reference.
 *
 * SeaState and Navigator are real designs — they are what the framework exists
 * to make possible. Dashboard is the general case, and HUD · Flight is the
 * layout the display was made for. Everything else is the reference: every
 * primitive, chart, component and icon the library has, each on a screen, so a
 * regression is something you see rather than something you hear about.
 */
export const screens: Screen[] = [
  seaStateScreen,
  navigatorScreen,
  dashboardScreen,
  primitivesScreen,
  chartsScreen,
  componentsScreen,
  showcaseControls,
  showcaseDashboard,
  showcaseStates,
  // The component library, one family per screen. New screens go at the end:
  // the tests address the ones above by position.
  hudFlightScreen,
  hudInstrumentsScreen,
  overlaysScreen,
  sheetsScreen,
  readingScreen,
  dataScreen,
  moreChartsScreen,
  inputsScreen,
  mediaScreen,
  iconsScreen
];
