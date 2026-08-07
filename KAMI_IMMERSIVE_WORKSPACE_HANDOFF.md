# Kami Reader Companion immersive workspace handoff

Status: repair implemented and locally accepted on Obsidian 1.13.4 at 984x768.
Default Dark and Default Light evidence now covers Editing, Reading, New Tab,
long native paths, and Reading Stage. The separate 1440x900 release matrix is
still pending. Commit, push, release, and Community Plugin submission remain
separately authorized.

Date: 2026-08-07

Related theme: [Kami Reader 0.2.0](https://github.com/KKenny0/obsidian-kami/releases/tag/0.2.0)

## Purpose

Turn Kami Reader Companion from a pair of Reading View corrections into a
small behavioral layer that makes the whole Obsidian workspace feel calmer and
more continuous while reading or editing Markdown.

The recommended product idea is a persistent **Folio Shell** plus Markdown-only
**Folio Presence**, not another Focus Mode. While Companion is enabled on
desktop, the Shell keeps the workspace on one continuous canvas across New Tab,
Markdown, Graph, Canvas, and other root views. An active Markdown leaf adds
document treatment, Outline context, and the optional Reading Stage. Leaving
Markdown clears those document enhancements without changing the Shell.

This document is the approved implementation baseline for local code and visual
verification. It does not authorize commits, pushes, releases, or Community
Plugin submission.

## Current-state snapshot

At the time of this handoff:

- the repository has no commits yet; the existing implementation is untracked;
- `origin` points to `git@github.com:KKenny0/kami-reader-companion.git`;
- the manifest targets Obsidian 1.13+ and declares the Folio Shell desktop-only;
- the plugin has one Reading Stage command and no settings, persistence,
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
On 2026-08-05 the visual contract was reopened: prototype parity now outranks
the previous constraint that Companion must yield all shell geometry and
reading typography to the active theme. README remains intentionally unchanged
until the broader release matrix passes.

The parity implementation owns the prototype palette, active-leaf 700px document
measure, Reading display title, deck and folio metadata, a flow-positioned
Reading/Editing stamp, and the Shell's vertical and Tool Spine geometry.
Obsidian owns its native segmented breadcrumb, file title, resizable sidebar
and pane widths, plus every native action and accessible name. Companion must
not synthesize a second file path or absolutely position text over the View
Header. Ephemeral
labels and metadata are derived from the current file and rendered DOM, are
removed on identity change or unload, and never write to the note. Automated
verification passes 21 tests. These tests prove selectors and lifecycle, while
the repository's 984x768 visual evidence proves the repaired Default Theme
composition in the states listed above. The required `1440×900` release matrix
has not passed.

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

## Approved direction: Reading Stage + Continuous Folio Shell

The second real-app pass also failed the intended perceptual bar. A stronger
shell surface made the active pane easier to locate, but the workspace geometry
still presented the article as one ordinary pane among tabs, sidebars, Ribbon,
and status. More color tuning cannot turn that composition into immersion.

The approved replacement keeps automatic **Folio Presence** as the calm default
across Reading and Editing, and retains explicit **Reading Stage** for deep
reading. The same Continuous Folio Shell treats tabs, sidebars, Ribbon, status,
and the active Markdown view as furniture on one canvas. Stage mode temporarily
lets the active Reading View cover the root workspace while the shell remains
available from the window edges.

### Activation contract

The Folio Shell is active on every desktop workspace while Companion is enabled.
Folio Presence activates automatically for an active desktop Markdown Reading
or Editing View. Reading Stage is available only in Reading View and remains
user-controlled through one command:
`Toggle reading stage`. It has no default hotkey, Ribbon icon, timer, or saved
preference.

Switching from Reading to Editing exits Stage immediately but keeps the Shell,
palette, 700px measure, breadcrumb, and an `EDITING` capsule. Editing keeps
CodeMirror's native caret, selections, gutters, syntax, and controls. Returning
to Reading restores the `READING` capsule and reading-only display treatment.

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

Use four plugin-owned classes and no persisted state. Companion may also add
ephemeral, plugin-owned labels and folio metadata inside the active Reading
View; they must be removed on identity change and unload:

| Class | Owner | Meaning |
| --- | --- | --- |
| `kami-reading-presence` | active view's `ownerDocument.body` | This window has an active desktop Markdown view. |
| `kami-reading-stage` | active `MarkdownView.containerEl` | This leaf owns the continuous Markdown plane. |
| `kami-reading-stage-open` | the same owner document body | Explicit Reading Stage is active in this window. |
| `kami-reading-stage-active` | the same active container | This leaf currently covers the root workspace. |

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
with broad theme aliases: light paper `#f5f4ed`, light ink `#141413`, dark paper
`#141413`, dark ink `#e8e3d2`, and the Kami ink-blue accents `#1b365d` and
`#2d5a8a`. It has no blur, gradient, texture, wallpaper, rounded pane cards, or
hard shadows.

The prototype is a composition reference, not visual acceptance evidence.

`prototypes/tonal-workspace/index.html` is the authoritative visual and spatial
reference for the two-level shell, icon density, local spacing and active ink
rails. Companion owns the prototype's 32px Folio Strip, 32px View Header, 22px
status line, 32px Tool Spine, and 30px native control boxes. Sidebar widths stay
user-resizable because the visual system does not require a single fixed width.

Durable real-app bitmap evidence is stored under `visual-evidence/` with a
candidate manifest that binds the captures to `main.js`, `styles.css`, and
`manifest.json`. `npm run check:visual` verifies those hashes and capture files.
The available host window was 984x768, so this evidence does not replace the
separate 1440x900 release gate.

These bitmaps are compositional references, not mood boards. Acceptance uses a
real note with equivalent title, deck, metadata, prose, Outline depth, and
sidebar density at `1440×900`. Geometry, typography, hierarchy, and palette are
reviewed together; matching only color and interaction is a failure.

#### Folio Strip

- Treat root tab headers as a compact manuscript index.
- Use the prototype's 32px Folio Strip and 30px native control rhythm.
- The active tab retains full text strength and a 2px bottom ink rail.
- The active tab does not receive a separate paper-colored fill.
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
  sets native control boxes to 30px, visible SVGs to 14px, and owns color,
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
display anchor, suppress the expanded Properties table, and add an ephemeral
`READING` stamp, deck, and folio metadata when equivalent source data exists.
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
- Express the current row with the existing 2px ink-blue inset edge and active
  semantic text color. Under Folio Presence, remove the filled active
  background; the rail is the location signal.
- Quiet inactive rows through semantic text colors, not opacity, hierarchy
  changes, or collapsed branches.
- Clicking a row must update immediately; subsequent scrolling resumes normal
  position ownership.
- When document scrolling moves the current row outside the visible Outline,
  reveal it with `scrollIntoView({ block: "nearest", inline: "nearest" })` only
  when the row changes and the Outline is not hovered or keyboard-focused.
  Clicking a row never triggers this reveal path.
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
 shared requestAnimationFrame scheduler and one command
        |
        +--> ReadingPresence --> presence/stage classes --> styles.css
        |
        +--> OutlineSync ------> line/class/ARIA state ----> styles.css
        |
        +--> AdaptiveContent --> kind/width/frame state ---> styles.css

Markdown post-processors and ResizeObserver feed the same scheduler.
No component changes notes, workspace layout persistence, or another component's state.
```

`ReadingPresence`, `OutlineSync`, and `AdaptiveContent` remain peers. They may
share the scheduler, but must not call each other. This prevents a visual
feature from becoming a prerequisite for correctness or cleanup.

## Implementation boundary

Expected implementation files:

| File | Change |
| --- | --- |
| `KAMI_IMMERSIVE_WORKSPACE_HANDOFF.md` | Own the current application-geometry and evidence contract. |
| `prototypes/tonal-workspace/index.html` | Model the native breadcrumb and collision-safe Reading/Editing stamp. |
| `src/reading-presence.ts` | Keep document decoration idempotent and avoid duplicate native information. |
| `styles.css` | Own component-scoped Shell surfaces and active-leaf treatment without fixing resizable pane widths. |
| `tests/contracts.test.ts` | Lock surface ownership, active-leaf scope, geometry tokens and AX boundaries. |
| `tests/reading-presence.test.ts` | Lock idempotent decoration and the flow-positioned stamp. |
| `visual-evidence/` | Store candidate provenance and real-app captures. |
| `README.md`, `manifest.json` | State only the compatibility proven by the final matrix. |

This repair changes more than eight files once evidence images are included,
but only two runtime files. It adds no dependency, service, setting schema,
persistent data shape, private API, credential, or command. The existing command
and four state classes remain unchanged. The only public contract change is
marking the plugin desktop-only until mobile receives its own visual matrix.

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

Do not combine either change with release automation or Community Plugin
submission. Those are follow-through actions after the experience is approved.

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
- duplicate headings, virtualized sections, scroll direction, and click
  ownership retain their current contract;
- a changed current Outline row reveals only when the Outline is not hovered or
  focused, and clicked rows never enter the reveal path;
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
| Outline duplicate headings | The exact clicked/scrolled child row, not its parent or same-name sibling, is current. |
| Long Outline | The changed current row stays visible while reading; hovering, focusing, or clicking inside Outline suspends automatic reveal. |
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
- no dimming of individual paragraphs, editor lines, or entire content panes;
- no reading-progress bar, floating toolbar, ambient background, wallpaper,
  texture, blur, gradient, or animation sequence;
- no internal redesign of Canvas, Graph, PDF, Bases, or community-plugin views;
- no mobile promise until the same lifecycle and visual matrix is run on mobile;
- no setting per UI element and no Style Settings dependency;
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

- **Building:** automatic Continuous Folio Shell plus explicit Reading Stage,
  edge-reveal Folio/Library/Margin/Tool/Status surfaces, exact Outline, and
  intentional wide-content plates.
- **Not building:** layout mutation, saved UI state, automatic Stage entry,
  progress tracking, decorative ambience, or per-element settings.
- **Approach:** four plugin-owned classes, one command, paired Escape lifecycle,
  component-scoped CSS variables, native Header ownership, and the existing
  shared scheduler.
- **Key decisions:** active paper plane before chrome dimming; shell stays
  readable; Stage overlays rather than rearranges; keyboard changes are
  immediate; pointer reveals animate only transform/opacity; foreground UI wins.
- **Unknowns:** Windows and Linux remain outside the current macOS evidence
  environment. Mobile Stage remains deferred and the manifest must not advertise
  mobile compatibility until that matrix exists. README claims remain provisional
  until the full desktop bitmap and interaction matrix passes.
