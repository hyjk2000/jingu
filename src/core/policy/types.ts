import type { OpacityKind, ParsedCommand, SimpleCommand } from "#/core/model.ts";

/**
 * Tunable runtime settings used by built-in policies and parse failure
 * handling.
 */
export interface Settings {
  /** Filesystem path globs treated as sensitive by path-oriented policies. */
  protectedPaths: string[];
  /** Command names considered shell or language interpreters. */
  interpreters: string[];
  /** Producer commands commonly involved in decode-and-execute pipelines. */
  decodeProducers: string[];
  /** Branch names or globs protected from force-push policies. */
  gitProtectedBranches: string[];
  /** Verdict to emit when a shell command cannot be parsed safely. */
  onParseError: "ask" | "deny";
  /** Verdict to emit when runtime-level handling fails. */
  onInternalError: "ask" | "defer" | "deny";
}

/**
 * Fully populated settings object after defaults and config overrides merge.
 */
export type ResolvedSettings = Readonly<Settings>;

/**
 * Normalized metadata from the Claude Code hook payload.
 */
export interface HookEnvelope {
  /** Shell command submitted to the Bash tool. */
  command: string;
  /** Working directory reported by the hook payload or current process. */
  cwd: string;
  /** Claude Code permission mode, when supplied by the hook payload. */
  permissionMode: string | null;
  /** Claude Code session id, when supplied by the hook payload. */
  sessionId: string | null;
}

/**
 * Predicate helpers available to policy evaluators.
 *
 * Predicates operate on normalized command structures so policies can avoid
 * reparsing raw shell text for common checks.
 */
export interface Predicates {
  /** Match a simple command by normalized basename. */
  is(c: SimpleCommand, name: string | string[]): boolean;
  /** Require all semantic flags to be present on a simple command. */
  hasFlags(c: SimpleCommand, ...semantic: string[]): boolean;
  /** Match an argv value, canonical flag, or raw flag token. */
  hasToken(c: SimpleCommand, token: string | string[]): boolean;
  /** Match any literal argument path against glob-style patterns. */
  argPathIn(c: SimpleCommand, patterns: string[]): boolean;
  /** Match redirect targets against glob-style patterns. */
  redirectsTo(c: SimpleCommand, patterns: string[]): boolean;
  /** Match `KEY=value` arguments by key and value pattern. */
  assignsTo(c: SimpleCommand, key: string, patterns: string[]): boolean;
  /** Detect a pipeline whose final command is an interpreter. */
  pipeIntoInterpreter(cmd: ParsedCommand, producers?: string[]): boolean;
  /** Detect force-pushes to protected Git branch patterns. */
  gitForcePushProtected(cmd: ParsedCommand, branches: string[]): boolean;
  /** Detect parser opacity markers by kind. */
  hasOpacity(cmd: ParsedCommand, ...kinds: OpacityKind[]): boolean;
  /** Detect non-ASCII command words in executed command positions. */
  nonAsciiVerb(cmd: ParsedCommand): boolean;
}

/**
 * Parsed shell command passed to policy evaluators.
 */
export type PolicyCommand = ParsedCommand;

/**
 * Runtime context passed to each policy evaluator.
 */
export interface PolicyContext {
  /** Resolved settings for the current run. */
  settings: ResolvedSettings;
  /** Shared predicate helpers for inspecting parsed commands. */
  predicates: Predicates;
  /** Metadata about the current hook invocation. */
  hook: HookEnvelope;
  /** Value returned by the policy module's optional setup function. */
  state: unknown;
}

/**
 * Action returned by a policy when it wants Jingu to intervene.
 */
export type PolicyVerdict =
  | { action: "deny"; reason: string; ruleId?: string }
  | { action: "ask"; reason: string; ruleId?: string };

/**
 * Optional metadata exported by a policy module.
 */
export interface PolicyMeta {
  /** Stable policy id used in reports, disables, and example failures. */
  id?: string;
  /** Human-readable description of the policy's purpose. */
  description?: string;
  /** Severity hint for users reviewing the policy. */
  severity?: "low" | "medium" | "high" | "critical";
  /** Free-form tags for grouping or searching policies. */
  tags?: string[];
  /** Person or team responsible for maintaining the policy. */
  owner?: string;
}

/**
 * Function signature for a policy module's default export.
 *
 * Return `null` when the policy has no opinion. Return {@link deny} or
 * {@link ask} when the command should be blocked or confirmed.
 */
export type PolicyEvaluate = (cmd: PolicyCommand, ctx: PolicyContext) => PolicyVerdict | null;

/**
 * Optional initializer for a policy module.
 *
 * The returned value is stored as {@link PolicyContext.state} for every
 * evaluation performed by that loaded policy.
 */
export type PolicySetup = (ctx: Omit<PolicyContext, "state">) => unknown;

/**
 * Co-located test case for a policy module.
 */
export type PolicyExample = {
  /** Command string to evaluate. */
  command: string;
  /** Expected final action for this example. */
  expect: "deny" | "ask" | "defer";
  /** Expected rule id when the policy emits a verdict. */
  ruleId?: string;
};

/**
 * Collection of policy examples run by the `claude-cli test` subcommand.
 */
export type PolicyExamples = PolicyExample[];

/**
 * Shape of a policy module loaded by Jingu.
 */
export interface PolicyModule {
  /** Evaluator function exported as the module default. */
  default: PolicyEvaluate;
  /** Optional policy metadata. */
  meta?: PolicyMeta;
  /** Optional setup hook invoked once when the policy is loaded. */
  setup?: PolicySetup;
  /** Optional example cases for the policy test runner. */
  examples?: PolicyExamples;
}

/**
 * Create a verdict that blocks the command immediately.
 *
 * @param reason Human-readable explanation shown to the user.
 * @returns A deny verdict without an explicit rule id.
 */
export const deny = (reason: string): PolicyVerdict => ({
  action: "deny",
  reason,
});

/**
 * Create a verdict that asks the user to confirm the command.
 *
 * @param reason Human-readable explanation shown to the user.
 * @returns An ask verdict without an explicit rule id.
 */
export const ask = (reason: string): PolicyVerdict => ({
  action: "ask",
  reason,
});

/** Loaded policy shape used internally by the runtime. */
export interface LoadedPolicy {
  /** Stable id derived from metadata or file name. */
  id: string;
  /** Metadata supplied by the policy module. */
  meta: PolicyMeta;
  /** Normalized policy evaluator. */
  evaluate: PolicyEvaluate;
  /** Setup state associated with the policy. */
  state: unknown;
  /** Example cases supplied by the policy module. */
  examples: PolicyExamples;
  /** File path or `builtin:<id>` source identifier. */
  source: string;
}

/** Final verdict after policy results have been ranked and assigned rule ids. */
export interface ResolvedVerdict {
  /** Winning intervention action. */
  action: "deny" | "ask";
  /** Human-readable explanation from the winning policy. */
  reason: string;
  /** Rule id from the verdict or emitting policy. */
  ruleId: string;
}
