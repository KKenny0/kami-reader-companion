import type { App, HeadingCache, MarkdownPostProcessorContext, MarkdownView } from "obsidian";
import {
  matchSectionHeadings,
  selectActiveLine,
  matchOutlineRows,
  type HeadingRef,
  type PositionedHeading
} from "./contracts";

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
const ROW_SELECTOR = ".tree-item-self";
const OUTLINE_SELECTOR = '.workspace-leaf-content[data-type="outline"] .view-content';

export class OutlineSync {
  private preview: HTMLElement | null = null;
  private outlines: HTMLElement[] = [];
  private observer: MutationObserver | null = null;
  private filePath: string | null = null;
  private currentLine?: number;
  private lastScrollTop = 0;
  private warned = false;
  private markedHeadings = new Set<HTMLElement>();

  constructor(private app: App, private schedule: (ownerWindow?: NonNullable<Document["defaultView"]>) => void) {}

  process(element: HTMLElement, context: MarkdownPostProcessorContext): void {
    const section = context.getSectionInfo(element);
    if (!section) return;
    const cached = this.cachedHeadings(context.sourcePath);
    const nodes = Array.from(element.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
      .filter((heading) => !heading.closest(".markdown-embed"));
    const lines = matchSectionHeadings(cached, nodes.map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent ?? "",
      lineStart: section.lineStart,
      lineEnd: section.lineEnd
    })));
    nodes.forEach((heading, index) => {
      const line = lines[index];
      if (line === null) {
        heading.removeAttribute("data-kami-heading-line");
        this.markedHeadings.delete(heading);
      } else {
        heading.dataset.kamiHeadingLine = String(line);
        this.markedHeadings.add(heading);
      }
    });
    this.schedule(element.ownerDocument.defaultView ?? undefined);
  }

  configure(view: MarkdownView | null): void {
    const preview = view?.getMode() === "preview"
      ? view.containerEl.querySelector<HTMLElement>(".markdown-preview-view")
      : null;
    const filePath = preview ? view?.file?.path ?? null : null;
    const identityChanged = preview !== this.preview || filePath !== this.filePath;
    if (identityChanged) {
      this.preview?.removeEventListener("scroll", this.onScroll);
      this.clearOutlines();
      this.preview = preview;
      this.filePath = filePath;
      this.currentLine = undefined;
      this.lastScrollTop = preview?.scrollTop ?? 0;
      preview?.addEventListener("scroll", this.onScroll, { passive: true });
    }

    const ownerDocument = preview?.ownerDocument ?? null;
    const outlines = ownerDocument
      ? Array.from(ownerDocument.querySelectorAll<HTMLElement>(OUTLINE_SELECTOR))
      : [];
    if (!this.sameOutlines(outlines)) {
      this.observer?.disconnect();
      this.clearOutlines();
      this.outlines = outlines;
      if (outlines.length > 0) {
        this.observer = new MutationObserver(() =>
          this.schedule(ownerDocument?.defaultView ?? undefined)
        );
        outlines.forEach((outline) => this.observer?.observe(outline, { childList: true, subtree: true }));
      }
    }
  }

  refresh(): void {
    if (!this.preview || !this.filePath || this.outlines.length === 0) return;
    [...this.markedHeadings].filter((heading) => !heading.isConnected)
      .forEach((heading) => this.markedHeadings.delete(heading));
    const cached = this.cachedHeadings(this.filePath);
    const valid: Array<{ outline: HTMLElement; rows: HTMLElement[]; lines: number[] }> = [];
    this.outlines.forEach((outline) => {
      const rows = Array.from(outline.querySelectorAll<HTMLElement>(ROW_SELECTOR));
      const lines = matchOutlineRows(cached, rows.map((row) => ({
        text: row.querySelector<HTMLElement>(".tree-item-inner")?.textContent ?? row.textContent ?? ""
      })));
      if (!lines) {
        this.failClosed(outline, "Kami Reader Companion: Outline changed; using Obsidian's native highlight.");
        return;
      }
      rows.forEach((row, index) => { row.dataset.kamiHeadingLine = String(lines[index]); });
      outline.classList.add("kami-companion-outline-active");
      valid.push({ outline, rows, lines });
    });
    if (valid.length === 0) return;
    if (valid.length === this.outlines.length) this.warned = false;

    const anchor = this.preview.getBoundingClientRect().top + 96;
    const positioned = Array.from(this.preview.querySelectorAll<HTMLElement>("[data-kami-heading-line]"))
      .filter((heading) => heading.isConnected)
      .map((heading): PositionedHeading => ({
        line: Number(heading.dataset.kamiHeadingLine),
        top: heading.getBoundingClientRect().top
      }))
      .sort((a, b) => a.line - b.line);
    const direction = this.preview.scrollTop >= this.lastScrollTop ? "down" : "up";
    this.lastScrollTop = this.preview.scrollTop;
    const line = selectActiveLine(positioned, anchor, direction, this.currentLine);
    if (line === null) {
      valid.forEach(({ outline }) => this.clearOutline(outline));
      return;
    }
    this.currentLine = line;
    valid.forEach(({ outline, rows }) => {
      rows.forEach((row) => {
        const current = Number(row.dataset.kamiHeadingLine) === line;
        row.classList.toggle("kami-outline-current", current);
        if (current) {
          row.setAttribute("aria-current", "location");
        } else {
          row.removeAttribute("aria-current");
        }
      });
    });
  }

  destroy(): void {
    this.preview?.removeEventListener("scroll", this.onScroll);
    this.observer?.disconnect();
    this.clearOutlines();
    this.markedHeadings.forEach((heading) => heading.removeAttribute("data-kami-heading-line"));
    this.markedHeadings.clear();
    this.preview = null;
  }

  private onScroll = (): void =>
    this.schedule(this.preview?.ownerDocument.defaultView ?? undefined);

  private cachedHeadings(path: string): HeadingRef[] {
    const headings: HeadingCache[] = this.app.metadataCache.getCache(path)?.headings ?? [];
    return headings.map((heading) => ({
      line: heading.position.start.line,
      level: heading.level,
      text: heading.heading
    }));
  }

  private failClosed(outline: HTMLElement, message: string): void {
    this.clearOutline(outline);
    if (!this.warned) {
      console.warn(message);
      this.warned = true;
    }
  }

  private sameOutlines(outlines: HTMLElement[]): boolean {
    return outlines.length === this.outlines.length && outlines.every((outline, index) => outline === this.outlines[index]);
  }

  private clearOutlines(): void {
    this.outlines.forEach((outline) => this.clearOutline(outline));
  }

  private clearOutline(outline: HTMLElement): void {
    outline.classList.remove("kami-companion-outline-active");
    outline.querySelectorAll<HTMLElement>(ROW_SELECTOR).forEach((row) => {
      row.classList.remove("kami-outline-current");
      row.removeAttribute("aria-current");
      row.removeAttribute("data-kami-heading-line");
    });
  }
}
