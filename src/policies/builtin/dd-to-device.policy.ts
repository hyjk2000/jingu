import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

const DEVICES = [
  "/dev/sd*",
  "/dev/nvme*",
  "/dev/disk*",
  "/dev/rdisk*",
  "/dev/mapper/*",
  "/dev/hd*",
];
export const meta: PolicyMeta = {
  id: "dd-to-device",
  description: "dd writing to a block device",
  severity: "critical",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  cmd.commands.some((c) => p.is(c, "dd") && p.assignsTo(c, "of", DEVICES))
    ? deny("Refusing dd write to a block device.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "dd if=/dev/zero of=/dev/sda bs=1M", expect: "deny" },
  { command: "dd if=/dev/urandom of=/dev/nvme0n1", expect: "deny" },
  { command: "dd if=in.img of=out.img", expect: "defer" },
];
