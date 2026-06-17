import { expect } from "@std/expect";
import { parse } from "#/core/parse.ts";
import { detectOpacities } from "#/core/opacity.ts";

async function kinds(src: string) {
  const tree = await parse(src);
  return detectOpacities(tree!.rootNode)
    .map((o) => o.kind)
    .sort();
}

Deno.test("command substitution in command position", async () => {
  expect(await kinds("$(printf rm) -rf /")).toContain("command-substitution");
});
Deno.test("eval is opaque", async () => {
  expect(await kinds('eval "$CMD"')).toContain("eval");
});
Deno.test("dynamic command name", async () => {
  expect(await kinds("$X -rf /")).toContain("dynamic-command-name");
});
Deno.test("non-ascii verb", async () => {
  expect(await kinds("гm -rf /")).toContain("non-ascii-verb");
});
Deno.test("clean command has no opacities", async () => {
  expect(await kinds("rm -rf /")).toEqual([]);
});
