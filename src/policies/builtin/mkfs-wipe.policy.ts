import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

const TOOLS = [
  "mkfs",
  "mke2fs",
  "wipefs",
  "blkdiscard",
  "sgdisk",
  "fdisk",
  "parted",
];
export const meta: PolicyMeta = {
  id: "mkfs-wipe",
  description: "Filesystem/partition destruction tool",
  severity: "critical",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  cmd.commands.some((c) => p.is(c, TOOLS) || (c.name?.startsWith("mkfs.") ?? false))
    ? deny("Refusing a filesystem/partition destruction command.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "mkfs.ext4 /dev/sda1", expect: "deny" },
  { command: "wipefs -a /dev/sdb", expect: "deny" },
  { command: "blkdiscard /dev/nvme0n1", expect: "deny" },
  { command: "echo mkfs", expect: "defer" },
];
