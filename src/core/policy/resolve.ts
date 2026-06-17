import type { ResolvedVerdict } from "./types.ts";

const RANK = { deny: 2, ask: 1 } as const;

export function resolve(verdicts: ResolvedVerdict[]): ResolvedVerdict | null {
  let best: ResolvedVerdict | null = null;
  for (const v of verdicts) {
    if (!best || RANK[v.action] > RANK[best.action]) best = v;
  }
  return best;
}
