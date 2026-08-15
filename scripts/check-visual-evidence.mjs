import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import jpeg from "jpeg-js";

const root = process.env.KAMI_VISUAL_ROOT
  ? pathToFileURL(`${process.env.KAMI_VISUAL_ROOT}/`)
  : new URL("../", import.meta.url);
const historicalEvidence = process.env.KAMI_VISUAL_EVIDENCE
  ? pathToFileURL(`${process.env.KAMI_VISUAL_EVIDENCE}/`)
  : new URL("../visual-evidence/", import.meta.url);
const macosEvidence = process.env.KAMI_VISUAL_MACOS_EVIDENCE
  ? pathToFileURL(`${process.env.KAMI_VISUAL_MACOS_EVIDENCE}/`)
  : new URL("macos/", historicalEvidence);
const windowsEvidence = new URL("windows/", historicalEvidence);

const [historicalManifest, macosManifest, windowsManifest, packageJson, pluginManifest] = await Promise.all([
  readFile(new URL("manifest.json", historicalEvidence), "utf8").then(JSON.parse),
  readFile(new URL("manifest.json", macosEvidence), "utf8").then(JSON.parse),
  readFile(new URL("manifest.json", windowsEvidence), "utf8").then(JSON.parse),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  readFile(new URL("manifest.json", root), "utf8").then(JSON.parse)
]);

const historicalRequired = new Map([
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
  ["kami-dark-wide-content-outline", ["Kami Reader", "dark", "reading", "single", "wide-content"]],
  ["kami-light-settings", ["Kami Reader", "light", "settings", "single", "settings"]],
  ["kami-dark-settings", ["Kami Reader", "dark", "settings", "single", "settings"]],
  ["kami-light-command-palette", ["Kami Reader", "light", "command-palette", "single", "foreground"]],
  ["kami-dark-quick-switcher", ["Kami Reader", "dark", "quick-switcher", "single", "foreground"]],
  ["kami-light-context-menu", ["Kami Reader", "light", "reading", "single", "context-menu"]],
  ["kami-dark-notice", ["Kami Reader", "dark", "reading", "single", "notice"]],
  ["kami-light-search-sidebar", ["Kami Reader", "light", "search", "split", "side-pane"]],
  ["kami-dark-secondary-panes", ["Kami Reader", "dark", "reading", "single", "side-pane"]]
]);

const currentRequired = new Map([
  ["macos-default-light-editing-split", {
    state: ["Default", "light", "editing", "split", "base"],
    assertions: ["default-font-preserved", "frameless-titlebar-safe-area", "native-status-bar", "pane-gutter-visible"]
  }],
  ["macos-default-dark-reading-single", {
    state: ["Default", "dark", "reading", "single", "base"],
    assertions: ["default-font-preserved", "frameless-titlebar-safe-area", "native-status-bar"]
  }],
  ["macos-kami-light-editing-split", {
    state: ["Kami Reader", "light", "editing", "split", "base"],
    assertions: ["theme-font-inherited", "frameless-titlebar-safe-area", "native-status-bar", "pane-gutter-visible"]
  }],
  ["macos-kami-dark-editing-split", {
    state: ["Kami Reader", "dark", "editing", "split", "base"],
    assertions: ["theme-font-inherited", "frameless-titlebar-safe-area", "native-status-bar", "pane-gutter-visible"]
  }],
  ["macos-kami-light-reading-single", {
    state: ["Kami Reader", "light", "reading", "single", "base"],
    assertions: ["theme-font-inherited", "frameless-titlebar-safe-area", "native-status-bar"]
  }],
  ["macos-kami-dark-reading-single", {
    state: ["Kami Reader", "dark", "reading", "single", "base"],
    assertions: ["theme-font-inherited", "frameless-titlebar-safe-area", "native-status-bar"]
  }],
  ["macos-kami-light-reading-stage-single", {
    state: ["Kami Reader", "light", "reading", "single", "stage"],
    assertions: ["theme-font-inherited", "frameless-titlebar-safe-area", "stage-status-overlay"]
  }],
  ["macos-default-dark-white-page-preview", {
    state: ["Default", "dark", "reading", "single", "white-page-preview"],
    assertions: ["default-font-preserved", "white-document-paper", "dark-shell-retained", "warm-document-surfaces"]
  }],
  ["macos-kami-dark-white-page-preview", {
    state: ["Kami Reader", "dark", "reading", "single", "white-page-preview"],
    assertions: ["theme-font-inherited", "white-document-paper", "dark-shell-retained", "warm-document-surfaces"]
  }]
]);

