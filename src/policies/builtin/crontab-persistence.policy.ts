import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

const CRON_DIRS = [
  "/etc/cron*/**",
  "/etc/crontab",
  "/Library/LaunchDaemons/**",
  "/etc/systemd/**",
];
export const meta: PolicyMeta = {
  id: "crontab-persistence",
  description: "Crontab wipe or persistence install",
  severity: "medium",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) => {
  const hit = cmd.commands.some((c) => {
    if (p.is(c, "crontab") && p.hasToken(c, "-r")) return true;
    if (p.redirectsTo(c, CRON_DIRS)) return true;
    if (p.is(c, ["tee", "cp", "mv"]) && p.argPathIn(c, CRON_DIRS)) return true;
    return false;
  });
  return hit ? deny("Refusing a crontab wipe or persistence install.") : null;
};
export default evaluate;

export const examples: PolicyExamples = [
  { command: "crontab -r", expect: "deny" },
  { command: "echo x > /etc/cron.d/job", expect: "deny" },
  { command: "crontab -l", expect: "defer" },
];
