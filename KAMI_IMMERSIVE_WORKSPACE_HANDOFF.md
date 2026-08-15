# Kami Reader Companion immersive workspace handoff

Status: Typography, navigation, print, and transient white-page-preview changes
are implemented in the local `0.3.0` candidate. The older macOS and Windows
matrices are retained as historical references only. Current release acceptance is
a seven-state macOS matrix plus two white-preview states captured from an isolated
real Obsidian 1.13.7 process using the tracked synthetic `visual-vault`,
and is bound to both Companion assets and the paired Kami Reader 0.3.0
release-candidate `theme.css`. Public delivery is governed by the explicit authorization in the
active implementation thread.

Date: 2026-08-12

Related theme: [Kami Reader](https://github.com/KKenny0/obsidian-kami), local 0.3.0 release candidate

## Purpose

Turn Kami Reader Companion from a pair of Reading View corrections into a
small behavioral layer that makes the whole Obsidian workspace feel calmer and
more continuous while reading or editing Markdown.

The product direction is a persistent **Folio Shell** plus Markdown-only
**Folio Presence**, with an optional CSS-led **Focus Mode**. While Companion is enabled on
desktop, the Shell keeps the workspace on one continuous canvas across New Tab,
Markdown, Graph, Canvas, and other root views. An active Markdown leaf adds
document treatment, Outline context, optional Focus Mode, and the Reading-only
Stage. Leaving Markdown clears those document enhancements without changing the Shell.

The approved One Field refinement makes persistent Shell, sidebar, and document
surfaces share one paper field. Pane geometry is carried by 26px whitespace
gutters (16px below 940px), while ink boundaries appear only for active,
hovered, focused, or dragged state. Static pane rules, filled active tabs, and
root shadows must not return as substitutes for that whitespace.

This document is the approved implementation baseline for local code and visual
verification. It does not authorize commits, pushes, releases, or Community
Plugin submission.

## Current-state snapshot

At the time of this handoff:

- the repository has no commits yet; the existing implementation is untracked;
- `origin` points to `git@github.com:KKenny0/kami-reader-companion.git`;
- the manifest targets Obsidian 1.13+ and declares the Folio Shell desktop-only;
- the plugin has Reading Stage, Focus Mode, and White Page Preview commands and no settings, persistence,
  network access, or note writes;
- `OutlineSync` fixes inaccurate current-heading highlighting in the core
  Outline and fails closed when the Outline DOM no longer matches metadata;
- `AdaptiveContent` expands intrinsically wide diagrams, tables, code, images,
  canvases, iframes, and embeds into unused pane width;
- both features already share one animation-frame scheduler in `src/main.ts`;
- `styles.css` owns the desktop Folio Shell baseline and Markdown-only document
  treatment without requiring Kami Reader to be installed.

These are assets to preserve. Immersion should emerge from their coordination
with an authored editorial shell, not from a large settings surface.

The first real-app acceptance pass on Obsidian `1.13.4` showed that the initial
Quiet Chrome implementation was structurally correct but visually insufficient.
Kami Reader already quiets Ribbon and header actions, and a single-pane layout
does not exercise the inactive-Markdown-pane rule. The resulting Companion
delta was too small to establish a new reading hierarchy at full-window scale.
This is an acceptance failure, not a request to tune the same opacity values.

The upstream baseline was refreshed against Kami `1.13.4` on 2026-08-03. Kami
describes itself as a print constraint system rather than a UI framework, but
its screen documentation rules provide three mechanisms that transfer directly:
a constrained reading measure, active navigation expressed as a rail rather
than a filled block, and hierarchy created by surface steps and whitespace.
The upstream maintainer has also confirmed that a clearly attributed third-party
Workspace extension is welcome.

The 2026-08-04 implementation added the approved command and Stage lifecycle.
Obsidian 1.13.4 verified command discovery, full-workspace paper geometry, and
`Escape` restoration in the temporary test Vault. The 2026-08-05 visual review
rejected the remaining multi-surface Shell because similar colors still read as
separate application panels. The rendered Continuous Folio Shell prototype then
became the approved target, but the first implementation transferred only its
shared background, quiet controls, and short rails. Bitmap review rejected that
result because the real app retained native Obsidian geometry and hierarchy.
On 2026-08-05 the visual contract was reopened: prototype parity now owns shell
geometry, but document typography continues to use the active theme's semantic
font, size, and line-height tokens. The README now uses representative captures
from the completed broader release matrix.

The parity implementation owns the prototype palette, active-leaf 700px document
measure, Reading display title, deck and folio metadata, a flow-positioned
Reading/Editing stamp, and the Shell's vertical and Tool Spine geometry.
Obsidian owns its native segmented breadcrumb, file title, resizable sidebar
and pane widths, plus every native action and accessible name. Companion must
not synthesize a second file path or absolutely position text over the View
Header. Ephemeral labels and metadata are derived from the current file and rendered DOM, are
removed on identity change or unload, and never write to the note. Automated
verification proves selectors, lifecycle, canonical cross-platform hashing, and
provenance rules; the current nine-state macOS matrix provides candidate bitmap
acceptance. The older macOS and Windows matrices are not counted toward the current release.

The 2026-08-07 boundary correction makes the desktop Shell a stylesheet-owned
baseline rather than an active-Markdown state. This prevents New Tab and other
non-Markdown root views from reverting the surrounding workspace. Kami Reader
remains an optional full-theme companion, not a dependency or detected runtime
mode.

Test-Vault plugin backups must live outside `.obsidian/plugins`. Backup folders
that retain the same manifest id are still plugin candidates, and Obsidian may
load an older duplicate after reload even when the canonical directory contains
the new build.

## First-principles definition of immersion

For this project, immersion is not “show less UI at any cost.” It is the
combination of four conditions:

1. **Content has stable visual priority.** The document remains the strongest
   plane; adjacent Markdown leaves become supporting workspace surfaces and
   controls become quieter without disappearing.
2. **Spatial memory is preserved.** Tabs, sidebars, Outline, and status remain
   where the user left them. Reading does not rearrange the workspace.
3. **Context follows attention.** The Outline identifies the exact section and
   wide material receives enough room without manual layout work.
4. **The transition is reversible.** Hover, keyboard focus, view changes,
   plugin unload, and app reload always return controls to full usability.

Kami texture comes from restraint: parchment/deep-dark content, ivory/warm-dark
shell, muted warm neutrals, one ink-blue focus signal, serif-led content, and no
glass, blur, gradients, wallpaper, texture, or hard shadow. The Companion should
orchestrate these existing values rather than invent another visual system.
The active Reading View must read as a continuous paper plane, not as a rounded
card floating inside Obsidian.

### Upstream Kami: keep page composition, not print imitation

Kami `1.13.4` defines stable, readable composition as the goal and explicitly
rejects dashboard-like document treatment. Its screen documentation guidance
constrains prose to roughly `720px`, uses a 2px active navigation rail without a
filled background, treats navigation as an aid rather than content, and requires
real rendered screenshots before visual acceptance.

Take:

- a primary reading plane separated from the shell through semantic surface
  steps;
- a Companion-owned 700px reading measure while Folio Presence is active;
- rail-only current location in Outline;
- whitespace and intrinsic content width instead of decorative separators;
- bitmap acceptance at full-window scale.

Do not take:

- fixed print dimensions, print font weights, or page-break behavior;
- a rounded paper card, wallpaper, or shadow around the active note;
- color changes outside Folio Presence. Companion's explicit Kami tokens must
  clear immediately when presence ends.

## External patterns reviewed

### Hider: keep the body-class mechanism

[Hider](https://github.com/kepano/obsidian-hider) expresses UI choices as
classes on `document.body`, then lets CSS own presentation. That separation is
small, inspectable, and reversible.

Take:

- plugin-owned state classes;
- CSS-only visual response;
- cleanup by removing the same classes.

Do not take:

- a setting for every piece of chrome;
- permanent hiding as the default interaction model.

### Focus Mode: reject layout ownership

[Focus Mode](https://github.com/ryanpcmcquen/obsidian-focus-mode) demonstrates
that dimming inactive surfaces can focus attention, but it also collapses splits,
uses internal workspace APIs, writes inline `display` values, and must remember
and restore sidebar state.

Take:

- reduced salience for inactive affordances;
- explicit active-pane emphasis.

Do not take:

- sidebar collapse/expand control;
- `display: none` for normal workspace surfaces;
- private APIs or saved layout restoration state;
- default hotkeys or a ribbon button.

### Contextual Typography: keep semantic annotation narrow

[Contextual Typography](https://github.com/mgmeyers/obsidian-contextual-typography)
shows that a Markdown post-processor can attach semantic classes/data for CSS.
The current Companion already follows this pattern for headings and content
kinds.

Take:

- semantic annotations that describe what an element is;
- plugin-owned class/data contracts consumed by CSS.

Do not take:

- general rewriting of rendered Markdown structure;
- annotation unrelated to the two supported reading behaviors.

### Obsidian-native lifecycle

Initialization should wait for `workspace.onLayoutReady()`. Workspace event
subscriptions remain registered through `registerEvent`, and DOM listeners
through plugin lifecycle helpers or explicit paired cleanup. The implementation
must use each view's `ownerDocument` and pop-out-safe DOM checks instead of
assuming one global window.

## Approved direction: Editorial Folio Workspace + optional Focus Mode

The second real-app pass also failed the intended perceptual bar. A stronger
shell surface made the active pane easier to locate, but the workspace geometry
still presented the article as one ordinary pane among tabs, sidebars, Ribbon,
and status. More color tuning cannot turn that composition into immersion.

The approved replacement keeps automatic **Folio Presence** as the calm default
across Reading and Editing, retains explicit **Reading Stage** for deep
reading. The same Continuous Folio Shell treats tabs, sidebars, Ribbon, status,
and the active Markdown view as furniture on one canvas. Stage mode temporarily
lets the active Reading View cover the root workspace while the shell remains
available from the window edges.

The optional **Focus Mode** changes attention rather than layout. Editing follows
CodeMirror's active line; Reading reveals the pointed-to or keyboard-focused
semantic block and its neighbors. It never collapses sidebars, captures content
clicks, or stores focus state.

Reading Focus starts from a native rendered block wrapper and supports
`Arrow Up` / `Arrow Down` navigation. Plugin-owned focusability and current-block
classes must be removed on Focus exit and every target identity change.

### Activation contract

The Folio Shell is active on every desktop workspace while Companion is enabled.
Folio Presence activates automatically for an active desktop Markdown Reading
or Editing View. Reading Stage is available only in Reading View through
`Toggle reading stage`. Focus Mode is available in both Markdown modes through
`Toggle focus mode`. White Page Preview is available in both Markdown modes
through `Toggle white page preview`. None of the commands has a default hotkey,
Ribbon icon, timer, or saved preference.

Switching from Reading to Editing exits Stage immediately but keeps the Shell,
palette, 700px measure, breadcrumb, and an `EDITING` stamp. Editing keeps
CodeMirror's native caret, selections, gutters, syntax, and controls. Returning
to Reading restores the `READING` stamp and reading-only display treatment.
Focus Mode is transient and clears when the active file, leaf, mode identity,
or owner window changes.

White Page Preview is also transient, active-leaf-only, and clears on the same
identity changes or unload. It does not use Escape because it changes document
surface tokens rather than keyboard focus or workspace geometry. It composes
with both Stage and Focus and never writes note metadata or saved plugin data.

Stage mode exits immediately when:

- the command is invoked again;
- `Escape` is pressed outside a modal, prompt, menu, or suggestion surface;
- the active view enters Editing View; the Folio Shell remains active;
- the active view becomes non-Markdown; only document Presence and Stage exit;
- the active file, leaf, or owner window changes;
- the plugin is disabled or unloaded.

Keyboard-triggered entry and exit are immediate. Pointer-driven edge reveals
may use a short transform/opacity transition. Reduced-motion users receive an
immediate reveal with no transition.

### State contract

Use nine plugin-owned classes and no persisted state. Companion may also add
ephemeral, plugin-owned labels and folio metadata inside the active Reading
View; they must be removed on identity change and unload:

| Class | Owner | Meaning |
| --- | --- | --- |
| `kami-reading-presence` | active view's `ownerDocument.body` | This window has an active desktop Markdown view. |
| `kami-reading-stage` | active `MarkdownView.containerEl` | This leaf owns the continuous Markdown plane. |
| `kami-reading-stage-open` | the same owner document body | Explicit Reading Stage is active in this window. |
| `kami-reading-stage-active` | the same active container | This leaf currently covers the root workspace. |
| `kami-focus-open` | the same owner document body | Optional Focus Mode is active in this window. |
| `kami-focus-active` | the same active container | This Markdown leaf owns the focus treatment. |
| `kami-focus-current` | current native Reading block wrapper | Keyboard-owned current Reading block. |
| `kami-focus-near` | adjacent native Reading block wrappers | Neighbor context around the current Reading block. |
| `kami-white-page-preview-active` | the active `MarkdownView.containerEl` | This one Reading or Editing leaf uses white paper and light document tokens. |

Continue using `kami-companion-outline-active`, `kami-outline-current`,
`aria-current="location"`, `kami-content-frame`, and
`data-kami-content-kind` exactly as before. Do not add layout serialization,
note state, settings, or private split-collapse calls.

### Continuous Folio Shell

The default Folio Shell is one continuous field, not a stack of similar-colored
panels. Companion owns the prototype canvas, shell geometry, whitespace, text
strength, and short ink rails for the lifetime of its desktop stylesheet.
Editorial document typography remains gated by `kami-reading-presence` and
disappears immediately on exit from Markdown.

Ivory, dark surface, and warm-sand equivalents are reserved for hover, menus,
and genuinely elevated temporary UI. Companion may style the active Markdown
Reading View and Obsidian-owned shell to match the prototype; arbitrary Canvas,
Search, Graph, PDF, Bases, and community-plugin content remains owner-controlled.

The Shell uses explicit prototype tokens so the accepted bitmap does not drift
with broad theme aliases: light paper `#f4f1e8`, light ink `#141413`, dark paper
`#151513`, dark ink `#e8e3d2`, and the Kami ink-blue accents `#1b365d` and
`#477baa`. It has no blur, gradient, texture, wallpaper, rounded pane cards, or
hard shadows.

The prototype is a composition reference, not visual acceptance evidence.

`designs/continuous-folio-field/Continuous Folio Field.html` is the authoritative
visual and spatial reference for One Field, icon density, local spacing, and
active ink rails. Companion owns the prototype's 32px Folio Strip, 32px View
Header, 22px status line, 32px Tool Spine, 30px native control boxes, and 26px
pane gutter. Sidebar and pane widths stay user-resizable; below 940px the gutter
contracts to 16px.

The 32px strip is mapped to native Obsidian containers rather than simulated
with replacement controls. Root tabs retain Obsidian's flexible
`flex: 1 1 0` and `--tab-width` contract, then add 12px inline padding and an
8px marker-to-title gap. The left dock reserves 28px after the 32px Ribbon; the
right dock keeps a 4px edge inset and continues the strip divider through its
fixed toggle button. Each dock toolbar owns one 32px action row, while
`.nav-header` itself remains auto-height so native Search filters expand below
that row without overlapping the pane content. Tab hover is painted by the full
outer tab slot while the native inner hover layer stays transparent. The status
bar keeps Obsidian's native placement outside Reading Stage; Companion changes
only its height, palette, and item density. Windows and Linux frameless windows
retain Obsidian's `--frame-right-space` reserve for caption buttons. These rules
must not fix sidebar widths, reorder native controls, or replace drag and AX
targets.

Durable real-app bitmap evidence is stored under `visual-evidence/`. The
`visual-evidence/macos/manifest.json` candidate binds nine current captures
to `main.js`, `styles.css`, `manifest.json`, the paired Kami Reader 0.3.0 tag,
and its canonical UTF-8/LF `theme.css` hash. It records the real viewport,
scale factor, synthetic fixture identity, and human-review checklist.
The root and Windows manifests remain explicitly historical and are reported
only as references.
After copying built assets into a Vault, disable and re-enable Companion before
capturing evidence. An app `Command-R` alone may leave the plugin-owned style
element stale; DevTools must confirm that the loaded stylesheet contains the
candidate shell contract before a screenshot can be accepted.

These bitmaps are compositional references, not mood boards. Acceptance uses a
real note with equivalent title, deck, metadata, prose, Outline depth, and
sidebar density at `1440×900`. Geometry, typography, hierarchy, and palette are
reviewed together; matching only color and interaction is a failure.

#### Desktop surface ledger

Visual acceptance is whole-window acceptance. A correct article with untreated
corners, side panes, Settings, or temporary UI is a failure. Every visible core
Obsidian surface must map to one of five Folio roles: Deep frame, Shell index,
Paper document, Foreground utility, or Interactive state.

| Surface family | Companion owns | Must preserve |
| --- | --- | --- |
| Permanent frame | macOS title-strip background, Tool Spine, all root and side-dock tab strips, View Header, dividers, resize-handle feedback, Vault Profile, status line | native traffic-light controls, hit areas, drag regions, sidebar widths |
| Library and margin panes | File Explorer, Search, Bookmarks, Outline, Backlinks, Tags, Properties headers, standard rows, active rails, empty/loading states and scroll edges | DOM order, actions, accessible names, plugin-owned pane content |
| Foreground utilities | Settings shell, Command Palette, Quick Switcher, native menus, submenus, prompts, suggestions, popovers, tooltips, notices and confirmation modals | foreground z-order, Escape ownership and keyboard navigation |
| Standard Settings controls | native buttons, inputs, dropdowns, toggles, checkboxes, sliders, disabled, focus and danger states | community-plugin custom widgets and plugin-specific layout |
| Owner-controlled views | only the surrounding Obsidian tab/header Shell | Canvas, Graph, PDF, Bases and community-plugin content surfaces |

The ledger includes easy-to-miss corners: the traffic-light reserve, left and
right dock strip ends, root New Tab corner, Ribbon top and bottom groups, Vault
Profile, status-bar tail, stacked side tabs, narrow and wide sidebars, long
Chinese and English labels, inactive-window chrome, scrollbars, separators,
drag targets, empty panes, focus rings and disabled controls.

Settings is included as a core Obsidian foreground surface; this does not add a
Companion settings page or per-element customization. Companion may set the
Settings modal frame, navigation, content plane, standard typography and native
controls. It must not target private classes belonging to another plugin.

Foreground surfaces use an explicit elevated Folio token and remain fully
opaque above Stage. They retain a restrained border and shadow so Settings,
menus and prompts remain distinguishable from the continuous workspace without
introducing a second visual language. Danger and disabled states remain
semantically distinct; the ink-blue accent is not used to erase those meanings.

#### Folio Strip

- Treat root tab headers as a compact manuscript index.
- Use the prototype's 32px Folio Strip and 30px native control rhythm.
- The active tab retains full text strength and a 2px bottom ink rail.
- The active tab receives the document paper color plus a 2px bottom ink rail.
- Inactive tab titles use semantic muted text, never container opacity.
- Close buttons and secondary tab controls become visible on hover, focus, open
  menu, or active state.
- Stage mode moves the active root tab strip beyond the top edge while leaving
  a small pointer target; hovering or focusing the strip reveals it over the
  page without changing content geometry.

#### Library Rail and Margin Navigator

- Left navigation reads as a library index. The current file uses a thin inset
  rail and weight instead of a filled selection block.
- Preserve the current user-controlled widths of the Library Rail and Margin
  Navigator. Companion owns the Tool Spine and header rhythm.
- Preserve Obsidian-native DOM order, actions and accessible names. Companion
  sets native control boxes to 30px, visible SVGs to 15px, and owns color,
  optical alignment, group spacing and the active 2px ink rail. Do not add
  decorative Library/Margin labels.
- Right Outline reads as the page margin. The exact current heading keeps its
  existing 2px ink-blue rail and semibold text.
- Passive sidebar headers and navigation use semantic muted colors; rows and
  whole sidebars never use opacity.
- Sidebars do not use permanent full-height borders or a secondary canvas.
- In Stage mode each sidebar moves beyond its own edge while retaining an 8px
  reveal target. Hover and keyboard focus restore it as an overlay, never by
  shrinking the article.

#### Tool Spine and Reading Stamp

- Ribbon remains a narrow, monochrome tool spine. Passive icons are quiet;
  hover, focus, menu, drag, and active states restore full strength.
- Companion sets the Ribbon to 32px and its clickable controls to 30px, matching
  the accepted prototype while retaining Obsidian's native elements and actions.
- Status remains a quiet information line using the existing status items.
  Companion adds no reading counter or progress model and does not reduce the
  opacity of the status container.
- Stage mode moves Ribbon and status to their nearest edges. Their reveal path
  uses the same overlay rule as the sidebars.
- Stage moves whole containers with self-relative transforms. It never applies
  `display: none` or `visibility: hidden` to focusable descendants; keyboard
  focus reveals an edge surface through `:focus-within`.
- The View Header keeps Obsidian's native segmented breadcrumb and file title.
  Companion may add one `aria-hidden` `READING` or `EDITING` stamp as a normal
  flex item before native actions. It must shrink the native title through
  normal flex layout, never overlap it through absolute positioning.

#### Other root leaves

- Every non-stage root leaf keeps its content fully opaque and readable.
- New Tab preserves the Folio Shell but receives no breadcrumb, mode capsule,
  display title, deck, metadata, Outline sync, or wide-content treatment.
- Companion may quiet its Obsidian-owned header and outer leaf shell, but does
  not recolor arbitrary Canvas, Search, Graph, PDF, Bases, or plugin content.
- Hover or keyboard focus restores normal control strength immediately.
- Stage mode covers other leaves without moving, resizing, closing, or
  serializing them. Exit exposes the untouched layout underneath.

### Reading Stage geometry

The active `kami-reading-stage-active` container becomes a fixed, square-edged
paper plane covering the Obsidian workspace. It keeps the prototype paper,
Companion-owned 700px reading measure, the current scroll position, the native
view controls, and the existing wide-content plate behavior.

In Reading View, Companion may turn the inline title into the prototype's
display anchor when no document H1 exists. With an H1, the inline filename
becomes a quiet context label. Companion preserves the native Properties table
and adds an ephemeral `READING` stamp, top-level deck, and folio metadata when
equivalent source data exists.
The first direct rendered H1 starts 24px below the preceding folio context;
subsequent H1 sections retain the normal 52px separation.
Editing View uses the same Shell and active-leaf document measure with an
`EDITING` stamp, but does not receive these reading-only display decorations.
It must never write those values into the note.

The stage must sit above workspace panes but below modal, menu, prompt,
suggestion, tooltip, notice, and drag surfaces. Edge tools sit above the paper
only while revealed. No stage transition may animate layout properties. Entry
and keyboard exit are immediate; pointer reveals may animate only transform and
opacity for at most 180ms with an ease-out curve.

The acceptance invariant is perceptual: at 25% thumbnail scale a Stage screenshot
must read as an article before it reads as Obsidian. In normal Folio Presence,
the whole window must read as one publication field while tabs, navigation, and
tools remain identifiable through type, spacing, and local rails.

### Outline as a margin

The Outline is the persistent reading margin, not a second navigation panel.

- Keep only the exact current row highlighted.
- Preserve ancestor rows as ordinary readable context; never highlight the
  parent as a substitute for the child.
- Express the current row with the existing 2px ink-blue inset edge, active
  semantic text color, and the shared low-contrast focus wash.
- Quiet inactive rows through semantic text colors, not opacity, hierarchy
  changes, or collapsed branches.
- Leave row clicks, native active state, and Outline viewport movement to
  Obsidian. Companion only mirrors the document scroll position with its
  `kami-outline-current` reading marker.
- If metadata and rendered rows disagree, clear Companion state and return to
  Obsidian's native highlight.

### Wide content as a reading plate

Wide content should feel like a deliberate plate inside the page, not a card or
floating widget.

- Preserve the existing intrinsic-overflow threshold of `2px`.
- Preserve the requirement for at least `120px` of useful spare pane width.
- Preserve the `1100px` maximum width and the pane's `48px` safety gutter.
- Keep the frame on the content canvas with no radius, drop shadow, gradient,
  or contrasting card fill.
- Do not add a generic block-axis divider. Width, whitespace, and the content's
  own structure create the plate; Companion must not package every wide block.
- Center visual material; keep tables/code left-readable and horizontally
  scrollable when their intrinsic width still exceeds the plate.
- Let iframe and internal-embed content use the computed plate width without
  exceeding it.
- A frame decision must be based on undecorated intrinsic width so it cannot
  invalidate its own measurement and oscillate.
- Unknown plugin-rendered content must remain inline unless it proves real
  overflow through the same measurement contract.

## Architecture

```text
Obsidian workspace events
        |
        v
 shared requestAnimationFrame scheduler and three commands
        |
        +--> ReadingPresence --> presence/stage classes --> styles.css
        |
        +--> PaperPreview -----> active-leaf paper class ----> styles.css
        |
        +--> OutlineSync ------> line/class/ARIA state ----> styles.css
        |
        +--> AdaptiveContent --> kind/width/frame state ---> styles.css

Markdown post-processors and ResizeObserver feed the same scheduler.
No component changes notes, workspace layout persistence, or another component's state.
```

`ReadingPresence`, `PaperPreview`, `OutlineSync`, and `AdaptiveContent` remain peers. They may
share the scheduler, but must not call each other. This prevents a visual
feature from becoming a prerequisite for correctness or cleanup.

## Implementation boundary

Expected implementation files:

| File | Change |
| --- | --- |
| `KAMI_IMMERSIVE_WORKSPACE_HANDOFF.md` | Own the current application-geometry and evidence contract. |
| `designs/continuous-folio-field/Continuous Folio Field.html` | Model One Field, native pane geometry, and whitespace gutters. |
| `src/main.ts`, `src/reading-presence.ts`, `src/paper-preview.ts` | Register the three transient commands, own their lifecycle, and keep document decoration idempotent. |
| `src/contracts.ts`, `src/outline-sync.ts` | Preserve fail-closed Outline matching and native tree semantics. |
| `styles.css` | Own component-scoped Shell surfaces and active-leaf treatment without fixing resizable pane widths. |
| `tests/contracts.test.ts`, `tests/main-lifecycle.test.ts`, `tests/reading-presence.test.ts`, `tests/paper-preview.test.ts` | Lock surface ownership, lifecycle, keyboard ownership, active-leaf scope, geometry tokens and AX boundaries. |
| `scripts/check-visual-evidence.mjs`, `tests/visual-evidence.test.mjs` | Verify the structural integrity and candidate binding of the required real-app capture matrix. |
| `visual-evidence/` | Store candidate provenance and real-app captures. |
| `package.json`, `package-lock.json` | Keep the JPEG decoder as a development-only verification dependency. |
| `.github/workflows/release.yml` | Require automated checks and the protected visual-review environment before release; the current macOS matrix remains the independent final-acceptance gate. |
| `README.md`, `README.zh-CN.md`, `manifest.json` | State only the compatibility proven by the final matrix. |

Runtime behavior remains in four peer controllers under `src/`; the only new
dependency is the development-only JPEG verifier. The plugin exposes two
non-persistent Stage/Focus commands plus one non-persistent paper-preview command,
adds no setting schema, service, credential, private
API, or persistent data shape, and remains desktop-only until mobile receives
its own visual matrix.

## Independently mergeable delivery

### Change 1: Continuous Folio Shell

Replace the current Folio Presence mixed secondary surface with one primary
canvas across Folio Strip, Library Rail, Margin Navigator, Tool Spine, status,
and the active note. Preserve layout, view-owned content, Outline matching, and
adaptive-content measurement.

This change is useful by itself: Reading View gains a coherent editorial shell
without a mode switch.

### Change 2: Explicit Reading Stage

Add the command, stage lifecycle, fixed paper plane, edge reveal behavior, and
paired cleanup. Do not use layout restoration or change pane dimensions.

This change is independently useful on top of the existing Folio Presence and
can be reverted by removing its two stage classes and command.

### Change 3: Transient White Page Preview

Add one active-leaf class and a peer controller that never persists state.
Document-local light tokens provide white paper in Reading and Editing while
warmth remains inside semantic surfaces. The print reset uses the same palette
and does not set page size, margins, breaks, or printer-specific dimensions.

The three experience changes remain independently reviewable. Release automation
runs the code checks and retains the protected manual visual-review gate.
`npm run check:visual` is the independent final-acceptance gate and must not be
represented as passing while the carried-forward baseline remains. Community
Plugin submission remains a separate public action.

## Verification

### Automated

Run from the repository root:

```sh
npm ci
npm run check
npm run dev:injector
git diff --check
```

The tests must cover:

- active Markdown Reading or Editing View enters Folio Presence;
- New Tab and non-Markdown views retain the desktop Folio Shell without entering
  Markdown Presence;
- the command is available only when an eligible Reading View is active;
- command toggle enters and exits Stage without changing workspace layout;
- Escape exits Stage but does not take ownership inside modal/menu/prompt UI;
- entering Editing View exits Stage but keeps Folio Presence;
- non-Markdown views do not receive document decoration or Stage eligibility;
- Folio CSS owns Ribbon, tab strip, View Header, status and clickable-control
  geometry while leaving sidebar widths resizable;
- native titlebar, tab, Ribbon and status variable chains resolve to the same
  Folio surface in focused and unfocused windows;
- the View Header uses only Obsidian's native breadcrumb and file title, and a
  long path cannot overlap the flow-positioned Reading/Editing stamp;
- only the active Markdown leaf inherits the 700px measure;
- repeated same-target refreshes do not remove and recreate folio metadata;
- Stage keeps every native focusable descendant in the accessibility tree and
  reveals edge surfaces on `:focus-within`;
- changing file, leaf, or owner window exits stale Stage before applying presence;
- pop-out windows receive and clear state in their own document;
- mobile bodies do not enter Folio Presence;
- plugin unload clears all tracked bodies, leaves, headings, Outline rows, and
  content frames;
- duplicate headings, virtualized sections, and scroll direction retain their
  current contract;
- Outline click state and viewport movement remain owned by Obsidian; Companion
  never scrolls or repositions the Outline;
- wide-content classification, minimum spare width, maximum width, and
  no-oscillation measurement retain their current contract.

### Real-app matrix

Use Obsidian 1.13+ with both Default Theme and Kami Reader. Test light and dark
themes at narrow, ordinary, and wide pane widths.

| Case | Pass condition |
| --- | --- |
| Enter Reading View | The full window reads as one publication field while navigation and tools remain identifiable. |
| Enter Editing View | The same Shell, palette, sidebar geometry, and document measure remain; native editing affordances stay intact. |
| Open New Tab | Shell palette and geometry do not jump; no Markdown capsule or injected document metadata appears. |
| Open Graph/Canvas | The Shell remains continuous while the view's own content stays fully opaque and owner-controlled. |
| Toggle Reading Stage | The article covers the workspace immediately; layout and scroll position do not change. |
| Stage thumbnail | At 25% scale the article is the first read and Obsidian chrome is secondary. |
| Top/left/right/bottom reveal | Each shell surface reveals from its own edge without resizing the article. |
| Escape | Stage exits unless a foreground modal/menu/prompt owns Escape. |
| Split Markdown panes | The active Reading View remains primary; inactive panes use the shell without opacity or layout change. |
| Hover/focus chrome | The interacted group returns to full strength without layout shift. |
| Focus/unfocus window | Traffic-light corners, tab strip, Ribbon and titlebar remain one surface. |
| Long path at narrow width | Native breadcrumbs truncate before the mode stamp and never overlap it. |
| Resize sidebars and panes | Native handles remain operable; sidebar and pane widths persist while the surrounding Shell rhythm remains fixed. |
| Keyboard through Stage chrome | Focused edge chrome reveals immediately and retains its native accessible name and action. |
| Return to Editing View | Stage exits immediately while Folio Presence remains continuous and the capsule changes to `EDITING`. |
| Switch files/leaves | Shell continuity remains; no document class, current heading, scroll baseline, or width state survives from the previous identity. |
| Pop-out window | Only the owning window receives Folio Presence; closing it leaves the main window clean. |
| Modal/menu/settings | Foreground UI remains fully opaque and keyboard-visible. |
| Settings navigation | Shell navigation and foreground content are continuous; the active category has the same 2px ink rail as Library and Outline. |
| Settings controls | Standard inputs, dropdowns, toggles and buttons share Folio tokens; focus, disabled and danger states remain unambiguous. |
| Command Palette/Quick Switcher | Prompt, input and selected suggestion read as one foreground utility and never inherit article typography. |
| Context menu/tooltip/notice | Temporary UI remains legible above Stage and uses the same border, ink and elevation system. |
| Search/Bookmarks/Backlinks/Tags/Properties | Headers, rows, matches, empty states and scroll edges remain part of the Shell rather than reverting to an unrelated panel color. |
| Narrow/stacked side panes | Long Chinese or English labels truncate without moving, clipping or overlapping native controls. |
| Disabled/danger/focus states | Meaning remains visible and keyboard focus has a 2px accent outline without layout shift. |
| Outline duplicate headings | The exact scrolled child row, not its parent or same-name sibling, is current. |
| Long Outline | Obsidian retains viewport and click ownership; Companion changes only the current-row marker. |
| Mermaid/SVG/image/canvas | Visual centers within the available plate and never clips into sidebars. |
| Table/code/embed | Content expands only when needed and retains horizontal fallback scrolling. |
| Resize repeatedly | No inline/expanded oscillation and no cumulative layout shift. |
| Disable plugin | Native Obsidian appearance and behavior return without reload or note changes. |
| Reduced motion | Stage and edge states change without transition. |

Primary visual evidence should be same-layout before/after captures at 1440px
showing the full Obsidian window in Default Theme and Kami Reader, light and dark,
with both single-pane and split-pane layouts. At 25% thumbnail scale the active
document must remain the first visual anchor and the current Outline rail the
second; passive controls must remain identifiable in dark mode. Acceptance is
based on the rendered bitmap, not merely on DOM classes existing.

## Non-scope

- no automatic Stage entry, default hotkey, Ribbon command icon, or saved mode;
- no sidebar collapse, pane maximization, fullscreen API, or saved layout restoration;
- no scroll-linked paragraph tracker, click capture, or dimming outside the active
  Markdown leaf;
- no reading-progress bar, floating toolbar, ambient background, wallpaper,
  texture, blur, gradient, or animation sequence;
- no internal redesign of Canvas, Graph, PDF, Bases, or community-plugin views;
- no mobile promise until the same lifecycle and visual matrix is run on mobile;
- no Companion settings page, setting per UI element, or Style Settings dependency;
- no private styling of community-plugin Settings widgets; only the core modal,
  standard controls and common Obsidian setting rows are Folio-owned;
- no edits to Kami Reader's `theme.css` for Companion-owned behavior;
- no release, push, tag, or Community Plugin submission in the implementation
  batch unless separately authorized.

## Rejected alternative

The close alternative is a conventional Focus Mode that collapses sidebars,
closes panes, or remembers a maximized leaf. It owns layout state and creates
restoration bugs. Reading Stage instead overlays the untouched layout and lets
the same shell return from the edges.

## Resolved fragile assumption

The first pass assumed that the theme's existing primary/secondary step and
semantic peripheral text colors were sufficient. Real-vault bitmap review
rejected that assumption: Kami already supplied most of the same chrome
quieting, so Companion did not create a legible new hierarchy.

The first resolution, a stronger semantic shell, also failed to create enough
structural continuity. The approved resolution is explicit Stage geometry plus
the Continuous Folio Shell. The remaining fragile assumption is that a fixed active
view can cover the root workspace while staying below Obsidian foreground
layers. If that fails in 1.13.4, constrain the stage to the root workspace
bounds; do not fall back to layout mutation.

## Final real-shell alignment contract

The Obsidian 1.13.4 GUI audit invalidated the earlier assumption that styling
`.titlebar` and generic theme variables was enough to reproduce the prototype.
On macOS the useful `.titlebar` box can be empty while the visible top surface
belongs to the left Side Dock tab strip, root tab strip, right Side Dock tab
strip, and the root View Header. The implementation therefore owns those real
containers, Ribbon, Vault Profile, and status as one Folio surface. It does not
set either Side Dock width.

The reference rhythm is 32px for each tab strip, View Header, Ribbon, and Vault
Profile, with a 22px status bar. Native controls keep 30px hit areas and 15px
icons. The prototype reserves the macOS traffic-light corner but does not draw
or grade system-controlled focused or unfocused colors.

Reading and Editing share `clamp(72px, 7vw, 100px)` document top spacing. A
rendered H1 remains the article title; when it exists, the inline filename is a
quiet context label rather than a second hero. Only a direct `.el-p > p` may be
the deck. Properties remain rendered and operable. Focus never applies opacity
to whole chrome containers; quiet chrome text must retain at least 4.5:1
contrast.

Outline rows may be a folded or virtualized ordered subset of cached headings.
The mapping accepts only a unique ordered match, using heading level when the
native row exposes it. Ambiguous duplicate rows fail closed to native Outline
highlighting.

Current candidate evidence is never inferred from the carried-forward matrices.
The macOS matrix covers Default light Editing split, Default dark Reading
single, Kami light/dark Editing split, Kami light/dark Reading single, and Kami
light Reading Stage single. Every capture comes from the tracked synthetic vault
and keeps both sidebars expanded. The evidence checker validates candidate and
theme provenance, canonical text hashes, viewport/DPI consistency, required
states, JPEG dimensions, and image hashes; recorded human bitmap review remains
the semantic acceptance gate.

## Rollback and failure handling

- Leaving Markdown clears document Presence and Stage while preserving the Shell;
  unloading removes all Companion presentation.
- Track every decorated body and leaf; cleanup must not depend on the currently
  active window still existing.
- Unsupported Outline DOM fails closed to native highlighting.
- Unmeasurable content and unknown content without proven overflow stay inline.
- Conflicts with another UI-hiding plugin must not be countered with
  `!important`; Companion should yield rather than fight for visibility.
- Disabling the plugin removes every surface, rail, stage, and reveal behavior
  because Obsidian unloads the plugin stylesheet and Escape has paired cleanup.
- Disabling or uninstalling the plugin is a complete rollback because the
  design writes no note, setting, or layout data.

## Decision summary for the next discussion

- **Building:** automatic Editorial Folio Workspace, explicit Reading Stage,
  optional Focus Mode, transient White Page Preview, edge-reveal Stage surfaces, exact Outline, and
  intentional wide-content plates.
- **Not building:** layout mutation, saved UI state, automatic Stage entry,
  progress tracking, decorative ambience, or per-element settings.
- **Approach:** nine plugin-owned classes, three commands, paired Escape lifecycle for Stage/Focus,
  CSS-native focus states, component-scoped variables, native Header ownership,
  and the existing shared scheduler.
- **Key decisions:** active paper plane before chrome dimming; shell stays
  readable; Stage overlays rather than rearranges; keyboard changes are
  immediate; pointer reveals animate only transform/opacity; foreground UI wins.
- **Platform evidence:** macOS is the primary release acceptance platform.
  Windows and Linux remain contract-tested and retain historical bitmap references,
  but this release makes no platform-specific pixel claim for them. The macOS page
  capture validates the frameless titlebar safe area, not OS-native traffic-light
  pixels outside the app webcontents. Mobile Stage remains deferred and the
  manifest must not advertise mobile compatibility until that matrix exists.