const historicalWindowsRequired = new Map([
  ["windows-default-light-editing-split", {
    state: ["Default", "light", "editing", "split", "base"],
    assertions: ["default-font-preserved", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-default-dark-reading-single", {
    state: ["Default", "dark", "reading", "single", "base"],
    assertions: ["default-font-preserved", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-kami-light-editing-split", {
    state: ["Kami Reader", "light", "editing", "split", "base"],
    assertions: ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-kami-dark-editing-split", {
    state: ["Kami Reader", "dark", "editing", "split", "base"],
    assertions: ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-kami-light-reading-single", {
    state: ["Kami Reader", "light", "reading", "single", "base"],
    assertions: ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-kami-dark-reading-single", {
    state: ["Kami Reader", "dark", "reading", "single", "base"],
    assertions: ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]
  }],
  ["windows-kami-light-reading-stage-single", {
    state: ["Kami Reader", "light", "reading", "single", "stage"],
    assertions: ["theme-font-inherited", "caption-controls-clear", "stage-status-overlay"]
  }],
  ["windows-default-dark-white-page-preview", {
    state: ["Default", "dark", "reading", "single", "white-page-preview"],
    assertions: ["default-font-preserved", "white-document-paper", "dark-shell-retained", "warm-document-surfaces"]
  }],
  ["windows-kami-dark-white-page-preview", {
    state: ["Kami Reader", "dark", "reading", "single", "white-page-preview"],
    assertions: ["theme-font-inherited", "white-document-paper", "dark-shell-retained", "warm-document-surfaces"]
  }]
]);

const requiredChecklist = [
  "fixture-only-content",
  "mode-and-layout-match",
  "frameless-titlebar-safe-area",
  "status-bar-placement",
  "theme-font-contract",
  "white-page-preview-boundary",
  "pane-gutter-visible"
];
const textHashEncoding = "utf8-lf-v1";
const rawHashEncoding = "raw-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalText = (bytes) => {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
};
const hashByEncoding = (bytes, encoding) => {
  if (encoding === rawHashEncoding) return sha256(bytes);
  if (encoding === textHashEncoding) return sha256(canonicalText(bytes));
  throw new Error(`unsupported hash encoding: ${encoding}`);
};

