import { describe, expect, it } from "vitest";
import type { MarkdownView } from "obsidian";
import { ReadingPresence } from "../src/reading-presence";

class FakeClassList {
  private values = new Set<string>();

  add(...names: string[]): void { names.forEach((name) => this.values.add(name)); }
  remove(...names: string[]): void { names.forEach((name) => this.values.delete(name)); }
  contains(name: string): boolean { return this.values.has(name); }
  toggle(name: string, force: boolean): boolean {
    if (force) this.values.add(name);
    else this.values.delete(name);
    return force;
  }
}

class FakeDocument {
  body!: FakeElement;
  defaultView = { Element: FakeElement };
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
  private styles = new Map<string, string>();
  private attributes = new Map<string, string>();
  private children = new Map<string, FakeElement>();
  style = {
    getPropertyValue: (name: string) => this.styles.get(name) ?? "",
    setProperty: (name: string, value: string) => this.styles.set(name, value),
    removeProperty: (name: string) => this.styles.delete(name)
  };

  constructor(
    readonly ownerDocument: FakeDocument,
    private foreground = false,
    private offset = { left: 0, top: 0 }
  ) {}

  closest(): FakeElement | null { return this.foreground ? this : null; }
  attach(selector: string, child: FakeElement): void { this.children.set(selector, child); }
  after(element: FakeElement): void { this.afterElements.push(element); }
  before(element: FakeElement): void { this.beforeElements.push(element); }
  append(element: FakeElement): void { this.appendedElements.push(element); }
  remove(): void { this.removed = true; this.isConnected = false; }
  querySelector(selector: string): FakeElement | null { return this.children.get(selector) ?? null; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  getBoundingClientRect(): DOMRect {
    return { left: this.offset.left, top: this.offset.top } as DOMRect;
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
    current.stage.attach(".markdown-preview-sizer p", deck);
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
    current.stage.attach(".markdown-preview-sizer p", deck);

    presence.configure(current.view);
    const modeLabel = actions.beforeElements[0];
    const meta = deck.afterElements[0];
    presence.configure(current.view);

    expect(actions.beforeElements).toEqual([modeLabel]);
    expect(deck.afterElements).toEqual([meta]);
    expect(modeLabel.removed).toBe(false);
    expect(meta.removed).toBe(false);
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

    presence.configure(null);
    expect(editing.body.classList.contains("kami-reading-presence")).toBe(false);
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

    presence.configure(second.view);
    expect(first.body.classList.contains("kami-reading-presence")).toBe(false);
    expect(first.stage.classList.contains("kami-reading-stage-active")).toBe(false);
    expect(first.document.listenerCount()).toBe(0);
    expect(second.body.classList.contains("kami-reading-presence")).toBe(true);

    presence.destroy();
    expect(second.body.classList.contains("kami-reading-presence")).toBe(false);
    expect(second.document.listenerCount()).toBe(0);
  });
});
