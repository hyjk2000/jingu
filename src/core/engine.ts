import { analyze } from "./analyze.ts";
import { predicates } from "./predicates.ts";
import { resolve } from "./policy/resolve.ts";
import type {
  HookEnvelope,
  LoadedPolicy,
  PolicyContext,
  PolicyVerdict,
  ResolvedSettings,
  ResolvedVerdict,
} from "./policy/types.ts";

export interface Runtime {
  settings: ResolvedSettings;
  policies: LoadedPolicy[];
}

export async function evaluate(
  command: string,
  hook: HookEnvelope,
  runtime: Runtime,
): Promise<ResolvedVerdict | null> {
  const cmd = await analyze(command);
  if (cmd.parseError) {
    return {
      action: runtime.settings.onParseError,
      reason: "Command could not be parsed safely.",
      ruleId: "parse-error",
    };
  }
  const verdicts: ResolvedVerdict[] = [];
  for (const policy of runtime.policies) {
    const ctx: PolicyContext = {
      settings: runtime.settings,
      predicates,
      hook,
      state: policy.state,
    };
    let v: PolicyVerdict | null = null;
    try {
      v = policy.evaluate(cmd, ctx);
    } catch {
      continue;
    } // a broken policy never blocks the others
    if (v) {
      verdicts.push({
        action: v.action,
        reason: v.reason,
        ruleId: v.ruleId ?? policy.id,
      });
    }
  }
  return resolve(verdicts);
}
