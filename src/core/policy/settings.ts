import type { ResolvedSettings, Settings } from "./types.ts";

/**
 * Default runtime settings used when a config file does not override them.
 *
 * These defaults define protected filesystem globs, shell interpreters,
 * producer commands commonly used in decode-and-execute pipelines, protected
 * Git branch globs, and fallback behavior for parser or internal failures.
 */
export const DEFAULT_SETTINGS: ResolvedSettings = {
  protectedPaths: [
    "/",
    "/*",
    "~",
    "$HOME",
    "..",
    "/etc/**",
    "/usr/**",
    "/bin/**",
    "/sbin/**",
    "/boot/**",
    "/dev/**",
    "/System/**",
    "/Library/LaunchDaemons/**",
  ],
  interpreters: [
    "sh",
    "bash",
    "zsh",
    "dash",
    "ksh",
    "python",
    "python3",
    "perl",
    "ruby",
    "node",
  ],
  decodeProducers: [
    "curl",
    "wget",
    "fetch",
    "base64",
    "xxd",
    "openssl",
    "gunzip",
    "zcat",
    "printf",
  ],
  gitProtectedBranches: ["main", "master", "release/*"],
  onParseError: "ask",
  onInternalError: "defer",
};

export function resolveSettings(
  overrides?: Partial<Settings>,
): ResolvedSettings {
  return Object.freeze({ ...DEFAULT_SETTINGS, ...overrides });
}
