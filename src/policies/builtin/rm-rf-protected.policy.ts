import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "rm-rf-protected",
  description: "Recursive force delete of a protected path",
  severity: "critical",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p, settings: s }) =>
  cmd.commands.some(
      (c) =>
        p.is(c, "rm") && p.hasFlags(c, "recursive", "force") &&
        p.argPathIn(c, s.protectedPaths),
    )
    ? deny("Refusing recursive force-delete of a protected path.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "rm -rf /", expect: "deny" },
  { command: "rm -fr ~", expect: "deny" },
  { command: "rm --recursive --force /etc", expect: "deny" },
  { command: "/bin/rm -rf /", expect: "deny" },
  { command: "rm -rf ./build", expect: "defer" },
  { command: 'git commit -m "rm -rf /"', expect: "defer" },
];
