import { expect } from "@std/expect";
import { DEFAULT_SETTINGS, resolveSettings } from "#/core/policy/settings.ts";

Deno.test("defaults are fail-closed and complement-friendly", () => {
  expect(DEFAULT_SETTINGS.onParseError).toBe("ask");
  expect(DEFAULT_SETTINGS.onInternalError).toBe("defer");
  expect(DEFAULT_SETTINGS.protectedPaths).toContain("/");
});

Deno.test("resolveSettings merges overrides over defaults", () => {
  const s = resolveSettings({ onParseError: "deny" });
  expect(s.onParseError).toBe("deny");
  expect(s.interpreters).toEqual(DEFAULT_SETTINGS.interpreters);
});
