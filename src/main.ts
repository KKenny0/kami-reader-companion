import { MarkdownView, Plugin } from "obsidian";
import { AdaptiveContent } from "./adaptive-content";
import { OutlineSync } from "./outline-sync";
import { ReadingPresence } from "./reading-presence";

export default class KamiReaderCompanion extends Plugin {
  private frame = 0;
  private resizeObserver?: ResizeObserver;
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
    this.register(() => window.cancelAnimationFrame(this.frame));
    this.app.workspace.onLayoutReady(() => {
      if (this.disposed) return;
      this.ready = true;
      this.registerEvent(this.app.workspace.on("active-leaf-change", this.schedule));
      this.registerEvent(this.app.workspace.on("file-open", this.schedule));
      this.registerEvent(this.app.workspace.on("layout-change", this.schedule));
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.register(() => this.resizeObserver?.disconnect());
      this.schedule();
    });
  }

  onunload(): void {
    this.disposed = true;
    this.ready = false;
    this.presence.destroy();
    this.outline.destroy();
    this.adaptive.destroy();
  }

  private schedule = (): void => {
    if (!this.ready) return;
    window.cancelAnimationFrame(this.frame);
    this.frame = window.requestAnimationFrame(() => {
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
        if (!previews.has(preview)) this.resizeObserver?.unobserve(preview);
      });
      previews.forEach((preview) => {
        if (!this.observedPreviews.has(preview)) this.resizeObserver?.observe(preview);
      });
      this.observedPreviews = previews;
      this.adaptive.configure(previews);
      previews.forEach((preview) => this.adaptive.refresh(preview));
      this.outline.refresh();
    });
  };
}
