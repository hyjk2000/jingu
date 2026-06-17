import { parse } from "./parse.ts";
import { normalize } from "./normalize.ts";
import { detectOpacities } from "./opacity.ts";
import type { ParsedCommand } from "./model.ts";

export async function analyze(command: string): Promise<ParsedCommand> {
  const tree = await parse(command);
  if (!tree) {
    return {
      raw: command,
      statements: [],
      commands: [],
      analyzable: false,
      parseError: true,
      opacities: [{
        kind: "parse-error",
        span: { start: 0, end: command.length },
      }],
    };
  }
  const pc = normalize(command, tree.rootNode);
  pc.opacities = detectOpacities(tree.rootNode);
  pc.parseError = tree.rootNode.hasError;
  // mark commands whose name is opaque, and compute analyzability
  for (const c of pc.commands) if (c.name === null) c.opaque = true;
  pc.analyzable = !pc.parseError && pc.opacities.length === 0;
  return pc;
}
