import { MarkdownView, Menu, Plugin, View } from "obsidian";
import { AdaptiveContent } from "./adaptive-content";
import { OutlineSync } from "./outline-sync";
import { PaperPreview } from "./paper-preview";
import { ReadingPresence } from "./reading-presence";

type OwnerWindow = NonNullable<Document["defaultView"]>;

export default class KamiReaderCompanion extends Plugin {
  private frames = new Map<OwnerWindow, number>();
  private outlineFrames = new Map<OwnerWindow, number>();
  private contentFrames = new Map<HTMLElement, number>();
  private observedSizers = new Map<HTMLElement, HTMLElement>();
  private resizeObservers = new Map<OwnerWindow, ResizeObserver>();
  private observedPreviews = new Set<HTMLElement>();
  private outline!: OutlineSync;
  private adaptive!: AdaptiveContent;
  private presence!: ReadingPresence;
  private paperPreview!: PaperPreview;
  private modeControls: HTMLElement | null = null;
  private ready = false;
  private disposed = false;

  onload(): void {
    this.disposed = false;
    this.outline = new OutlineSync(this.app, this.scheduleOutline);
    this.adaptive = new AdaptiveContent(this.scheduleContent);
    this.presence = new ReadingPresence(this.updateModeControls);
    this.paperPreview = new PaperPreview();
    const escape = this.app.scope.register([], "Escape", (event) => {
      if (this.presence.handleEscape(event)) return false;
    });
    this.register(() => this.app.scope.unregister(escape));
    this.addCommand({
      id: "toggle-reading-stage",
      name: "Toggle reading stage",
      checkCallback: (checking) => {
        this.configureModes();
        if (!this.presence.canToggleStage()) return false;
        if (!checking) this.presence.toggleStage();
        return true;
      }
    });
    this.addCommand({
      id: "toggle-focus-mode",
      name: "Toggle focus mode",
      checkCallback: (checking) => {
        this.configureModes();
        if (!this.presence.canToggleFocus()) return false;
        if (!checking) this.presence.toggleFocus();
        return true;
      }
    });
    this.addCommand({
      id: "toggle-white-page-preview",
      name: "Toggle white page preview",
      checkCallback: (checking) => {
        this.configureModes();
        if (!this.paperPreview.canToggle()) return false;
        if (!checking) {
          this.paperPreview.toggle();
          this.updateModeControls();
        }
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
      this.registerEvent(this.app.workspace.on("file-menu", (menu, file, _source, leaf) => {
        if (!(leaf?.view instanceof MarkdownView) || leaf.view.file?.path !== file.path) return;
        this.addModeMenu(menu, leaf.view);
      }));
      this.schedule();
    });
  }

  onunload(): void {
    this.disposed = true;
    this.ready = false;
    this.modeControls?.remove();
    this.modeControls = null;
    this.presence.destroy();
    this.paperPreview.destroy();
    this.outline.destroy();
    this.adaptive.destroy();
    this.frames.forEach((frame, ownerWindow) => ownerWindow.cancelAnimationFrame(frame));
    this.frames.clear();
    this.outlineFrames.forEach((frame, ownerWindow) => ownerWindow.cancelAnimationFrame(frame));
    this.outlineFrames.clear();
    this.contentFrames.forEach((frame, preview) => preview.ownerDocument.defaultView?.cancelAnimationFrame(frame));
    this.contentFrames.clear();
    this.observedPreviews.clear();
    this.observedSizers.clear();
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeObservers.clear();
  }

  private configureModes(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    this.presence.configure(view, this.app.workspace.getActiveViewOfType(View)?.containerEl.ownerDocument);
    this.paperPreview.configure(view);
    this.updateModeControls();
  }

  private addModeMenu(menu: Menu, view: MarkdownView): void {
    this.configureModes();
    const filePath = view.file?.path;
    const mode = view.getMode();
    const eligible = !!filePath && !view.containerEl.ownerDocument.body.classList.contains("is-mobile") &&
      (mode === "preview" || mode === "source");
    const items = [
      { title: "Reading Stage", checked: this.presence.isStageOpen(view), enabled: eligible && mode === "preview", toggle: () => this.presence.toggleStage() },
      { title: "Focus Mode", checked: this.presence.isFocusOpen(view.containerEl.ownerDocument), enabled: eligible, toggle: () => this.presence.toggleFocus() },
      { title: "White page preview", checked: this.paperPreview.isActive(view), enabled: eligible, toggle: () => this.paperPreview.toggle() }
    ];
    for (const item of items) {
      menu.addItem((entry) => entry.setSection("kami-modes").setTitle(item.title)
        .setChecked(item.checked).setDisabled(!item.enabled).onClick(() => {
          if (this.disposed || view.file?.path !== filePath || !view.containerEl.isConnected) return;
          this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
          this.configureModes();
          if (this.app.workspace.getActiveViewOfType(MarkdownView) !== view) return;
          if (item.title === "Reading Stage" && !this.presence.canToggleStage()) return;
          item.toggle();
          this.updateModeControls();
        }));
    }
  }

  private updateModeControls = (): void => {
    if (this.disposed) return;
    const view = this.app.workspace.getActiveViewOfType(View);
    const header = view?.containerEl.querySelector<HTMLElement>(".view-header");
    const states = [
      { label: "Stage", active: this.presence.isStageOpen(), exit: () => this.presence.exitStage() },
      { label: view instanceof MarkdownView ? "Focus" : "Focus paused", active: this.presence.isFocusOpen(view?.containerEl.ownerDocument), exit: () => this.presence.exitFocus() },
      { label: "Paper", active: this.paperPreview?.isActive(), exit: () => this.paperPreview.exit() }
    ].filter((state) => state.active);
    if (!header || !view?.containerEl.isConnected || !states.length) {
      this.modeControls?.remove();
      this.modeControls = null;
      return;
    }
    if (this.modeControls?.parentElement !== header) {
      this.modeControls?.remove();
      this.modeControls = header.createDiv({ cls: "kami-mode-controls", attr: { role: "group", "aria-label": "Active reading modes" } });
    }
    const controls = this.modeControls;
    const signature = states.map((state) => state.label).join(",");
    if (controls.dataset.modes === signature) return;
    controls.dataset.modes = signature;
    controls.replaceChildren();
    for (const state of states) {
      const button = controls.createEl("button", {
        text: `${state.label} ×`,
        attr: { type: "button", "aria-label": `Exit ${state.label}`, title: `Exit ${state.label}` }
      });
      button.addEventListener("focus", () => {
        const viewport = controls.getBoundingClientRect();
        const rect = button.getBoundingClientRect();
        if (rect.left < viewport.left) controls.scrollLeft += rect.left - viewport.left;
        else if (rect.right > viewport.left + controls.clientWidth) {
          controls.scrollLeft += rect.right - viewport.left - controls.clientWidth;
        }
      });
      button.addEventListener("click", () => {
        state.exit();
        this.updateModeControls();
      });
    }
  };

  private schedule = (ownerWindow: OwnerWindow = window): void => {
    if (!this.ready) return;
    const pending = this.frames.get(ownerWindow);
    if (pending !== undefined) ownerWindow.cancelAnimationFrame(pending);
    const frame = ownerWindow.requestAnimationFrame(() => {
      this.frames.delete(ownerWindow);
      if (!this.ready) return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      this.configureModes();
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
      this.outlineFrames.forEach((frame, observedWindow) => {
        if (activeWindows.has(observedWindow)) return;
        observedWindow.cancelAnimationFrame(frame);
        this.outlineFrames.delete(observedWindow);
      });
      this.adaptive.configure(previews);
      previews.forEach((preview) => {
        const pending = this.contentFrames.get(preview);
        if (pending !== undefined) preview.ownerDocument.defaultView?.cancelAnimationFrame(pending);
        this.contentFrames.delete(preview);
        this.observeSizer(preview);
        this.adaptive.refresh(preview);
      });
      this.outline.refresh();
    });
    this.frames.set(ownerWindow, frame);
  };

  private scheduleOutline = (ownerWindow: OwnerWindow = window): void => {
    if (!this.ready || this.outlineFrames.has(ownerWindow)) return;
    const frame = ownerWindow.requestAnimationFrame(() => {
      this.outlineFrames.delete(ownerWindow);
      if (this.ready) this.outline.refresh();
    });
    this.outlineFrames.set(ownerWindow, frame);
  };

  private scheduleContent = (preview: HTMLElement): void => {
    const ownerWindow = preview.ownerDocument.defaultView;
    if (!this.ready || !ownerWindow || this.contentFrames.has(preview)) return;
    const frame = ownerWindow.requestAnimationFrame(() => {
      this.contentFrames.delete(preview);
      if (!this.ready || !preview.isConnected || !this.observedPreviews.has(preview)) return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view?.containerEl.querySelector(".markdown-preview-view") === preview) {
        this.presence.configure(view, preview.ownerDocument);
      }
      this.observeSizer(preview);
      this.adaptive.refresh(preview);
      this.scheduleOutline(ownerWindow);
    });
    this.contentFrames.set(preview, frame);
  };

