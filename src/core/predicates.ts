import picomatch from "picomatch";
import type { OpacityKind, ParsedCommand, SimpleCommand } from "./model.ts";
import type { Predicates } from "./policy/types.ts";

const DEFAULT_INTERPRETERS = [
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
];

const FLAG_ALIASES: Record<string, string[]> = {
  recursive: ["-r", "-R", "--recursive"],
  force: ["-f", "--force"],
  "no-preserve-root": ["--no-preserve-root"],
};

function basename(name: string | null): string | null {
  return name === null ? null : name.replace(/.*\//, "");
}

function matchAny(value: string, patterns: string[]): boolean {
  return patterns.some((pat) => {
    if (value === pat) return true;
    if (picomatch.isMatch(value, pat, { dot: true })) return true;
    if (pat.endsWith("/**") && value === pat.slice(0, -3)) return true; // '/etc/**' also matches bare '/etc'
    return false;
  });
}

export const predicates: Predicates = {
  is(c: SimpleCommand, name: string | string[]) {
    const names = Array.isArray(name) ? name : [name];
    return c.name !== null && names.includes(basename(c.name)!);
  },
  hasFlags(c: SimpleCommand, ...semantic: string[]) {
    const present = new Set(c.flags.map((f) => f.canonical));
    return semantic.every((s) =>
      (FLAG_ALIASES[s] ?? ["-" + s, "--" + s]).some((a) => present.has(a))
    );
  },
  hasToken(c: SimpleCommand, token: string | string[]) {
    const tokens = Array.isArray(token) ? token : [token];
    const present = new Set<string>([
      ...c.argv.map((a) => a.value ?? ""),
      ...c.flags.map((f) => f.canonical),
      ...c.flags.map((f) => f.raw),
    ]);
    return tokens.some((t) => present.has(t));
  },
  argPathIn(c: SimpleCommand, patterns: string[]) {
    return c.argv.some((a) => a.value !== null && matchAny(a.value, patterns));
  },
  redirectsTo(c: SimpleCommand, patterns: string[]) {
    return c.redirects.some((r) => r.target !== null && matchAny(r.target, patterns));
  },
  assignsTo(c: SimpleCommand, key: string, patterns: string[]) {
    return c.argv.some((a) => {
      if (a.value === null) return false;
      const m = a.value.match(/^([A-Za-z_]+)=(.*)$/);
      return !!m && m[1] === key && matchAny(m[2]!, patterns);
    });
  },
  pipeIntoInterpreter(cmd: ParsedCommand, producers?: string[]) {
    return cmd.statements.some((st) => {
      if (st.pipeline.length < 2) return false;
      const sink = basename(st.pipeline[st.pipeline.length - 1]!.name);
      if (!sink || !DEFAULT_INTERPRETERS.includes(sink)) return false;
      if (!producers) return true;
      return st.pipeline.slice(0, -1).some((c) => producers.includes(basename(c.name) ?? ""));
    });
  },
  gitForcePushProtected(cmd: ParsedCommand, branches: string[]) {
    return cmd.commands.some((c) => {
      if (basename(c.name) !== "git") return false;
      const args = c.argv.map((a) => a.value ?? "");
      if (args[0] !== "push") return false;
      const flags = new Set(c.flags.map((f) => f.canonical));
      const forced = flags.has("-f") || flags.has("--force"); // '--force-with-lease' is a distinct canonical
      return forced && args.some((a) => matchAny(a, branches));
    });
  },
  hasOpacity(cmd: ParsedCommand, ...kinds: OpacityKind[]) {
    return cmd.opacities.some((o) => kinds.includes(o.kind));
  },
  nonAsciiVerb(cmd: ParsedCommand) {
    return cmd.commands.some((c) => c.nameRaw !== null && /[\u0080-\uFFFF]/.test(c.nameRaw));
  },
};
