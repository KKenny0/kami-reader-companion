import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  app: null as unknown,
  layoutReady: null as (() => void) | null,
  observerCount: 0,
  observerOptions: null as MutationObserverInit | null,
  workspaceEvents: 0,
  commandIds: [] as string[],
  animationCallback: null as FrameRequestCallback | null,
  resizeCallback: null as ResizeObserverCallback | null,
  observedElements: [] as Element[]
}));

vi.mock("obsidian", () => ({
  MarkdownView: class MarkdownView {},
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

describe("plugin lifecycle", () => {
  beforeEach(() => {
    mocks.layoutReady = null;
    mocks.observerCount = 0;
    mocks.observerOptions = null;
    mocks.workspaceEvents = 0;
    mocks.commandIds = [];
    mocks.animationCallback = null;
    mocks.resizeCallback = null;
    mocks.observedElements = [];
    mocks.app = {
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
