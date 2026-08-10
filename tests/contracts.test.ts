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
  shouldRevealOutlineRow,
  type HeadingRef
} from "../src/contracts";
import { ReadingPresence } from "../src/reading-presence";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const releaseWorkflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const visualCheck = readFileSync(new URL("../scripts/check-visual-evidence.mjs", import.meta.url), "utf8");

describe("folio shell CSS contracts", () => {
  it("owns the prototype shell rhythm without hiding AX nodes or fixing sidebar widths", () => {
    expect(styles).toMatch(/--kami-folio-strip-height:\s*32px/);
    expect(styles).toMatch(/--kami-folio-view-header-height:\s*32px/);
    expect(styles).toMatch(/--kami-folio-status-height:\s*22px/);
    expect(styles).toMatch(/--kami-folio-ribbon-width:\s*32px/);
    expect(styles).toMatch(/--kami-folio-document-top:\s*clamp\(72px, 7vw, 100px\)/);
    expect(styles).not.toMatch(/workspace-split\.mod-(?:left|right)-split\s*\{[^}]*(?:min-|max-)?width:/s);
    expect(styles).not.toMatch(/visibility:\s*hidden/);
    expect(styles).toMatch(/\.clickable-icon\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;/s);
    expect(styles).toMatch(/\.clickable-icon svg\s*\{[^}]*width:\s*15px;[^}]*height:\s*15px;/s);
    expect(styles).toMatch(/\.workspace-tab-header:is\(\.is-active, \.has-active-menu\)\s*\{[^}]*background-color:\s*transparent;/s);
    expect(styles).toMatch(/\.workspace-split\.mod-root\s+\.workspace-tab-header\s*\{[^}]*margin:\s*0;[^}]*border-radius:\s*0;/s);
    expect(styles).toMatch(/\.workspace-sidedock-vault-profile\s*\{[^}]*height:\s*32px;/s);
    expect(styles).toMatch(/\.workspace-leaf-content\.kami-reading-stage\s+\.view-header-title-container\s*\{[^}]*--file-header-justify:\s*flex-start;/s);
    expect(styles).not.toMatch(/body\.kami-reading-presence:not\(\.is-mobile\)\s+\.view-header-title-container/);
    expect(styles).toMatch(/\.status-bar\s*\{[^}]*border-radius:\s*0;/s);
    expect(styles).not.toMatch(/\.metadata-container\s*\{[^}]*display:\s*none/s);
  });

  it("keeps the desktop shell on New Tab while scoping document treatment to Markdown presence", () => {
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-paper:/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-canvas:\s*#dfddd4;/s);
    expect(styles).toMatch(/body:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-shell:\s*#e9e6dc;/s);
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
    expect(styles).toMatch(/\.kami-folio-mode-label\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).not.toMatch(/data-kami-folio-breadcrumb|kami-folio-header-title/);
  });

  it("scopes Focus Mode to native preview wrappers and the active editor line", () => {
    expect(styles).toMatch(/body\.kami-focus-open:not\(\.is-mobile\)[^{]+\.workspace-leaf-content\.kami-focus-active/s);
    expect(styles).toMatch(/\.markdown-source-view\.mod-cm6[^}]+\.cm-line:is\(\.cm-activeLine, \.cm-active, :hover, :focus-within\)/s);
    expect(styles).toMatch(/\.kami-focus-block\s*\{[^}]+opacity:\s*0\.62;/s);
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
    expect(styles).toMatch(/--kami-folio-foreground:\s*#fbfaf4/);
    expect(styles).toMatch(/body\.theme-dark:not\(\.is-mobile\)\s*\{[^}]*--kami-folio-foreground:\s*#211f1b;/s);
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
});

describe("release contracts", () => {
  it("keeps tagged releases reviewed while visual acceptance stays independent", () => {
    expect(releaseWorkflow).toMatch(/npm run check\s+[\s\S]*Attest release assets/);
    expect(releaseWorkflow).toMatch(/environment:\s*visual-review/);
    expect(releaseWorkflow).not.toMatch(/npm run check:visual/);
    expect(visualCheck).toMatch(/visual viewport must be 1440x900/);
    expect(visualCheck).toMatch(/carried-forward visual baselines are not allowed/);
    expect(visualCheck).toMatch(/artifact\.sha256/);
    expect(visualCheck).toMatch(/maxResolutionInMP:\s*2/);
    expect(visualCheck).toMatch(/Verified structural integrity/);
    expect(visualCheck).not.toMatch(/manifest\.accepted/);
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

  it("tracks down, up and click transitions without reversing direction", () => {
    const positioned = [
      { line: 4, top: -40 },
      { line: 8, top: 80 },
      { line: 24, top: 300 }
    ];
    expect(selectActiveLine(positioned, 96, "down", 4)).toBe(8);
    expect(selectActiveLine(positioned, 50, "up", 8)).toBe(4);
    expect(selectActiveLine(positioned, -100, "up", 8)).toBe(8);
    expect(selectActiveLine(positioned, 96, "up", 8, 24)).toBe(24);
  });

  it("reveals only changed scroll-owned rows outside active Outline interaction", () => {
    expect(shouldRevealOutlineRow(4, 8, false, false)).toBe(true);
    expect(shouldRevealOutlineRow(8, 8, false, false)).toBe(false);
    expect(shouldRevealOutlineRow(4, 8, true, false)).toBe(false);
    expect(shouldRevealOutlineRow(4, 8, false, true)).toBe(false);
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
