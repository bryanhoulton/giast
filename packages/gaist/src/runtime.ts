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

// Note: render function removed from core runtime - use gaist-react for React rendering

export class RuntimeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeException";
  }
}

export type RuntimeConfig = {
  program: Program;
  loggerConfig?: LoggerConfig;
};

export class Runtime {
  public scope: Scope;
  private logger: Logger;
  private program: Program;
  private changeListeners: (() => void)[] = [];
  public hasRun = false;

  constructor(config: RuntimeConfig) {
    this.logger = new Logger(
      config.loggerConfig ?? {
        printTypes: ["expr", "stmt", "scope"],
        storeTypes: ["expr", "stmt", "scope"],
      }
    );
    this.program = config.program;
    this.scope = new Scope({
      vars: this.program.state.vars.reduce((acc, v) => {
        acc[v.name] = this.evaluateExpr(v.init);
        return acc;
      }, {} as Record<string, Literal>),
      logger: this.logger,
      onChange: () => this.notifyChange(),
    });
    this.logger.log("scope", "Initial scope", this.scope);
    this.program = JSON.parse(JSON.stringify(config.program));
  }

  // Add change notification system
  onChange(callback: () => void) {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyChange() {
    this.changeListeners.forEach((callback) => callback());
  }

  checkType(value: Literal, type: _LiteralType) {
    if (typeof value !== type) {
      throw new RuntimeException(`Expected ${type}, got ${typeof value}`);
    }
  }

  evaluateExpr(expr: Expr, scope: Scope = this.scope): Literal {
    function helper(runtime: Runtime, expr: Expr, scope: Scope): Literal {
      switch (expr.kind) {
        case "literal":
          return expr.value;
        case "var":
          return scope.get(expr.name);
        case "binary":
          const left = helper(runtime, expr.left, scope);
          const right = helper(runtime, expr.right, scope);
          switch (expr.op) {
            case "+":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) + (right as number);
            case "-":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) - (right as number);
            case "*":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) * (right as number);
            case "/":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) / (right as number);
            case "==":
              return left === right;
            case "!=":
              return left !== right;
            case "&&":
              runtime.checkType(left, "boolean");
              runtime.checkType(right, "boolean");
              return (left as boolean) && (right as boolean);
            case "||":
              runtime.checkType(left, "boolean");
              runtime.checkType(right, "boolean");
              return (left as boolean) || (right as boolean);
            case "<":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) < (right as number);
            case "<=":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) <= (right as number);
            case ">":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) > (right as number);
            case ">=":
              runtime.checkType(left, "number");
              runtime.checkType(right, "number");
              return (left as number) >= (right as number);
            default:
              throw new RuntimeException(`Unknown binary operator: ${expr.op}`);
          }
        default:
          throw new RuntimeException(
            `Unknown expression kind: ${(expr as any).kind}`
          );
      }
    }
    const result = helper(this, expr, scope);
    this.logger.log("expr", "Evaluated expression", expr, result);
    return result;
  }

  evaluateStmt(stmt: Stmt, scope: Scope = this.scope) {
    this.logger.log("stmt", "Evaluating statement", stmt);
    switch (stmt.kind) {
      case "assign":
        scope.set(stmt.target, this.evaluateExpr(stmt.expr, scope));
        break;
      case "call":
        const func = this.program.logic.funcs.find((f) => f.name === stmt.func);
        if (!func) {
          throw new RuntimeException(`Function ${stmt.func} not found`);
        }
        const newScope = scope.extend();
        if (func.params.length !== stmt.args.length) {
          throw new RuntimeException(
            `Wrong number of arguments for function ${stmt.func}`
          );
        }
        func.params.forEach((p, i) => {
          if (p.name in scope) {
            throw new RuntimeException(`Variable ${p.name} already in scope`);
          }
          newScope.set(p.name, this.evaluateExpr(stmt.args[i]));
        });
        func.body.forEach((s) => this.evaluateStmt(s, newScope));
        break;
      case "if":
        const cond = this.evaluateExpr(stmt.cond);
        if (cond) {
          stmt.then.forEach((s) => this.evaluateStmt(s));
        } else if (stmt.else) {
          stmt.else.forEach((s) => this.evaluateStmt(s));
        }
    }
  }

  run() {
    this.program.init.forEach((s) => this.evaluateStmt(s));
    this.hasRun = true;
  }

  // Note: render method removed from core runtime
  // Use gaist-react package for React rendering functionality
  getProgram() {
    return this.program;
  }
}
