import type { Node } from "web-tree-sitter";
import type { Opacity } from "./model.ts";

const EVAL_NAMES = new Set(["eval"]);

export function detectOpacities(root: Node): Opacity[] {
  const out: Opacity[] = [];
  const push = (kind: Opacity["kind"], n: Node) =>
    out.push({ kind, span: { start: n.startIndex, end: n.endIndex } });

  const cursor = root.walk();
  const visit = (): void => {
    do {
      const n = cursor.currentNode;
      if (n.isError || n.isMissing) push("parse-error", n);

      if (n.type === "command") {
        const nameNode = n.childForFieldName("name");
        if (nameNode) {
          const inner = nameNode.namedChild(0);
          if (inner?.type === "command_substitution") {
            push("command-substitution", inner);
          } else if (inner?.type === "simple_expansion") {
            push("dynamic-command-name", inner);
          } else if (inner?.type === "expansion") {
            if (inner.text.startsWith("${!")) push("indirect-expansion", inner);
            else push("dynamic-command-name", inner);
          } else if (/[\u0080-\uFFFF]/.test(nameNode.text)) {
            push("non-ascii-verb", nameNode);
          }
          if (nameNode.text && EVAL_NAMES.has(nameNode.text)) push("eval", n);
        }
        for (const arg of n.childrenForFieldName("argument")) {
          if (arg?.namedChild(0)?.type === "command_substitution") {
            push("command-substitution", arg);
          }
        }
      }
      if (cursor.gotoFirstChild()) {
        visit();
        cursor.gotoParent();
      }
    } while (cursor.gotoNextSibling());
  };
  if (root.hasError) push("parse-error", root);
  if (cursor.gotoFirstChild()) visit();
  return out;
}
