import { Logger, } from '../logger';
import { Scope } from '../scope';
import { render } from '../ui/render';
export class RuntimeException extends Error {
    constructor(message) {
        super(message);
        this.name = "RuntimeException";
    }
}
export class Runtime {
    constructor(config) {
        Object.defineProperty(this, "scope", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "program", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "changeListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "hasRun", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.logger = new Logger(config.loggerConfig ?? {
            printTypes: ["expr", "stmt", "scope"],
            storeTypes: ["expr", "stmt", "scope"],
        });
        this.program = config.program;
        this.scope = new Scope({
            vars: this.program.state.vars.reduce((acc, v) => {
                acc[v.name] = this.evaluateExpr(v.init);
                return acc;
            }, {}),
            logger: this.logger,
            onChange: () => this.notifyChange(),
        });
        this.logger.log("scope", "Initial scope", this.scope);
        this.program = JSON.parse(JSON.stringify(config.program));
    }
    // Add change notification system
    onChange(callback) {
        this.changeListeners.push(callback);
        return () => {
            this.changeListeners = this.changeListeners.filter((cb) => cb !== callback);
        };
    }
    notifyChange() {
        this.changeListeners.forEach((callback) => callback());
    }
    checkType(value, type) {
        if (typeof value !== type) {
            throw new RuntimeException(`Expected ${type}, got ${typeof value}`);
        }
    }
    evaluateExpr(expr, scope = this.scope) {
        function helper(runtime, expr, scope) {
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
                            return left + right;
                        case "-":
                            runtime.checkType(left, "number");
                            runtime.checkType(right, "number");
                            return left - right;
                        case "*":
                            runtime.checkType(left, "number");
                            runtime.checkType(right, "number");
                            return left * right;
                        case "/":
                            runtime.checkType(left, "number");
                            runtime.checkType(right, "number");
                            return left / right;
                        case "==":
                            return left === right;
                        case "!=":
                            return left !== right;
                        case "&&":
                            runtime.checkType(left, "boolean");
                            runtime.checkType(right, "boolean");
                            return left && right;
                        case "||":
                            runtime.checkType(left, "boolean");
                            runtime.checkType(right, "boolean");
                            return left || right;
                    }
            }
        }
        const result = helper(this, expr, scope);
        this.logger.log("expr", "Evaluated expression", expr, result);
        return result;
    }
    evaluateStmt(stmt, scope = this.scope) {
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
                    throw new RuntimeException(`Wrong number of arguments for function ${stmt.func}`);
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
                }
                else if (stmt.else) {
                    stmt.else.forEach((s) => this.evaluateStmt(s));
                }
        }
    }
    run() {
        this.program.init.forEach((s) => this.evaluateStmt(s));
        this.hasRun = true;
    }
    render() {
        return render({ runtime: this, ui: this.program.ui, scope: this.scope });
    }
}
