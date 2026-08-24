import { chartsScreen } from "./charts.js";
import { componentsScreen } from "./components.js";
import { dashboardScreen } from "./dashboard.js";
import { navigatorScreen } from "./navigator.js";
import { primitivesScreen } from "./primitives.js";
import { seaStateScreen } from "./seastate.js";
import type { Screen } from "../glyph/index.js";

/**
 * Four applications and two reference screens.
 *
 * SeaState and Navigator are real designs — they are what the framework exists
 * to make possible. Dashboard is the general case. Primitives, Charts and
 * Components are the reference: everything the library can draw, on three
 * screens, so a regression is visible rather than reported.
 */
export const screens: Screen[] = [
  seaStateScreen,
  navigatorScreen,
  dashboardScreen,
  primitivesScreen,
  chartsScreen,
  componentsScreen
];
