import { expect } from "@std/expect";
import { discoverPolicyFiles } from "#/core/policy/discover.ts";
import { join } from "@std/path";

const dir = join(import.meta.dirname!, "fixtures/policies");

Deno.test("finds *.policy.ts files under a dir", async () => {
  const files = await discoverPolicyFiles([dir]);
  expect(files.some((f) => f.endsWith("sample.policy.ts"))).toBe(true);
});

Deno.test("ignores non-policy files", async () => {
  const files = await discoverPolicyFiles([dir]);
  expect(files.every((f) => /\.policy\.(ts|js|mjs)$/.test(f))).toBe(true);
});
