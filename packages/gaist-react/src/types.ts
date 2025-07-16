// This file will temporarily define types that should come from the gaist package
// In a real scenario, these would be imported from the published gaist package

export interface LoggerConfig {
  printTypes: string[];
  storeTypes: string[];
}

export interface RuntimeConfig {
  program: Program;
  loggerConfig?: LoggerConfig;
}

export interface Program {
  spec: string;
  state: State;
  logic: Logic;
  init: Stmt[];
  ui: UINode;
}

export interface State {
  vars: StateVar[];
}

export interface StateVar {
  name: string;
  init: Expr;
}

export interface Logic {
  funcs: Func[];
}

export interface Func {
  name: string;
  params: FuncParam[];
  body: Stmt[];
}

export interface FuncParam {
  name: string;
}

export type Literal = string | number | boolean;

export interface Expr {
  type: "literal" | "variable" | "binary" | "template";
  value?: Literal;
  name?: string;
  left?: Expr;
  right?: Expr;
  operator?: string;
  template?: string;
  expressions?: Expr[];
}

export interface Stmt {
  type: "assign" | "call" | "if";
  name?: string;
  value?: Expr;
  args?: Expr[];
  condition?: Expr;
  thenStmts?: Stmt[];
  elseStmts?: Stmt[];
}

export interface UINode {
  type: "Text" | "Button" | "Column" | "Container";
  text?: string;
  onClick?: Stmt | Stmt[];
  children?: UINode[];
}

// Runtime class placeholder
export class Runtime {
  constructor(config: RuntimeConfig) {}
  run(): void {}
  onChange(callback: () => void): () => void {
    return () => {};
  }
  hasRun: boolean = false;
}

export class Scope {
  constructor(config: any) {}

  get(name: string): Literal {
    // Placeholder implementation
    return name;
  }
}
