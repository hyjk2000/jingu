import { expect } from "@std/expect";
import { analyze } from "#/core/analyze.ts";

Deno.test("clean command is analyzable with no opacities", async () => {
  const pc = await analyze("rm -rf /");
  expect(pc.analyzable).toBe(true);
  expect(pc.parseError).toBe(false);
  expect(pc.commands[0]!.name).toBe("rm");
});

Deno.test("eval command is not analyzable and carries an opacity", async () => {
  const pc = await analyze('eval "$CMD"');
  expect(pc.analyzable).toBe(false);
  expect(pc.opacities.map((o) => o.kind)).toContain("eval");
});

Deno.test("syntax error sets parseError", async () => {
  const pc = await analyze('echo "oops');
  expect(pc.parseError).toBe(true);
  expect(pc.analyzable).toBe(false);
});
