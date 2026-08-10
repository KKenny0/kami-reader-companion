import type { MarkdownPostProcessorContext } from "obsidian";
import { classifyOverflow, computeFrameWidth, isOverflowing, type ContentKind } from "./contracts";

const KNOWN = ".mermaid, table, pre, svg, img, canvas, iframe, .internal-embed";

export class AdaptiveContent {
  private destroyed = false;
  private decorated = new Set<HTMLElement>();
  private observed = new Set<HTMLElement>();
  private observer = new MutationObserver((records) =>
    this.schedule(records[0]?.target.ownerDocument?.defaultView ?? undefined)
  );

  constructor(private schedule: (ownerWindow?: NonNullable<Document["defaultView"]>) => void) {}

  configure(previews: ReadonlySet<HTMLElement>): void {
    if (previews.size === this.observed.size && [...previews].every((preview) => this.observed.has(preview))) return;
    this.observer.disconnect();
    this.observed.forEach((preview) => preview.removeEventListener("load", this.onLoad, true));
    this.observed = new Set(previews);
    previews.forEach((preview) => {
      preview.addEventListener("load", this.onLoad, true);
      this.observer.observe(preview, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "srcset", "width", "height", "viewBox"]
      });
    });
  }

  process(element: HTMLElement, context: MarkdownPostProcessorContext): void {
    if (!context.getSectionInfo(element)) return;
    const ownerWindow = element.ownerDocument.defaultView ?? window;
    ownerWindow.requestAnimationFrame(() => { if (!this.destroyed) this.decorate(element); });
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
      let outer = candidate;
      while (outer.parentElement && outer.parentElement !== section) outer = outer.parentElement;
      if (!Array.from(candidates).some((existing) => existing.contains(outer))) candidates.add(outer);
    });
    const HTMLElementCtor = section.ownerDocument.defaultView?.HTMLElement;
    Array.from(section.children).forEach((child) => {
      if (HTMLElementCtor && child.instanceOf(HTMLElementCtor)) candidates.add(child);
    });

    candidates.forEach((candidate) => {
      const kind = this.kind(candidate);
      this.clear(candidate);
      if (candidate.clientWidth === 0) return;
      const article = candidate.parentElement?.clientWidth ?? candidate.clientWidth;
      const pane = candidate.closest<HTMLElement>(".markdown-preview-view")?.clientWidth ?? article;
      const natural = kind === "visual" ? this.visualWidth(candidate) : this.contentWidth(candidate);
      if (!isOverflowing(natural, candidate.clientWidth)) return;
      candidate.classList.add("kami-content-frame");
      this.decorated.add(candidate);
      candidate.dataset.kamiContentKind = kind;
      candidate.style.setProperty(
        "--kami-content-frame-width",
        `${Math.round(computeFrameWidth(article, pane, natural))}px`
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

  private onLoad = (event: Event): void =>
    this.schedule((event.currentTarget as HTMLElement | null)?.ownerDocument.defaultView ?? undefined);
}
