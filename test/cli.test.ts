import { expect } from "@std/expect";
import { checkCommand } from "#/adapters/claude-code/cli.ts";

Deno.test("check prints a deny verdict with the ruleId", async () => {
  const { text, exitCode } = await checkCommand("rm -rf /");
  expect(text).toMatch(/deny/i);
  expect(text).toMatch(/rm-rf-protected/);
  expect(exitCode).toBe(1);
});

Deno.test("check on a safe command reports no opinion", async () => {
  const { text, exitCode } = await checkCommand("ls -la");
  expect(text).toMatch(/no opinion|defer|silent/i);
  expect(exitCode).toBe(0);
});
