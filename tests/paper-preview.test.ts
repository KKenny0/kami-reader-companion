import { describe, expect, it } from "vitest";
import type { MarkdownView } from "obsidian";
import { PaperPreview, WHITE_PAGE_PREVIEW_CLASS } from "../src/paper-preview";

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

type Fixture = {
  container: HTMLElement;
  path: { value: string };
  mode: { value: "preview" | "source" };
  view: MarkdownView;
};

function fixture(
  pathValue = "note.md",
  modeValue: "preview" | "source" = "preview",
  mobile = false
): Fixture {
  const bodyClasses = new FakeClassList();
  if (mobile) bodyClasses.add("is-mobile");
  const ownerDocument = {
    body: { classList: bodyClasses },
    defaultView: {}
  } as unknown as Document;
  const container = {
    classList: new FakeClassList(),
    ownerDocument
  } as unknown as HTMLElement;
  const path = { value: pathValue };
  const mode = { value: modeValue };
  const view = {
    containerEl: container,
    file: { get path() { return path.value; } },
    getMode: () => mode.value
  } as unknown as MarkdownView;
  return { container, path, mode, view };
}

describe("white page preview", () => {
  it("toggles only the eligible active Markdown target", () => {
    const preview = new PaperPreview();
    const current = fixture();

    expect(preview.canToggle()).toBe(false);
    preview.configure(current.view);
    expect(preview.canToggle()).toBe(true);
    expect(preview.toggle()).toBe(true);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(true);
    expect(preview.toggle()).toBe(false);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
  });

  it("keeps same-target state but clears on file, mode, leaf, and window changes", () => {
    const preview = new PaperPreview();
    const current = fixture();
    preview.configure(current.view);
    preview.toggle();

    preview.configure(current.view);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(true);

    current.path.value = "other.md";
    preview.configure(current.view);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
    preview.toggle();

    current.mode.value = "source";
    preview.configure(current.view);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
    preview.toggle();

    const otherWindow = fixture("other.md", "source");
    preview.configure(otherWindow.view);
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
    expect(otherWindow.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);

    preview.toggle();
    preview.configure(null);
    expect(otherWindow.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
  });

  it("rejects mobile targets and removes transient state on unload", () => {
    const preview = new PaperPreview();
    preview.configure(fixture("mobile.md", "preview", true).view);
    expect(preview.canToggle()).toBe(false);

    const current = fixture();
    preview.configure(current.view);
    preview.toggle();
    preview.destroy();
    expect(current.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS)).toBe(false);
    expect(preview.canToggle()).toBe(false);
  });
});
