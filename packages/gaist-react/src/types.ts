import type {
  Func,
  FuncParam,
  Expr,
  Literal,
  Logic,
  Program as CoreProgram,
  RuntimeConfig as CoreRuntimeConfig,
  State,
  StateVar,
  Stmt,
} from 'gaist';

export type { Expr, Func, FuncParam, Literal, Logic, State, StateVar, Stmt };

export type Scope = import('gaist').Scope;

export { Runtime } from 'gaist';

// Re-export error types for convenience
export {
  RuntimeError,
  TypeError,
  VariableError,
  FunctionError,
  ExpressionError,
  ScopeException,
} from 'gaist';

export type LoggerConfig = import('gaist').LoggerConfig;

// ============================================================================
// UI Node Types
// ============================================================================

export interface TextNode {
  type: "Text";
  text?: string;
  variant?: "default" | "muted" | "heading" | "label";
}

export interface ButtonNode {
  type: "Button";
  text?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  onClick?: Stmt | Stmt[];
}

export interface InputNode {
  type: "Input";
  placeholder?: string;
  value?: string; // state variable name to bind
  onSubmit?: Stmt | Stmt[]; // called when Enter is pressed
}

export interface ColumnNode {
  type: "Column";
  gap?: "none" | "sm" | "md" | "lg";
  children?: UINode[];
}

export interface RowNode {
  type: "Row";
  gap?: "none" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
  children?: UINode[];
}

export interface CardNode {
  type: "Card";
  children?: UINode[];
}

export interface BadgeNode {
  type: "Badge";
  text?: string;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}

export interface DividerNode {
  type: "Divider";
}

// Legacy alias
export interface ContainerNode {
  type: "Container";
  children?: UINode[];
}

export type UINode = 
  | TextNode 
  | ButtonNode 
  | InputNode
  | ColumnNode 
  | RowNode
  | CardNode
  | BadgeNode
  | DividerNode
  | ContainerNode;

// ============================================================================
// Program Types
// ============================================================================

export interface Program extends CoreProgram {
  ui: UINode;
}

export interface RuntimeConfig extends Omit<CoreRuntimeConfig, "program"> {
  program: Program;
}
