import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "git-destructive",
  description: "Destructive git operation",
  severity: "medium",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p, settings: s }) => {
  if (p.gitForcePushProtected(cmd, s.gitProtectedBranches)) {
    return deny("Refusing force-push to a protected branch.");
  }
  const hit = cmd.commands.some((c) => {
    if (!p.is(c, "git")) return false;
    const sub = c.argv[0]?.value;
    const flags = new Set(c.flags.map((f) => f.canonical));
    if (sub === "reset" && flags.has("--hard")) return true;
    if (sub === "clean" && flags.has("-f") && flags.has("-d")) return true;
    return false;
  });
  return hit ? deny("Refusing a destructive git operation.") : null;
};
export default evaluate;

export const examples: PolicyExamples = [
  { command: "git push --force origin main", expect: "deny" },
  { command: "git reset --hard HEAD~5", expect: "deny" },
  { command: "git clean -fdx", expect: "deny" },
  { command: "git push --force-with-lease origin main", expect: "defer" },
  { command: "git status", expect: "defer" },
];
