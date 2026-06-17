import { resolveSettings } from "./core/policy/settings.ts";
import { loadPolicyFile, normalizeModule } from "./core/policy/load.ts";
import { discoverPolicyFiles } from "./core/policy/discover.ts";
import { defaultPolicies } from "./policies/builtin/index.ts";
import type { JinguConfig } from "./core/policy/define-config.ts";
import type { HookEnvelope, LoadedPolicy } from "./core/policy/types.ts";
import type { Runtime } from "./core/engine.ts";

export async function buildRuntime(
  config: JinguConfig,
  hook: HookEnvelope,
): Promise<Runtime> {
  const settings = resolveSettings(config.settings);
  const disabled = new Set(config.disable ?? []);
  const policies: LoadedPolicy[] = [];

  for (const [i, mod] of defaultPolicies.entries()) {
    const fallbackId = `builtin-${i}`;
    const loaded = normalizeModule(
      mod,
      `builtin:${mod.meta?.id ?? i}`,
      fallbackId,
      settings,
      hook,
    );
    if (loaded && !disabled.has(loaded.id)) policies.push(loaded);
  }

  for (const file of await discoverPolicyFiles(config.policies ?? [])) {
    const loaded = await loadPolicyFile(file, settings, hook);
    if (loaded && !disabled.has(loaded.id)) policies.push(loaded);
  }

  return { settings, policies };
}
