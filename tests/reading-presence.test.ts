import { describe, expect, it } from "vitest";
import type { MarkdownView } from "obsidian";
import { ReadingPresence } from "../src/reading-presence";

class FakeClassList {
  private values = new Set<string>();
  toggleCount = 0;

  add(...names: string[]): void { names.forEach((name) => this.values.add(name)); }
  remove(...names: string[]): void { names.forEach((name) => this.values.delete(name)); }
  contains(name: string): boolean { return this.values.has(name); }
  toggle(name: string, force: boolean): boolean {
    this.toggleCount += 1;
    if (force) this.values.add(name);
    else this.values.delete(name);
    return force;
  }
}

class FakeDocument {
  body!: FakeElement;
  focused: FakeElement | null = null;
  get activeElement(): FakeElement { return this.focused?.isConnected ? this.focused : this.body; }
  defaultView = { Element: FakeElement, HTMLElement: FakeElement };
  private keydown = new Set<(event: KeyboardEvent) => void>();

  addEventListener(_type: string, listener: (event: KeyboardEvent) => void): void {
    this.keydown.add(listener);
  }

  removeEventListener(_type: string, listener: (event: KeyboardEvent) => void): void {
    this.keydown.delete(listener);
  }

  escape(target: FakeElement): void {
    const event = { key: "Escape", defaultPrevented: false, target } as unknown as KeyboardEvent;
    this.keydown.forEach((listener) => listener(event));
  }

  arrow(key: "ArrowUp" | "ArrowDown", target: FakeElement): boolean {
    let prevented = false;
    const event = {
      key,
      defaultPrevented: false,
      target,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault(): void { prevented = true; }
    } as unknown as KeyboardEvent;
    this.keydown.forEach((listener) => listener(event));
    return prevented;
  }

  listenerCount(): number { return this.keydown.size; }
  createElement(): FakeElement { return new FakeElement(this); }
}

class FakeElement {
  classList = new FakeClassList();
  textContent = "";
  afterElements: FakeElement[] = [];
  beforeElements: FakeElement[] = [];
  appendedElements: FakeElement[] = [];
  removed = false;
  isConnected = true;
  scrollTop = 0;
  querySelectorAllCount = 0;
  private styles = new Map<string, string>();
  private attributes = new Map<string, string>();
  private children = new Map<string, FakeElement>();
  private childLists = new Map<string, FakeElement[]>();
  private closestElements = new Map<string, FakeElement>();
  style = {
    getPropertyValue: (name: string) => this.styles.get(name) ?? "",
    setProperty: (name: string, value: string) => this.styles.set(name, value),
    removeProperty: (name: string) => this.styles.delete(name)
  };

  constructor(
    readonly ownerDocument: FakeDocument,
    private foreground = false,
    private offset: { left: number; top: number; height?: number } = { left: 0, top: 0 }
  ) {}

  instanceOf(constructor: typeof FakeElement): boolean { return this instanceof constructor; }
  closest(selector: string): FakeElement | null {
    return this.foreground ? this : this.closestElements.get(selector) ?? null;
  }
  markClosest(selector: string, element: FakeElement = this): void { this.closestElements.set(selector, element); }
  contains(element: Element): boolean { return element === this as unknown as Element; }
  attach(selector: string, child: FakeElement): void { this.children.set(selector, child); }
  attachAll(selector: string, children: FakeElement[]): void {
    children.forEach((child) => child.markClosest(selector));
    this.childLists.set(selector, children);
  }
  after(element: FakeElement): void { this.afterElements.push(element); }
  before(element: FakeElement): void { this.beforeElements.push(element); }
  append(element: FakeElement): void { this.appendedElements.push(element); }
  remove(): void { this.removed = true; this.isConnected = false; }
  querySelector(selector: string): FakeElement | null { return this.children.get(selector) ?? null; }
  querySelectorAll(selector: string): FakeElement[] {
    this.querySelectorAllCount += 1;
    return this.childLists.get(selector) ?? [];
  }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  hasAttribute(name: string): boolean { return this.attributes.has(name); }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  focus(): void { this.ownerDocument.focused = this; }
  scrollIntoView(): void {}
  getBoundingClientRect(): DOMRect {
    return {
      left: this.offset.left,
      top: this.offset.top,
      bottom: this.offset.top + (this.offset.height ?? 100)
    } as DOMRect;
  }
}