  private observeSizer(preview: HTMLElement): void {
    const observer = this.resizeObservers.get(preview.ownerDocument.defaultView!);
    const previous = this.observedSizers.get(preview);
    const sizer = preview.querySelector<HTMLElement>(".markdown-preview-sizer");
    if (previous === sizer) return;
    if (previous) observer?.unobserve(previous);
    this.observedSizers.delete(preview);
    if (sizer) {
      observer?.observe(sizer);
      this.observedSizers.set(preview, sizer);
    }
  }

  private observe(element: HTMLElement): void {
    const ownerWindow = element.ownerDocument.defaultView;
    if (!ownerWindow) return;
    let observer = this.resizeObservers.get(ownerWindow);
    if (!observer) {
      observer = new ownerWindow.ResizeObserver((entries) => {
        entries.forEach(({ target }) => {
          const preview = target.closest<HTMLElement>(".markdown-preview-view");
          if (preview) this.scheduleContent(preview);
        });
      });
      this.resizeObservers.set(ownerWindow, observer);
    }
    observer.observe(element);
  }

  private unobserve(element: HTMLElement): void {
    const ownerWindow = element.ownerDocument.defaultView;
    if (ownerWindow) {
      const observer = this.resizeObservers.get(ownerWindow);
      observer?.unobserve(element);
      const sizer = this.observedSizers.get(element);
      if (sizer) observer?.unobserve(sizer);
      const frame = this.contentFrames.get(element);
      if (frame !== undefined) ownerWindow.cancelAnimationFrame(frame);
    }
    this.observedSizers.delete(element);
    this.contentFrames.delete(element);
  }
}
