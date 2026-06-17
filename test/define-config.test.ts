import { expect } from "@std/expect";
import { defineConfig } from "#/core/policy/define-config.ts";

Deno.test("defineConfig returns its input unchanged", () => {
  const cfg = defineConfig({
    policies: ["./policies"],
    disable: ["broad-kill"],
    settings: { onParseError: "deny" },
  });
  expect(cfg.policies).toEqual(["./policies"]);
  expect(cfg.disable).toEqual(["broad-kill"]);
  expect(cfg.settings?.onParseError).toBe("deny");
});
