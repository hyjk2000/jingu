export interface Span {
  start: number;
  end: number;
}

export type OpacityKind =
  | "parse-error"
  | "command-substitution" // $(...) / backticks in a command/arg position
  | "eval" // eval / sh -c "$VAR"
  | "dynamic-command-name" // $VAR as the command word
  | "indirect-expansion" // ${!ref}
  | "pipe-into-interpreter" // curl|bash, base64 -d|sh
  | "heredoc-to-interpreter" // bash <<EOF ... EOF
  | "protected-glob" // rm -rf /etc/*
  | "non-ascii-verb";

export interface Opacity {
  kind: OpacityKind;
  span: Span;
}

export interface Arg {
  value: string | null;
  isLiteral: boolean;
  isGlob: boolean;
  raw: string;
}
export interface Flag {
  canonical: string;
  raw: string;
  value?: string;
}
export interface Redirect {
  op: ">" | ">>" | "<" | ">&" | "heredoc";
  target: string | null;
  targetLiteral: boolean;
}

export interface SimpleCommand {
  name: string | null; // normalized basename; null when opaque
  nameRaw: string | null;
  argv: Arg[];
  flags: Flag[];
  redirects: Redirect[]; // >, >>, <, >&, heredoc
  prefixes: string[]; // unwrapped wrappers: sudo, env, command, ...
  kind: "executed" | "inline-code" | "heredoc-body";
  opaque: boolean;
  span: Span; // byte range in raw
}

export interface Statement {
  pipeline: SimpleCommand[]; // commands joined by |
  operatorAfter: "&&" | "||" | ";" | "&" | null; // connector to the next statement
}

export interface ParsedCommand {
  raw: string;
  statements: Statement[];
  commands: SimpleCommand[]; // every executed-position SimpleCommand, flattened
  analyzable: boolean; // false if an opacity sits in an executed position
  opacities: Opacity[];
  parseError: boolean;
}
