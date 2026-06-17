import { deny, type PolicyEvaluate, type PolicyMeta } from "#policy";
export const meta: PolicyMeta = { description: "fixture" };
export default ((cmd) =>
  cmd.commands.some((c) => c.name === "shutdown") ? deny("no shutdown") : null) as PolicyEvaluate;
