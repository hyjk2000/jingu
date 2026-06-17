import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { ask } from "#policy";

export const meta: PolicyMeta = {
  id: "opaque",
  description: "Un-analyzable construct; defer to the user",
  severity: "medium",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  p.hasOpacity(
      cmd,
      "eval",
      "command-substitution",
      "dynamic-command-name",
      "indirect-expansion",
      "non-ascii-verb",
    )
    ? ask("Command contains a construct that cannot be statically verified.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: 'eval "$CMD"', expect: "ask" },
  { command: "$(printf rm) -rf /", expect: "ask" },
  { command: "$X -rf /", expect: "ask" },
  { command: "rm -rf /tmp/x", expect: "defer" },
];
