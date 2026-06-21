# Jingu

**Jingu** (金箍, Sun Wukong’s Golden Circlet from _Journey to the West_) is a Bash command guard for
Claude Code, designed to complement sandbox and auto mode as a deterministic pre-filter. It parses
every command with Tree-sitter, evaluates it against policies authored in TypeScript, and then
either blocks dangerous commands, prompts for human review when intent cannot be verified, or
remains silent.

Jingu is intentionally designed never to emit an explicit _allow_ decision. Any command that passes
through Jingu is still subject to evaluation by the auto mode classifier. Like the Golden Circlet
worn by the Monkey King, Jingu stays unobtrusive during normal operation and tightens only when the
agent reaches for something dangerous.

## Requirements

Currently, [Deno](https://deno.com) is the only supported runtime.

## Install

The package is published to [JSR](https://jsr.io/@hyjk2000/jingu) as `@hyjk2000/jingu`.

```sh
deno run --allow-read jsr:@hyjk2000/jingu@0.1.1/claude-cli hook --config ./.claude/jingu.config.ts
```

## Wire it into Claude Code

Add a `PreToolUse` hook in your Claude Code settings (`.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "deno run --allow-read jsr:@hyjk2000/jingu@0.1.1/claude-cli hook --config ${CLAUDE_PROJECT_DIR}/.claude/jingu.config.ts",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

The `--config` flag points to your project-level config (see [Write a policy](#write-a-policy)
below). Omit it to run with the built-in defaults only.

## CLI

Invoke each subcommand with:

```sh
deno run --allow-read jsr:@hyjk2000/jingu@0.1.1/claude-cli <subcommand>
```

| Command         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `check "<cmd>"` | Print the verdict and firing rule for a command. Exits 1 on deny. |
| `test`          | Run every policy's co-located `examples` against the engine.      |
| `hook`          | The `PreToolUse` entry point. Reads the hook payload from stdin.  |

Example:

```sh
deno run --allow-read jsr:@hyjk2000/jingu@0.1.1/claude-cli check "rm -rf /"
# DENY [rm-rf-protected] ...
```

## Write a policy

Policies are `*.policy.ts` modules. The default export is the evaluate function. Optional named
exports: `meta` (description, severity), `setup` (async initialisation), `examples` (test cases).

```ts
// .claude/policies/no-prod-kubectl.policy.ts
import {
  ask,
  type PolicyCommand,
  type PolicyContext,
  type PolicyExamples,
  type PolicyMeta,
  type PolicyVerdict,
} from "jsr:@hyjk2000/jingu@0.1.1/policy";

export const meta: PolicyMeta = {
  description: "Confirm kubectl/helm against a prod context",
  severity: "high",
};

export default function evaluate(
  cmd: PolicyCommand,
  { predicates: p }: PolicyContext,
): PolicyVerdict | null {
  if (
    cmd.commands.some((c) => p.is(c, ["kubectl", "helm"])) &&
    cmd.raw.includes("--context prod")
  ) {
    return ask("Targeting a prod cluster, confirm?");
  }
  return null;
}

// Optional: co-located test cases, run via the `test` subcommand.
export const examples: PolicyExamples = [
  { command: "kubectl get pods --context prod", expect: "ask" },
  { command: "helm upgrade api ./chart --context prod", expect: "ask" },
  { command: "kubectl get pods", expect: "defer" },
];
```

Point jingu at your policy directory via `policies` in `jingu.config.ts`:

```ts
// jingu.config.ts
import { join } from "jsr:@std/path@1";
import { defineConfig } from "jsr:@hyjk2000/jingu@0.1.1";

export default defineConfig({
  policies: [join(import.meta.dirname!, "policies")],
  // disable: ['broad-kill'],
  settings: { onParseError: "ask", onInternalError: "defer" },
});
```

Built-in deny policies are always included. Opt out of any by id using `disable` in
`jingu.config.ts`. Policies run as native TypeScript with no build step. Use `import type` for
type-only imports and keep policy files to erasable syntax (no enums, namespaces, or parameter
properties).

For type checking your config and policy files:

```sh
deno check jingu.config.ts policies/*.policy.ts
```

## Built-in Policies

14 policies ship with Jingu:

| ID                    | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `rm-rf-protected`     | `rm -rf` targeting protected paths (/, /etc, home dirs, etc.)               |
| `pipe-into-shell`     | Piping remote content directly into a shell interpreter                     |
| `decode-exec`         | Base64/hex decode piped into execution                                      |
| `opaque`              | Commands that are structurally unanalysable (eval, $(...) as command, etc.) |
| `dd-to-device`        | `dd` writing to a raw block device                                          |
| `mkfs-wipe`           | `mkfs` or `wipefs` against a device                                         |
| `forkbomb`            | Fork bomb patterns                                                          |
| `system-write`        | Writes to sensitive system paths (/etc, /usr, /boot, ...)                   |
| `perms-mass`          | Mass `chmod`/`chown` from root downward                                     |
| `firewall-sip`        | Disabling the firewall or SIP                                               |
| `secret-exfil`        | Reading secret stores and piping off-host                                   |
| `git-destructive`     | Force-push to main/master or `git filter-branch` rewrites                   |
| `crontab-persistence` | Writing crontab entries that persist agent activity                         |
| `broad-kill`          | `kill -9 -1` or equivalent broad process termination                        |
