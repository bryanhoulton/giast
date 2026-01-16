// ============================================================================
// Re-exports from gaist core
// ============================================================================

export type {
  Expr,
  Func,
  FuncParam,
  Literal,
  Logic,
  Program,
  RuntimeConfig,
  State,
  StateVar,
  Stmt,
} from "gaist";

export type Scope = import("gaist").Scope;
export type LoggerConfig = import("gaist").LoggerConfig;

// Re-export error types and Runtime for convenience
export {
  ExpressionError,
  FunctionError,
  Runtime,
  RuntimeError,
  ScopeException,
  TypeError,
  VariableError,
} from "gaist";
