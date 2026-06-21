import type { Settings } from "./types.ts";

/**
 * Configuration consumed by the Jingu runtime and CLI.
 */
export interface JinguConfig {
  /** Directories searched recursively for `*.policy.{ts,js,mjs}` policy modules. */
  policies?: string[];
  /** Policy ids to skip after built-in and custom policies are loaded. */
  disable?: string[];
  /** Runtime settings that override `DEFAULT_SETTINGS`. */
  settings?: Partial<Settings>;
}

/**
 * Type helper for Jingu configuration object.
 *
 * Use this helper to declare the default export from `jingu.config.ts` so editors and
 * `deno check` validate policy paths, disabled ids, and settings.
 *
 * @param config The configuration object to expose to the CLI.
 * @returns The same configuration object.
 */
export function defineConfig(config: JinguConfig): JinguConfig {
  return config;
}
