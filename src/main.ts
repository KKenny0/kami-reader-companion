import { MarkdownView, Plugin } from "obsidian";
import { AdaptiveContent } from "./adaptive-content";
import { OutlineSync } from "./outline-sync";
import { ReadingPresence } from "./reading-presence";

type OwnerWindow = NonNullable<Document["defaultView"]>;

export default class KamiReaderCompanion extends Plugin {
  private frames = new Map<OwnerWindow, number>();
  private resizeObservers = new Map<OwnerWindow, ResizeObserver>();
  private observedPreviews = new Set<HTMLElement>();
  private outline!: OutlineSync;
  private adaptive!: AdaptiveContent;
  private presence!: ReadingPresence;
  private ready = false;
  private disposed = false;

  onload(): void {
    this.disposed = false;
    this.outline = new OutlineSync(this.app, this.schedule);
    this.adaptive = new AdaptiveContent(this.schedule);
    this.presence = new ReadingPresence();
    this.addCommand({
      id: "toggle-reading-stage",
      name: "Toggle reading stage",
      checkCallback: (checking) => {
        if (!this.presence.canToggleStage()) return false;
        if (!checking) this.presence.toggleStage();
        return true;
      }
    });
    this.addCommand({
      id: "toggle-focus-mode",
      name: "Toggle focus mode",
      checkCallback: (checking) => {
        if (!this.presence.canToggleFocus()) return false;
        if (!checking) this.presence.toggleFocus();
        return true;
      }
    });
    this.registerMarkdownPostProcessor((element, context) => {
      this.outline.process(element, context);
      this.adaptive.process(element, context);
    });
    this.app.workspace.onLayoutReady(() => {
      if (this.disposed) return;
      this.ready = true;
      this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.schedule()));
      this.registerEvent(this.app.workspace.on("file-open", () => this.schedule()));
      this.registerEvent(this.app.workspace.on("layout-change", () => this.schedule()));
      this.schedule();
    });
  }

  onunload(): void {
    this.disposed = true;
    this.ready = false;
    this.presence.destroy();
    this.outline.destroy();
    this.adaptive.destroy();
    this.frames.forEach((frame, ownerWindow) => ownerWindow.cancelAnimationFrame(frame));
    this.frames.clear();
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeObservers.clear();
  }

  private schedule = (ownerWindow: OwnerWindow = window): void => {
    if (!this.ready) return;
    const pending = this.frames.get(ownerWindow);
    if (pending !== undefined) ownerWindow.cancelAnimationFrame(pending);
    const frame = ownerWindow.requestAnimationFrame(() => {
      this.frames.delete(ownerWindow);
      if (!this.ready) return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      this.presence.configure(view);
      this.outline.configure(view);
      const previews = new Set(this.app.workspace.getLeavesOfType("markdown")
        .map((leaf) => leaf.view)
        .filter((candidate): candidate is MarkdownView => candidate instanceof MarkdownView)
        .filter((candidate) => candidate.getMode() === "preview")
        .map((candidate) => candidate.containerEl.querySelector<HTMLElement>(".markdown-preview-view"))
        .filter((preview): preview is HTMLElement => preview !== null));
      this.observedPreviews.forEach((preview) => {
        if (!previews.has(preview)) this.unobserve(preview);
      });
      previews.forEach((preview) => {
        if (!this.observedPreviews.has(preview)) this.observe(preview);
      });
      this.observedPreviews = previews;
      const activeWindows = new Set([...previews]
        .map((preview) => preview.ownerDocument.defaultView)
        .filter((candidate): candidate is OwnerWindow => candidate !== null));
      this.resizeObservers.forEach((observer, observedWindow) => {
        if (activeWindows.has(observedWindow)) return;
        observer.disconnect();
        this.resizeObservers.delete(observedWindow);
      });
      this.adaptive.configure(previews);
      previews.forEach((preview) => this.adaptive.refresh(preview));
      this.outline.refresh();
    });
    this.frames.set(ownerWindow, frame);
  };

  private observe(element: HTMLElement): void {
    const ownerWindow = element.ownerDocument.defaultView;
    if (!ownerWindow) return;
    let observer = this.resizeObservers.get(ownerWindow);
    if (!observer) {
      observer = new ownerWindow.ResizeObserver(() => this.schedule(ownerWindow));
      this.resizeObservers.set(ownerWindow, observer);
    }
    observer.observe(element);
  }

  private unobserve(element: HTMLElement): void {
    const ownerWindow = element.ownerDocument.defaultView;
    if (ownerWindow) this.resizeObservers.get(ownerWindow)?.unobserve(element);
  }
}
