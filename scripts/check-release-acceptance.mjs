import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.env.KAMI_VISUAL_ROOT ?? new URL("../", import.meta.url).pathname;
const json = (name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const manifest = json("manifest.json");
// One approved release exception; later versions return to the full visual gate.
if (manifest.version !== "0.4.0") {
  await import("./check-visual-evidence.mjs");
} else {
  const approval = json("visual-evidence/release-0.4.0.json");
  const reviewed = json("output/playwright/phase2-assets.json");
  assert.equal(json("package.json").version, "0.4.0");
  assert.equal(approval.version, "0.4.0");
  assert.equal(approval.macos, "maintainer-accepted");
  assert.equal(approval.windows, "not-validated");
  assert.equal(approval.exception, "maintainer-approved-macos-only-release");
  assert.deepEqual(Object.keys(approval.sha256).sort(), ["main.js", "manifest.json", "styles.css"]);
  for (const name of Object.keys(approval.sha256)) {
    assert.equal(hash(resolve(root, name)), approval.sha256[name], `${name} differs from release approval`);
  }
  for (const name of ["main.js", "styles.css"]) {
    assert.equal(approval.sha256[name], reviewed.assets[name], `${name} differs from macOS-reviewed implementation`);
  }
  assert.equal(approval.themeDependency.repository, "KKenny0/obsidian-kami");
  assert.equal(approval.themeDependency.tag, "0.3.1");
  assert.equal(approval.themeDependency.asset, "theme.css");
  assert.equal(approval.themeDependency.sha256, reviewed.assets["../kami-obsidian/theme.css"]);
  assert.ok(process.env.KAMI_VISUAL_THEME_CSS, "KAMI_VISUAL_THEME_CSS must identify the paired theme");
  assert.equal(hash(process.env.KAMI_VISUAL_THEME_CSS), approval.themeDependency.sha256, "paired theme changed");
  console.log("PASS 0.4.0 maintainer-approved macOS release exception; Windows NOT validated; full visual acceptance remains open");
}
