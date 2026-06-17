import { expect } from "@std/expect";
import { runExamples } from "#/examples-runner.ts";
import { resolveSettings } from "#/core/policy/settings.ts";
import { deny } from "#/core/policy/types.ts";
import type { LoadedPolicy } from "#/core/policy/types.ts";

const policy: LoadedPolicy = {
  id: "shutdown",
  meta: {},
  state: undefined,
  source: "builtin:shutdown",
  evaluate: (cmd, { predicates: p }) =>
    cmd.commands.some((c) => p.is(c, "shutdown")) ? deny("no") : null,
  examples: [
    { command: "shutdown now", expect: "deny" },
    { command: "ls", expect: "defer" },
  ],
};

Deno.test("all examples pass", async () => {
  const fails = await runExamples([policy], resolveSettings());
  expect(fails).toEqual([]);
});

Deno.test("reports a mismatch", async () => {
  const bad: LoadedPolicy = {
    ...policy,
    examples: [{ command: "ls", expect: "deny" }],
  };
  const fails = await runExamples([bad], resolveSettings());
  expect(fails).toHaveLength(1);
  expect(fails[0]!.command).toBe("ls");
});
