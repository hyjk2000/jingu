import { expect } from "@std/expect";
import { loadPolicyFile } from "#/core/policy/load.ts";
import { resolveSettings } from "#/core/policy/settings.ts";
import { join } from "@std/path";

const file = join(import.meta.dirname!, "fixtures/policies/sample.policy.ts");
const hook = {
  command: "",
  cwd: "/repo",
  permissionMode: null,
  sessionId: null,
};

Deno.test("loads a policy module and derives id from filename", async () => {
  const loaded = await loadPolicyFile(file, resolveSettings(), hook);
  expect(loaded?.id).toBe("sample");
  expect(loaded?.meta.description).toBe("fixture");
  expect(typeof loaded?.evaluate).toBe("function");
});
