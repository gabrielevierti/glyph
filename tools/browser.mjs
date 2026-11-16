/**
 * One place that decides which browser the scripts drive.
 *
 * By default this is Playwright's own Chromium (`npx playwright install
 * chromium`). Two environment variables override it, for machines where that
 * download is unavailable or unwanted:
 *
 *   GLYPH_BROWSER_CHANNEL=chrome     use an installed Chrome / Edge channel
 *   GLYPH_BROWSER_PATH=/path/chrome  use a specific executable
 */
import { chromium } from "playwright";

export async function launchBrowser() {
  const options = {};
  if (process.env.GLYPH_BROWSER_PATH) options.executablePath = process.env.GLYPH_BROWSER_PATH;
  else if (process.env.GLYPH_BROWSER_CHANNEL) options.channel = process.env.GLYPH_BROWSER_CHANNEL;
  try {
    return await chromium.launch(options);
  } catch (error) {
    const message = String(error?.message ?? error);
    if (/Executable doesn't exist|playwright install/.test(message)) {
      throw new Error(
        "Glyph: no browser to render with. Run `npx playwright install chromium`, " +
        "or point GLYPH_BROWSER_CHANNEL / GLYPH_BROWSER_PATH at one you already have."
      );
    }
    throw error;
  }
}
