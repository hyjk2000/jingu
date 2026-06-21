/**
 * Types and helpers for authoring Jingu policy modules.
 *
 * Policy files export a default evaluator and may also export `meta`, `setup`,
 * and `examples`. Evaluators inspect a normalized shell command and either
 * return {@link deny}, return {@link ask}, or return `null` to defer to the
 * next policy and the surrounding sandbox or permission flow.
 *
 * @example
 * ```ts
 * import {
 *   ask,
 *   type PolicyCommand,
 *   type PolicyContext,
 *   type PolicyVerdict,
 * } from "jsr:@hyjk2000/jingu/policy";
 *
 * export default function evaluate(
 *   cmd: PolicyCommand,
 *   { predicates: p }: PolicyContext,
 * ): PolicyVerdict | null {
 *   return cmd.commands.some((c) => p.is(c, "kubectl") && p.hasToken(c, "--context=prod"))
 *     ? ask("Confirm kubectl against production.")
 *     : null;
 * }
 * ```
 *
 * @module
 */
export { ask, deny } from "#/core/policy/types.ts";

export type {
  HookEnvelope,
  PolicyCommand,
  PolicyContext,
  PolicyEvaluate,
  PolicyExample,
  PolicyExamples,
  PolicyMeta,
  PolicyModule,
  PolicySetup,
  PolicyVerdict,
  Predicates,
  ResolvedSettings,
  Settings,
} from "#/core/policy/types.ts";

export type {
  Arg,
  Flag,
  Opacity,
  OpacityKind,
  ParsedCommand,
  Redirect,
  SimpleCommand,
  Span,
  Statement,
} from "#/core/model.ts";
