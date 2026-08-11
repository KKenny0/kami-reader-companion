import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import jpeg from "jpeg-js";

const script = fileURLToPath(new URL("../scripts/check-visual-evidence.mjs", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalTextHash = (bytes) =>
  sha256(Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8"));
const states = [
  ["default-light-reading-single", "Default", "light", "reading", "single", "base"],
  ["default-light-editing-split", "Default", "light", "editing", "split", "base"],
  ["default-dark-reading-single", "Default", "dark", "reading", "single", "base"],
  ["default-dark-editing-split", "Default", "dark", "editing", "split", "base"],
  ["kami-light-reading-single", "Kami Reader", "light", "reading", "single", "base"],
  ["kami-light-editing-split", "Kami Reader", "light", "editing", "split", "base"],
  ["kami-dark-reading-single", "Kami Reader", "dark", "reading", "single", "base"],
  ["kami-dark-editing-split", "Kami Reader", "dark", "editing", "split", "base"],
  ["kami-light-new-tab", "Kami Reader", "light", "new-tab", "single", "new-tab"],
  ["kami-light-long-path", "Kami Reader", "light", "reading", "single", "long-path"],
  ["kami-light-reading-focus", "Kami Reader", "light", "reading", "single", "focus"],
  ["kami-dark-editing-focus", "Kami Reader", "dark", "editing", "single", "focus"],
  ["kami-light-reading-stage", "Kami Reader", "light", "reading", "single", "stage"],
  ["kami-dark-wide-content-outline", "Kami Reader", "dark", "reading", "single", "wide-content"],
  ["kami-light-settings", "Kami Reader", "light", "settings", "single", "settings"],
  ["kami-dark-settings", "Kami Reader", "dark", "settings", "single", "settings"],
  ["kami-light-command-palette", "Kami Reader", "light", "command-palette", "single", "foreground"],
  ["kami-dark-quick-switcher", "Kami Reader", "dark", "quick-switcher", "single", "foreground"],
  ["kami-light-context-menu", "Kami Reader", "light", "reading", "single", "context-menu"],
  ["kami-dark-notice", "Kami Reader", "dark", "reading", "single", "notice"],
  ["kami-light-search-sidebar", "Kami Reader", "light", "search", "split", "side-pane"],
  ["kami-dark-secondary-panes", "Kami Reader", "dark", "reading", "single", "side-pane"]
];

let directory;
let evidence;
let windowsEvidence;
let themePath;
let manifest;
let windowsManifest;

const run = (historicalCandidate, windowsCandidate = windowsManifest) => {
  writeFileSync(join(evidence, "manifest.json"), JSON.stringify(historicalCandidate));
  writeFileSync(join(windowsEvidence, "manifest.json"), JSON.stringify(windowsCandidate));
  return spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      KAMI_VISUAL_ROOT: directory,
      KAMI_VISUAL_EVIDENCE: evidence,
      KAMI_VISUAL_WINDOWS_EVIDENCE: windowsEvidence,
      KAMI_VISUAL_THEME_CSS: themePath
    }
  });
};

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), "kami-visual-evidence-"));
  evidence = join(directory, "visual-evidence");
  windowsEvidence = join(evidence, "windows");
  mkdirSync(evidence);
  mkdirSync(windowsEvidence);
  writeFileSync(join(directory, "main.js"), "main");
  writeFileSync(join(directory, "styles.css"), "styles");
  writeFileSync(join(directory, "package.json"), JSON.stringify({ version: "0.1.5" }));
  writeFileSync(join(directory, "manifest.json"), JSON.stringify({ version: "0.1.5" }));
  themePath = join(directory, "theme.css");
  writeFileSync(themePath, "body { --font-text-theme: serif; }\n");

  const artifacts = states.map(([id, theme, colorScheme, mode, layout, scenario], index) => {
    const pixels = Buffer.alloc(1440 * 900 * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = index * 17;
      pixels[offset + 1] = 255 - index * 11;
      pixels[offset + 2] = index * 7;
      pixels[offset + 3] = 255;
    }
    const bytes = jpeg.encode({ data: pixels, width: 1440, height: 900 }, 20).data;
    const file = `${id}.jpg`;
    writeFileSync(join(evidence, file), bytes);
    return {
      id,
      theme,
      colorScheme,
      mode,
      layout,
      scenario,
      sidebars: "expanded",
      file,
      sha256: sha256(bytes)
    };
  });
  manifest = {
    kind: "historical-macos-matrix",
    appVersion: "1.13.4",
    os: "macOS",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    baselineCandidate: {
      version: "0.1.5",
      sha256: {
        "main.js": sha256(readFileSync(join(directory, "main.js"))),
        "manifest.json": sha256(readFileSync(join(directory, "manifest.json"))),
        "styles.css": sha256(readFileSync(join(directory, "styles.css")))
      }
    },
    artifacts
  };

  const windowsStates = [
    ["windows-default-light-editing-split", "Default", "light", "editing", "split", "base",
      ["default-font-preserved", "caption-controls-clear", "native-status-bar"]],
    ["windows-default-dark-reading-single", "Default", "dark", "reading", "single", "base",
      ["default-font-preserved", "caption-controls-clear", "native-status-bar"]],
    ["windows-kami-light-editing-split", "Kami Reader", "light", "editing", "split", "base",
      ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]],
    ["windows-kami-dark-editing-split", "Kami Reader", "dark", "editing", "split", "base",
      ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]],
    ["windows-kami-light-reading-single", "Kami Reader", "light", "reading", "single", "base",
      ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]],
    ["windows-kami-dark-reading-single", "Kami Reader", "dark", "reading", "single", "base",
      ["theme-font-inherited", "caption-controls-clear", "native-status-bar"]],
    ["windows-kami-light-reading-stage-single", "Kami Reader", "light", "reading", "single", "stage",
      ["theme-font-inherited", "caption-controls-clear", "stage-status-overlay"]]
  ];
  const windowsArtifacts = windowsStates.map(([id, theme, colorScheme, mode, layout, scenario, assertions], index) => {
    const pixels = Buffer.alloc(1200 * 800 * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const pixel = offset / 4;
      pixels[offset] = (pixel + index * 31) % 256;
      pixels[offset + 1] = (Math.floor(pixel / 1200) * 13 + index * 47) % 256;
      pixels[offset + 2] = (Math.floor(pixel / 97) + index * 61) % 256;
      pixels[offset + 3] = 255;
    }
    const bytes = jpeg.encode({ data: pixels, width: 1200, height: 800 }, 20).data;
    const file = `${id}.jpg`;
    writeFileSync(join(windowsEvidence, file), bytes);
    return {
      id,
      theme,
      colorScheme,
      mode,
      layout,
      scenario,
      sidebars: "expanded",
      assertions,
      file,
      sha256: sha256(bytes)
    };
  });
  windowsManifest = {
    kind: "current-windows-acceptance",
    appVersion: "1.13.6",
    os: "Windows",
    fixtureVault: "visual-vault",
    viewport: { width: 1200, height: 800 },
    dpi: 96,
    deviceScaleFactor: 1,
    review: {
      method: "human-pixel-review",
      checklist: [
        "fixture-only-content",
        "mode-and-layout-match",
        "caption-controls-clear",
        "status-bar-placement",
        "theme-font-contract"
      ]
    },
    candidate: {
      version: "0.1.5",
      hashEncoding: {
        "main.js": "raw-v1",
        "manifest.json": "utf8-lf-v1",
        "styles.css": "utf8-lf-v1"
      },
      sha256: {
        "main.js": sha256(readFileSync(join(directory, "main.js"))),
        "manifest.json": canonicalTextHash(readFileSync(join(directory, "manifest.json"))),
        "styles.css": canonicalTextHash(readFileSync(join(directory, "styles.css")))
      }
    },
    themeDependency: {
      repository: "KKenny0/obsidian-kami",
      tag: "0.2.1",
      commit: "0123456789abcdef0123456789abcdef01234567",
      asset: "theme.css",
      hashEncoding: "utf8-lf-v1",
      sha256: canonicalTextHash(readFileSync(themePath))
    },
    artifacts: windowsArtifacts
  };
}, 30_000);

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe("visual evidence gate", () => {
  it("verifies the structural integrity of a complete capture set", () => {
    const result = run(structuredClone(manifest));
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("7 current Windows candidate captures");
  }, 30_000);

  it("rejects missing candidate asset hashes", () => {
    const candidate = structuredClone(windowsManifest);
    delete candidate.candidate.sha256["styles.css"];
    const result = run(structuredClone(manifest), candidate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("candidate hashes must contain exactly");
  });

  it("rejects a corrupt JPEG even when its declared hash matches", () => {
    const candidate = structuredClone(manifest);
    const artifact = candidate.artifacts[0];
    const path = join(evidence, artifact.file);
    const original = readFileSync(path);
    const corrupt = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x08, 0x08, 0x03, 0x84, 0x05, 0xa0, 0x00]);
    writeFileSync(path, corrupt);
    artifact.sha256 = sha256(corrupt);
    const result = run(candidate);
    writeFileSync(path, original);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not a decodable JPEG");
  });

  it("rejects oversized JPEG dimensions before decoding the full image", () => {
    const candidate = structuredClone(manifest);
    const artifact = candidate.artifacts[0];
    const path = join(evidence, artifact.file);
    const original = readFileSync(path);
    const oversized = jpeg.encode({ data: Buffer.alloc(3100 * 2000 * 4), width: 3100, height: 2000 }, 20).data;
    writeFileSync(path, oversized);
    artifact.sha256 = sha256(oversized);
    const result = run(candidate);
    writeFileSync(path, original);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("exceeds decode limits");
  }, 30_000);

  it("rejects one screenshot reused for multiple states", () => {
    const candidate = structuredClone(manifest);
    candidate.artifacts[1].file = candidate.artifacts[0].file;
    candidate.artifacts[1].sha256 = candidate.artifacts[0].sha256;
    const result = run(candidate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("independent screenshot file");
  });

  it("rejects an unapproved app or OS capture environment", () => {
    const candidate = structuredClone(windowsManifest);
    candidate.appVersion = "0.0.0-wrong";
    candidate.os = "not-Windows";
    const result = run(structuredClone(manifest), candidate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Obsidian 1.13.6 on Windows");
  });

  it("rejects a Windows artifact that drops a required visual assertion", () => {
    const candidate = structuredClone(windowsManifest);
    candidate.artifacts[0].assertions.pop();
    const result = run(structuredClone(manifest), candidate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("assertions mismatch");
  });

  it("uses canonical UTF-8/LF hashes for text assets", () => {
    writeFileSync(join(directory, "styles.css"), "one\r\ntwo\rthree\n");
    const candidate = structuredClone(windowsManifest);
    candidate.candidate.sha256["styles.css"] = canonicalTextHash(
      readFileSync(join(directory, "styles.css"))
    );
    const result = run(structuredClone(manifest), candidate);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    writeFileSync(join(directory, "styles.css"), "styles");
  });

  it("rejects a theme asset that does not match the pinned public dependency", () => {
    const original = readFileSync(themePath);
    writeFileSync(themePath, "changed\n");
    const result = run(structuredClone(manifest));
    writeFileSync(themePath, original);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("theme.css hash mismatch");
  });
});
