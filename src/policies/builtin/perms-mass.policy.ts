import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

const PROTECTED = ["/", "/*", "~", "$HOME", "/etc/**", "/usr/**"];
const DANGER_MODES = new Set(["777", "0777", "000", "0000", "a+rwx"]);
export const meta: PolicyMeta = {
  id: "perms-mass",
  description: "Mass permission/ownership change on a protected path",
  severity: "high",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  cmd.commands.some(
      (c) =>
        p.is(c, ["chmod", "chown"]) &&
        p.hasFlags(c, "recursive") &&
        p.argPathIn(c, PROTECTED) &&
        (c.name !== "chmod" ||
          c.argv.some((a) => a.value !== null && DANGER_MODES.has(a.value))),
    )
    ? deny(
      "Refusing a recursive permission/ownership change on a protected path.",
    )
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "chmod -R 777 /", expect: "deny" },
  { command: "chown -R nobody /etc", expect: "deny" },
  { command: "chmod -R 755 ./dist", expect: "defer" },
];
