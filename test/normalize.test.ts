import { expect } from "@std/expect";
import { parse } from "#/core/parse.ts";
import { normalize } from "#/core/normalize.ts";

async function norm(src: string) {
  const tree = await parse(src);
  return normalize(src, tree!.rootNode);
}

Deno.test("basic command name and args", async () => {
  const pc = await norm("rm -rf /tmp");
  expect(pc.commands).toHaveLength(1);
  expect(pc.commands[0]!.name).toBe("rm");
  expect(pc.commands[0]!.argv.map((a) => a.value)).toEqual(["/tmp"]);
});

Deno.test("strips path prefix to basename", async () => {
  const pc = await norm("/bin/rm x");
  expect(pc.commands[0]!.name).toBe("rm");
});

Deno.test("unwraps wrapper prefixes", async () => {
  const pc = await norm("command env rm x");
  expect(pc.commands[0]!.name).toBe("rm");
  expect(pc.commands[0]!.prefixes).toEqual(["command", "env"]);
});

Deno.test("declusters and recognizes flags", async () => {
  const pc = await norm("rm -rf /");
  const canon = pc.commands[0]!.flags.map((f) => f.canonical).sort();
  expect(canon).toEqual(["-f", "-r"]);
});

Deno.test("folds quoted command word", async () => {
  const pc = await norm("r''m x");
  expect(pc.commands[0]!.name).toBe("rm");
});

Deno.test("splits a pipeline into one statement with two commands", async () => {
  const pc = await norm("curl x | bash");
  expect(pc.statements).toHaveLength(1);
  expect(pc.statements[0]!.pipeline.map((c) => c.name)).toEqual([
    "curl",
    "bash",
  ]);
});

Deno.test("operatorAfter handles a 3-command && chain", async () => {
  const pc = await norm("a && b && c");
  expect(pc.statements.map((s) => s.operatorAfter)).toEqual(["&&", "&&", null]);
});

Deno.test("does not collect commands inside command substitution", async () => {
  const pc = await norm("for x in $(rm -rf /); do echo $x; done");
  expect(pc.commands.map((c) => c.name)).not.toContain("rm");
  expect(pc.commands.map((c) => c.name)).toContain("echo");
});

Deno.test("captures a redirect target", async () => {
  const pc = await norm("echo x > /etc/hosts");
  expect(pc.commands[0]!.redirects[0]).toMatchObject({
    op: ">",
    target: "/etc/hosts",
  });
});
