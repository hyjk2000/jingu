import { expect } from "@std/expect";
import { parse } from "#/core/parse.ts";
import { classify } from "#/core/classify.ts";

async function kindAt(src: string, needle: string) {
  const tree = await parse(src);
  const idx = src.indexOf(needle);
  const spans = classify(tree!.rootNode);
  const hit = spans.find((s) => idx >= s.span.start && idx < s.span.end && s.kind !== "executed");
  return hit?.kind ?? "executed";
}

Deno.test("command word is executed", async () => {
  expect(await kindAt("rm -rf /", "rm")).toBe("executed");
});
Deno.test("string argument content is data", async () => {
  expect(await kindAt('git commit -m "rm -rf /"', "rm -rf /")).toBe("data");
});
Deno.test("comment is comment", async () => {
  expect(await kindAt("ls # rm -rf /", "# rm")).toBe("comment");
});
