import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  app: null as unknown,
  layoutReady: null as (() => void) | null,
  observerCount: 0,
  mutationCallbacks: [] as MutationCallback[],
  observerOptions: null as MutationObserverInit | null,
  workspaceEvents: 0,
  commandIds: [] as string[],
  animationCallback: null as FrameRequestCallback | null,
  resizeCallback: null as ResizeObserverCallback | null,
  observedElements: [] as Element[]
}));

vi.mock("obsidian", () => ({
  MarkdownView: class MarkdownView {},
  View: class View {},
  Plugin: class Plugin {
    app = mocks.app;
    register(): void {}
    registerEvent(): void {}
    registerMarkdownPostProcessor(): void {}
    addCommand(command: { id: string }): void { mocks.commandIds.push(command.id); }
  }
}));

import KamiReaderCompanion from "../src/main";
import { AdaptiveContent } from "../src/adaptive-content";
import { ReadingPresence } from "../src/reading-presence";
import { OutlineSync } from "../src/outline-sync";
import { PaperPreview } from "../src/paper-preview";
import { MarkdownView } from "obsidian";

describe("plugin lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.mutationCallbacks = [];
    mocks.layoutReady = null;
    mocks.observerCount = 0;
    mocks.observerOptions = null;
    mocks.workspaceEvents = 0;
    mocks.commandIds = [];
    mocks.animationCallback = null;
    mocks.resizeCallback = null;
    mocks.observedElements = [];
    mocks.app = {
      scope: { register: () => ({}), unregister: () => undefined },
      metadataCache: { getCache: () => null },
      workspace: {
        onLayoutReady: (callback: () => void) => { mocks.layoutReady = callback; },
        on: () => { mocks.workspaceEvents += 1; return {}; },
        iterateAllLeaves: () => undefined,
        getActiveViewOfType: () => null,
        getLeavesOfType: () => []
      }
    };
    vi.stubGlobal("MutationObserver", class {
      constructor(callback: MutationCallback) { mocks.mutationCallbacks.push(callback); }
      disconnect(): void {}
      observe(_target: Node, options: MutationObserverInit): void { mocks.observerOptions = options; }
    });
    const ResizeObserverMock = class {
      constructor(callback: ResizeObserverCallback) {
        mocks.observerCount += 1;
        mocks.resizeCallback = callback;
      }
      disconnect(): void {}
      observe(element: Element): void { mocks.observedElements.push(element); }
      unobserve(): void {}
    };
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    const cancelAnimationFrame = (): void => undefined;
    const requestAnimationFrame = (callback: FrameRequestCallback): number => {
      mocks.animationCallback = callback;
      return 1;
    };
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    vi.stubGlobal("window", {
      cancelAnimationFrame,
      requestAnimationFrame,
      ResizeObserver: ResizeObserverMock
    });
  });

  it("does not restart after unloading before layout ready", () => {
    const PluginUnderTest = KamiReaderCompanion as unknown as new () => KamiReaderCompanion;
    const plugin = new PluginUnderTest();
    plugin.onload();
    expect(mocks.commandIds).toEqual([
      "toggle-reading-stage",
      "toggle-focus-mode",
      "toggle-white-page-preview"
    ]);
    plugin.onunload();
    mocks.layoutReady?.();

    expect(mocks.observerCount).toBe(0);
    expect(mocks.workspaceEvents).toBe(0);
  });

  it("reschedules for media loads and intrinsic-size attributes", () => {
    const added: string[] = [];
    const removed: string[] = [];
    const preview = {
      addEventListener: (name: string) => added.push(name),
      removeEventListener: (name: string) => removed.push(name)
    } as unknown as HTMLElement;
    const adaptive = new AdaptiveContent(() => undefined);

    adaptive.configure(new Set([preview]));
    expect(added).toEqual(["load"]);
    expect(mocks.observerOptions).toMatchObject({
      attributes: true,
      attributeFilter: ["src", "srcset", "width", "height", "viewBox"]
    });

    adaptive.destroy();
    expect(removed).toEqual(["load"]);
  });

  it("scrolls Outline without scanning Markdown panes, but sizes only the changed pane", () => {
    vi.spyOn(ReadingPresence.prototype, "configure").mockImplementation(() => undefined);
    vi.spyOn(PaperPreview.prototype, "configure").mockImplementation(() => undefined);
    const refresh = vi.spyOn(AdaptiveContent.prototype, "refresh").mockImplementation(() => undefined);
    const outlineRefresh = vi.spyOn(OutlineSync.prototype, "refresh");
    const listeners = new Map<string, EventListener>();
    const ownerDocument = { defaultView: window, querySelectorAll: () => [] } as unknown as Document;
    const preview = {
      ownerDocument,
      isConnected: true,
      scrollTop: 0,
      addEventListener: (name: string, callback: EventListener) => listeners.set(name, callback),
      removeEventListener: (name: string) => listeners.delete(name),
      querySelector: () => null,
      closest: () => preview
    } as unknown as HTMLElement;
    const reference = { ...preview, addEventListener: () => undefined, removeEventListener: () => undefined } as unknown as HTMLElement;
    const makeView = (element: HTMLElement) => Object.assign(new MarkdownView(null as never), {
      file: { path: "long-note.md" },
      getMode: () => "preview",
      containerEl: { ownerDocument, querySelector: () => element }
    });
    const view = makeView(preview);
    const workspace = (mocks.app as { workspace: Record<string, unknown> }).workspace;
    workspace.getActiveViewOfType = () => view;
    const leaves = vi.fn(() => [{ view }, { view: makeView(reference) }]);
    workspace.getLeavesOfType = leaves;
    const PluginUnderTest = KamiReaderCompanion as unknown as new () => KamiReaderCompanion;
    const plugin = new PluginUnderTest();
    plugin.onload();
    mocks.layoutReady?.();
    mocks.animationCallback?.(0);
    refresh.mockClear();
    outlineRefresh.mockClear();
    leaves.mockClear();

    for (let index = 0; index < 3; index += 1) {
      listeners.get("scroll")?.({} as Event);
      mocks.animationCallback?.(index);
    }
    expect(refresh).not.toHaveBeenCalled();
    expect(outlineRefresh).toHaveBeenCalledTimes(3);
    expect(leaves).not.toHaveBeenCalled();

    mocks.resizeCallback?.([{ target: preview }] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
    mocks.animationCallback?.(4);
    expect(refresh).toHaveBeenCalledExactlyOnceWith(preview);
    expect(leaves).not.toHaveBeenCalled();
    plugin.onunload();
    expect(listeners.has("scroll")).toBe(false);
  });

  it("invalidates only the preview containing new content or loaded media", () => {
    const schedule = vi.fn();
    const mediaHandlers: EventListener[] = [];
    const child = {} as Node;
    const first = {
      contains: (node: Node) => node === child,
      addEventListener: (_name: string, handler: EventListener) => mediaHandlers.push(handler),
      removeEventListener: () => undefined
    } as unknown as HTMLElement;
    const second = { ...first, contains: () => false } as unknown as HTMLElement;
    const adaptive = new AdaptiveContent(schedule);
    adaptive.configure(new Set([first, second]));
    mocks.mutationCallbacks.at(-1)?.([{ target: child }] as MutationRecord[], {} as MutationObserver);
    expect(schedule).toHaveBeenCalledExactlyOnceWith(first);
    schedule.mockClear();
    mediaHandlers[1]({ currentTarget: second } as unknown as Event);
    expect(schedule).toHaveBeenCalledExactlyOnceWith(second);
    adaptive.destroy();
  });

  it("cancels deferred postprocessing when unloaded", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const adaptive = new AdaptiveContent(() => undefined);
    const element = { ownerDocument: { defaultView: window } } as HTMLElement;
    adaptive.process(element, { getSectionInfo: () => ({}) } as never);
    adaptive.destroy();
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it("leaves native status-bar geometry untouched", () => {
    const values = new Map<string, string>();
    const root = {} as HTMLElement;
    const body = {
      style: {
        getPropertyValue: (name: string) => values.get(name) ?? "",
        setProperty: (name: string, value: string) => values.set(name, value),
        removeProperty: (name: string) => values.delete(name)
      }
    } as unknown as HTMLElement;
    const ownerDocument = {
      body,
      querySelector: () => root,
      defaultView: window
    } as unknown as Document;
    Object.defineProperty(root, "ownerDocument", { value: ownerDocument });
    vi.stubGlobal("document", ownerDocument);

    const PluginUnderTest = KamiReaderCompanion as unknown as new () => KamiReaderCompanion;
    const plugin = new PluginUnderTest();
    plugin.onload();
    mocks.layoutReady?.();
    mocks.animationCallback?.(0);

    expect(values.size).toBe(0);
    expect(mocks.observedElements).not.toContain(root);
    expect(mocks.resizeCallback).toBeNull();

    plugin.onunload();
  });
});
