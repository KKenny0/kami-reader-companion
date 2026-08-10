import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import jpeg from "jpeg-js";

const root = process.env.KAMI_VISUAL_ROOT
  ? pathToFileURL(`${process.env.KAMI_VISUAL_ROOT}/`)
  : new URL("../", import.meta.url);
const evidence = process.env.KAMI_VISUAL_EVIDENCE
  ? pathToFileURL(`${process.env.KAMI_VISUAL_EVIDENCE}/`)
  : new URL("../visual-evidence/", import.meta.url);
const [manifest, packageJson, pluginManifest] = await Promise.all([
  readFile(new URL("manifest.json", evidence), "utf8").then(JSON.parse),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  readFile(new URL("manifest.json", root), "utf8").then(JSON.parse)
]);

const required = new Map([
  ["default-light-reading-single", ["Default", "light", "reading", "single", "base"]],
  ["default-light-editing-split", ["Default", "light", "editing", "split", "base"]],
  ["default-dark-reading-single", ["Default", "dark", "reading", "single", "base"]],
  ["default-dark-editing-split", ["Default", "dark", "editing", "split", "base"]],
  ["kami-light-reading-single", ["Kami Reader", "light", "reading", "single", "base"]],
  ["kami-light-editing-split", ["Kami Reader", "light", "editing", "split", "base"]],
  ["kami-dark-reading-single", ["Kami Reader", "dark", "reading", "single", "base"]],
  ["kami-dark-editing-split", ["Kami Reader", "dark", "editing", "split", "base"]],
  ["kami-light-new-tab", ["Kami Reader", "light", "new-tab", "single", "new-tab"]],
  ["kami-light-long-path", ["Kami Reader", "light", "reading", "single", "long-path"]],
  ["kami-light-reading-focus", ["Kami Reader", "light", "reading", "single", "focus"]],
  ["kami-dark-editing-focus", ["Kami Reader", "dark", "editing", "single", "focus"]],
  ["kami-light-reading-stage", ["Kami Reader", "light", "reading", "single", "stage"]],
  ["kami-dark-wide-outline-split", ["Kami Reader", "dark", "reading", "split", "wide-outline"]],
  ["kami-light-settings", ["Kami Reader", "light", "settings", "single", "settings"]],
  ["kami-dark-settings", ["Kami Reader", "dark", "settings", "single", "settings"]],
  ["kami-light-command-palette", ["Kami Reader", "light", "command-palette", "single", "foreground"]],
  ["kami-dark-quick-switcher", ["Kami Reader", "dark", "quick-switcher", "single", "foreground"]],
  ["kami-light-context-menu", ["Kami Reader", "light", "reading", "single", "context-menu"]],
  ["kami-dark-notice", ["Kami Reader", "dark", "reading", "single", "notice"]],
  ["kami-light-search-sidebar", ["Kami Reader", "light", "search", "split", "side-pane"]],
  ["kami-dark-secondary-panes", ["Kami Reader", "dark", "reading", "split", "side-pane"]]
]);

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const MAX_JPEG_BYTES = 16 * 1024 * 1024;
const jpegSize = (bytes) => {
  try {
    if (bytes.length > MAX_JPEG_BYTES) throw new Error("file exceeds 16 MiB");
    const decoded = jpeg.decode(bytes, {
      formatAsRGBA: false,
      maxMemoryUsageInMB: 64,
      maxResolutionInMP: 2,
      useTArray: true
    });
    if (!decoded?.width || !decoded.height) throw new Error("missing dimensions");
    return { width: decoded.width, height: decoded.height, pixels: sha256(decoded.data) };
  } catch (error) {
    if (error instanceof Error &&
      (error.message.includes("exceeds 16 MiB") || error.message.includes("maxResolutionInMP") ||
        error.message.includes("maxMemoryUsageInMB"))) {
      throw new Error("visual artifact exceeds decode limits", { cause: error });
    }
    throw new Error("visual artifact is not a decodable JPEG", { cause: error });
  }
};

const candidateAssets = ["main.js", "manifest.json", "styles.css"];

if (manifest.visualBaseline) throw new Error("carried-forward visual baselines are not allowed");
if (manifest.candidate.version !== packageJson.version || manifest.candidate.version !== pluginManifest.version) {
  throw new Error("visual candidate version must match package.json and manifest.json");
}
if (manifest.appVersion !== "1.13.4" || manifest.os !== "macOS") {
  throw new Error("visual evidence must come from Obsidian 1.13.4 on macOS");
}
if (manifest.viewport?.width !== 1440 || manifest.viewport?.height !== 900) {
  throw new Error("visual viewport must be 1440x900");
}
const declaredAssets = Object.keys(manifest.candidate.sha256 ?? {}).sort();
if (declaredAssets.length !== candidateAssets.length || declaredAssets.some((name, index) => name !== candidateAssets[index])) {
  throw new Error(`candidate hashes must contain exactly: ${candidateAssets.join(", ")}`);
}
for (const [name, expected] of Object.entries(manifest.candidate.sha256)) {
  const actual = sha256(await readFile(new URL(name, root)));
  if (actual !== expected) throw new Error(`${name} hash mismatch`);
}

if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== required.size) {
  throw new Error(`visual evidence must contain exactly ${required.size} artifacts`);
}
const seen = new Set();
const seenFiles = new Set();
const seenImages = new Set();
for (const artifact of manifest.artifacts) {
  const expected = required.get(artifact.id);
  if (!expected) throw new Error(`unknown visual state: ${artifact.id}`);
  if (seen.has(artifact.id)) throw new Error(`duplicate visual state: ${artifact.id}`);
  seen.add(artifact.id);
  const actualState = [artifact.theme, artifact.colorScheme, artifact.mode, artifact.layout, artifact.scenario];
  if (actualState.some((value, index) => value !== expected[index])) throw new Error(`${artifact.id} state mismatch`);
  if (artifact.sidebars !== "expanded") throw new Error(`${artifact.id} must capture expanded sidebars`);
  if (typeof artifact.file !== "string" || !/^[a-z0-9][a-z0-9._-]*\.jpe?g$/i.test(artifact.file)) {
    throw new Error(`${artifact.id} has an invalid artifact file`);
  }
  if (seenFiles.has(artifact.file)) throw new Error(`${artifact.id} must use an independent screenshot file`);
  seenFiles.add(artifact.file);
  const bytes = await readFile(new URL(artifact.file, evidence));
  const size = jpegSize(bytes);
  if (size.width !== manifest.viewport.width || size.height !== manifest.viewport.height) {
    throw new Error(`${artifact.file} must be 1440x900`);
  }
  if (sha256(bytes) !== artifact.sha256) throw new Error(`${artifact.file} hash mismatch`);
  if (seenImages.has(size.pixels)) throw new Error(`${artifact.id} must show an independent screenshot`);
  seenImages.add(size.pixels);
}

for (const id of required.keys()) if (!seen.has(id)) throw new Error(`missing visual state: ${id}`);

console.log(`Verified structural integrity for ${seen.size} 1440x900 captures from Obsidian ${manifest.appVersion}.`);
