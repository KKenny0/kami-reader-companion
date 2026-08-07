import { mkdir, readFile, writeFile } from "node:fs/promises";

const id = "kami-reader-companion";
const files = Object.fromEntries(await Promise.all(
  ["manifest.json", "main.js", "styles.css"].map(async (name) => [
    name,
    (await readFile(name)).toString("base64")
  ])
));

const payload = JSON.stringify(files);
const source = `// Generated local-development injector for ${id}.
const id = ${JSON.stringify(id)};
const dir = '.obsidian/plugins/' + id;
const files = ${payload};
const adapter = app.vault.adapter;
const nodeRequire = globalThis.require ?? globalThis.window?.require;
if (typeof nodeRequire !== 'function' || typeof adapter.getBasePath !== 'function' || typeof adapter.getFullPath !== 'function') {
  throw new Error('Safe local installation requires Obsidian Desktop.');
}
const fs = nodeRequire('fs');
const path = nodeRequire('path');
const vaultRoot = fs.realpathSync(adapter.getBasePath());
if (!await adapter.exists('.obsidian/plugins')) await adapter.mkdir('.obsidian/plugins');
const pluginsRoot = fs.realpathSync(adapter.getFullPath('.obsidian/plugins'));
const assertInsideVault = target => {
  const relative = path.relative(vaultRoot, target);
  if (relative === '' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('Refusing to write outside the vault: ' + target);
  }
};
assertInsideVault(pluginsRoot);
if (await adapter.exists(dir)) {
  throw new Error('Refusing to update an existing plugin directory. Remove ' + dir + ' and run this injector again.');
}
await adapter.mkdir(dir);
const installPath = adapter.getFullPath(dir);
const installRoot = fs.realpathSync(installPath);
const installStat = fs.lstatSync(installPath);
assertInsideVault(installRoot);
if (!installStat.isDirectory() || installStat.isSymbolicLink()) {
  throw new Error('Refusing unsafe plugin directory: ' + dir);
}
for (const [name, base64] of Object.entries(files)) {
  const target = path.join(installRoot, name);
  assertInsideVault(target);
  if (fs.existsSync(target)) throw new Error('Refusing to overwrite existing file: ' + target);
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  await adapter.writeBinary(dir + '/' + name, bytes.buffer);
}
console.log('Installed ' + id + '. Enable or reload it in Settings > Community plugins.');
`;

await mkdir(".dev", { recursive: true });
await writeFile(`.dev/inject-${id}.js`, source);
console.log(`Generated .dev/inject-${id}.js`);
