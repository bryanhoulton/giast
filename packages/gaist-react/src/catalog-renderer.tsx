import {
  type ReactNode,
  useCallback,
  useState,
} from 'react';

import type {
  Catalog,
  ComponentRegistry,
  Expression,
  FuncDef,
  GaistProgram,
  Statement,
  UIElement,
} from './catalog.js';

// ============================================================================
// Types
// ============================================================================

export interface GaistRendererProps<TState extends Record<string, unknown>> {
  /** The catalog defining available components */
  catalog: Catalog;
  /** Your component implementations */
  components: ComponentRegistry<TState>;
  /** The LLM-generated program */
  program: GaistProgram;
  /** Initial state override */
  initialState?: Partial<TState>;
  /** Called when state changes */
  onStateChange?: (state: TState) => void;
}

// ============================================================================
// Runtime Engine
// ============================================================================

class GaistRuntime<TState extends Record<string, unknown>> {
  private state: TState;
  private funcs: Map<string, FuncDef>;
  private listeners: Set<() => void> = new Set();

  constructor(program: GaistProgram, initialState?: Partial<TState>) {
    // Initialize state from program
    const stateObj: Record<string, unknown> = {};
    for (const v of program.state ?? []) {
      stateObj[v.name] = v.init;
    }
    this.state = { ...stateObj, ...initialState } as TState;

    // Index functions
    this.funcs = new Map();
    for (const fn of program.logic ?? []) {
      this.funcs.set(fn.name, fn);
    }
  }

  getState(): TState {
    return this.state;
  }

  setState(key: string, value: unknown): void {
    this.state = { ...this.state, [key]: value };
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  callFunc(name: string, args: unknown[] = []): void {
    const fn = this.funcs.get(name);
    if (!fn) {
      console.warn(`[GaistRuntime] Unknown function: ${name}`);
      return;
    }

    // Bind parameters
    const params: Record<string, unknown> = {};
    for (let i = 0; i < (fn.params?.length ?? 0); i++) {
      params[fn.params![i]] = args[i];
    }

    // Execute body
    this.executeStatements(fn.body, params);
  }

  private executeStatements(
    statements: Statement[],
    params: Record<string, unknown>
  ): void {
    for (const stmt of statements) {
      this.executeStatement(stmt, params);
    }
  }

  private executeStatement(
    stmt: Statement,
    params: Record<string, unknown>
  ): void {
    switch (stmt.kind) {
      case "assign": {
        const value = this.evaluate(stmt.expr, params);
        this.state = { ...this.state, [stmt.target]: value };
        this.notify();
        break;
      }
      case "call": {
        const args = stmt.args?.map((a) => this.evaluate(a, params)) ?? [];
        this.callFunc(stmt.func, args);
        break;
      }
      case "if": {
        const cond = this.evaluate(stmt.cond, params);
        if (cond) {
          this.executeStatements(stmt.then, params);
        } else if (stmt.else) {
          this.executeStatements(stmt.else, params);
        }
        break;
      }
    }
  }

  private evaluate(expr: Expression, params: Record<string, unknown>): unknown {
    switch (expr.kind) {
      case "literal":
        return expr.value;
      case "var": {
        // Check params first, then state
        if (expr.name in params) return params[expr.name];
        return this.state[expr.name as keyof TState];
      }
      case "binary": {
        const left = this.evaluate(expr.left, params);
        const right = this.evaluate(expr.right, params);
        return this.evalBinaryOp(expr.op, left, right);
      }
      case "call": {
        const args = expr.args.map((a) => this.evaluate(a, params));
        return this.evalBuiltinFunc(expr.func, args);
      }
    }
  }

  private evalBuiltinFunc(name: string, args: unknown[]): unknown {
    switch (name) {
      case "randInt": {
        const [min, max] = args as [number, number];
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      case "rand":
        return Math.random();
      case "min":
        return Math.min(...(args as number[]));
      case "max":
        return Math.max(...(args as number[]));
      case "abs":
        return Math.abs(args[0] as number);
      case "floor":
        return Math.floor(args[0] as number);
      case "ceil":
        return Math.ceil(args[0] as number);
      case "round":
        return Math.round(args[0] as number);
      case "len":
        return (args[0] as string).length;
      default:
        console.warn(`[GaistRuntime] Unknown built-in function: ${name}`);
        return null;
    }
  }

  private evalBinaryOp(op: string, left: unknown, right: unknown): unknown {
    const l = left as number;
    const r = right as number;
    switch (op) {
      case "+":
        return l + r;
      case "-":
        return l - r;
      case "*":
        return l * r;
      case "/":
        return l / r;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case "<":
        return l < r;
      case "<=":
        return l <= r;
      case ">":
        return l > r;
      case ">=":
        return l >= r;
      case "&&":
        return left && right;
      case "||":
        return left || right;
      default:
        console.warn(`[GaistRuntime] Unknown operator: ${op}`);
        return null;
    }
  }
}

// ============================================================================
// Renderer Component
// ============================================================================

export function GaistRenderer<TState extends Record<string, unknown>>({
  catalog,
  components,
  program,
  initialState,
  onStateChange,
}: GaistRendererProps<TState>): ReactNode {
  // Create runtime
  const [runtime] = useState(
    () => new GaistRuntime<TState>(program, initialState)
  );

  // Subscribe to state changes
  const [, forceUpdate] = useState(0);
  useState(() => {
    return runtime.subscribe(() => {
      forceUpdate((n) => n + 1);
      onStateChange?.(runtime.getState());
    });
  });

  const state = runtime.getState();

  // Render element recursively
  const renderElement = useCallback(
    (element: UIElement, index: number = 0): ReactNode => {
      // Check visibility
      if (element.visible !== undefined) {
        const isVisible = evaluateExpr(element.visible, state);
        if (!isVisible) {
          return null;
        }
      }

      const Component = components[element.type];
      if (!Component) {
        console.warn(`[GaistRenderer] Unknown component: ${element.type}`);
        return null;
      }

      // Interpolate state in string props
      const props = interpolateProps(element.props ?? {}, state);

      // Render children
      const children = element.children?.map((child, i) =>
        renderElement(child, i)
      );

      // Create action handler
      const action = element.onClick ?? element.onSubmit;
      const onAction = action
        ? () => {
            const args = action.args?.map((a) => evaluateExpr(a, state)) ?? [];
            runtime.callFunc(action.func, args);
          }
        : undefined;

      return (
        <Component
          key={index}
          element={{ type: element.type, props, action }}
          children={children}
          state={state}
          setState={(key, value) => runtime.setState(key, value)}
          onAction={onAction}
        />
      );
    },
    [components, state, runtime]
  );

  return <>{renderElement(program.ui)}</>;
}

// ============================================================================
// Helpers
// ============================================================================

function interpolateProps(
  props: Record<string, unknown>,
  state: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        const stateValue = state[varName];
        return stateValue !== undefined ? String(stateValue) : `{{${varName}}}`;
      });
    } else {
      result[key] = value;
    }
  }
  return result;
}

