import {
  _LiteralType,
  Expr,
  Literal,
  Program,
  Stmt,
} from './grammar.js';
import {
  Logger,
  LoggerConfig,
} from './logger.js';
import { Scope } from './scope.js';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for all runtime errors
 */
export class RuntimeError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

/**
 * Error thrown when type checking fails
 */
export class TypeError extends RuntimeError {
  constructor(expected: string, actual: string) {
    super(`Expected ${expected}, got ${actual}`, "TYPE_ERROR");
    this.name = "TypeError";
  }
}

/**
 * Error thrown when a variable is not found
 */
export class VariableError extends RuntimeError {
  constructor(name: string) {
    super(`Variable "${name}" not found`, "VARIABLE_NOT_FOUND");
    this.name = "VariableError";
  }
}

/**
 * Error thrown when a function is not found
 */
export class FunctionError extends RuntimeError {
  constructor(name: string, reason: string) {
    super(`Function "${name}": ${reason}`, "FUNCTION_ERROR");
    this.name = "FunctionError";
  }
}

/**
 * Error thrown for expression evaluation failures
 */
export class ExpressionError extends RuntimeError {
  constructor(message: string) {
    super(message, "EXPRESSION_ERROR");
    this.name = "ExpressionError";
  }
}

/** @deprecated Use RuntimeError instead */
export class RuntimeException extends RuntimeError {
  constructor(message: string) {
    super(message, "RUNTIME_EXCEPTION");
    this.name = "RuntimeException";
  }
}

// ============================================================================
// Configuration Types
// ============================================================================

export type RuntimeConfig = {
  program: Program;
  loggerConfig?: LoggerConfig;
  /** Initial state to hydrate from (e.g., from SSR or localStorage) */
  initialState?: Record<string, Literal>;
};

// ============================================================================
// Runtime Class
// ============================================================================

/**
 * Runtime executes a compiled Gaist program.
 * 
 * Features:
 * - State management with change notifications
 * - Hydration support (save/restore state)
 * - Batch updates for performance
 * - Proper error types for debugging
 */
export class Runtime {
  public readonly scope: Scope;
  private readonly logger: Logger;
  private readonly program: Program;
  private readonly initialVars: Record<string, Literal>;
  private changeListeners: Set<() => void> = new Set();
  private _hasRun = false;
  private _isDestroyed = false;

  constructor(config: RuntimeConfig) {
    this.logger = new Logger(
      config.loggerConfig ?? {
        printTypes: [],
        storeTypes: ["expr", "stmt", "scope"],
      }
    );
    
    // Deep clone program to prevent external mutations
    this.program = JSON.parse(JSON.stringify(config.program));
    
    // Evaluate initial state values
    this.initialVars = this.program.state.vars.reduce((acc, v) => {
      acc[v.name] = this.evaluateExpr(v.init);
      return acc;
    }, {} as Record<string, Literal>);
    
    // Create scope with initial state (possibly hydrated)
    // Only include known state variables from initialState
    const hydratedVars: Record<string, Literal> = {};
    if (config.initialState) {
      for (const [key, value] of Object.entries(config.initialState)) {
        if (key in this.initialVars) {
          hydratedVars[key] = value;
        }
      }
    }
    const vars = { ...this.initialVars, ...hydratedVars };
    
    this.scope = new Scope({
      vars,
      logger: this.logger,
      onChange: () => this._notifyChange(),
    });
    
    this.logger.log("scope", "Initial scope created", this.scope);
  }

  // ============================================================================
  // Public Properties
  // ============================================================================

  /** Whether the init block has been executed */
  get hasRun(): boolean {
    return this._hasRun;
  }

  /** @deprecated Use hasRun getter instead */
  set hasRun(value: boolean) {
    this._hasRun = value;
  }

  /** Whether this runtime has been destroyed */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /** Current state version - changes on every state update */
  get stateVersion(): number {
    return this.scope.version;
  }

  // ============================================================================
  // Change Notification
  // ============================================================================

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  onChange(callback: () => void): () => void {
    this.changeListeners.add(callback);
    return () => {
      this.changeListeners.delete(callback);
    };
  }

