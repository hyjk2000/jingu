/**
 * Public configuration helpers and built-in policy exports for Jingu.
 *
 * Import this module from a project-level `jingu.config.ts` file to type-check
 * configuration and reference the built-in policy set.
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsr:@hyjk2000/jingu";
 *
 * export default defineConfig({
 *   policies: ["./.claude/policies"],
 *   disable: ["broad-kill"],
 *   settings: { onParseError: "ask" },
 * });
 * ```
 *
 * @module
 */
export { defineConfig, type JinguConfig } from "./src/core/policy/define-config.ts";
export { defaultPolicies } from "./src/policies/builtin/index.ts";
export { DEFAULT_SETTINGS } from "./src/core/policy/settings.ts";
