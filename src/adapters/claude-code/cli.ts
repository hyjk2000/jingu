/**
 * Command-line adapter for running Jingu from Claude Code hooks or a terminal.
 *
 * The executable supports `hook`, `check`, and `test` subcommands. The `hook`
 * subcommand reads a Claude Code `PreToolUse` payload from stdin, while `check`
 * evaluates a command string directly for local debugging.
 *
 * @example
 * ```sh
 * deno run --allow-read jsr:@hyjk2000/jingu/claude-cli check "rm -rf /"
 * ```
 *
 * @module claude_cli
 */
import { resolve, toFileUrl } from "@std/path";
import { runHook } from "./hook.ts";
import { buildRuntime } from "#/runtime.ts";
import { evaluate } from "#/core/engine.ts";
import { runExamples } from "#/examples-runner.ts";
import type { JinguConfig } from "#/core/policy/define-config.ts";
import type { HookEnvelope } from "#/core/policy/types.ts";

async function loadConfig(argv: string[]): Promise<JinguConfig> {
  const i = argv.indexOf("--config");
  if (i === -1) return {};
  const mod = await import(toFileUrl(resolve(argv[i + 1]!)).href);
  return (mod.default ?? {}) as JinguConfig;
}

/**
 * Evaluate a shell command with the same runtime used by the CLI.
 *
 * This is primarily useful for tests and for embedding the CLI behavior in
 * development tooling. A command with no matching policy returns exit code `0`
 * and a "no opinion" message; an `ask` verdict also exits `0`, while a `deny`
 * verdict exits `1`.
 *
 * @param command Shell command text to parse and evaluate.
 * @param config Optional Jingu configuration. Built-in policies are included
 * by default and custom policy directories are loaded from `config.policies`.
 * @returns Text suitable for terminal output and the corresponding process
 * exit code.
 */
export async function checkCommand(
  command: string,
  config: JinguConfig = {},
): Promise<{ text: string; exitCode: number }> {
  const hook: HookEnvelope = {
    command,
    cwd: process.cwd(),
    permissionMode: null,
    sessionId: null,
  };
  const runtime = await buildRuntime(config, hook);
  const v = await evaluate(command, hook, runtime);
  if (!v) {
    return {
      text: "no opinion (defer to sandbox / permission flow)",
      exitCode: 0,
    };
  }
  return {
    text: `${v.action.toUpperCase()} [${v.ruleId}] ${v.reason}`,
    exitCode: v.action === "deny" ? 1 : 0,
  };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const config = await loadConfig(rest);

  if (cmd === "hook") {
    const result = await runHook(await readStdin(), config);
    if (result.stdout) process.stdout.write(result.stdout);
    process.exit(result.exitCode);
  } else if (cmd === "check") {
    const args = [...rest];
    const ci = args.indexOf("--config");
    if (ci !== -1) args.splice(ci, 2); // drop the --config pair; the remainder is the command
    const command = args.join(" ");
    const { text, exitCode } = await checkCommand(command, config);
    process.stdout.write(text + "\n");
    process.exit(exitCode);
  } else if (cmd === "test") {
    const hook: HookEnvelope = {
      command: "",
      cwd: process.cwd(),
      permissionMode: null,
      sessionId: null,
    };
    const runtime = await buildRuntime(config, hook);
    const failures = await runExamples(runtime.policies, runtime.settings);
    for (const f of failures) {
      process.stderr.write(
        `FAIL ${f.policyId}: "${f.command}" expected ${f.expected}, got ${f.got}\n`,
      );
    }
    process.stdout.write(
      `${failures.length === 0 ? "PASS" : "FAIL"}: ${runtime.policies.length} policies\n`,
    );
    process.exit(failures.length === 0 ? 0 : 1);
  } else {
    process.stderr.write("usage: jingu <hook|check|test> [--config <path>]\n");
    process.exit(2);
  }
}

// run only when invoked directly (not when imported by tests)
if (import.meta.main) void main();
