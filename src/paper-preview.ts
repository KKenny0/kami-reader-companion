import type { MarkdownView } from "obsidian";

export const WHITE_PAGE_PREVIEW_CLASS = "kami-white-page-preview-active";

type PaperPreviewTarget = {
  container: HTMLElement;
  filePath: string;
  mode: "preview" | "source";
  ownerWindow: Window;
};

export class PaperPreview {
  private target: PaperPreviewTarget | null = null;

  configure(view: MarkdownView | null): void {
    const mode = view?.getMode();
    const container = view?.containerEl ?? null;
    const ownerWindow = container?.ownerDocument.defaultView ?? null;
    const next = view?.file && container && ownerWindow &&
      !container.ownerDocument.body.classList.contains("is-mobile") &&
      (mode === "preview" || mode === "source")
      ? { container, filePath: view.file.path, mode, ownerWindow }
      : null;

    if (next && this.sameTarget(next)) return;
    this.clear();
    this.target = next;
  }

  canToggle(): boolean {
    return this.target !== null;
  }

  toggle(): boolean {
    if (!this.target) return false;
    const active = !this.target.container.classList.contains(WHITE_PAGE_PREVIEW_CLASS);
    this.target.container.classList.toggle(WHITE_PAGE_PREVIEW_CLASS, active);
    return active;
  }

  destroy(): void {
    this.clear();
  }

  private sameTarget(next: PaperPreviewTarget): boolean {
    return this.target !== null &&
      this.target.container === next.container &&
      this.target.filePath === next.filePath &&
      this.target.mode === next.mode &&
      this.target.ownerWindow === next.ownerWindow;
  }

  private clear(): void {
    this.target?.container.classList.remove(WHITE_PAGE_PREVIEW_CLASS);
    this.target = null;
  }
}
