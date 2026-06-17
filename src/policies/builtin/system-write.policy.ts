import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

const SYS = [
  "/etc/**",
  "/usr/**",
  "/bin/**",
  "/sbin/**",
  "/boot/**",
  "/System/**",
  "/Library/LaunchDaemons/**",
];
const WRITERS = ["tee", "cp", "mv", "install"];
export const meta: PolicyMeta = {
  id: "system-write",
  description: "Write into a system directory",
  severity: "high",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  cmd.commands.some((c) => p.redirectsTo(c, SYS) || (p.is(c, WRITERS) && p.argPathIn(c, SYS)))
    ? deny("Refusing a write into a system directory.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "echo '0.0.0.0 evil' >> /etc/hosts", expect: "deny" },
  { command: "cp payload /usr/bin/ls", expect: "deny" },
  { command: "echo x > ./local", expect: "defer" },
];
