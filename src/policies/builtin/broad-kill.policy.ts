import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "broad-kill",
  description: "Broad process kill",
  severity: "medium",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) => {
  const hit = cmd.commands.some((c) => {
    if (p.is(c, "kill") && p.hasToken(c, "-1")) return true;
    if (
      p.is(c, "killall") && c.flags.some((f) => f.canonical === "-9") &&
      c.argv.length === 0
    ) {
      return true;
    }
    return false;
  });
  return hit ? deny("Refusing a broad process kill.") : null;
};
export default evaluate;

export const examples: PolicyExamples = [
  { command: "kill -9 -1", expect: "deny" },
  { command: "killall -9", expect: "deny" },
  { command: "kill -9 1234", expect: "defer" },
];
