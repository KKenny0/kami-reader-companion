import { describe, expect, it, vi } from "vitest";
const runtime = vi.hoisted(() => ({ app: null as unknown, commands: new Map<string, { checkCallback(checking: boolean): boolean }>(), events: new Map<string, (...args: unknown[]) => void>() }));
vi.mock("obsidian", () => {
  class View {}
  return {
    View, MarkdownView: class extends View {},
    Plugin: class {
      app = runtime.app;
      register(): void {}
      registerEvent(): void {}
      registerMarkdownPostProcessor(): void {}
      addCommand(command: { id: string; checkCallback(checking: boolean): boolean }): void { runtime.commands.set(command.id, command); }
    }
  };
});
import { MarkdownView, View } from "obsidian";
import KamiReaderCompanion from "../src/main";

class Element {
  classes = new Set<string>();
  classList = {
    add: (...names: string[]) => names.forEach((name) => this.classes.add(name)),
    remove: (...names: string[]) => names.forEach((name) => this.classes.delete(name)),
    contains: (name: string) => this.classes.has(name),
    toggle: (name: string, on: boolean) => { if (on) this.classes.add(name); else this.classes.delete(name); }
  };
  style = { getPropertyValue: () => "", setProperty: () => undefined, removeProperty: () => undefined };
  children: Element[] = [];
  parentElement: Element | null = null;
  dataset: Record<string, string> = {};
  textContent = "";
  isConnected = true;
  listeners = new Map<string, () => void>();
  header: Element | null = null;
  constructor(public ownerDocument: Doc) {}
  querySelector(selector: string): Element | null { return selector === ".view-header" ? this.header : null; }
  querySelectorAll(): Element[] { return []; }
  closest(): null { return null; }
  getBoundingClientRect(): { left: number; top: number } { return { left: 0, top: 0 }; }
  createEl(_tag = "", options: { text?: string } = {}): Element {
    const child = new Element(this.ownerDocument); child.textContent = options.text ?? ""; this.append(child); return child;
  }
  createDiv(): Element { return this.createEl(); }
  createSpan(): Element { return this.createEl(); }
  append(child: Element): void { this.children.push(child); child.parentElement = this; }
  remove(): void { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); this.parentElement = null; this.isConnected = false; }
  replaceChildren(): void { this.children = []; }
  addEventListener(name: string, listener: () => void): void { this.listeners.set(name, listener); }
}
class Doc {
  body = new Element(this);
  defaultView = {
    Element, HTMLElement: Element,
    addEventListener: (name: string, listener: (event: unknown) => void) => this.listeners.set(`window:${name}`, listener),
    removeEventListener: (name: string) => this.listeners.delete(`window:${name}`)
  };
  listeners = new Map<string, (event: unknown) => void>();
  addEventListener(name: string, listener: (event: unknown) => void, capture = false): void { this.listeners.set(capture ? `${name}:capture` : name, listener); }
  removeEventListener(name: string, _listener: unknown, capture = false): void { this.listeners.delete(capture ? `${name}:capture` : name); }
  querySelectorAll(): Element[] { return []; }
  escape(): void { const event = { key: "Escape", target: this.body }; this.listeners.get("window:keydown")?.(event); this.listeners.get("keydown:capture")?.(event); this.listeners.get("keydown")?.(event); }
}
class Menu {
  entries: Array<{ title: string; checked: boolean; disabled: boolean; click: () => void }> = [];
  addItem(callback: (item: unknown) => void): void {
    const entry = { title: "", checked: false, disabled: false, click: () => undefined as void };
    const item = {
      setSection: () => item,
      setTitle: (title: string) => { entry.title = title; return item; },
      setChecked: (checked: boolean) => { entry.checked = checked; return item; },
      setDisabled: (disabled: boolean) => { entry.disabled = disabled; return item; },
      onClick: (click: () => void) => { entry.click = click; return item; }
    };
    callback(item); this.entries.push(entry);
  }
}
function setup() {
  vi.stubGlobal("MutationObserver", class { disconnect(): void {} observe(): void {} });
  const doc = new Doc();
  const makeView = (path: string, mode = "preview") => {
    const container = new Element(doc); container.header = new Element(doc);
    const view = Object.assign(new MarkdownView(null as never), { file: { path }, containerEl: container, getMode: () => mode });
    Object.assign(view, { leaf: { view } });
    return view;
  };
  const first = makeView("first.md"); const second = makeView("second.md");
  let active: unknown = first;
  runtime.commands.clear(); runtime.events.clear();
  let escape: ((event: KeyboardEvent) => boolean | void) | null = null;
  runtime.app = { scope: {
    register: (_modifiers: string[], _key: string, handler: (event: KeyboardEvent) => boolean | void) => { escape = handler; return handler; },
    unregister: () => { escape = null; }
  }, metadataCache: {}, workspace: {
    onLayoutReady: (callback: () => void) => callback(),
    on: (name: string, callback: (...args: unknown[]) => void) => { runtime.events.set(name, callback); return {}; },
    getActiveViewOfType: (type: new (...args: never[]) => unknown) => active instanceof type ? active : null,
    setActiveLeaf: (leaf: { view: unknown }) => { active = leaf.view; }
  } };
  vi.stubGlobal("window", { requestAnimationFrame: () => 1, cancelAnimationFrame: () => undefined });
  const plugin = new (KamiReaderCompanion as unknown as new () => KamiReaderCompanion)(); plugin.onload();
  const command = (id: string) => runtime.commands.get(id)!.checkCallback(false);
  const menu = (view = first) => { const menu = new Menu(); runtime.events.get("file-menu")!(menu, view.file, "pane-more-options", view.leaf); return menu; };
  const buttons = (view = first) => (view.containerEl as unknown as Element).header!.children.flatMap((child) => child.children);
  return { plugin, first, second, makeView, menu, command, buttons, doc, escape: (foreground = false) => { if (!foreground) return escape?.({ target: doc.body } as unknown as KeyboardEvent); }, activate: (view: unknown) => { active = view; } };
}