const MAX_JPEG_BYTES = 16 * 1024 * 1024;
const jpegSize = (bytes) => {
  try {
    if (bytes.length > MAX_JPEG_BYTES) throw new Error("file exceeds 16 MiB");
    const decoded = jpeg.decode(bytes, {
      formatAsRGBA: false,
      maxMemoryUsageInMB: 128,
      maxResolutionInMP: 6,
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

const validateArtifacts = async ({ manifest, evidence, required, label }) => {
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== required.size) {
    throw new Error(`${label} visual evidence must contain exactly ${required.size} artifacts`);
  }
  const seen = new Set();
  const seenFiles = new Set();
  const seenImages = new Set();
  for (const artifact of manifest.artifacts) {
    const expected = required.get(artifact.id);
    if (!expected) throw new Error(`unknown ${label} visual state: ${artifact.id}`);
    if (seen.has(artifact.id)) throw new Error(`duplicate ${label} visual state: ${artifact.id}`);
    seen.add(artifact.id);
    const expectedState = Array.isArray(expected) ? expected : expected.state;
    const actualState = [artifact.theme, artifact.colorScheme, artifact.mode, artifact.layout, artifact.scenario];
    if (actualState.some((value, index) => value !== expectedState[index])) {
      throw new Error(`${artifact.id} state mismatch`);
    }
    if (artifact.sidebars !== "expanded") throw new Error(`${artifact.id} must capture expanded sidebars`);
    if (!Array.isArray(expected) && JSON.stringify(artifact.assertions) !== JSON.stringify(expected.assertions)) {
      throw new Error(`${artifact.id} assertions mismatch`);
    }
    if (typeof artifact.file !== "string" || !/^[a-z0-9][a-z0-9._-]*\.jpe?g$/i.test(artifact.file)) {
      throw new Error(`${artifact.id} has an invalid artifact file`);
    }
    if (seenFiles.has(artifact.file)) throw new Error(`${artifact.id} must use an independent screenshot file`);
    seenFiles.add(artifact.file);
    const bytes = await readFile(new URL(artifact.file, evidence));
    const size = jpegSize(bytes);
    const rasterWidth = manifest.viewport.width * manifest.deviceScaleFactor;
    const rasterHeight = manifest.viewport.height * manifest.deviceScaleFactor;
    if (size.width !== rasterWidth || size.height !== rasterHeight) {
      throw new Error(`${artifact.file} must represent the declared ${manifest.viewport.width}x${manifest.viewport.height} viewport at ${manifest.deviceScaleFactor}x`);
    }
    if (sha256(bytes) !== artifact.sha256) throw new Error(`${artifact.file} hash mismatch`);
    if (seenImages.has(size.pixels)) throw new Error(`${artifact.id} must show an independent screenshot`);
    seenImages.add(size.pixels);
  }
  for (const id of required.keys()) if (!seen.has(id)) throw new Error(`missing ${label} visual state: ${id}`);
  return seen.size;
};

if (historicalManifest.kind !== "historical-macos-matrix" || historicalManifest.candidate) {
  throw new Error("macOS matrix must be explicitly historical and must not claim the current candidate");
}
if (historicalManifest.appVersion !== "1.13.4" || historicalManifest.os !== "macOS") {
  throw new Error("historical visual matrix must come from Obsidian 1.13.4 on macOS");
}
if (historicalManifest.viewport?.width !== 1440 || historicalManifest.viewport?.height !== 900) {
  throw new Error("historical visual viewport must be 1440x900");
}
if (![1, 2].includes(historicalManifest.deviceScaleFactor)) {
  throw new Error("historical visual evidence must declare a deviceScaleFactor of 1 or 2");
}
if (!/^0\.1\.\d+$/.test(historicalManifest.baselineCandidate?.version ?? "") ||
  Object.keys(historicalManifest.baselineCandidate?.sha256 ?? {}).sort().join(",") !== "main.js,manifest.json,styles.css" ||
  Object.values(historicalManifest.baselineCandidate.sha256).some((hash) => !/^[a-f0-9]{64}$/.test(hash))) {
  throw new Error("historical matrix must retain its original candidate provenance");
}

if (windowsManifest.kind !== "historical-windows-matrix" || windowsManifest.candidate) {
  throw new Error("Windows evidence must be historical and must not claim the current candidate");
}
if (windowsManifest.appVersion !== "1.13.6" || windowsManifest.os !== "Windows") {
  throw new Error("historical Windows matrix must come from Obsidian 1.13.6 on Windows");
}
if (Object.keys(windowsManifest.baselineCandidate?.sha256 ?? {}).sort().join(",") !== "main.js,manifest.json,styles.css") {
  throw new Error("historical Windows matrix must retain its original candidate provenance");
}

if (macosManifest.kind !== "current-macos-acceptance") {
  throw new Error("macOS evidence must be marked as current candidate acceptance");
}
if (macosManifest.appVersion !== "1.13.7" || macosManifest.os !== "macOS") {
  throw new Error("current visual acceptance must come from Obsidian 1.13.7 on macOS");
}
if (macosManifest.fixtureVault !== "visual-vault") {
  throw new Error("macOS acceptance must use the tracked visual-vault fixture");
}
if (macosManifest.viewport?.width !== 1440 || macosManifest.viewport?.height !== 900 ||
  macosManifest.deviceScaleFactor !== 1) {
  throw new Error("macOS acceptance must declare the captured 1440x900 viewport at 1x");
}
if (macosManifest.review?.method !== "human-pixel-review" ||
  JSON.stringify(macosManifest.review.checklist) !== JSON.stringify(requiredChecklist)) {
  throw new Error("macOS acceptance must record the complete human review checklist");
}
if (macosManifest.candidate.version !== packageJson.version || macosManifest.candidate.version !== pluginManifest.version) {
  throw new Error("macOS visual candidate version must match package.json and manifest.json");
}

const candidateEncodings = {
  "main.js": rawHashEncoding,
  "manifest.json": textHashEncoding,
  "styles.css": textHashEncoding
};
if (JSON.stringify(macosManifest.candidate.hashEncoding) !== JSON.stringify(candidateEncodings)) {
  throw new Error("candidate hash encodings must use raw-v1 for main.js and utf8-lf-v1 for text assets");
}
const candidateAssets = Object.keys(candidateEncodings).sort();
const declaredAssets = Object.keys(macosManifest.candidate.sha256 ?? {}).sort();
if (JSON.stringify(declaredAssets) !== JSON.stringify(candidateAssets)) {
  throw new Error(`candidate hashes must contain exactly: ${candidateAssets.join(", ")}`);
}
for (const name of candidateAssets) {
  const actual = hashByEncoding(await readFile(new URL(name, root)), candidateEncodings[name]);
  if (actual !== macosManifest.candidate.sha256[name]) throw new Error(`${name} hash mismatch`);
}

const theme = macosManifest.themeDependency;
if (theme?.repository !== "KKenny0/obsidian-kami" || theme.tag !== "0.3.0" ||
  Object.hasOwn(theme, "commit") || theme.asset !== "theme.css" ||
  theme.hashEncoding !== textHashEncoding || !/^[a-f0-9]{64}$/.test(theme.sha256 ?? "")) {
  throw new Error("macOS acceptance must bind the exact Kami Reader 0.3.0 release-candidate theme.css");
}
if (!process.env.KAMI_VISUAL_THEME_CSS) {
  throw new Error("KAMI_VISUAL_THEME_CSS must point to the exact paired Kami Reader theme.css");
}
const themeBytes = await readFile(pathToFileURL(process.env.KAMI_VISUAL_THEME_CSS));
if (hashByEncoding(themeBytes, theme.hashEncoding) !== theme.sha256) {
  throw new Error("pinned Kami Reader theme.css hash mismatch");
}

const historicalCount = await validateArtifacts({
  manifest: historicalManifest,
  evidence: historicalEvidence,
  required: historicalRequired,
  label: "historical macOS"
});
const macosCount = await validateArtifacts({
  manifest: macosManifest,
  evidence: macosEvidence,
  required: currentRequired,
  label: "current macOS"
});
const windowsCount = await validateArtifacts({
  manifest: windowsManifest,
  evidence: windowsEvidence,
  required: historicalWindowsRequired,
  label: "historical Windows"
});

console.log(`Retained ${historicalCount} historical macOS reference captures (not current acceptance).`);
console.log(`Retained ${windowsCount} historical Windows reference captures (not current acceptance).`);
console.log(`Verified ${macosCount} current macOS candidate captures for Obsidian 1.13.7 after recorded human pixel review.`);
