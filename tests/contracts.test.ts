import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { MarkdownView } from "obsidian";
import {
  classifyOverflow,
  computeFrameWidth,
  isOverflowing,
  matchOutlineRows,
  matchSectionHeadings,
  selectActiveLine,
  type HeadingRef
} from "../src/contracts";
import { ReadingPresence } from "../src/reading-presence";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const outlineSyncSource = readFileSync(new URL("../src/outline-sync.ts", import.meta.url), "utf8");
const paperPreviewSource = readFileSync(new URL("../src/paper-preview.ts", import.meta.url), "utf8");
const releaseWorkflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const visualCheck = readFileSync(new URL("../scripts/check-visual-evidence.mjs", import.meta.url), "utf8");

describe("folio shell CSS contracts", () => {
  it("owns the prototype shell rhythm without hiding AX nodes or fixing sidebar widths", () => {
    expect(styles).toMatch(/--kami-folio-strip-height:\s*32px/);
    expect(styles).toMatch(/--kami-folio-view-header-height:\s*32px/);
    expect(styles).toMatch(/--kami-folio-status-height:\s*22px/);
    expect(styles).toMatch(/--kami-folio-ribbon-width:\s*32px/);
    expect(styles).toMatch(/--kami-folio-pane-gutter:\s*26px/);
    expect(styles).toMatch(/--kami-folio-document-top:\s*clamp\(72px, 7vw, 100px\)/);
    expect(styles).not.toMatch(/workspace-split\.mod-(?:left|right)-split\s*\{[^}]*(?:min-|max-)?width:/s);
    expect(styles).not.toMatch(/visibility:\s*hidden/);
    expect(styles).toMatch(/\.clickable-icon\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;/s);
    expect(styles).toMatch(/\.clickable-icon svg\s*\{[^}]*width:\s*15px;[^}]*height:\s*15px;/s);
    expect(styles).toMatch(/\.workspace-tab-header:is\(\.is-active, \.has-active-menu\)\s*\{[^}]*background-color:\s*transparent;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root:is\(\.mod-vertical, \.mod-horizontal\),[\s\S]*:is\(\.workspace-split\.mod-vertical, \.workspace-split\.mod-horizontal\)\s*\{[^}]*gap:\s*var\(--kami-folio-pane-gutter\);/s);
    expect(styles).toMatch(/\.workspace\s*\{[^}]*--divider-color:\s*transparent;[^}]*--divider-color-hover:\s*var\(--kami-folio-accent\);/s);
    expect(styles).toMatch(/\.workspace-leaf-resize-handle:is\(:hover, :active\)\s*\{[^}]*background:\s*var\(--kami-folio-accent\);/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root\s+\.workspace-tab-header\s*\{[^}]*margin:\s*0;[^}]*border-radius:\s*0;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header-container-inner\s*\{[^}]*margin:\s*0;[^}]*padding:\s*0;[^}]*gap:\s*0;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-left-split[^{]+\.workspace-tab-header-container-inner\s*\{[^}]*padding:\s*1px 0 1px 28px;[^}]*gap:\s*0;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-right-split[^{]+\.workspace-tab-header-container-inner\s*\{[^}]*padding:\s*1px 4px;[^}]*gap:\s*0;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header\s*\{[^}]*flex:\s*1 1 0;[^}]*width:\s*var\(--tab-width\);[^}]*padding:\s*0 12px;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header-inner\s*\{[^}]*gap:\s*8px;[^}]*width:\s*100%;[^}]*padding:\s*0;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header-inner-title\s*\{[^}]*width:\s*100%;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header:not\(\.is-active\):is\(:hover, :focus-within, \.has-active-menu\)\s*\{[^}]*background:\s*var\(--kami-folio-interactive\);/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root[^{]+\.workspace-tab-header:is\(:hover, :focus-within, \.has-active-menu\)[^{]+\.workspace-tab-header-inner\s*\{[^}]*background:\s*transparent;/s);
    expect(styles).not.toMatch(/content:\s*["'][◇◆]["']/);
    expect(styles).toMatch(/body:is\(\.mod-windows, \.mod-linux\)\.is-hidden-frameless:not\(\.is-fullscreen\):not\(\.is-mobile\)[^{]+\.workspace-tabs\.mod-top-right-space[^{]+\.workspace-tab-header-container\s*\{[^}]*padding-right:\s*var\(--frame-right-space\);/s);
    expect(styles).toMatch(/\.sidebar-toggle-button\.mod-right\s*\{[^}]*right:\s*4px;[^}]*width:\s*30px;[^}]*padding:\s*1px 0;[^}]*box-shadow:\s*none;/s);
    expect(styles).toMatch(/\.nav-header\s*\{[^}]*padding:\s*0;/s);
    expect(styles).not.toMatch(/\.nav-header\s*\{[^}]*(?:min-)?height:/s);
    expect(styles).toMatch(/\.nav-header \.nav-buttons-container\s*\{[^}]*min-height:\s*32px;[^}]*padding:\s*1px 5px 1px 7px;/s);
    expect(styles).toMatch(/\[data-type="file-explorer"\][^{]+\.clickable-icon:nth-last-child\(2\)\s*\{[^}]*margin-inline-start:\s*auto;/s);
    expect(styles).toMatch(/\[data-type="outline"\][^{]+\.nav-buttons-container\s*\{[^}]*justify-content:\s*flex-end;/s);
    expect(styles).toMatch(/\.workspace-sidedock-vault-profile\s*\{[^}]*height:\s*32px;/s);
    expect(styles).toMatch(/\.workspace-leaf-content\.kami-reading-stage\s+\.view-header-title-container\s*\{[^}]*--file-header-justify:\s*flex-start;/s);
    expect(styles).not.toMatch(/body\.kami-reading-presence:not\(\.is-mobile\)\s+\.view-header-title-container/);
    expect(styles).toMatch(/\.status-bar\s*\{[^}]*border-radius:\s*0;/s);
    const baseStatus = styles.match(/body:not\(\.is-mobile\) \.status-bar\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(baseStatus).not.toMatch(/position:\s*fixed|(?:left|right):\s*|width:\s*auto|pointer-events:/);
    expect(mainSource).not.toMatch(/kami-folio-status-left|syncShellGeometry|observedRoots|shellDocuments/);
    expect(styles).toMatch(/body\.kami-reading-stage-open:not\(\.is-mobile\) \.status-bar\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(styles).not.toMatch(/--kami-folio-status-left/);
    expect(styles).not.toMatch(/\.metadata-container\s*\{[^}]*display:\s*none/s);
    expect(styles).toMatch(/@media \(max-width:\s*940px\)\s*\{[^}]*--kami-folio-pane-gutter:\s*16px;/s);
  });

  it("keeps the desktop shell on New Tab while scoping document treatment to Markdown presence", () => {
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-paper:/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-canvas:\s*#f4f1e8;/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-paper:\s*#f4f1e8;/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-shell:\s*#f4f1e8;/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-shell-deep:\s*#f4f1e8;/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--titlebar-background:\s*var\(--kami-folio-shell-deep\);/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--titlebar-background-focused:\s*var\(--kami-folio-shell-deep\);/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--tab-container-background:\s*var\(--kami-folio-shell\);/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s+\.workspace-ribbon\s*\{/s);
    expect(styles).not.toMatch(/body\.kami-reading-presence:not\(\.is-mobile\)\s+\.workspace-ribbon\s*\{/s);
    expect(styles).toMatch(/\.workspace-leaf-content\[data-type="empty"\][^{]+\.empty-state-action\s*\{[^}]*color:\s*var\(--kami-folio-muted\);/s);
    expect(styles).toMatch(/body\.kami-reading-presence:not\(\.is-mobile\)[^{]+\.workspace-leaf-content\.kami-reading-stage\s*\{[^}]*--file-line-width:\s*700px;/s);
    expect(styles).toMatch(/\.workspace-leaf-content\[data-type="markdown"\][^{]+:is\(\.view-header, \.view-content\)\s*\{[^}]*background-color:\s*var\(--kami-folio-paper\);/s);
    expect(styles).toMatch(/\.workspace-leaf-content:is\([^{]+\[data-type="file-explorer"\][^{]+\[data-type="outline"\][^{]+\)\s*\{[^}]*--background-primary:\s*var\(--kami-folio-shell\);/s);
    expect(styles).toMatch(/\.workspace-leaf-content:is\([^{]+\[data-type="file-explorer"\][^{]+\)\s+\.view-content\s*\{[^}]*background-color:\s*var\(--kami-folio-shell\);/s);
    expect(styles).not.toMatch(/mod-(?:left|right)-split[^\n{]*\s+\.workspace-leaf-content\s*[,{]/s);
    expect(styles).not.toMatch(/\.workspace-tabs\.mod-active[^{]+:is\([^)]*\.view-content/s);
    expect(styles).not.toMatch(/mod-(?:left|right)-split\)[^{]+:is\([^)]*\.view-content/s);
    expect(styles).not.toMatch(/body\.kami-reading-presence:not\(\.is-mobile\)\s*\{[^}]*--file-line-width:/s);
    expect(styles).toMatch(/--kami-folio-reading-font:\s*var\(--font-text-theme\);/);
    expect(styles).toMatch(/--kami-folio-heading-font:\s*var\(--font-heading-theme, var\(--font-text-theme\)\);/);
    expect(styles).toMatch(/\.markdown-preview-view\s*\{[^}]*font-family:\s*var\(--kami-folio-reading-font\);[^}]*font-size:\s*var\(--font-text-size\);[^}]*line-height:\s*var\(--line-height-normal\);/s);
    expect(styles).toMatch(/\.kami-folio-deck\s*\{[^}]*font-family:\s*var\(--kami-folio-reading-font\);[^}]*font-size:\s*calc\(var\(--font-text-size\) \* 1\.0625\);[^}]*line-height:\s*var\(--line-height-normal\);/s);
    expect(styles).toMatch(/:is\(h1, h2, h3, h4, h5, h6\)\s*\{[^}]*font-family:\s*var\(--kami-folio-heading-font\);/s);
    expect(styles).toMatch(/\.kami-folio-inline-title\s*\{[^}]*font-family:\s*var\(--kami-folio-heading-font\);/s);
    expect(styles).toMatch(/> \.el-h1:not\(\.el-h1 ~ \.el-h1\)\s*> h1\s*\{[^}]*margin-top:\s*24px;/s);
    expect(styles).not.toMatch(/--kami-folio-reading-font:\s*Charter|\.markdown-preview-view\s*\{[^}]*font-size:\s*17px|\.markdown-preview-view\s*\{[^}]*line-height:\s*1\.68/s);
    expect(styles).toMatch(/\.kami-folio-mode-label\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).not.toMatch(/data-kami-folio-breadcrumb|kami-folio-header-title/);
  });

  it("scopes Focus Mode to native preview wrappers and the active editor line", () => {
    expect(styles).toMatch(/body\.kami-focus-open:not\(\.is-mobile\)[^{]+\.workspace-leaf-content\.kami-focus-active/s);
    expect(styles).toMatch(/\.markdown-source-view\.mod-cm6[^}]+\.cm-line:is\(\.cm-activeLine, \.cm-active, :hover, :focus-within\)/s);
    expect(styles).toMatch(/\.kami-focus-block\s*\{[^}]+opacity:\s*0\.62;/s);
    expect(styles).toMatch(/\.workspace-leaf-content\[data-type="markdown"\]:not\(\.kami-focus-active\)[^{]+> \.view-content\s*\{[^}]*opacity:\s*0\.62;/s);
    expect(styles).toMatch(/\.workspace-leaf-content\[data-type="markdown"\]:not\(\.kami-focus-active\):is\(:hover, :focus-within\)[^{]+> \.view-content\s*\{[^}]*opacity:\s*0\.78;/s);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.workspace-leaf-content\[data-type="markdown"\]:not\(\.kami-focus-active\)[^{]+> \.view-content,[\s\S]*?transition:\s*none;/);
    expect(styles).not.toMatch(/\.markdown-preview-section\s*> div[^}]+opacity:/s);
    expect(styles).not.toMatch(/body\.kami-focus-open[^}]+opacity:\s*0\.38/s);
    expect(styles).not.toMatch(/display:\s*none[^}]*kami-focus/s);
  });

  it("does not leak broad theme aliases from the desktop shell body", () => {
    const bodyBlock = styles.match(/body:not\(\.is-mobile\)\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(bodyBlock).not.toMatch(/--background-(?:primary|secondary):/);
    expect(bodyBlock).not.toMatch(/--text-(?:normal|muted|faint|accent):/);
    expect(bodyBlock).not.toMatch(/--interactive-accent:|--divider-color:/);
  });

  it("unifies native foreground and Settings surfaces without recoloring arbitrary views", () => {
    expect(styles).toMatch(/--kami-folio-foreground:\s*#fbfaf5/);
    expect(styles).toMatch(/body\.theme-dark:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-foreground:\s*#24221e;/s);
    expect(styles).toMatch(/:is\(\.modal-container \.modal, \.prompt, \.suggestion-container, \.menu, \.popover\)\s*\{[^}]*background:\s*var\(--kami-folio-foreground\);/s);
    expect(styles).toMatch(/\.modal\.mod-settings \.vertical-tab-header\s*\{[^}]*background:\s*var\(--kami-folio-shell\);/s);
    expect(styles).toMatch(/\.modal\.mod-settings \.vertical-tab-content-container\s*\{[^}]*background:\s*var\(--kami-folio-foreground\);/s);
    expect(styles).toMatch(/\.modal\.mod-settings \.vertical-tab-nav-item\.is-active\s*\{[^}]*inset 2px 0 0 var\(--kami-folio-accent\)/s);
    expect(styles).toMatch(/\.checkbox-container\.is-enabled\)\s*\{[^}]*background:\s*var\(--kami-folio-accent\);/s);
    expect(styles).toMatch(/\.modal\.mod-settings[\s\S]*\.checkbox-container\):focus-visible,/);
    expect(styles).toMatch(/\.checkbox-container:focus-within\s*\{[^}]*outline:\s*2px solid var\(--kami-folio-accent\);/s);
    expect(styles).not.toMatch(/\.workspace-leaf-content:not\(\[data-type="markdown"\]\)[^{]*\.view-content\s*\{[^}]*background/s);
    expect(styles).not.toMatch(/\.workspace-leaf-content\[data-type="(?:canvas|graph|pdf|bases)"\][^{]*\.view-content\s*\{[^}]*background/s);
    expect(styles).not.toMatch(/!important/);
  });

  it("keeps selected sidebar rows on the shared field with a rail-only location signal", () => {
    expect(styles).toMatch(/body\.theme-dark:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-focus-wash:[^}]*16%/s);
    expect(styles).toMatch(/\.tree-item-self\.kami-outline-current\s*\{[^}]*background:\s*transparent;[^}]*inset 2px 0 0 var\(--kami-folio-accent\)/s);
  });

  it("leaves Outline click, active-row, and viewport ownership to Obsidian", () => {
    expect(outlineSyncSource).toContain('preview?.addEventListener("scroll", this.onScroll');
    expect(outlineSyncSource).not.toMatch(/addEventListener\("click"|scrollIntoView|clickedLine/);
    expect(styles).not.toMatch(/\.tree-item-self\.is-active:not\(\.kami-outline-current\)/);
  });
});

describe("release contracts", () => {
  it("binds tagged releases to current macOS acceptance while retaining historical matrices", () => {
    expect(releaseWorkflow).toMatch(/npm run check[\s\S]*Verify and fetch paired Kami Reader theme[\s\S]*npm run check:visual[\s\S]*Attest release assets/);
    expect(releaseWorkflow).toMatch(/environment:\s*visual-review/);
    expect(releaseWorkflow).toMatch(/raw\.githubusercontent\.com[\s\S]*KAMI_VISUAL_THEME_CSS/);
    expect(visualCheck).toMatch(/historical-macos-matrix/);
    expect(visualCheck).toMatch(/must not claim the current candidate/);
    expect(visualCheck).toMatch(/current-macos-acceptance/);
    expect(visualCheck).toMatch(/macOS visual candidate version must match/);
    expect(visualCheck).toMatch(/utf8-lf-v1/);
    expect(visualCheck).toMatch(/KAMI_VISUAL_THEME_CSS/);
    expect(visualCheck).toMatch(/exact Kami Reader 0\.3\.0 release-candidate/);
    expect(visualCheck).toMatch(/artifact\.sha256/);
    expect(visualCheck).toMatch(/maxResolutionInMP:\s*6/);
    expect(visualCheck).toMatch(/current macOS candidate captures/);
    expect(visualCheck).not.toMatch(/manifest\.accepted/);
  });

  it("keeps file navigation quiet while retaining Outline location context", () => {
    expect(styles).toMatch(/\.nav-file-title\.is-active\s*\{[^}]*background:\s*transparent;[^}]*inset 2px 0 0 var\(--kami-folio-accent\);/s);
    expect(styles).toMatch(/\.tree-item-self\.kami-outline-current\s*\{[^}]*background:\s*transparent;/s);
    expect(styles).toMatch(/\.workspace-ribbon \.clickable-icon\s*\{[^}]*color:\s*var\(--kami-folio-faint\);[^}]*opacity:\s*1;/s);
    expect(styles).not.toMatch(/\.workspace-ribbon \.clickable-icon\s*\{[^}]*opacity:\s*0\./s);
  });

  it("provides an active-leaf white preview and a print-safe light reset", () => {
    expect(mainSource).toContain('id: "toggle-white-page-preview"');
    expect(mainSource).toContain('name: "Toggle white page preview"');
    expect(mainSource).toMatch(/paperPreview\.configure\(view\)/);
    expect(mainSource).toMatch(/paperPreview\.destroy\(\)/);
    expect(paperPreviewSource).toContain('"kami-white-page-preview-active"');
    expect(paperPreviewSource).not.toMatch(/loadData|saveData|localStorage|sessionStorage|frontmatter/);
    expect(styles).toMatch(/\.workspace-leaf-content\.kami-white-page-preview-active\s*\{[^}]*--kami-folio-paper:\s*#ffffff;[^}]*color-scheme:\s*light;/s);
    expect(styles).toMatch(/kami-white-page-preview-active\s*\{[^}]*--background-modifier-form-field:\s*#ffffff;[^}]*--input-shadow:\s*none;/s);
    expect(styles).toMatch(/kami-white-page-preview-active[\s\S]*\.metadata-property-key-input,[\s\S]*background-color:\s*#ffffff;/s);
    expect(styles).toMatch(/kami-white-page-preview-active[\s\S]*tbody[\s\S]*tr:nth-child\(even\)\s*\{\s*background:\s*#f5f4ed;/s);
    expect(styles).toMatch(/@media print\s*\{[\s\S]*--kami-folio-paper:\s*#ffffff;[\s\S]*print-color-adjust:\s*exact;/s);
    expect(styles).not.toMatch(/@media print\s*\{[\s\S]*@page\s*\{[^}]*(?:size|margin)\s*:/s);
  });
});

const headings: HeadingRef[] = [
  { line: 0, level: 1, text: "Story 1" },
  { line: 4, level: 2, text: "Why" },
  { line: 8, level: 2, text: "Goal" },
  { line: 20, level: 1, text: "Story 2" },
  { line: 24, level: 2, text: "Why" },
  { line: 28, level: 2, text: "Goal" }
];

describe("heading contracts", () => {
  it("maps duplicate headings by section source range", () => {
    expect(matchSectionHeadings(headings, [
      { lineStart: 20, lineEnd: 30, level: 2, text: "Why" },
      { lineStart: 20, lineEnd: 30, level: 2, text: "Goal" }
    ])).toEqual([24, 28]);
  });

  it("supports virtualized sections and skips unknown section information", () => {
    expect(matchSectionHeadings(headings, [
      { lineStart: 3, lineEnd: 10, level: 2, text: "Goal" }
    ])).toEqual([8]);
    expect(matchSectionHeadings(headings, [])).toEqual([]);
  });

  it("maps a unique rendered Outline subset and fails closed on ambiguity", () => {
    expect(matchOutlineRows(headings, headings.map((heading) => ({ text: heading.text })))).toEqual([0, 4, 8, 20, 24, 28]);
    expect(matchOutlineRows(headings, [{ text: "Story 2" }, { text: "Why" }, { text: "Goal" }])).toEqual([20, 24, 28]);
    expect(matchOutlineRows(headings, [{ text: "Story 2" }, { text: "Goal" }])).toEqual([20, 28]);
    expect(matchOutlineRows(headings, [{ text: "Why" }])).toBeNull();
    expect(matchOutlineRows(headings, [{ text: "Nope" }])).toBeNull();
  });

  it("matches Outline tree depth independently from Markdown heading rank", () => {
    const skippedLevels = [
      { line: 0, level: 1, text: "Root" },
      { line: 4, level: 3, text: "Skipped level" }
    ];
    expect(matchOutlineRows(skippedLevels, [{ text: "Root" }, { text: "Skipped level" }])).toEqual([0, 4]);
  });

  it("matches a large Outline without copying a suffix for every row", () => {
    const many = Array.from({ length: 20_000 }, (_, line) => ({ line, level: 2, text: `H${line}` }));
    expect(matchOutlineRows(many, many.map(({ text }) => ({ text })))?.length).toBe(20_000);
    expect(matchOutlineRows.toString()).not.toContain("slice(cursor)");
  });

  it("tracks down and up transitions without reversing direction", () => {
    const positioned = [
      { line: 4, top: -40 },
      { line: 8, top: 80 },
      { line: 24, top: 300 }
    ];
    expect(selectActiveLine(positioned, 96, "down", 4)).toBe(8);
    expect(selectActiveLine(positioned, 50, "up", 8)).toBe(4);
    expect(selectActiveLine(positioned, -100, "up", 8)).toBe(8);
  });
});

describe("wide-content contracts", () => {
  it("classifies supported and unknown overflow blocks", () => {
    expect(classifyOverflow("DIV", "mermaid")).toBe("visual");
    expect(classifyOverflow("TABLE")).toBe("table");
    expect(classifyOverflow("PRE")).toBe("code");
    expect(classifyOverflow("DIV", "internal-embed")).toBe("embed");
    expect(classifyOverflow("DIV", "plugin-widget")).toBe("unknown");
  });

  it("keeps narrow panes inline and caps wide panes", () => {
    expect(isOverflowing(702, 700)).toBe(false);
    expect(isOverflowing(703, 700)).toBe(true);
    expect(computeFrameWidth(552, 600, 1800)).toBe(552);
    expect(computeFrameWidth(700, 960, 1800)).toBe(912);
    expect(computeFrameWidth(700, 1440, 1800)).toBe(1100);
    expect(computeFrameWidth(700, 1440, 820)).toBe(820);
  });

  it("handles a large outline and virtualized rendered subset", () => {
    const many = Array.from({ length: 100 }, (_, line) => ({ line, level: 2, text: `H${line}` }));
    const rendered = Array.from({ length: 20 }, (_, index) => ({
      lineStart: index + 40,
      lineEnd: index + 40,
      level: 2,
      text: `H${index + 40}`
    }));
    expect(matchSectionHeadings(many, rendered)).toEqual(Array.from({ length: 20 }, (_, index) => index + 40));
  });
});

type FakeClassList = {
  values: Set<string>;
  removed: string[];
  add: (...names: string[]) => void;
  remove: (...names: string[]) => void;
  contains: (name: string) => boolean;
};

const fakeClassList = (...initial: string[]): FakeClassList => {
  const values = new Set(initial);
  const removed: string[] = [];
  return {
    values,
    removed,
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => {
      values.delete(name);
      removed.push(name);
    }),
    contains: (name) => values.has(name)
  };
};

const fakeElement = (...classes: string[]): HTMLElement => {
  const styles = new Map<string, string>();
  return {
    classList: fakeClassList(...classes),
    style: {
      getPropertyValue: (name: string) => styles.get(name) ?? "",
      setProperty: (name: string, value: string) => { styles.set(name, value); },
      removeProperty: (name: string) => styles.delete(name)
    },
    querySelector: () => null,
    querySelectorAll: () => []
  } as unknown as HTMLElement;
};

const fakeView = (
  body: HTMLElement,
  stage: HTMLElement,
  mode: "preview" | "source",
  filePath: string | null
): MarkdownView => {
  const ownerDocument = {
    body,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  };
  Object.assign(body, { ownerDocument });
  Object.assign(stage, { ownerDocument });
  return {
    containerEl: stage,
    file: filePath ? { path: filePath } : null,
    getMode: () => mode
  } as unknown as MarkdownView;
};

describe("reading presence", () => {
  it("tracks view, file, window, mobile and unload identity", () => {
    const presence = new ReadingPresence();
    const mainBody = fakeElement();
    const mainStage = fakeElement();
    presence.configure(fakeView(mainBody, mainStage, "preview", "A.md"));
    expect(mainBody.classList.contains("kami-reading-presence")).toBe(true);
    expect(mainStage.classList.contains("kami-reading-stage")).toBe(true);

    presence.configure(fakeView(mainBody, mainStage, "preview", "B.md"));
    expect((mainBody.classList as unknown as FakeClassList).removed).toContain("kami-reading-presence");

    const popoutBody = fakeElement();
    const popoutStage = fakeElement();
    presence.configure(fakeView(popoutBody, popoutStage, "preview", "B.md"));
    expect(mainBody.classList.contains("kami-reading-presence")).toBe(false);
    expect(popoutBody.classList.contains("kami-reading-presence")).toBe(true);

    presence.configure(fakeView(popoutBody, popoutStage, "source", "B.md"));
    expect(popoutBody.classList.contains("kami-reading-presence")).toBe(true);
    expect(presence.canToggleStage()).toBe(false);

    const mobileBody = fakeElement("is-mobile");
    const mobileStage = fakeElement();
    presence.configure(fakeView(mobileBody, mobileStage, "preview", "C.md"));
    expect(mobileBody.classList.contains("kami-reading-presence")).toBe(false);

    presence.configure(fakeView(mainBody, mainStage, "preview", null));
    expect(mainBody.classList.contains("kami-reading-presence")).toBe(false);

    presence.configure(fakeView(mainBody, mainStage, "preview", "A.md"));
    presence.destroy();
    expect(mainBody.classList.contains("kami-reading-presence")).toBe(false);
    expect(mainStage.classList.contains("kami-reading-stage")).toBe(false);
  });
});
