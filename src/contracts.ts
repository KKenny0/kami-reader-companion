export type HeadingRef = { line: number; level: number; text: string };
export type RenderedHeading = { level: number; text: string; lineStart: number; lineEnd: number };
export type OutlineRowRef = { text: string };
export type PositionedHeading = { line: number; top: number };
export type ContentKind = "visual" | "table" | "code" | "embed" | "unknown";

export const normalizeHeading = (text: string): string => text.trim().replace(/\s+/g, " ");

export function matchSectionHeadings(
  cached: readonly HeadingRef[],
  rendered: readonly RenderedHeading[]
): Array<number | null> {
  const used = new Set<number>();
  return rendered.map((heading) => {
    const index = cached.findIndex((candidate, candidateIndex) =>
      !used.has(candidateIndex) &&
      candidate.line >= heading.lineStart &&
      candidate.line <= heading.lineEnd &&
      candidate.level === heading.level &&
      normalizeHeading(candidate.text) === normalizeHeading(heading.text)
    );
    if (index < 0) return null;
    used.add(index);
    return cached[index].line;
  });
}

export function matchOutlineRows(
  cached: readonly HeadingRef[],
  rows: readonly OutlineRowRef[]
): number[] | null {
  const matches = (heading: HeadingRef, row: OutlineRowRef): boolean =>
    normalizeHeading(heading.text) === normalizeHeading(row.text);
  const forward: number[] = [];
  let cursor = 0;
  for (const row of rows) {
    while (cursor < cached.length && !matches(cached[cursor], row)) cursor += 1;
    if (cursor >= cached.length) return null;
    forward.push(cursor);
    cursor += 1;
  }
  const backward: number[] = [];
  cursor = cached.length - 1;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    while (cursor >= 0 && !matches(cached[cursor], rows[index])) cursor -= 1;
    if (cursor < 0) return null;
    backward[index] = cursor;
    cursor -= 1;
  }
  return forward.every((cachedIndex, index) => cachedIndex === backward[index])
    ? forward.map((index) => cached[index].line)
    : null;
}

export function selectActiveLine(
  headings: readonly PositionedHeading[],
  anchor: number,
  direction: "up" | "down",
  currentLine?: number,
  clickedLine?: number
): number | null {
  if (clickedLine !== undefined) return clickedLine;
  if (headings.length === 0) return currentLine ?? null;
  let candidateIndex = -1;
  for (let index = 0; index < headings.length; index += 1) {
    if (headings[index].top > anchor) break;
    candidateIndex = index;
  }
  if (candidateIndex < 0) return currentLine ?? headings[0].line;
  if (currentLine === undefined) return headings[candidateIndex].line;
  const currentIndex = headings.findIndex((heading) => heading.line === currentLine);
  if (currentIndex < 0) return headings[candidateIndex].line;
  if (direction === "down" && candidateIndex < currentIndex) return currentLine;
  if (direction === "up" && candidateIndex > currentIndex) return currentLine;
  return headings[candidateIndex].line;
}

export function classifyOverflow(tag: string, classes = ""): ContentKind {
  const value = `${tag} ${classes}`.toLowerCase();
  if (/\b(mermaid|svg|img|canvas)\b/.test(value)) return "visual";
  if (/\btable\b/.test(value)) return "table";
  if (/\b(pre|code)\b/.test(value)) return "code";
  if (/\b(iframe|internal-embed|markdown-embed)\b/.test(value)) return "embed";
  return "unknown";
}

export function computeFrameWidth(articleWidth: number, paneWidth: number, naturalWidth: number): number {
  const available = Math.max(0, Math.min(1100, paneWidth - 48));
  if (available - articleWidth < 120) return articleWidth;
  return Math.max(articleWidth, Math.min(naturalWidth, available));
}

export const isOverflowing = (naturalWidth: number, inlineWidth: number): boolean =>
  naturalWidth > inlineWidth + 2;

export const shouldRevealOutlineRow = (
  previousLine: number | undefined,
  nextLine: number,
  interacting: boolean,
  clicked: boolean
): boolean => previousLine !== nextLine && !interacting && !clicked;
