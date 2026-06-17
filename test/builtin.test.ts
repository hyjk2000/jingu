import { expect } from "@std/expect";
import { defaultPolicies } from "#/policies/builtin/index.ts";
import { normalizeModule } from "#/core/policy/load.ts";
import { runExamples } from "#/examples-runner.ts";
import { resolveSettings } from "#/core/policy/settings.ts";

Deno.test("every built-in policy passes its own examples", async () => {
  const settings = resolveSettings();
  const hook = {
    command: "",
    cwd: process.cwd(),
    permissionMode: null,
    sessionId: null,
  };
  const loaded = defaultPolicies
    .map((m, i) => normalizeModule(m, `builtin:${i}`, `builtin-${i}`, settings, hook))
    .filter((p): p is NonNullable<typeof p> => p !== null);
  expect(loaded).toHaveLength(defaultPolicies.length);
  const failures = await runExamples(loaded, settings);
  expect(failures).toEqual([]);
});
