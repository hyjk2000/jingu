import type { Node } from "web-tree-sitter";
import type { Span } from "./model.ts";

export type SpanKind =
  | "executed"
  | "data"
  | "comment"
  | "inline-code"
  | "heredoc-body";
export interface ClassifiedSpan {
  span: Span;
  kind: SpanKind;
}

const DATA_TYPES = new Set([
  "raw_string",
  "string",
  "ansi_c_string",
  "translated_string",
  "string_content",
]);
const HEREDOC_TYPES = new Set(["heredoc_body", "heredoc_content"]);

export function classify(root: Node): ClassifiedSpan[] {
  const spans: ClassifiedSpan[] = [];
  const cursor = root.walk();
  const visit = (): void => {
    do {
      const n = cursor.currentNode;
      let kind: SpanKind | null = null;
      if (n.type === "comment") kind = "comment";
      else if (DATA_TYPES.has(n.type)) kind = "data";
      else if (HEREDOC_TYPES.has(n.type)) kind = "heredoc-body";
      if (kind) {
        spans.push({ span: { start: n.startIndex, end: n.endIndex }, kind });
      }
      if (cursor.gotoFirstChild()) {
        visit();
        cursor.gotoParent();
      }
    } while (cursor.gotoNextSibling());
  };
  if (cursor.gotoFirstChild()) visit();
  return spans;
}

/** True if a byte index falls inside any non-executed span. */
export function isShadowed(spans: ClassifiedSpan[], index: number): boolean {
  return spans.some((s) => s.kind !== "executed" && index >= s.span.start && index < s.span.end);
}
