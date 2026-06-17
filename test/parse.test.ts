import { expect } from "@std/expect";
import { parse } from "#/core/parse.ts";

Deno.test("parses a simple command to a program node", async () => {
  const tree = await parse("echo hi");
  expect(tree?.rootNode.type).toBe("program");
  expect(tree?.rootNode.hasError).toBe(false);
});

Deno.test("flags a syntax error", async () => {
  const tree = await parse('echo "unterminated');
  expect(tree?.rootNode.hasError).toBe(true);
});