describe("native mode controls", () => {
  it("keeps command, checked menu, individual exits and Escape in sync", () => {
    const s = setup();
    s.command("toggle-reading-stage"); s.command("toggle-focus-mode"); s.command("toggle-white-page-preview");
    expect(s.menu().entries.map((entry) => entry.checked)).toEqual([true, true, true]);
    expect(s.buttons().map((button) => button.textContent)).toEqual(["Stage ×", "Focus ×", "Paper ×"]);
    const paperButton = s.buttons().find((button) => button.textContent === "Paper ×")!;
    const controls = paperButton.parentElement!;
    Object.assign(controls, { scrollLeft: 0, clientWidth: 77, getBoundingClientRect: () => ({ left: 100, right: 177 }) });
    Object.assign(paperButton, { getBoundingClientRect: () => ({ left: 160, right: 214 }) });
    paperButton.listeners.get("focus")!();
    expect((controls as unknown as HTMLElement).scrollLeft).toBe(37);
    const firstButton = s.buttons()[0];
    Object.assign(firstButton, { getBoundingClientRect: () => ({ left: 63, right: 117 }) });
    firstButton.listeners.get("focus")!();
    expect((controls as unknown as HTMLElement).scrollLeft).toBe(0);
    s.escape(true);
    expect(s.menu().entries.map((entry) => entry.checked)).toEqual([true, true, true]);
    s.escape();
    expect(s.menu().entries.map((entry) => entry.checked)).toEqual([false, true, true]);
    s.buttons().find((button) => button.textContent === "Paper ×")!.listeners.get("click")!();
    expect(s.menu().entries.map((entry) => entry.checked)).toEqual([false, true, false]);
    s.escape();
    expect(s.buttons()).toHaveLength(0);
    s.plugin.onunload();
  });

  it("operates the clicked pane, rejects stale files, and disables Stage in source", () => {
    const s = setup(); s.command("toggle-reading-stage");
    const secondMenu = s.menu(s.second);
    expect(secondMenu.entries[0].checked).toBe(false);
    secondMenu.entries[2].click();
    expect(s.menu(s.second).entries.map((entry) => entry.checked)).toEqual([false, false, true]);
    expect(s.buttons()).toHaveLength(0);
    const stale = s.menu(s.second); s.second.file.path = "replaced.md"; stale.entries[0].click();
    expect(s.menu(s.second).entries[0].checked).toBe(false);
    const source = s.makeView("source.md", "source"); s.activate(source);
    const sourceMenu = s.menu(source);
    expect(sourceMenu.entries[0].disabled).toBe(true);
    expect(s.command("toggle-reading-stage")).toBe(false);
    sourceMenu.entries[1].click();
    expect(s.buttons(source).map((button) => button.textContent)).toEqual(["Focus ×"]);
    const nonMarkdownContainer = new Element(s.doc); nonMarkdownContainer.header = new Element(s.doc);
    const nonMarkdown = Object.assign(new (View as unknown as new () => View)(), { containerEl: nonMarkdownContainer });
    s.activate(nonMarkdown);
    runtime.commands.get("toggle-focus-mode")!.checkCallback(true);
    const pausedButtons = nonMarkdownContainer.header.children.flatMap((child) => child.children);
    expect(pausedButtons.map((button) => button.textContent)).toEqual(["Focus paused ×"]);
    pausedButtons[0].listeners.get("click")!();
    s.activate(source);
    expect(s.menu(source).entries[1].checked).toBe(false);
    s.plugin.onunload(); expect(s.buttons(source)).toHaveLength(0);
  });
});
