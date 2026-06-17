import { evaluate } from "./core/engine.ts";
import type { LoadedPolicy, ResolvedSettings } from "./core/policy/types.ts";

export interface ExampleFailure {
  policyId: string;
  command: string;
  expected: string;
  got: string;
}

export async function runExamples(
  policies: LoadedPolicy[],
  settings: ResolvedSettings,
): Promise<ExampleFailure[]> {
  const failures: ExampleFailure[] = [];
  for (const policy of policies) {
    for (const ex of policy.examples) {
      const hook = {
        command: ex.command,
        cwd: process.cwd(),
        permissionMode: null,
        sessionId: null,
      };
      const v = await evaluate(ex.command, hook, {
        settings,
        policies: [policy],
      });
      const got = v?.action ?? "defer";
      if (got !== ex.expect) {
        failures.push({
          policyId: policy.id,
          command: ex.command,
          expected: ex.expect,
          got,
        });
      }
    }
  }
  return failures;
}
