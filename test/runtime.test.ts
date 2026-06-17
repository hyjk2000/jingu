import { expect } from "@std/expect";
import { buildRuntime } from "#/runtime.ts";
import { evaluate } from "#/core/engine.ts";
import { join } from "@std/path";

const hook = {
  command: "",
  cwd: "/repo",
  permissionMode: null,
  sessionId: null,
};
const fixtures = join(import.meta.dirname!, "fixtures/policies");

Deno.test("built-ins are loaded and enforce", async () => {
  const rt = await buildRuntime({}, hook);
  const v = await evaluate("rm -rf /", { ...hook, command: "rm -rf /" }, rt);
  expect(v?.action).toBe("deny");
});

Deno.test("disable opts a built-in out by id", async () => {
  const rt = await buildRuntime({ disable: ["rm-rf-protected"] }, hook);
  expect(rt.policies.find((p) => p.id === "rm-rf-protected")).toBeUndefined();
});

Deno.test("user policy dir is discovered and merged", async () => {
  const rt = await buildRuntime({ policies: [fixtures] }, hook);
  const v = await evaluate(
    "shutdown now",
    { ...hook, command: "shutdown now" },
    rt,
  );
  expect(v?.action).toBe("deny");
});
