import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "firewall-sip",
  description: "Disable firewall or system integrity protection",
  severity: "high",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) => {
  const hit = cmd.commands.some((c) => {
    if (p.is(c, "ufw") && p.hasToken(c, "disable")) return true;
    if (
      p.is(c, "iptables") &&
      (p.hasToken(c, "-F") || (p.hasToken(c, "-P") && p.hasToken(c, "ACCEPT")))
    ) {
      return true;
    }
    if (p.is(c, "setenforce") && p.hasToken(c, "0")) return true;
    if (p.is(c, "csrutil") && p.hasToken(c, "disable")) return true;
    if (p.is(c, "spctl") && p.hasToken(c, "--master-disable")) return true;
    if (p.is(c, "pfctl") && p.hasToken(c, "-d")) return true;
    return false;
  });
  return hit ? deny("Refusing to disable firewall or system integrity protection.") : null;
};
export default evaluate;

export const examples: PolicyExamples = [
  { command: "ufw disable", expect: "deny" },
  { command: "iptables -F", expect: "deny" },
  { command: "csrutil disable", expect: "deny" },
  { command: "setenforce 1", expect: "defer" },
];