function target(path = "note.md", document = new FakeDocument(), mode: "preview" | "source" = "preview") {
  const body = new FakeElement(document);
  const stage = new FakeElement(document);
  document.body = body;
  const view = {
    containerEl: stage,
    file: { path },
    getMode: () => mode
  } as unknown as MarkdownView;
  return { body, document, stage, view };
}

describe("reading presence", () => {
  it("toggles an eligible reading stage without persisted state", () => {
    const presence = new ReadingPresence();
    const current = target();

    presence.configure(current.view);
    expect(current.body.classList.contains("kami-reading-presence")).toBe(true);
    expect(current.stage.classList.contains("kami-reading-stage")).toBe(true);
    expect(presence.toggleStage()).toBe(true);
    expect(current.body.classList.contains("kami-reading-stage-open")).toBe(true);
    expect(current.stage.classList.contains("kami-reading-stage-active")).toBe(true);
    expect(presence.toggleStage()).toBe(false);
    expect(current.body.classList.contains("kami-reading-stage-open")).toBe(false);
  });

  it("adds reversible folio labels from the active file", () => {
    const presence = new ReadingPresence();
    const current = target("Product/Kami/Note.md");
    const header = new FakeElement(current.document);
    const actions = new FakeElement(current.document);
    const title = new FakeElement(current.document);
    const deck = new FakeElement(current.document);
    header.attach(".view-actions", actions);
    current.stage.attach(".view-header", header);
    current.stage.attach(".inline-title", title);
    current.stage.attach(".markdown-preview-section > .el-p > p", deck);
    Object.assign(current.view.file!, { stat: { mtime: Date.UTC(2026, 7, 5) } });

    presence.configure(current.view);
    const modeLabel = actions.beforeElements[0];
    expect(modeLabel.textContent).toBe("READING");
    expect(modeLabel.getAttribute("aria-hidden")).toBe("true");
    expect(deck.classList.contains("kami-folio-deck")).toBe(true);
    expect(deck.afterElements[0].textContent).toBe("READING NOTE   2026.08.05");

    presence.destroy();
    expect(modeLabel.removed).toBe(true);
    expect(deck.classList.contains("kami-folio-deck")).toBe(false);
    expect(deck.afterElements[0].removed).toBe(true);
  });

  it("keeps same-target decoration idempotent", () => {
    const presence = new ReadingPresence();
    const current = target("Product/Kami/Note.md");
    const header = new FakeElement(current.document);
    const actions = new FakeElement(current.document);
    const title = new FakeElement(current.document);
    const deck = new FakeElement(current.document);
    header.attach(".view-actions", actions);
    current.stage.attach(".view-header", header);
    current.stage.attach(".inline-title", title);
    current.stage.attach(".markdown-preview-section > .el-p > p", deck);

    presence.configure(current.view);
    const modeLabel = actions.beforeElements[0];
    const meta = deck.afterElements[0];
    presence.configure(current.view);

    expect(actions.beforeElements).toEqual([modeLabel]);
    expect(deck.afterElements).toEqual([meta]);
    expect(modeLabel.removed).toBe(false);
    expect(meta.removed).toBe(false);
  });

  it("keeps a document H1 primary and treats the inline filename as context", () => {
    const presence = new ReadingPresence();
    const current = target();
    const title = new FakeElement(current.document);
    const heading = new FakeElement(current.document);
    title.textContent = "The same title";
    heading.textContent = "The   same title";
    current.stage.attach(".inline-title", title);
    current.stage.attach(".markdown-preview-section > .el-h1 > h1", heading);

    presence.configure(current.view);
    expect(title.classList.contains("kami-folio-inline-title-context")).toBe(true);
    expect(title.classList.contains("kami-folio-inline-title")).toBe(false);

    presence.configure(null);
    expect(title.classList.contains("kami-folio-inline-title-context")).toBe(false);
  });

  it("treats the filename as context whenever the document has a direct H1", () => {
    const presence = new ReadingPresence();
    const current = target();
    const title = new FakeElement(current.document);
    const heading = new FakeElement(current.document);
    title.textContent = "Meeting notes";
    heading.textContent = "Quarterly plan";
    current.stage.attach(".inline-title", title);
    current.stage.attach(".markdown-preview-section > .el-h1 > h1", heading);

    presence.configure(current.view);
    expect(title.classList.contains("kami-folio-inline-title")).toBe(false);
    expect(title.classList.contains("kami-folio-inline-title-context")).toBe(true);
  });

  it("keeps the inline filename as the display title when no direct H1 exists", () => {
    const presence = new ReadingPresence();
    const current = target();
    const title = new FakeElement(current.document);
    current.stage.attach(".inline-title", title);

    presence.configure(current.view);
    expect(title.classList.contains("kami-folio-inline-title")).toBe(true);
    expect(title.classList.contains("kami-folio-inline-title-context")).toBe(false);
  });

  it("keeps the shell in Editing View while exiting the Reading-only stage", () => {
    const presence = new ReadingPresence();
    const document = new FakeDocument();
    const reading = target("note.md", document);
    const editing = target("note.md", document, "source");
    const header = new FakeElement(document);
    const actions = new FakeElement(document);
    header.attach(".view-actions", actions);
    editing.stage.attach(".view-header", header);

    presence.configure(reading.view);
    presence.toggleStage();
    presence.configure(editing.view);

    expect(editing.body.classList.contains("kami-reading-presence")).toBe(true);
    expect(editing.body.classList.contains("kami-reading-stage-open")).toBe(false);
    expect(presence.canToggleStage()).toBe(false);
    expect(presence.toggleStage()).toBe(false);
    expect(actions.beforeElements[0].textContent).toBe("EDITING");

    expect(presence.canToggleFocus()).toBe(true);
    expect(presence.toggleFocus()).toBe(true);
    expect(editing.body.classList.contains("kami-focus-open")).toBe(true);
    expect(editing.stage.classList.contains("kami-focus-active")).toBe(true);
    expect(actions.beforeElements[0].textContent).toBe("EDITING · FOCUS");

    const readingAgain = target("note.md", document);
    presence.configure(readingAgain.view);
    expect(readingAgain.body.classList.contains("kami-focus-open")).toBe(false);
    expect(readingAgain.stage.classList.contains("kami-focus-active")).toBe(false);

    presence.configure(null);
    expect(readingAgain.body.classList.contains("kami-reading-presence")).toBe(false);
    expect(readingAgain.body.classList.contains("kami-focus-open")).toBe(false);
  });

  it("moves Reading Focus across native preview block wrappers with the keyboard", () => {
    const presence = new ReadingPresence();
    const current = target();
    const first = new FakeElement(current.document);
    const second = new FakeElement(current.document);
    const preview = new FakeElement(current.document);
    const selector = ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)";
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(selector, [first, second]);

    presence.configure(current.view);
    presence.toggleFocus();
    expect(first.classList.contains("kami-focus-current")).toBe(true);
    expect(second.classList.contains("kami-focus-near")).toBe(true);
    expect(first.classList.contains("kami-focus-block")).toBe(true);
    expect(second.classList.contains("kami-focus-block")).toBe(true);

    expect(current.document.focused).toBe(first);
    expect(current.document.arrow("ArrowDown", first)).toBe(true);
    expect(first.classList.contains("kami-focus-near")).toBe(true);
    expect(second.classList.contains("kami-focus-current")).toBe(true);
    expect(current.document.focused).toBe(second);

    presence.exitFocus();
    expect(second.classList.contains("kami-focus-current")).toBe(false);
    expect(second.classList.contains("kami-focus-block")).toBe(false);
    expect(second.hasAttribute("tabindex")).toBe(false);
  });

  it("moves from the block that actually owns keyboard focus", () => {
    const presence = new ReadingPresence();
    const current = target();
    const blocks = Array.from({ length: 3 }, () => new FakeElement(current.document));
    const preview = new FakeElement(current.document);
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      blocks
    );

    presence.configure(current.view);
    presence.toggleFocus();
    expect(current.document.arrow("ArrowDown", blocks[1])).toBe(true);
    expect(blocks[2].classList.contains("kami-focus-current")).toBe(true);
  });

  it("leaves arrow behavior on arbitrary focusable reading descendants untouched", () => {
    const presence = new ReadingPresence();
    const current = target();
    const block = new FakeElement(current.document);
    const widget = new FakeElement(current.document);
    widget.markClosest(".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)", block);
    current.stage.attach(".markdown-preview-view", new FakeElement(current.document));
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      [block]
    );

    presence.configure(current.view);
    presence.toggleFocus();
    expect(current.document.arrow("ArrowDown", widget)).toBe(false);
    expect(block.classList.contains("kami-focus-current")).toBe(true);
  });

  it("leaves native arrow navigation alone outside the active article", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document);
    const block = new FakeElement(current.document);
    const sidebar = new FakeElement(current.document);
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      [block]
    );

    presence.configure(current.view);
    presence.toggleFocus();
    expect(current.document.arrow("ArrowDown", sidebar)).toBe(false);
    expect(block.classList.contains("kami-focus-current")).toBe(true);
  });

  it("treats an embedded note as one host block without entering its internals", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document);
    const host = new FakeElement(current.document);
    const embedded = new FakeElement(current.document);
    embedded.markClosest(".markdown-embed");
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      [host, embedded]
    );

    presence.configure(current.view);
    presence.toggleFocus();
    expect(current.document.arrow("ArrowDown", host)).toBe(true);
    expect(host.classList.contains("kami-focus-current")).toBe(true);
    expect(host.classList.contains("kami-focus-block")).toBe(true);
    expect(embedded.classList.contains("kami-focus-block")).toBe(false);
    expect(embedded.classList.contains("kami-focus-current")).toBe(false);
  });

  it("updates only the nearby Focus blocks on keyboard movement", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document);
    const blocks = Array.from({ length: 20 }, () => new FakeElement(current.document));
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      blocks
    );

    presence.configure(current.view);
    presence.toggleFocus();
    const before = blocks.reduce((sum, block) => sum + block.classList.toggleCount, 0);
    const queriesBefore = current.stage.querySelectorAllCount;
    current.document.arrow("ArrowDown", blocks[0]);
    const after = blocks.reduce((sum, block) => sum + block.classList.toggleCount, 0);
    expect(after - before).toBeLessThanOrEqual(6);
    expect(current.stage.querySelectorAllCount - queriesBefore).toBe(1);
  });

  it("does not migrate top-of-document decorations while the preview is virtualized", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document);
    const title = new FakeElement(current.document);
    const heading = new FakeElement(current.document);
    const topDeck = new FakeElement(current.document);
    title.textContent = heading.textContent = "Document title";
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attach(".inline-title", title);
    current.stage.attach(".markdown-preview-section > .el-h1 > h1", heading);
    current.stage.attach(".markdown-preview-section > .el-p > p", topDeck);
    presence.configure(current.view);

    const middleHeading = new FakeElement(current.document);
    const middleParagraph = new FakeElement(current.document);
    preview.scrollTop = 400;
    current.stage.attach(".markdown-preview-section > .el-h1 > h1", middleHeading);
    current.stage.attach(".markdown-preview-section > .el-p > p", middleParagraph);
    presence.configure(current.view);
    expect(middleParagraph.classList.contains("kami-folio-deck")).toBe(false);
    expect(middleParagraph.afterElements).toEqual([]);

    preview.scrollTop = 0;
    middleHeading.textContent = title.textContent;
    presence.configure(current.view);
    expect(middleParagraph.classList.contains("kami-folio-deck")).toBe(true);
  });

  it("starts Reading Focus from the first visible block", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document, false, { left: 0, top: 200, height: 500 });
    const above = new FakeElement(current.document, false, { left: 0, top: 0 });
    const visible = new FakeElement(current.document, false, { left: 0, top: 250 });
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(
      ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)",
      [above, visible]
    );

    presence.configure(current.view);
    presence.toggleFocus();
    expect(above.classList.contains("kami-focus-current")).toBe(false);
    expect(visible.classList.contains("kami-focus-current")).toBe(true);
  });

  it("keeps a keyboard-reachable current block after preview virtualization", () => {
    const presence = new ReadingPresence();
    const current = target();
    const preview = new FakeElement(current.document, false, { left: 0, top: 200, height: 500 });
    const first = new FakeElement(current.document, false, { left: 0, top: 250 });
    const replacement = new FakeElement(current.document, false, { left: 0, top: 260 });
    const selector = ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)";
    current.stage.attach(".markdown-preview-view", preview);
    current.stage.attachAll(selector, [first]);

    presence.configure(current.view);
    presence.toggleFocus();
    first.isConnected = false;
    current.stage.attachAll(selector, [replacement]);
    presence.configure(current.view);

    expect(replacement.classList.contains("kami-focus-current")).toBe(true);
    expect(replacement.getAttribute("tabindex")).toBe("0");
    expect(current.document.focused).toBe(replacement);
  });

  it("exits Reading Stage before Focus Mode on Escape", () => {
    const presence = new ReadingPresence();
    const current = target();
    const header = new FakeElement(current.document);
    const actions = new FakeElement(current.document);
    header.attach(".view-actions", actions);
    current.stage.attach(".view-header", header);

    presence.configure(current.view);
    presence.toggleFocus();
    presence.toggleStage();

    current.document.escape(current.body);
    expect(current.body.classList.contains("kami-reading-stage-open")).toBe(false);
    expect(current.body.classList.contains("kami-focus-open")).toBe(true);
    expect(actions.beforeElements[0].textContent).toBe("READING · FOCUS");

    current.document.escape(current.body);
    expect(current.body.classList.contains("kami-focus-open")).toBe(false);
    expect(current.stage.classList.contains("kami-focus-active")).toBe(false);
    expect(actions.beforeElements[0].textContent).toBe("READING");
  });

  it("offsets a split-pane stage and clears the inline geometry on exit", () => {
    const presence = new ReadingPresence();
    const current = target();
    const shiftedStage = new FakeElement(current.document, false, { left: 612, top: 0 });
    const view = {
      containerEl: shiftedStage,
      file: { path: "split.md" },
      getMode: () => "preview"
    } as unknown as MarkdownView;

    presence.configure(view);
    presence.toggleStage();
    expect(shiftedStage.style.getPropertyValue("--kami-reading-stage-shift-x")).toBe("-612px");
    presence.exitStage();
    expect(shiftedStage.style.getPropertyValue("--kami-reading-stage-shift-x")).toBe("");
  });

  it("lets foreground UI own Escape and exits from the reading surface", () => {
    const presence = new ReadingPresence();
    const current = target();
    presence.configure(current.view);
    presence.toggleStage();

    current.document.escape(new FakeElement(current.document, true));
    expect(current.body.classList.contains("kami-reading-stage-open")).toBe(true);
    current.document.escape(current.body);
    expect(current.body.classList.contains("kami-reading-stage-open")).toBe(false);
  });

  it("cleans the previous window and stage when identity changes or unloads", () => {
    const presence = new ReadingPresence();
    const first = target("first.md");
    const second = target("second.md");
    presence.configure(first.view);
    presence.toggleStage();
    presence.toggleFocus();

    presence.configure(second.view);
    expect(first.body.classList.contains("kami-reading-presence")).toBe(false);
    expect(first.stage.classList.contains("kami-reading-stage-active")).toBe(false);
    expect(first.document.listenerCount()).toBe(0);
    expect(second.body.classList.contains("kami-reading-presence")).toBe(true);
    expect(second.body.classList.contains("kami-focus-open")).toBe(false);

    presence.destroy();
    expect(second.body.classList.contains("kami-reading-presence")).toBe(false);
    expect(second.document.listenerCount()).toBe(0);
  });
});
