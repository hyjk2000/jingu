import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "forkbomb",
  description: "Fork bomb",
  severity: "critical",
};

const evaluate: PolicyEvaluate = (cmd) =>
  /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/.test(
      cmd.raw.replace(/\s+/g, " "),
    )
    ? deny("Refusing a fork bomb.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: ":(){ :|:& };:", expect: "deny" },
  { command: "echo hi", expect: "defer" },
];
