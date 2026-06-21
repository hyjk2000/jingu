/**
 * Byte range in the original shell command.
 */
export interface Span {
  /** Inclusive start byte offset. */
  start: number;
  /** Exclusive end byte offset. */
  end: number;
}

/**
 * Reason a portion of a command cannot be statically analyzed.
 */
export type OpacityKind =
  | "parse-error"
  | "command-substitution"
  | "eval"
  | "dynamic-command-name"
  | "indirect-expansion"
  | "pipe-into-interpreter"
  | "heredoc-to-interpreter"
  | "protected-glob"
  | "non-ascii-verb";

/**
 * Marker describing an opaque or high-risk span in the parsed command.
 */
export interface Opacity {
  /** Classification of the opaque construct. */
  kind: OpacityKind;
  /** Byte range where the construct appears in the original command. */
  span: Span;
}

/**
 * Normalized command argument.
 */
export interface Arg {
  /** Literal value when statically known; `null` for dynamic values. */
  value: string | null;
  /** Whether the argument was parsed as a literal value. */
  isLiteral: boolean;
  /** Whether the argument contains glob syntax. */
  isGlob: boolean;
  /** Original argument text. */
  raw: string;
}

/**
 * Normalized flag token.
 */
export interface Flag {
  /** Canonical flag spelling used for comparisons. */
  canonical: string;
  /** Original flag token text. */
  raw: string;
  /** Inline or following value associated with the flag, when parsed. */
  value?: string;
}

/**
 * Shell redirection attached to a simple command.
 */
export interface Redirect {
  /** Redirection operator. */
  op: ">" | ">>" | "<" | ">&" | "heredoc";
  /** Static redirect target, or `null` when dynamic. */
  target: string | null;
  /** Whether the target was parsed as a literal value. */
  targetLiteral: boolean;
}

/**
 * A normalized simple command in executed or inline-code position.
 */
export interface SimpleCommand {
  /** Normalized command basename, or `null` when dynamic or opaque. */
  name: string | null;
  /** Raw command word text, or `null` when unavailable. */
  nameRaw: string | null;
  /** Positional arguments and assignment-like tokens. */
  argv: Arg[];
  /** Parsed flags for this command. */
  flags: Flag[];
  /** Redirects such as `>`, `>>`, `<`, `>&`, and heredocs. */
  redirects: Redirect[];
  /** Wrapper commands that were unwrapped, such as `sudo`, `env`, or `command`. */
  prefixes: string[];
  /** Role of the command in the parsed shell program. */
  kind: "executed" | "inline-code" | "heredoc-body";
  /** Whether the command contains dynamic structure that limits analysis. */
  opaque: boolean;
  /** Byte range in the original shell command. */
  span: Span;
}

/**
 * Pipeline and following shell control operator.
 */
export interface Statement {
  /** Commands joined by pipe operators. */
  pipeline: SimpleCommand[];
  /** Connector to the next statement, if any. */
  operatorAfter: "&&" | "||" | ";" | "&" | null;
}

/**
 * Full normalized representation of a shell command string.
 */
export interface ParsedCommand {
  /** Original shell command text. */
  raw: string;
  /** Top-level statements in source order. */
  statements: Statement[];
  /** Every executed-position simple command, flattened in source order. */
  commands: SimpleCommand[];
  /** False when an opacity affects an executed command position. */
  analyzable: boolean;
  /** Opaque or risky constructs detected while analyzing the command. */
  opacities: Opacity[];
  /** Whether Tree-sitter reported a parse error. */
  parseError: boolean;
}
