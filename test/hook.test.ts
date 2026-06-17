import { expect } from "@std/expect";
import { runHook } from "#/adapters/claude-code/hook.ts";

function run(input: unknown) {
  return runHook(JSON.stringify(input));
}

Deno.test("deny emits a deny decision", async () => {
  const out = await run({
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    cwd: "/repo",
    tool_input: { command: "rm -rf /" },
  });
  const parsed = JSON.parse(out.stdout);
  expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
  expect(out.exitCode).toBe(0);
});

Deno.test("safe command emits nothing", async () => {
  const out = await run({
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    cwd: "/repo",
    tool_input: { command: "ls" },
  });
  expect(out.stdout).toBe("");
  expect(out.exitCode).toBe(0);
});

Deno.test("malformed input defers (no output)", async () => {
  const out = await runHook("not json");
  expect(out.stdout).toBe("");
  expect(out.exitCode).toBe(0);
});

Deno.test("non-Bash tool emits nothing", async () => {
  const out = await run({
    hook_event_name: "PreToolUse",
    tool_name: "Read",
    tool_input: { file_path: "/x" },
  });
  expect(out.stdout).toBe("");
});
