import type { Settings } from "./types.ts";

export interface JinguConfig {
  policies?: string[]; // dirs/globs of *.policy.{ts,js,mjs}; built-ins always included
  disable?: string[]; // built-in ids to opt out of
  settings?: Partial<Settings>;
}

export function defineConfig(config: JinguConfig): JinguConfig {
  return config;
}
