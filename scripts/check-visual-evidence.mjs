import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const evidence = new URL("../visual-evidence/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", evidence), "utf8"));

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

for (const [name, expected] of Object.entries(manifest.candidate.sha256)) {
  const actual = sha256(await readFile(new URL(name, root)));
  if (actual !== expected) throw new Error(`${name} hash mismatch`);
}

for (const artifact of manifest.artifacts) {
  const bytes = await readFile(new URL(artifact.file, evidence));
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    throw new Error(`${artifact.file} is not a complete JPEG`);
  }
}

console.log(`Verified ${manifest.artifacts.length} captures for Obsidian ${manifest.appVersion}.`);
