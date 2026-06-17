import { expect } from "@std/expect";
import { evaluate } from "#/core/engine.ts";
import { resolveSettings } from "#/core/policy/settings.ts";
import { deny } from "#/core/policy/types.ts";
import type { LoadedPolicy } from "#/core/policy/types.ts";

const settings = resolveSettings();
const hook = {
  command: "",
  cwd: "/repo",
  permissionMode: "default",
  sessionId: null,
};

const rmPolicy: LoadedPolicy = {
  id: "rm",
  meta: {},
  state: undefined,
  examples: [],
  source: "builtin:rm",
  evaluate: (cmd, { predicates: p, settings: s }) =>
    cmd.commands.some(
        (c) =>
          p.is(c, "rm") && p.hasFlags(c, "recursive", "force") &&
          p.argPathIn(c, s.protectedPaths),
      )
      ? deny("no rm -rf protected")
      : null,
};

Deno.test("denies rm -rf / and stamps ruleId", async () => {
  const v = await evaluate(
    "rm -rf /",
    { ...hook, command: "rm -rf /" },
    { settings, policies: [rmPolicy] },
  );
  expect(v).toEqual({
    action: "deny",
    reason: "no rm -rf protected",
    ruleId: "rm",
  });
});

Deno.test("stays silent on a safe command", async () => {
  expect(
    await evaluate("ls -la", { ...hook, command: "ls -la" }, {
      settings,
      policies: [rmPolicy],
    }),
  ).toBeNull();
});

Deno.test("parse error yields onParseError verdict without running policies", async () => {
  const v = await evaluate(
    'echo "oops',
    { ...hook, command: 'echo "oops' },
    { settings, policies: [rmPolicy] },
  );
  expect(v?.action).toBe("ask");
  expect(v?.ruleId).toBe("parse-error");
});
