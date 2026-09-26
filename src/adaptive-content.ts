import type { MarkdownPostProcessorContext } from "obsidian";
import { classifyOverflow, computeFrameWidth, isOverflowing, type ContentKind } from "./contracts";

const KNOWN = ".mermaid, table, pre, svg, img, canvas, iframe, .internal-embed";

export class AdaptiveContent {
  private destroyed = false;
  private decorated = new Set<HTMLElement>();
  private observed = new Set<HTMLElement>();
  private frames = new Map<HTMLElement, number>();
  private observer = new MutationObserver((records) => {
    this.observed.forEach((preview) => {
      if (records.some((record) => preview.contains(record.target))) this.schedule(preview);
    });
  });

  constructor(private schedule: (preview: HTMLElement) => void) {}

  configure(previews: ReadonlySet<HTMLElement>): void {
    if (previews.size === this.observed.size && [...previews].every((preview) => this.observed.has(preview))) return;
    this.frames.forEach((frame, element) => {
      if (element.isConnected && [...previews].some((preview) => preview.contains(element))) return;
      (element.ownerDocument.defaultView ?? window).cancelAnimationFrame(frame);
      this.frames.delete(element);
    });
    this.observer.disconnect();
    this.observed.forEach((preview) => preview.removeEventListener("load", this.onLoad, true));
    this.observed = new Set(previews);
    previews.forEach((preview) => {
      preview.addEventListener("load", this.onLoad, true);
      this.observer.observe(preview, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "srcset", "width", "height", "viewBox"]
      });
    });
  }

  process(element: HTMLElement, context: MarkdownPostProcessorContext): void {
    if (!context.getSectionInfo(element)) return;
    const ownerWindow = element.ownerDocument.defaultView ?? window;
    const previous = this.frames.get(element);
    if (previous !== undefined) ownerWindow.cancelAnimationFrame(previous);
    const frame = ownerWindow.requestAnimationFrame(() => {
      this.frames.delete(element);
      if (!this.destroyed) this.decorate(element);
    });
    this.frames.set(element, frame);
  }

  refresh(preview: HTMLElement | null): void {
    if (!preview) return;
    [...this.decorated].filter((element) => !element.isConnected).forEach(this.clear);
    preview.querySelectorAll<HTMLElement>(".markdown-preview-section").forEach((section) =>
      this.decorate(section)
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.frames.forEach((frame, element) => (element.ownerDocument.defaultView ?? window).cancelAnimationFrame(frame));
    this.frames.clear();
    this.observer.disconnect();
    this.observed.forEach((preview) => preview.removeEventListener("load", this.onLoad, true));
    [...this.decorated].forEach(this.clear);
    this.observed.clear();
  }

  private decorate(section: HTMLElement): void {
    if (!section.isConnected) return;
    const candidates = new Set<HTMLElement>();
    if (section.matches(`${KNOWN}, .kami-content-frame`)) candidates.add(section);
    section.querySelectorAll<HTMLElement>(".kami-content-frame").forEach((candidate) => candidates.add(candidate));
    section.querySelectorAll<HTMLElement>(KNOWN).forEach((candidate) => {
      // Expand top-level blocks only. A nested table/diagram must not turn its
      // entire list or callout into a wide, horizontally scrolling article.
      const nested = candidate.closest("li, .callout-content");
      let outer = candidate.closest<HTMLElement>(".mermaid, .internal-embed") ?? candidate;
      if (!nested || !section.contains(nested)) {
        while (outer.parentElement && outer.parentElement !== section) outer = outer.parentElement;
      }
      if (!Array.from(candidates).some((existing) => existing.contains(outer))) candidates.add(outer);
    });
    const HTMLElementCtor = section.ownerDocument.defaultView?.HTMLElement;
    Array.from(section.children).forEach((child) => {
      if (HTMLElementCtor && child.instanceOf(HTMLElementCtor) &&
        !child.matches("ul, ol, .callout") && !child.querySelector("li, .callout-content")) candidates.add(child);
    });

    candidates.forEach((candidate) => {
      const kind = this.kind(candidate);
      this.clear(candidate);
      if (candidate.clientWidth === 0) return;
      const article = candidate.parentElement?.clientWidth ?? candidate.clientWidth;
      const preview = candidate.closest<HTMLElement>(".markdown-preview-view");
      const topLevel = candidate.parentElement?.matches(".markdown-preview-sizer, .markdown-preview-section");
      const pane = topLevel ? preview?.clientWidth ?? article : article;
      const natural = kind === "visual" ? this.visualWidth(candidate) : this.contentWidth(candidate);
      if (!isOverflowing(natural, Math.min(candidate.clientWidth, article))) return;
      candidate.classList.add("kami-content-frame");
      this.decorated.add(candidate);
      candidate.dataset.kamiContentKind = kind;
      candidate.style.setProperty(
        "--kami-content-frame-width",
        `${Math.round(topLevel ? computeFrameWidth(article, pane, natural) : article)}px`
      );
    });
  }

  private kind(element: HTMLElement): ContentKind {
    const known = element.matches(KNOWN) ? element : element.querySelector<HTMLElement>(KNOWN);
    return classifyOverflow(known?.tagName ?? element.tagName, known?.className ?? element.className);
  }

  private visualWidth(element: HTMLElement): number {
    const svg = element.matches("svg") ? element as unknown as SVGSVGElement : element.querySelector("svg");
    if (svg?.viewBox.baseVal.width) return svg.viewBox.baseVal.width;
    const image = element.matches("img") ? element : element.querySelector("img");
    if (image && "naturalWidth" in image && typeof image.naturalWidth === "number" && image.naturalWidth) {
      return image.naturalWidth;
    }
    const canvas = element.matches("canvas") ? element : element.querySelector("canvas");
    return canvas && "width" in canvas && typeof canvas.width === "number" ? canvas.width || element.scrollWidth : element.scrollWidth;
  }

  private contentWidth(element: HTMLElement): number {
    return Math.max(
      element.scrollWidth,
      ...Array.from(element.querySelectorAll<HTMLElement>("table, pre, iframe, .internal-embed"))
        .map((child) => Math.max(child.scrollWidth, child.clientWidth))
    );
  }

  private clear = (element: HTMLElement): void => {
    this.decorated.delete(element);
    element.classList.remove("kami-content-frame");
    element.removeAttribute("data-kami-content-kind");
    element.style.removeProperty("--kami-content-frame-width");
  };

  private onLoad = (event: Event): void => {
    const preview = event.currentTarget as HTMLElement | null;
    if (preview) this.schedule(preview);
  };
}
