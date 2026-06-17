import { basename, toFileUrl } from "@std/path";
import type { HookEnvelope, LoadedPolicy, PolicyModule, ResolvedSettings } from "./types.ts";
import { predicates } from "#/core/predicates.ts";

function idFromFile(file: string): string {
  return basename(file).replace(/\.policy\.(ts|js|mjs)$/, "");
}

export function normalizeModule(
  mod: Partial<PolicyModule>,
  source: string,
  fallbackId: string,
  settings: ResolvedSettings,
  hook: HookEnvelope,
): LoadedPolicy | null {
  if (typeof mod.default !== "function") {
    console.error(
      `jingu: skipping ${source}: missing a default evaluate export`,
    );
    return null;
  }
  const meta = mod.meta ?? {};
  const id = meta.id ?? fallbackId;
  let state: unknown = undefined;
  if (typeof mod.setup === "function") {
    try {
      state = mod.setup({ settings, predicates, hook });
    } catch (e) {
      console.error(`jingu: setup failed for ${id}: ${String(e)}`);
    }
  }
  return {
    id,
    meta,
    evaluate: mod.default,
    state,
    examples: mod.examples ?? [],
    source,
  };
}

export async function loadPolicyFile(
  file: string,
  settings: ResolvedSettings,
  hook: HookEnvelope,
): Promise<LoadedPolicy | null> {
  let mod: Partial<PolicyModule>;
  try {
    mod = (await import(toFileUrl(file).href)) as Partial<PolicyModule>;
  } catch (e) {
    console.error(`jingu: failed to import ${file}: ${String(e)}`);
    return null;
  }
  return normalizeModule(mod, file, idFromFile(file), settings, hook);
}
