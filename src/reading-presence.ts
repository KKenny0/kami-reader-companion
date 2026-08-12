import type { MarkdownView } from "obsidian";

const BODY_CLASS = "kami-reading-presence";
const STAGE_CLASS = "kami-reading-stage";
const STAGE_OPEN_CLASS = "kami-reading-stage-open";
const STAGE_ACTIVE_CLASS = "kami-reading-stage-active";
const FOCUS_OPEN_CLASS = "kami-focus-open";
const FOCUS_ACTIVE_CLASS = "kami-focus-active";
const FOCUS_BLOCK_CLASS = "kami-focus-block";
const FOCUS_CURRENT_CLASS = "kami-focus-current";
const FOCUS_NEAR_CLASS = "kami-focus-near";
const FOCUS_TABSTOP_ATTRIBUTE = "data-kami-focus-tabstop";
const READING_FOCUS_BLOCK_SELECTOR = ".markdown-preview-section > div:not(.mod-ui):not(.markdown-preview-pusher)";
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
  private focusOpen = false;
  private focusBlock: HTMLElement | null = null;
  private focusBlocks = new Set<HTMLElement>();
  private focusMarked = new Set<HTMLElement>();

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
      if (this.focusOpen) this.ensureReadingFocusBlock(false);
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

  canToggleFocus(): boolean {
    return this.target !== null;
  }

  toggleFocus(): boolean {
    if (!this.target) return false;
    const opening = !this.focusOpen;
    this.focusOpen = opening;
    this.target.body.classList.toggle(FOCUS_OPEN_CLASS, opening);
    this.target.stage.classList.toggle(FOCUS_ACTIVE_CLASS, opening);
    if (opening) this.ensureReadingFocusBlock(true);
    else this.clearReadingFocusBlock();
    this.updateModeLabel();
    return opening;
  }

  exitStage(): void {
    this.target?.body.classList.remove(STAGE_OPEN_CLASS);
    this.target?.stage.classList.remove(STAGE_ACTIVE_CLASS);
    this.clearStageShift();
  }

  exitFocus(): void {
    this.focusOpen = false;
    this.clearReadingFocusBlock();
    this.target?.body.classList.remove(FOCUS_OPEN_CLASS);
    this.target?.stage.classList.remove(FOCUS_ACTIVE_CLASS);
    this.updateModeLabel();
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
    if (event.defaultPrevented) return;
    const view = this.keyDocument?.defaultView;
    if (view?.Element && event.target instanceof view.Element && event.target.closest(ESCAPE_OWNER_SELECTOR)) return;
    if (event.key === "Escape") {
      if (this.target?.body.classList.contains(STAGE_OPEN_CLASS)) {
        this.exitStage();
        return;
      }
      this.exitFocus();
      return;
    }
    if (!this.focusOpen || this.target?.mode !== "preview" || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!view?.Element || !(event.target instanceof view.Element)) return;
    const blocks = this.readingFocusBlocks();
    const origin = event.target.closest(READING_FOCUS_BLOCK_SELECTOR);
    if (event.target !== origin || !origin.instanceOf(view.HTMLElement) || origin.closest(".markdown-embed") || !blocks.includes(origin)) return;
    event.preventDefault();
    this.moveReadingFocus(event.key === "ArrowDown" ? 1 : -1, origin, blocks);
  };

  private readingFocusBlocks(): HTMLElement[] {
    return this.target?.mode === "preview"
      ? Array.from(this.target.stage.querySelectorAll<HTMLElement>(READING_FOCUS_BLOCK_SELECTOR))
          .filter((block) => !block.closest(".markdown-embed"))
      : [];
  }

  private ensureReadingFocusBlock(moveFocus: boolean): void {
    if (this.target?.mode !== "preview") return;
    const blocks = this.readingFocusBlocks();
    this.syncReadingFocusBlocks(blocks);
    if (this.focusBlock?.isConnected && blocks.includes(this.focusBlock)) {
      this.setReadingFocusBlock(this.focusBlock, false, blocks);
      return;
    }
    const keyDocument = this.keyDocument;
    const restoreFocus = this.focusBlock !== null &&
      !this.focusBlock.isConnected &&
      keyDocument?.activeElement === keyDocument?.body;
    const viewport = this.target.stage.querySelector<HTMLElement>(".markdown-preview-view")?.getBoundingClientRect();
    const visible = viewport && blocks.find((block) => {
      const rect = block.getBoundingClientRect();
      return rect.bottom > viewport.top && rect.top < viewport.bottom;
    });
    const initial = visible || blocks[0];
    if (initial) this.setReadingFocusBlock(initial, moveFocus || restoreFocus, blocks);
  }

  private moveReadingFocus(offset: -1 | 1, origin: HTMLElement, blocks: HTMLElement[]): void {
    if (!blocks.length) return;
    const current = Math.max(0, blocks.indexOf(origin));
    const next = Math.max(0, Math.min(blocks.length - 1, current + offset));
    this.setReadingFocusBlock(blocks[next], true, blocks);
  }

  private setReadingFocusBlock(block: HTMLElement, moveFocus: boolean, blocks: HTMLElement[]): void {
    const current = blocks.indexOf(block);
    const marked = new Set(blocks.filter((_candidate, index) => Math.abs(index - current) <= 1));
    new Set([...this.focusMarked, ...marked]).forEach((candidate) => {
      const index = blocks.indexOf(candidate);
      candidate.classList.toggle(FOCUS_CURRENT_CLASS, index === current);
      candidate.classList.toggle(FOCUS_NEAR_CLASS, Math.abs(index - current) === 1);
    });
    this.focusMarked = marked;
    this.clearOwnedTabstop();
    if (!block.hasAttribute("tabindex")) {
      block.setAttribute("tabindex", "0");
      block.setAttribute(FOCUS_TABSTOP_ATTRIBUTE, "");
    }
    this.focusBlock = block;
    if (moveFocus) {
      block.focus({ preventScroll: true });
      block.scrollIntoView({ block: "nearest" });
    }
  }

  private syncReadingFocusBlocks(blocks: HTMLElement[]): void {
    const next = new Set(blocks);
    this.focusBlocks.forEach((block) => {
      if (!next.has(block)) block.classList.remove(FOCUS_BLOCK_CLASS);
    });
    next.forEach((block) => block.classList.add(FOCUS_BLOCK_CLASS));
    this.focusBlocks = next;
  }

  private clearOwnedTabstop(): void {
    if (this.focusBlock?.hasAttribute(FOCUS_TABSTOP_ATTRIBUTE)) {
      this.focusBlock.removeAttribute("tabindex");
      this.focusBlock.removeAttribute(FOCUS_TABSTOP_ATTRIBUTE);
    }
  }

  private clearReadingFocusBlock(): void {
    this.focusBlocks.forEach((block) => block.classList.remove(FOCUS_BLOCK_CLASS));
    this.focusBlocks.clear();
    this.focusMarked.forEach((block) => block.classList.remove(FOCUS_CURRENT_CLASS, FOCUS_NEAR_CLASS));
    this.focusMarked.clear();
    this.clearOwnedTabstop();
    this.focusBlock = null;
  }

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
    if (!this.target) return;
    this.decorateMode(view, mode);
    if (mode !== "preview") {
      this.clearReadingDecorations();
      return;
    }
    const preview = view.containerEl.querySelector<HTMLElement>(".markdown-preview-view");
    if ((preview?.scrollTop ?? 0) > 32) return;
    const mtime = view.file?.stat?.mtime;
    const date = typeof mtime === "number" && Number.isFinite(mtime)
      ? new Date(mtime).toISOString().slice(0, 10).replaceAll("-", ".")
      : "";
    const metaText = ["READING NOTE", date].filter(Boolean).join("   ");
    const title = view.containerEl.querySelector<HTMLElement>(".inline-title");
    const heading = view.containerEl.querySelector<HTMLElement>(".markdown-preview-section > .el-h1 > h1");
    const deck = view.containerEl.querySelector<HTMLElement>(".markdown-preview-section > .el-p > p");
    if (!title) {
      this.clearReadingDecorations();
      return;
    }
    const currentMeta = this.target.meta;
    const contextTitle = heading !== null;
    const sameNodes = this.target.title === title &&
      this.target.deck === deck &&
      title.classList.contains("kami-folio-inline-title-context") === contextTitle &&
      currentMeta?.isConnected;
    if (sameNodes && currentMeta) {
      if (currentMeta.textContent !== metaText) currentMeta.textContent = metaText;
      return;
    }
    this.clearReadingDecorations();
    title.classList.add(contextTitle ? "kami-folio-inline-title-context" : "kami-folio-inline-title");
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
    const base = mode === "preview" ? "READING" : "EDITING";
    const text = this.target.body.classList.contains(FOCUS_OPEN_CLASS) ? `${base} · FOCUS` : base;
    if (label.textContent !== text) label.textContent = text;
  }

  private updateModeLabel(): void {
    if (!this.target?.modeLabel) return;
    const base = this.target.mode === "preview" ? "READING" : "EDITING";
    this.target.modeLabel.textContent = this.target.body.classList.contains(FOCUS_OPEN_CLASS)
      ? `${base} · FOCUS`
      : base;
  }

  private clearDecorations(): void {
    this.target?.modeLabel?.remove();
    if (this.target) this.target.modeLabel = null;
    this.clearReadingDecorations();
  }

  private clearReadingDecorations(): void {
    if (!this.target) return;
    this.target.title?.classList.remove("kami-folio-inline-title", "kami-folio-inline-title-context");
    this.target.deck?.classList.remove("kami-folio-deck");
    this.target.meta?.remove();
    this.target.title = null;
    this.target.deck = null;
    this.target.meta = null;
  }

  private clear(): void {
    this.exitStage();
    this.exitFocus();
    this.clearDecorations();
    this.keyDocument?.removeEventListener("keydown", this.onKeyDown);
    this.keyDocument = null;
    this.target?.body.classList.remove(BODY_CLASS);
    this.target?.stage.classList.remove(STAGE_CLASS);
    this.target = null;
  }
}
