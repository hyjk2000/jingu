import type { PolicyModule } from "#/core/policy/types.ts";
import * as rmRf from "./rm-rf-protected.policy.ts";
import * as pipe from "./pipe-into-shell.policy.ts";
import * as decode from "./decode-exec.policy.ts";
import * as opaque from "./opaque.policy.ts";
import * as dd from "./dd-to-device.policy.ts";
import * as mkfs from "./mkfs-wipe.policy.ts";
import * as forkbomb from "./forkbomb.policy.ts";
import * as systemWrite from "./system-write.policy.ts";
import * as perms from "./perms-mass.policy.ts";
import * as firewall from "./firewall-sip.policy.ts";
import * as exfil from "./secret-exfil.policy.ts";
import * as git from "./git-destructive.policy.ts";
import * as cron from "./crontab-persistence.policy.ts";
import * as kill from "./broad-kill.policy.ts";

export const defaultPolicies: PolicyModule[] = [
  rmRf,
  pipe,
  decode,
  opaque,
  dd,
  mkfs,
  forkbomb,
  systemWrite,
  perms,
  firewall,
  exfil,
  git,
  cron,
  kill,
];
