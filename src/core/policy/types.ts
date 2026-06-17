import type { OpacityKind, ParsedCommand, SimpleCommand } from "#/core/model.ts";

export interface Settings {
  protectedPaths: string[];
  interpreters: string[];
  decodeProducers: string[];
  gitProtectedBranches: string[];
  onParseError: "ask" | "deny";
  onInternalError: "ask" | "defer" | "deny";
}
export type ResolvedSettings = Readonly<Settings>;

export interface HookEnvelope {
  command: string;
  cwd: string;
  permissionMode: string | null;
  sessionId: string | null;
}

export interface Predicates {
  // per simple-command
  is(c: SimpleCommand, name: string | string[]): boolean;
  hasFlags(c: SimpleCommand, ...semantic: string[]): boolean;
  hasToken(c: SimpleCommand, token: string | string[]): boolean; // matches an argv value OR a flag (canonical/raw)
  argPathIn(c: SimpleCommand, patterns: string[]): boolean;
  redirectsTo(c: SimpleCommand, patterns: string[]): boolean;
  assignsTo(c: SimpleCommand, key: string, patterns: string[]): boolean;
  // whole-command / structural
  pipeIntoInterpreter(cmd: ParsedCommand, producers?: string[]): boolean;
  gitForcePushProtected(cmd: ParsedCommand, branches: string[]): boolean;
  hasOpacity(cmd: ParsedCommand, ...kinds: OpacityKind[]): boolean;
  nonAsciiVerb(cmd: ParsedCommand): boolean;
}

export type PolicyCommand = ParsedCommand;

export interface PolicyContext {
  settings: ResolvedSettings;
  predicates: Predicates;
  hook: HookEnvelope;
  state: unknown;
}

export type PolicyVerdict =
  | { action: "deny"; reason: string; ruleId?: string }
  | { action: "ask"; reason: string; ruleId?: string };

export interface PolicyMeta {
  id?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  tags?: string[];
  owner?: string;
}

export type PolicyEvaluate = (cmd: PolicyCommand, ctx: PolicyContext) => PolicyVerdict | null;

export type PolicySetup = (ctx: Omit<PolicyContext, "state">) => unknown;

export type PolicyExample = {
  command: string;
  expect: "deny" | "ask" | "defer";
  ruleId?: string;
};

export type PolicyExamples = PolicyExample[];

export interface PolicyModule {
  default: PolicyEvaluate;
  meta?: PolicyMeta;
  setup?: PolicySetup;
  examples?: PolicyExamples;
}

export const deny = (reason: string): PolicyVerdict => ({
  action: "deny",
  reason,
});

export const ask = (reason: string): PolicyVerdict => ({
  action: "ask",
  reason,
});

// internal (engine-side) shapes
export interface LoadedPolicy {
  id: string;
  meta: PolicyMeta;
  evaluate: PolicyEvaluate;
  state: unknown;
  examples: PolicyExamples;
  source: string; // file path or 'builtin:<id>'
}

export interface ResolvedVerdict {
  action: "deny" | "ask";
  reason: string;
  ruleId: string;
}
