import { expandGlob } from "@std/fs";
import { resolve as resolvePath } from "@std/path";

const POLICY_GLOB = "**/*.policy.{ts,js,mjs}";

export async function discoverPolicyFiles(dirs: string[]): Promise<string[]> {
  const found: string[] = [];
  for (const dir of dirs) {
    const root = resolvePath(dir);
    try {
      for await (const entry of expandGlob(POLICY_GLOB, { root, includeDirs: false })) {
        found.push(entry.path);
      }
    } catch {
      continue;
    }
  }
  return found.sort();
}
