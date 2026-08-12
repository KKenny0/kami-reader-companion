# Kami Reader Companion

[English](./README.md) | [简体中文](./README.zh-CN.md)

A desktop-first Obsidian 1.13+ plugin that keeps the workspace on one continuous
Kami-inspired Folio Shell across New Tab, Reading, Editing, Graph, Canvas, and
other root views. Active Markdown views additionally receive:

- continuous Reading and Editing presentation;
- exact current-heading highlighting in the core Outline when its rendered rows
  map uniquely to note headings, with native highlighting as the safe fallback;
- adaptive use of spare pane width for wide diagrams, tables, code and embeds;
- an explicit **Toggle reading stage** command for deep Reading View;
- an optional **Toggle focus mode** command that follows the active editor line
  and reveals Reading blocks through pointer or keyboard focus;
- a transient **Toggle white page preview** command for printing-minded review
  of one active Markdown document without changing the surrounding shell.

The plugin is desktop-only, targets Obsidian 1.13+, and works with Obsidian's
Default Theme. It does not require
[Kami Reader](https://github.com/KKenny0/obsidian-kami). Kami Reader remains an
optional companion for fuller styling of callouts, tables, code, editor syntax,
menus, settings, and other components outside Companion's document treatment.
No theme detection or integration setting is required.

Companion writes no note content, stores no workspace state, and restores the
active theme when disabled.

## Reading Stage, Focus Mode, and White Page Preview

Open the Command Palette and run **Kami Reader Companion: Toggle focus mode**
to enter the optional focus treatment in either Editing or Reading View. In
Editing View it follows CodeMirror's active line. In Reading View, point to or
keyboard-focus a block to bring it and its neighbors forward; use `Arrow Up`
and `Arrow Down` to move between blocks. Workspace chrome returns to full
contrast-safe throughout; hovered, active, or keyboard-focused controls become
the strongest chrome within their group.

**Toggle reading stage** remains Reading-only and changes the workspace's
spatial presentation. The two modes can be combined: Reading Stage controls
space, while Focus Mode controls attention. `Escape` exits Reading Stage first,
then Focus Mode. Neither mode is persisted.

Run **Kami Reader Companion: Toggle white page preview** in either Reading or
Editing View to make only the active Markdown leaf use white paper, dark ink,
Ink Blue accents, and warm parchment document surfaces. It composes with Stage
and Focus, has no default hotkey or Ribbon button, and clears when the active
file, leaf, mode, or owner window changes—or when Companion unloads. It never
writes frontmatter or saved plugin data. The same light reset also protects
Obsidian PDF export when the app is in Dark mode.

The 22-state macOS matrix under `visual-evidence/` is retained as a historical
reference and is not counted as current release acceptance. Version 0.2.0 uses
nine current Obsidian 1.13.6 Windows captures from the tracked synthetic `visual-vault`: the
Default and Kami Reader themes, light and dark schemes, Reading and Editing,
single and split layouts, Reading Stage, and white-page preview under both
Default Dark and Kami Reader Dark. The gate binds those reviewed
pixels to the exact Companion assets and the paired Kami Reader 0.3.0
release-candidate `theme.css`. The release workflow resolves that same asset
from the `0.3.0` tag, so Companion cannot release before the paired Reader tag
exists. The gate records structure and provenance; it does not replace human
pixel review.

## Showcase

### One visual language across Reading and Editing

| Reading View · Dark | Editing View · Dark · Split |
|---|---|
| ![Dark Reading View](./visual-evidence/kami-dark-reading-single.jpg) | ![Dark Editing View in a split layout](./visual-evidence/kami-dark-editing-split.jpg) |

### The shell stays continuous beyond the document

| New Tab · Light | Reading Stage · Light |
|---|---|
| ![Light New Tab](./visual-evidence/kami-light-new-tab.jpg) | ![Light Reading Stage](./visual-evidence/kami-light-reading-stage.jpg) |

### Foregrounds and settings remain part of the same workspace

| Command Palette · Light | Settings · Dark |
|---|---|
| ![Light Command Palette](./visual-evidence/kami-light-command-palette.jpg) | ![Dark Settings](./visual-evidence/kami-dark-settings.jpg) |

## Local development

```sh
npm ci
npm run check
npm run dev:injector
```

`check:visual` also needs the exact paired theme asset. On PowerShell:

```powershell
$env:KAMI_VISUAL_THEME_CSS = "C:\path\to\obsidian-kami-0.3.0\theme.css"
npm run check:visual
```

Release screenshots must contain only files and text from
`tests/fixtures/visual-vault`; never capture a personal or production vault.

Companion inherits `--font-text-theme` for body copy and the optional
`--font-heading-theme` contract for headings. Themes without the heading token,
including Obsidian Default, safely fall back to their body font.

Paste `.dev/inject-kami-reader-companion.js` into Obsidian DevTools, then enable
**Kami Reader Companion** under Settings → Community plugins.

The injector intentionally refuses to update an existing plugin directory.
Remove the previous local installation before injecting a new build.
