import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  app: null as unknown,
  layoutReady: null as (() => void) | null,
  observerCount: 0,
  observerOptions: null as MutationObserverInit | null,
  workspaceEvents: 0,
  commandId: ""
}));

vi.mock("obsidian", () => ({
  MarkdownView: class MarkdownView {},
  Plugin: class Plugin {
    app = mocks.app;
    register(): void {}
    registerEvent(): void {}
    registerMarkdownPostProcessor(): void {}
    addCommand(command: { id: string }): void { mocks.commandId = command.id; }
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
    mocks.commandId = "";
    mocks.app = {
      metadataCache: { getCache: () => null },
      workspace: {
        onLayoutReady: (callback: () => void) => { mocks.layoutReady = callback; },
        on: () => { mocks.workspaceEvents += 1; return {}; },
        getActiveViewOfType: () => null,
        getLeavesOfType: () => []
      }
    };
    vi.stubGlobal("MutationObserver", class {
      disconnect(): void {}
      observe(_target: Node, options: MutationObserverInit): void { mocks.observerOptions = options; }
    });
    vi.stubGlobal("ResizeObserver", class {
      constructor() { mocks.observerCount += 1; }
      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    vi.stubGlobal("requestAnimationFrame", () => 1);
  });

  it("does not restart after unloading before layout ready", () => {
    const PluginUnderTest = KamiReaderCompanion as unknown as new () => KamiReaderCompanion;
    const plugin = new PluginUnderTest();
    plugin.onload();
    expect(mocks.commandId).toBe("toggle-reading-stage");
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
});
