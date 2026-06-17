import type { ResolvedSettings, Settings } from "./types.ts";

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
