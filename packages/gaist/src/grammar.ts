// grammar.ts — v0.1 skeleton
// -------------------------------------
// Goal: provide TypeScript definitions for the minimal JSON‑AST
//       (primitive state, pure reducers, and basic logic)
//       so the compiler / editor can get static safety for free.

/**
 * Spec version — bump when the grammar changes in a breaking way.
 */
export const SPEC_VERSION = "giast/0.1" as const;

/* ------------------------------------------------------------------
 * 1.  Expressions
 * ------------------------------------------------------------------*/

// ───────────────────────────────────────────────────────────────────
// Scalars allowed in v0.1 (extend later with structs / generics)
// ───────────────────────────────────────────────────────────────────
export type _LiteralType = "number" | "string" | "boolean";
export type Literal = number | string | boolean;

/** Literal expression — wraps a raw scalar value */
export interface LiteralExpr {
  kind: "literal";
  value: Literal;
}

/** Variable read — the compiler resolves `name` inside `state.vars` or `params` */
export interface VarExpr {
  kind: "var";
  name: string;
}

/** Binary operators supported in the minimal grammar */
export type BinOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "&&"
  | "||";

/** Binary expression — pure, side‑effect‑free */
export interface BinExpr {
  kind: "binary";
  op: BinOp;
  left: Expr;
  right: Expr;
}

/** Union of every Expression variant */
export type Expr = LiteralExpr | VarExpr | BinExpr;

/* ------------------------------------------------------------------
 * 2.  Statements (reducers only — no side effects)
 * ------------------------------------------------------------------*/

/** Assignment into a mutable state variable */
export interface AssignStmt {
  kind: "assign";
  target: string; // must exist in State.vars
  expr: Expr;
}

/** Call another pure function declared in Logic.funcs */
export interface CallStmt {
  kind: "call";
  func: string;
  args: Expr[];
}

export interface IfStmt {
  kind: "if";
  cond: Expr;
  then: Stmt[];
  else?: Stmt[];
}

/** Discriminated union of all statement nodes */
export type Stmt = AssignStmt | CallStmt | IfStmt;

/* ------------------------------------------------------------------
 * 3.  Logic layer (pure reducers)
 * ------------------------------------------------------------------*/

export interface FuncParam {
  name: string;
}

export interface Func {
  name: string;
  params: FuncParam[];
  body: Stmt[];
}

export interface Logic {
  funcs: Func[];
}

/* ------------------------------------------------------------------
 * 4.  State layer (reactive store)
 * ------------------------------------------------------------------*/

export interface StateVar {
  name: string;
  init: Expr; // primitive literal or expression
}

export interface State {
  vars: StateVar[];
  // derived/computed values come in v0.2
}

export interface Program {
  spec: typeof SPEC_VERSION;
  state: State;
  logic: Logic;
  init: Stmt[];
}
