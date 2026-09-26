import { it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

it("accepts approved bytes and rejects changed assets, themes and later versions", () => {
  const root = mkdtempSync(join(tmpdir(), "kami-release-"));
  const digest = (text: string) => createHash("sha256").update(text).digest("hex");
  const write = (name: string, value: unknown) => writeFileSync(join(root, name), typeof value === "string" ? value : JSON.stringify(value));
  try {
    mkdirSync(join(root, "visual-evidence"));
    mkdirSync(join(root, "output/playwright"), { recursive: true });
    const manifest = JSON.stringify({ version: "0.4.0" });
    write("manifest.json", manifest);
    write("package.json", { version: "0.4.0" });
    write("main.js", "reviewed implementation");
    write("styles.css", "reviewed styles");
    write("theme.css", "reviewed theme");
    const sha256 = { "main.js": digest("reviewed implementation"), "styles.css": digest("reviewed styles"), "manifest.json": digest(manifest) };
    write("output/playwright/phase2-assets.json", { assets: { ...sha256, "../kami-obsidian/theme.css": digest("reviewed theme") } });
    write("visual-evidence/release-0.4.0.json", { version: "0.4.0", macos: "maintainer-accepted", windows: "not-validated", exception: "maintainer-approved-macos-only-release", sha256, themeDependency: { repository: "KKenny0/obsidian-kami", tag: "0.3.1", asset: "theme.css", sha256: digest("reviewed theme") } });
    const run = () => spawnSync(process.execPath, [resolve("scripts/check-release-acceptance.mjs")], { env: { ...process.env, KAMI_VISUAL_ROOT: root, KAMI_VISUAL_THEME_CSS: join(root, "theme.css") }, encoding: "utf8" });
    expect(run().status).toBe(0);
    write("main.js", "unreviewed implementation");
    expect(run().status).not.toBe(0);
    write("main.js", "reviewed implementation");
    write("theme.css", "unreviewed theme");
    expect(run().status).not.toBe(0);
    write("theme.css", "reviewed theme");
    write("manifest.json", { version: "0.4.1" });
    expect(run().status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
