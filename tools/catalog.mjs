/**
 * Writes docs/COMPONENTS.md from the source.
 *
 *   npm run catalog          rewrite the file
 *   npm run catalog -- --check   fail if the file is out of date (CI)
 *
 * A hand-kept list of components is wrong within a week of being written. This
 * one is read off the code: every exported drawing function, its parameters,
 * and the first sentence of its doc comment. A component with no doc comment
 * fails the build, which is the only way such a rule survives.
 */
import fs from "node:fs";

const OUT = "docs/COMPONENTS.md";

const MODULES = [
  ["components", "Core components", "Surfaces, data display, indicators, buttons and the original instruments."],
  ["extended", "Compact controls", "Small, stroke-only controls. Marked experimental: check them on hardware."],
  ["hud", "HUD instruments", "Moving scales, aiming marks, scopes and meters — the shapes a see-through display is best at."],
  ["overlays", "Overlays and feedback", "Dialogs, sheets, menus, alerts, gesture hints, captions, and ways of saying \"not yet\"."],
  ["content", "Content", "People, messages, tables, schedules, media, and text in motion."],
  ["inputs", "Inputs", "Controls for four gestures and no pointer. Each has a focused state."],
  ["charts", "Charts", "Line, bar and scatter; parts of a whole; distributions; radial and polar."]
];

/** Split a parameter list on its top-level commas. */
function splitParams(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if ("([{<".includes(ch)) depth++;
    else if (")]}>".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(current); current = ""; } else current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** `name`, `name?` for an optional or defaulted parameter. */
function paramName(param) {
  const match = /^([A-Za-z_$][\w$]*)\s*(\??)\s*[:=]?/.exec(param);
  if (!match) return "…";
  const optional = match[2] === "?" || /=\s*[^>]/.test(param.replace(/=>/g, ""));
  return match[1] + (optional ? "?" : "");
}

/** The text of the doc comment's first sentence. */
function summary(comment) {
  const text = comment
    .replace(/^\s*\/\*\*/, "").replace(/\*\/\s*$/, "")
    .split("\n").map((line) => line.replace(/^\s*\*\s?/, "")).join(" ")
    .replace(/\s+/g, " ").trim();
  const end = text.search(/[.:]\s[A-Z`"]|[.]$/);
  return (end < 0 ? text : text.slice(0, end + 1)).replace(/:$/, ".").replace(/\|/g, "\\|");
}

function read(module) {
  const source = fs.readFileSync(`src/glyph/${module}.ts`, "utf8");
  const found = [];
  const pattern = /(\/\*\*(?:(?!\*\/)[\s\S])*\*\/\s*)?export function (\w+)\s*\(/g;
  let match;
  while ((match = pattern.exec(source))) {
    // Walk to the parenthesis that closes the parameter list.
    let depth = 1;
    let i = pattern.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "(") depth++;
      else if (source[i] === ")") depth--;
      i++;
    }
    const params = splitParams(source.slice(pattern.lastIndex, i - 1)).map(paramName);
    found.push({ name: match[2], params, summary: match[1] ? summary(match[1]) : "" });
  }
  return found;
}

const undocumented = [];
let total = 0;
let body = "";
for (const [module, title, blurb] of MODULES) {
  const entries = read(module).sort((a, b) => a.name.localeCompare(b.name));
  total += entries.length;
  body += `\n## ${title}\n\n${blurb} — \`src/glyph/${module}.ts\`\n\n| Component | What it is |\n|---|---|\n`;
  for (const entry of entries) {
    if (!entry.summary) undocumented.push(`${module}.${entry.name}`);
    body += `| \`${entry.name}(${entry.params.join(", ")})\` | ${entry.summary} |\n`;
  }
}

const iconSource = fs.readFileSync("src/glyph/icons.ts", "utf8");
const iconBlock = iconSource.slice(iconSource.indexOf("export const iconPaths"), iconSource.indexOf("export type GlyphIconName"));
const icons = [...iconBlock.matchAll(/^  "([a-z0-9-]+)":/gm)].map((m) => m[1]).sort();

const text =
  `# Component catalog\n\n` +
  `Generated from the source by \`npm run catalog\` — do not edit by hand.\n\n` +
  `**${total} components** and **${icons.length} icons**. Every one is imported from \`@gabrielevierti/glyph\`, ` +
  `takes the raster as its first argument, and draws in both surface styles. ` +
  `Each is shown on a reference screen in the preview (\`npm run dev\`).\n\n` +
  `A trailing \`?\` marks an optional parameter. \`g\` is a \`GlyphRaster\`; \`r\` and \`box\` are rects; ` +
  `\`cx\`, \`cy\` are a centre. Options and their types are in the source and in your editor's hover.\n` +
  body +
  `\n## Icons\n\n${icons.length} stroked icons on a 24px grid, drawn with \`icon(g, name, cx, cy, size, gray)\`. ` +
  `Add your own with \`registerIcon(name, pathData)\`.\n\n${icons.map((n) => `\`${n}\``).join(" · ")}\n`;

if (undocumented.length) {
  console.error(`Components with no doc comment:\n  ${undocumented.join("\n  ")}`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.error(`${OUT} is out of date — run \`npm run catalog\`.`);
    process.exit(1);
  }
  console.log(`${OUT} is current: ${total} components, ${icons.length} icons.`);
} else {
  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync(OUT, text);
  console.log(`${total} components, ${icons.length} icons → ${OUT}`);
}
