import { expect } from "@std/expect";
import { resolve } from "#/core/policy/resolve.ts";

Deno.test("deny beats ask", () => {
  expect(
    resolve([
      { action: "ask", reason: "a", ruleId: "x" },
      { action: "deny", reason: "b", ruleId: "y" },
    ]),
  ).toEqual({ action: "deny", reason: "b", ruleId: "y" });
});

Deno.test("empty resolves to null", () => {
  expect(resolve([])).toBeNull();
});

Deno.test("single ask survives", () => {
  expect(resolve([{ action: "ask", reason: "a", ruleId: "x" }])?.action).toBe(
    "ask",
  );
});
