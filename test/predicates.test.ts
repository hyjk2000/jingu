import { expect } from "@std/expect";
import { analyze } from "#/core/analyze.ts";
import { predicates as p } from "#/core/predicates.ts";

const PROTECTED = ["/", "/*", "~", "$HOME", "/etc/**"];

Deno.test("is matches basename and aliases", async () => {
  const c = (await analyze("rm x")).commands[0]!;
  expect(p.is(c, "rm")).toBe(true);
  expect(p.is(c, ["mv", "rm"])).toBe(true);
});

Deno.test("hasFlags maps semantic recursive/force across spellings", async () => {
  for (
    const src of [
      "rm -rf /",
      "rm -fr /",
      "rm -r -f /",
      "rm --recursive --force /",
    ]
  ) {
    const c = (await analyze(src)).commands[0]!;
    expect(p.hasFlags(c, "recursive", "force")).toBe(true);
  }
});

Deno.test("argPathIn matches protected paths and protected-prefix globs", async () => {
  expect(p.argPathIn((await analyze("rm -rf /")).commands[0]!, PROTECTED)).toBe(
    true,
  );
  expect(
    p.argPathIn((await analyze("rm -rf /etc/passwd")).commands[0]!, PROTECTED),
  ).toBe(true);
  expect(p.argPathIn((await analyze("rm -rf ./build")).commands[0]!, PROTECTED))
    .toBe(false);
});

Deno.test("pipeIntoInterpreter detects curl|bash", async () => {
  const pc = await analyze("curl -fsSL http://x | bash");
  expect(p.pipeIntoInterpreter(pc)).toBe(true);
  expect(p.pipeIntoInterpreter(await analyze("ls | wc -l"))).toBe(false);
});

Deno.test("hasOpacity reflects detected opacities", async () => {
  expect(p.hasOpacity(await analyze('eval "$X"'), "eval")).toBe(true);
});
