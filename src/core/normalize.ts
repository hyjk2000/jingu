import type { Node } from "web-tree-sitter";
import type { Arg, Flag, ParsedCommand, SimpleCommand, Statement } from "./model.ts";

const WRAPPERS = new Set([
  "command",
  "builtin",
  "env",
  "nice",
  "nohup",
  "time",
  "exec",
  "xargs",
  "sudo",
  "doas",
  "pkexec",
]);

/** Fold a node's literal text, dropping quotes/escapes. Returns null if not statically literal. */
function literalText(n: Node): string | null {
  switch (n.type) {
    case "command_name": {
      // the `name` field wraps the actual word/expansion
      const child = n.namedChild(0);
      return child ? literalText(child) : null;
    }
    case "word":
    case "number":
      return n.text.replace(/\\(.)/g, "$1");
    case "raw_string":
      return n.text.slice(1, -1);
    case "string": {
      // double-quoted: literal only if it has no expansion/substitution children
      const dynamic = n.namedChildren.some((c) => c && c.type !== "string_content");
      return dynamic ? null : n.text.slice(1, -1);
    }
    case "concatenation": {
      let out = "";
      for (const c of n.namedChildren) {
        if (!c) return null;
        const t = literalText(c);
        if (t === null) return null;
        out += t;
      }
      return out;
    }
    default:
      return null;
  }
}

function declusterFlag(raw: string): Flag[] {
  if (/^-[A-Za-z]+$/.test(raw)) {
    return Array.from(raw.slice(1), (ch) => ({ canonical: "-" + ch, raw }));
  }
  const eq = raw.indexOf("=");
  if (raw.startsWith("--") && eq > 0) {
    return [{ canonical: raw.slice(0, eq), raw, value: raw.slice(eq + 1) }];
  }
  return [{ canonical: raw, raw }];
}

function expandBraces(value: string): string[] {
  // Literal brace expansion only. We deliberately keep `~` / `$HOME` as source text
  // so they match the `~` / `$HOME` entries in protectedPaths.
  const brace = value.match(/^(.*)\{([^{}]+)\}(.*)$/);
  if (brace) {
    return brace[2]!.split(",").map((part) => brace[1]! + part + brace[3]!);
  }
  return [value];
}

function buildCommand(node: Node): SimpleCommand {
  const prefixes: string[] = [];
  const flags: Flag[] = [];
  const argv: Arg[] = [];
  let nameRaw: string | null = null;
  let name: string | null = null;
  let opaque = false;

  const nameNode = node.childForFieldName("name");
  const argNodes = node.childrenForFieldName("argument");
  const all = [nameNode, ...argNodes].filter((n): n is Node => !!n);

  let sawName = false;
  for (const n of all) {
    const lit = literalText(n);
    if (!sawName) {
      if (lit === null) {
        opaque = true;
        nameRaw = n.text;
        sawName = true;
        continue;
      }
      const base = lit.replace(/.*\//, "");
      if (WRAPPERS.has(base)) {
        prefixes.push(base);
        continue;
      } // unwrap and keep scanning for the real verb
      name = base;
      nameRaw = lit;
      sawName = true;
      continue;
    }
    if (lit !== null && lit.startsWith("-")) {
      flags.push(...declusterFlag(lit));
      continue;
    }
    if (lit === null) {
      // dynamic; keep simple variable refs ($HOME) as source text so protected-var matches work
      const isExpansion = n.type === "simple_expansion" ||
        n.namedChild(0)?.type === "simple_expansion";
      argv.push({
        value: isExpansion ? n.text : null,
        isLiteral: false,
        isGlob: false,
        raw: n.text,
      });
      continue;
    }
    for (const v of expandBraces(lit)) {
      argv.push({
        value: v,
        isLiteral: true,
        isGlob: /[*?[]/.test(v),
        raw: n.text,
      });
    }
  }

  // redirects: walk the command's own redirect field plus an enclosing redirected_statement
  const redirects: import("./model.ts").Redirect[] = [];
  const addRedirect = (rn: Node) => {
    if (rn.type !== "file_redirect" && rn.type !== "heredoc_redirect") return;
    const opText = rn.text.match(/^\s*(>>|>&|>|<)/)?.[1] ?? ">";
    const dest = rn.childForFieldName("destination");
    const op = rn.type === "heredoc_redirect" ? "heredoc" : (opText as ">" | ">>" | "<" | ">&");
    const lit = dest ? literalText(dest) : null;
    redirects.push({ op, target: lit, targetLiteral: lit !== null });
  };
  for (const r of node.childrenForFieldName("redirect")) if (r) addRedirect(r);
  const parent = node.parent;
  if (parent?.type === "redirected_statement") {
    for (const r of parent.childrenForFieldName("redirect")) {
      if (r) addRedirect(r);
    }
  }

  return {
    name,
    nameRaw,
    argv,
    flags,
    redirects,
    prefixes,
    kind: "executed",
    opaque,
    span: { start: node.startIndex, end: node.endIndex },
  };
}

function collectCommands(node: Node, out: SimpleCommand[]): void {
  if (
    node.type === "command_substitution" || node.type === "process_substitution"
  ) return; // opaque; not executed commands
  if (node.type === "command") {
    out.push(buildCommand(node));
    return;
  }
  for (const c of node.namedChildren) if (c) collectCommands(c, out);
}

function operatorAfter(node: Node): Statement["operatorAfter"] {
  // tree-sitter nests `list` left-recursively, so the operator that follows a
  // statement can be a sibling of an enclosing `list`, not of the node itself.
  let n: Node | null = node;
  while (n) {
    const next = n.nextSibling;
    if (next) {
      if (next.type === "&&") return "&&";
      if (next.type === "||") return "||";
      if (next.type === "&") return "&";
      if (next.type === ";") return ";";
      return null;
    }
    const parent: Node | null = n.parent;
    n = parent && parent.type === "list" ? parent : null;
  }
  return null;
}

export function normalize(raw: string, root: Node): ParsedCommand {
  const statements: Statement[] = [];
  const visit = (node: Node): void => {
    if (
      node.type === "command_substitution" ||
      node.type === "process_substitution"
    ) return; // contents are opaque (Task 6)
    if (node.type === "pipeline" || node.type === "command") {
      const pipeline: SimpleCommand[] = [];
      collectCommands(node, pipeline);
      statements.push({ pipeline, operatorAfter: operatorAfter(node) });
      return;
    }
    for (const c of node.namedChildren) if (c) visit(c);
  };
  visit(root);
  const commands = statements.flatMap((s) => s.pipeline);
  return {
    raw,
    statements,
    commands,
    analyzable: true,
    opacities: [],
    parseError: false,
  };
}