function evaluateExpr(expr: unknown, state: Record<string, unknown>): unknown {
  if (typeof expr !== "object" || expr === null) return expr;

  const e = expr as Expression;
  switch (e.kind) {
    case "literal":
      return e.value;
    case "var":
      return state[e.name];
    case "binary": {
      const left = evaluateExpr(e.left, state);
      const right = evaluateExpr(e.right, state);
      switch (e.op) {
        case "+":
          return (left as number) + (right as number);
        case "-":
          return (left as number) - (right as number);
        case "*":
          return (left as number) * (right as number);
        case "/":
          return (left as number) / (right as number);
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        case "<":
          return (left as number) < (right as number);
        case "<=":
          return (left as number) <= (right as number);
        case ">":
          return (left as number) > (right as number);
        case ">=":
          return (left as number) >= (right as number);
        case "&&":
          return left && right;
        case "||":
          return left || right;
        default:
          return null;
      }
    }
    case "call": {
      const args = e.args.map((a) => evaluateExpr(a, state));
      return evalBuiltinFunc(e.func, args);
    }
    default:
      return expr;
  }
}

function evalBuiltinFunc(name: string, args: unknown[]): unknown {
  switch (name) {
    case "randInt": {
      const [min, max] = args as [number, number];
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    case "rand":
      return Math.random();
    case "min":
      return Math.min(...(args as number[]));
    case "max":
      return Math.max(...(args as number[]));
    case "abs":
      return Math.abs(args[0] as number);
    case "floor":
      return Math.floor(args[0] as number);
    case "ceil":
      return Math.ceil(args[0] as number);
    case "round":
      return Math.round(args[0] as number);
    case "len":
      return (args[0] as string).length;
    default:
      console.warn(`[GaistRenderer] Unknown built-in function: ${name}`);
      return null;
  }
}
