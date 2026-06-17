import type { PolicyEvaluate, PolicyExamples, PolicyMeta } from "#policy";
import { deny } from "#policy";

export const meta: PolicyMeta = {
  id: "decode-exec",
  description: "Decode-then-execute pipeline",
  severity: "high",
};

const evaluate: PolicyEvaluate = (cmd, { predicates: p }) =>
  p.pipeIntoInterpreter(cmd, [
      "base64",
      "xxd",
      "openssl",
      "printf",
      "gunzip",
      "zcat",
    ])
    ? deny("Decoding content directly into a shell is blocked.")
    : null;
export default evaluate;

export const examples: PolicyExamples = [
  { command: "echo Zm9v | base64 -d | bash", expect: "deny" },
  { command: "xxd -r -p data | sh", expect: "deny" },
  { command: "base64 -d file > out", expect: "defer" },
];
