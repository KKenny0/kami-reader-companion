# Kami Reader Companion

[English](./README.md) | [简体中文](./README.zh-CN.md)

A desktop-first Obsidian 1.13+ plugin that keeps the workspace on one continuous
Kami-inspired Folio Shell across New Tab, Reading, Editing, Graph, Canvas, and
other root views. Active Markdown views additionally receive:

- continuous Reading and Editing presentation;
- exact current-heading highlighting in the core Outline;
- adaptive use of spare pane width for wide diagrams, tables, code and embeds;
- an explicit **Toggle reading stage** command for deep Reading View.

The plugin is desktop-only, targets Obsidian 1.13+, and works with Obsidian's
Default Theme. It does not require
[Kami Reader](https://github.com/KKenny0/obsidian-kami). Kami Reader remains an
optional companion for fuller styling of callouts, tables, code, editor syntax,
menus, settings, and other components outside Companion's document treatment.
No theme detection or integration setting is required.

Companion writes no note content, stores no workspace state, and restores the
active theme when disabled.

The `0.1.0` release is verified on macOS with Obsidian 1.13.4 and the Default
Theme in Dark and Light modes at 984x768. The checked evidence covers Editing,
Reading, New Tab, a long native breadcrumb, and Reading Stage. A separate
1440x900 release matrix remains pending.

## Showcase

### One visual language across Editing and Reading

| Editing View · Dark | Reading View · Dark |
|---|---|
| ![Dark Editing View](./visual-evidence/01-default-dark-editing-984x768.jpg) | ![Dark Reading View](./visual-evidence/02-default-dark-reading-984x768.jpg) |

### The shell stays continuous beyond the document

| New Tab | Reading Stage |
|---|---|
| ![Dark New Tab](./visual-evidence/04-default-dark-new-tab-984x768.jpg) | ![Dark Reading Stage](./visual-evidence/05-default-dark-reading-stage-984x768.jpg) |

### The same hierarchy in Light mode

| Editing View · Light | Reading View · Light |
|---|---|
| ![Light Editing View](./visual-evidence/06-default-light-editing-984x768.jpg) | ![Light Reading View](./visual-evidence/07-default-light-reading-984x768.jpg) |

## Local development

```sh
npm ci
npm run check
npm run check:visual
npm run dev:injector
```

Paste `.dev/inject-kami-reader-companion.js` into Obsidian DevTools, then enable
**Kami Reader Companion** under Settings → Community plugins.

The injector intentionally refuses to update an existing plugin directory.
Remove the previous local installation before injecting a new build.
