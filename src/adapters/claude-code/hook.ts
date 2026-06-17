import { buildRuntime } from "#/runtime.ts";
import { evaluate } from "#/core/engine.ts";
import type { JinguConfig } from "#/core/policy/define-config.ts";
import type { HookEnvelope } from "#/core/policy/types.ts";

export interface HookResult {
  stdout: string;
  exitCode: number;
}

interface PreToolUseInput {
  hook_event_name?: string;
  tool_name?: string;
  cwd?: string;
  permission_mode?: string;
  session_id?: string;
  tool_input?: { command?: string };
}

const SILENT: HookResult = { stdout: "", exitCode: 0 };

export async function runHook(
  rawStdin: string,
  config: JinguConfig = {},
): Promise<HookResult> {
  try {
    const input = JSON.parse(rawStdin) as PreToolUseInput;
    if (input.tool_name !== "Bash") return SILENT;
    const command = input.tool_input?.command;
    if (typeof command !== "string") return SILENT;

    const hook: HookEnvelope = {
      command,
      cwd: input.cwd ?? process.cwd(),
      permissionMode: input.permission_mode ?? null,
      sessionId: input.session_id ?? null,
    };
    const runtime = await buildRuntime(config, hook);
    const verdict = await evaluate(command, hook, runtime);
    if (!verdict) return SILENT;

    return {
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: verdict.action,
          permissionDecisionReason: verdict.reason,
          additionalContext: `jingu:${verdict.ruleId}`,
        },
      }),
      exitCode: 0,
    };
  } catch (e) {
    // internal error: defer (degrade gracefully) and log loudly
    console.error(`jingu: internal error, deferring: ${String(e)}`);
    return SILENT;
  }
}
