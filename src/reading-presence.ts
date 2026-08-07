import type { MarkdownView } from "obsidian";

const BODY_CLASS = "kami-reading-presence";
const STAGE_CLASS = "kami-reading-stage";
const STAGE_OPEN_CLASS = "kami-reading-stage-open";
const STAGE_ACTIVE_CLASS = "kami-reading-stage-active";
const STAGE_SHIFT_X = "--kami-reading-stage-shift-x";
const STAGE_SHIFT_Y = "--kami-reading-stage-shift-y";
const ESCAPE_OWNER_SELECTOR = ".modal-container, .menu, .prompt, .suggestion-container, .popover";

type ReadingTarget = {
  body: HTMLElement;
  stage: HTMLElement;
  filePath: string;
  mode: "preview" | "source";
  modeLabel: HTMLElement | null;
  title: HTMLElement | null;
  deck: HTMLElement | null;
  meta: HTMLElement | null;
};

export class ReadingPresence {
  private target: ReadingTarget | null = null;
  private keyDocument: Document | null = null;

  configure(view: MarkdownView | null): void {
    const body = view?.containerEl.ownerDocument.body ?? null;
    const mode = view?.getMode();
    const next = view?.file && body && !body.classList.contains("is-mobile") && (mode === "preview" || mode === "source")
      ? {
          body,
          stage: view.containerEl,
          filePath: view.file.path,
          mode,
          modeLabel: null,
          title: null,
          deck: null,
          meta: null
        }
      : null;
    if (next && this.sameTarget(next)) {
      if (view) this.decorate(view, next.mode);
      this.alignStage();
      return;
    }
    this.clear();
    if (!next) return;
    next.body.classList.add(BODY_CLASS);
    next.stage.classList.add(STAGE_CLASS);
    next.body.ownerDocument.addEventListener("keydown", this.onKeyDown);
    this.keyDocument = next.body.ownerDocument;
    this.target = next;
    if (view) this.decorate(view, next.mode);
  }

  canToggleStage(): boolean {
    return this.target?.mode === "preview";
  }

  toggleStage(): boolean {
    if (!this.target || this.target.mode !== "preview") return false;
    const opening = !this.target.body.classList.contains(STAGE_OPEN_CLASS);
    this.target.body.classList.toggle(STAGE_OPEN_CLASS, opening);
    this.target.stage.classList.toggle(STAGE_ACTIVE_CLASS, opening);
    if (opening) this.alignStage();
    else this.clearStageShift();
    return opening;
  }

  exitStage(): void {
    this.target?.body.classList.remove(STAGE_OPEN_CLASS);
    this.target?.stage.classList.remove(STAGE_ACTIVE_CLASS);
    this.clearStageShift();
  }

  destroy(): void {
    this.clear();
  }

  private sameTarget(next: ReadingTarget): boolean {
    return this.target !== null &&
      this.target.body === next.body &&
      this.target.stage === next.stage &&
      this.target.filePath === next.filePath &&
      this.target.mode === next.mode;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const view = this.keyDocument?.defaultView;
    if (view?.Element && event.target instanceof view.Element && event.target.closest(ESCAPE_OWNER_SELECTOR)) return;
    this.exitStage();
  };

  private alignStage(): void {
    if (!this.target?.body.classList.contains(STAGE_OPEN_CLASS)) return;
    const rect = this.target.stage.getBoundingClientRect();
    const currentX = Number.parseFloat(this.target.stage.style.getPropertyValue(STAGE_SHIFT_X)) || 0;
    const currentY = Number.parseFloat(this.target.stage.style.getPropertyValue(STAGE_SHIFT_Y)) || 0;
    this.target.stage.style.setProperty(STAGE_SHIFT_X, `${currentX - rect.left}px`);
    this.target.stage.style.setProperty(STAGE_SHIFT_Y, `${currentY - rect.top}px`);
  }

  private clearStageShift(): void {
    this.target?.stage.style.removeProperty(STAGE_SHIFT_X);
    this.target?.stage.style.removeProperty(STAGE_SHIFT_Y);
  }

  private decorate(view: MarkdownView, mode: "preview" | "source"): void {
    if (!this.target || typeof view.containerEl.querySelector !== "function") return;
    this.decorateMode(view, mode);
    if (mode !== "preview") {
      this.clearReadingDecorations();
      return;
    }
    const mtime = view.file?.stat?.mtime;
    const date = typeof mtime === "number" && Number.isFinite(mtime)
      ? new Date(mtime).toISOString().slice(0, 10).replaceAll("-", ".")
      : "";
    const metaText = ["READING NOTE", date].filter(Boolean).join("   ");
    const title = view.containerEl.querySelector<HTMLElement>(".inline-title");
    const deck = view.containerEl.querySelector<HTMLElement>(".markdown-preview-sizer p");
    if (!title) {
      this.clearReadingDecorations();
      return;
    }
    const currentMeta = this.target.meta;
    const sameNodes = this.target.title === title && this.target.deck === deck && currentMeta?.isConnected;
    if (sameNodes && currentMeta) {
      if (currentMeta.textContent !== metaText) currentMeta.textContent = metaText;
      return;
    }
    this.clearReadingDecorations();
    title.classList.add("kami-folio-inline-title");
    if (deck) deck.classList.add("kami-folio-deck");
    const meta = title.ownerDocument.createElement("div");
    meta.classList.add("kami-folio-meta");
    meta.textContent = metaText;
    if (deck) deck.after(meta);
    else title.after(meta);
    this.target.title = title;
    this.target.deck = deck;
    this.target.meta = meta;
  }

  private decorateMode(view: MarkdownView, mode: "preview" | "source"): void {
    if (!this.target) return;
    const header = view.containerEl.querySelector<HTMLElement>(".view-header");
    if (!header) {
      this.target.modeLabel?.remove();
      this.target.modeLabel = null;
      return;
    }
    let label = this.target.modeLabel;
    if (!label?.isConnected) {
      label?.remove();
      label = header.ownerDocument.createElement("span");
      label.classList.add("kami-folio-mode-label");
      label.setAttribute("aria-hidden", "true");
      const actions = header.querySelector<HTMLElement>(".view-actions");
      if (actions) actions.before(label);
      else header.append(label);
      this.target.modeLabel = label;
    }
    const text = mode === "preview" ? "READING" : "EDITING";
    if (label.textContent !== text) label.textContent = text;
  }

  private clearDecorations(): void {
    this.target?.modeLabel?.remove();
    if (this.target) this.target.modeLabel = null;
    this.clearReadingDecorations();
  }

  private clearReadingDecorations(): void {
    if (!this.target) return;
    this.target.title?.classList.remove("kami-folio-inline-title");
    this.target.deck?.classList.remove("kami-folio-deck");
    this.target.meta?.remove();
    this.target.title = null;
    this.target.deck = null;
    this.target.meta = null;
  }

  private clear(): void {
    this.exitStage();
    this.clearDecorations();
    this.keyDocument?.removeEventListener("keydown", this.onKeyDown);
    this.keyDocument = null;
    this.target?.body.classList.remove(BODY_CLASS);
    this.target?.stage.classList.remove(STAGE_CLASS);
    this.target = null;
  }
}
