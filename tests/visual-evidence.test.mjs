import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import jpeg from "jpeg-js";

const script = new URL("../scripts/check-visual-evidence.mjs", import.meta.url);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
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
  ["kami-dark-wide-outline-split", "Kami Reader", "dark", "reading", "split", "wide-outline"],
  ["kami-light-settings", "Kami Reader", "light", "settings", "single", "settings"],
  ["kami-dark-settings", "Kami Reader", "dark", "settings", "single", "settings"],
  ["kami-light-command-palette", "Kami Reader", "light", "command-palette", "single", "foreground"],
  ["kami-dark-quick-switcher", "Kami Reader", "dark", "quick-switcher", "single", "foreground"],
  ["kami-light-context-menu", "Kami Reader", "light", "reading", "single", "context-menu"],
  ["kami-dark-notice", "Kami Reader", "dark", "reading", "single", "notice"],
  ["kami-light-search-sidebar", "Kami Reader", "light", "search", "split", "side-pane"],
  ["kami-dark-secondary-panes", "Kami Reader", "dark", "reading", "split", "side-pane"]
];

let directory;
let evidence;
let manifest;

const run = (candidate) => {
  writeFileSync(join(evidence, "manifest.json"), JSON.stringify(candidate));
  return spawnSync(process.execPath, [script.pathname], {
    encoding: "utf8",
    env: {
      ...process.env,
      KAMI_VISUAL_ROOT: directory,
      KAMI_VISUAL_EVIDENCE: evidence
    }
  });
};

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), "kami-visual-evidence-"));
  evidence = join(directory, "visual-evidence");
  mkdirSync(evidence);
  writeFileSync(join(directory, "main.js"), "main");
  writeFileSync(join(directory, "styles.css"), "styles");
  writeFileSync(join(directory, "package.json"), JSON.stringify({ version: "0.1.5" }));
  writeFileSync(join(directory, "manifest.json"), JSON.stringify({ version: "0.1.5" }));

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
    appVersion: "1.13.4",
    os: "macOS",
    viewport: { width: 1440, height: 900 },
    candidate: {
      version: "0.1.5",
      sha256: {
        "main.js": sha256(readFileSync(join(directory, "main.js"))),
        "manifest.json": sha256(readFileSync(join(directory, "manifest.json"))),
        "styles.css": sha256(readFileSync(join(directory, "styles.css")))
      }
    },
    artifacts
  };
}, 30_000);

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe("visual evidence gate", () => {
  it("verifies the structural integrity of a complete capture set", () => {
    const result = run(structuredClone(manifest));
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Verified structural integrity");
  }, 30_000);

  it("rejects missing candidate asset hashes", () => {
    const candidate = structuredClone(manifest);
    delete candidate.candidate.sha256["styles.css"];
    const result = run(candidate);
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
    const oversized = jpeg.encode({ data: Buffer.alloc(2000 * 1100 * 4), width: 2000, height: 1100 }, 20).data;
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
    const candidate = structuredClone(manifest);
    candidate.appVersion = "0.0.0-wrong";
    candidate.os = "not-macOS";
    const result = run(candidate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Obsidian 1.13.4 on macOS");
  });
});