  private _notifyChange(): void {
    if (this._isDestroyed) return;
    this.changeListeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("Error in onChange callback:", err);
      }
    });
  }

  // ============================================================================
  // State Management / Hydration
  // ============================================================================

  /**
   * Get current state as a plain object (for serialization)
   */
  getState(): Record<string, Literal> {
    return this.scope.getSnapshot();
  }

  /**
   * Set state from a plain object (for hydration)
   * Only updates variables that exist in the program's state definition
   */
  setState(state: Record<string, Literal>): void {
    this._assertNotDestroyed();
    
    this.scope.batch(() => {
      for (const [name, value] of Object.entries(state)) {
        if (name in this.initialVars) {
          this.scope.set(name, value);
        }
      }
    });
  }

  /**
   * Reset state to initial values (as defined in the program)
   */
  resetState(): void {
    this._assertNotDestroyed();
    
    this.scope.batch(() => {
      for (const [name, value] of Object.entries(this.initialVars)) {
        this.scope.set(name, value);
      }
    });
    this._hasRun = false;
  }

  /**
   * Batch multiple state changes into a single notification
   */
  batch<T>(fn: () => T): T {
    return this.scope.batch(fn);
  }

  // ============================================================================
  // Program Access
  // ============================================================================

  /**
   * Get the program AST
   */
  getProgram(): Program {
    return this.program;
  }

  /**
   * Get state variable names defined in the program
   */
  getStateVarNames(): string[] {
    return this.program.state.vars.map(v => v.name);
  }

  // ============================================================================
  // Type Checking
  // ============================================================================

  checkType(value: Literal, type: _LiteralType): void {
    if (typeof value !== type) {
      throw new TypeError(type, typeof value);
    }
  }

  // ============================================================================
  // Expression Evaluation
  // ============================================================================

  evaluateExpr(expr: Expr, scope: Scope = this.scope): Literal {
    const helper = (expr: Expr, scope: Scope): Literal => {
      switch (expr.kind) {
        case "literal":
          return expr.value;
          
        case "var":
          return scope.get(expr.name);
          
        case "binary": {
          const left = helper(expr.left, scope);
          const right = helper(expr.right, scope);
          
          switch (expr.op) {
            case "+":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) + (right as number);
              
            case "-":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) - (right as number);
              
            case "*":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) * (right as number);
              
            case "/":
              this.checkType(left, "number");
              this.checkType(right, "number");
              if (right === 0) {
                throw new ExpressionError("Division by zero");
              }
              return (left as number) / (right as number);
              
            case "==":
              return left === right;
              
            case "!=":
              return left !== right;
              
            case "&&":
              this.checkType(left, "boolean");
              this.checkType(right, "boolean");
              return (left as boolean) && (right as boolean);
              
            case "||":
              this.checkType(left, "boolean");
              this.checkType(right, "boolean");
              return (left as boolean) || (right as boolean);
              
            case "<":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) < (right as number);
              
            case "<=":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) <= (right as number);
              
            case ">":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) > (right as number);
              
            case ">=":
              this.checkType(left, "number");
              this.checkType(right, "number");
              return (left as number) >= (right as number);
              
            default:
              throw new ExpressionError(`Unknown binary operator: ${expr.op}`);
          }
        }
          
        default:
          throw new ExpressionError(
            `Unknown expression kind: ${(expr as Expr).kind}`
          );
      }
    };
    
    const result = helper(expr, scope);
    this.logger.log("expr", "Evaluated expression", expr, result);
    return result;
  }

  // ============================================================================
  // Statement Execution
  // ============================================================================

  evaluateStmt(stmt: Stmt, scope: Scope = this.scope): void {
    this._assertNotDestroyed();
    this.logger.log("stmt", "Evaluating statement", stmt);
    
    switch (stmt.kind) {
      case "assign":
        scope.set(stmt.target, this.evaluateExpr(stmt.expr, scope));
        break;
        
      case "call": {
        const func = this.program.logic.funcs.find((f) => f.name === stmt.func);
        if (!func) {
          throw new FunctionError(stmt.func, "not found");
        }
        
        if (func.params.length !== stmt.args.length) {
          throw new FunctionError(
            stmt.func,
            `expected ${func.params.length} arguments, got ${stmt.args.length}`
          );
        }
        
        const newScope = scope.extend();
        
        // Bind parameters
        func.params.forEach((p, i) => {
          if (scope.has(p.name)) {
            throw new FunctionError(
              stmt.func,
              `parameter "${p.name}" shadows existing variable`
            );
          }
          newScope.set(p.name, this.evaluateExpr(stmt.args[i], scope));
        });
        
        // Execute function body
        func.body.forEach((s) => this.evaluateStmt(s, newScope));
        break;
      }
        
      case "if": {
        const cond = this.evaluateExpr(stmt.cond, scope);
        if (cond) {
          stmt.then.forEach((s) => this.evaluateStmt(s, scope));
        } else if (stmt.else) {
          stmt.else.forEach((s) => this.evaluateStmt(s, scope));
        }
        break;
      }
    }
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Run the init block (if not already run)
   */
  run(): void {
    this._assertNotDestroyed();
    
    if (this._hasRun) {
      return;
    }
    
    this.program.init.forEach((s) => this.evaluateStmt(s));
    this._hasRun = true;
  }

  /**
   * Clean up runtime resources
   */
  destroy(): void {
    this._isDestroyed = true;
    this.changeListeners.clear();
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  private _assertNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new RuntimeError("Runtime has been destroyed", "DESTROYED");
    }
  }
}
