import { describe, expect, it, vi } from "vitest";

import { Program } from "./grammar.js";
import {
  ExpressionError,
  FunctionError,
  Runtime,
  RuntimeError,
  TypeError,
} from "./runtime.js";

// ============================================================================
// Test Fixtures
// ============================================================================

function createCounterProgram(): Program {
  return {
    spec: "giast/0.1",
    state: {
      vars: [{ name: "count", init: { kind: "literal", value: 0 } }],
    },
    logic: {
      funcs: [
        {
          name: "increment",
          params: [],
          body: [
            {
              kind: "assign",
              target: "count",
              expr: {
                kind: "binary",
                op: "+",
                left: { kind: "var", name: "count" },
                right: { kind: "literal", value: 1 },
              },
            },
          ],
        },
        {
          name: "add",
          params: [{ name: "x" }],
          body: [
            {
              kind: "assign",
              target: "count",
              expr: {
                kind: "binary",
                op: "+",
                left: { kind: "var", name: "count" },
                right: { kind: "var", name: "x" },
              },
            },
          ],
        },
        {
          name: "reset",
          params: [],
          body: [
            {
              kind: "assign",
              target: "count",
              expr: { kind: "literal", value: 0 },
            },
          ],
        },
      ],
    },
    init: [],
  };
}

function createMultiVarProgram(): Program {
  return {
    spec: "giast/0.1",
    state: {
      vars: [
        { name: "count", init: { kind: "literal", value: 0 } },
        { name: "name", init: { kind: "literal", value: "default" } },
        { name: "active", init: { kind: "literal", value: false } },
      ],
    },
    logic: { funcs: [] },
    init: [],
  };
}

function createConditionalProgram(): Program {
  return {
    spec: "giast/0.1",
    state: {
      vars: [
        { name: "value", init: { kind: "literal", value: 0 } },
        { name: "result", init: { kind: "literal", value: "" } },
      ],
    },
    logic: {
      funcs: [
        {
          name: "checkValue",
          params: [],
          body: [
            {
              kind: "if",
              cond: {
                kind: "binary",
                op: ">",
                left: { kind: "var", name: "value" },
                right: { kind: "literal", value: 10 },
              },
              then: [
                {
                  kind: "assign",
                  target: "result",
                  expr: { kind: "literal", value: "big" },
                },
              ],
              else: [
                {
                  kind: "assign",
                  target: "result",
                  expr: { kind: "literal", value: "small" },
                },
              ],
            },
          ],
        },
      ],
    },
    init: [],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("Runtime", () => {
  describe("initialization", () => {
    it("should initialize with program state", () => {
      const runtime = new Runtime({ program: createCounterProgram() });
      expect(runtime.scope.get("count")).toBe(0);
    });

    it("should initialize multiple state variables", () => {
      const runtime = new Runtime({ program: createMultiVarProgram() });

      expect(runtime.scope.get("count")).toBe(0);
      expect(runtime.scope.get("name")).toBe("default");
      expect(runtime.scope.get("active")).toBe(false);
    });

    it("should hydrate from initial state", () => {
      const runtime = new Runtime({
        program: createCounterProgram(),
        initialState: { count: 100 },
      });

      expect(runtime.scope.get("count")).toBe(100);
    });

    it("should ignore unknown variables in initial state", () => {
      const runtime = new Runtime({
        program: createCounterProgram(),
        initialState: { count: 50, unknown: 999 } as any,
      });

      expect(runtime.scope.get("count")).toBe(50);
      expect(runtime.scope.has("unknown")).toBe(false);
    });

    it("should start with hasRun = false", () => {
      const runtime = new Runtime({ program: createCounterProgram() });
      expect(runtime.hasRun).toBe(false);
    });
  });

  describe("expression evaluation", () => {
    it("should evaluate literal expressions", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(runtime.evaluateExpr({ kind: "literal", value: 42 })).toBe(42);
      expect(runtime.evaluateExpr({ kind: "literal", value: "hello" })).toBe(
        "hello"
      );
      expect(runtime.evaluateExpr({ kind: "literal", value: true })).toBe(true);
    });

    it("should evaluate variable expressions", () => {
      const runtime = new Runtime({ program: createCounterProgram() });
      expect(runtime.evaluateExpr({ kind: "var", name: "count" })).toBe(0);
    });

    it("should evaluate arithmetic binary expressions", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "+",
          left: { kind: "literal", value: 5 },
          right: { kind: "literal", value: 3 },
        })
      ).toBe(8);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "-",
          left: { kind: "literal", value: 10 },
          right: { kind: "literal", value: 4 },
        })
      ).toBe(6);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "*",
          left: { kind: "literal", value: 6 },
          right: { kind: "literal", value: 7 },
        })
      ).toBe(42);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "/",
          left: { kind: "literal", value: 20 },
          right: { kind: "literal", value: 4 },
        })
      ).toBe(5);
    });

    it("should evaluate comparison expressions", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "==",
          left: { kind: "literal", value: 5 },
          right: { kind: "literal", value: 5 },
        })
      ).toBe(true);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "!=",
          left: { kind: "literal", value: 5 },
          right: { kind: "literal", value: 3 },
        })
      ).toBe(true);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "<",
          left: { kind: "literal", value: 3 },
          right: { kind: "literal", value: 5 },
        })
      ).toBe(true);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: ">=",
          left: { kind: "literal", value: 5 },
          right: { kind: "literal", value: 5 },
        })
      ).toBe(true);
    });

    it("should evaluate logical expressions", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "&&",
          left: { kind: "literal", value: true },
          right: { kind: "literal", value: true },
        })
      ).toBe(true);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "&&",
          left: { kind: "literal", value: true },
          right: { kind: "literal", value: false },
        })
      ).toBe(false);

      expect(
        runtime.evaluateExpr({
          kind: "binary",
          op: "||",
          left: { kind: "literal", value: false },
          right: { kind: "literal", value: true },
        })
      ).toBe(true);
    });

    it("should throw TypeError for invalid operand types", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(() =>
        runtime.evaluateExpr({
          kind: "binary",
          op: "+",
          left: { kind: "literal", value: "string" },
          right: { kind: "literal", value: 5 },
        })
      ).toThrow(TypeError);

      expect(() =>
        runtime.evaluateExpr({
          kind: "binary",
          op: "&&",
          left: { kind: "literal", value: 5 },
          right: { kind: "literal", value: true },
        })
      ).toThrow(TypeError);
    });

    it("should throw ExpressionError for division by zero", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(() =>
        runtime.evaluateExpr({
          kind: "binary",
          op: "/",
          left: { kind: "literal", value: 10 },
          right: { kind: "literal", value: 0 },
        })
      ).toThrow(ExpressionError);
    });
  });

  describe("statement execution", () => {
    it("should execute assign statements", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.evaluateStmt({
        kind: "assign",
        target: "count",
        expr: { kind: "literal", value: 42 },
      });

      expect(runtime.scope.get("count")).toBe(42);
    });

    it("should execute call statements", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.evaluateStmt({
        kind: "call",
        func: "increment",
        args: [],
      });

      expect(runtime.scope.get("count")).toBe(1);
    });

    it("should execute call statements with arguments", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.evaluateStmt({
        kind: "call",
        func: "add",
        args: [{ kind: "literal", value: 10 }],
      });

      expect(runtime.scope.get("count")).toBe(10);
    });

    it("should execute if statements (true branch)", () => {
      const runtime = new Runtime({ program: createConditionalProgram() });
      runtime.scope.set("value", 15);

      runtime.evaluateStmt({
        kind: "call",
        func: "checkValue",
        args: [],
      });

      expect(runtime.scope.get("result")).toBe("big");
    });

    it("should execute if statements (false branch)", () => {
      const runtime = new Runtime({ program: createConditionalProgram() });
      runtime.scope.set("value", 5);

      runtime.evaluateStmt({
        kind: "call",
        func: "checkValue",
        args: [],
      });

      expect(runtime.scope.get("result")).toBe("small");
    });

    it("should throw FunctionError for unknown function", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(() =>
        runtime.evaluateStmt({
          kind: "call",
          func: "unknownFunction",
          args: [],
        })
      ).toThrow(FunctionError);
    });

    it("should throw FunctionError for wrong number of arguments", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(() =>
        runtime.evaluateStmt({
          kind: "call",
          func: "add",
          args: [], // Missing required argument
        })
      ).toThrow(FunctionError);
    });
  });

  describe("run()", () => {
    it("should execute init statements", () => {
      const program = createCounterProgram();
      program.init = [
        { kind: "call", func: "increment", args: [] },
        { kind: "call", func: "increment", args: [] },
      ];

      const runtime = new Runtime({ program });
      runtime.run();

      expect(runtime.scope.get("count")).toBe(2);
      expect(runtime.hasRun).toBe(true);
    });

    it("should only run once", () => {
      const program = createCounterProgram();
      program.init = [{ kind: "call", func: "increment", args: [] }];

      const runtime = new Runtime({ program });
      runtime.run();
      runtime.run();
      runtime.run();

      expect(runtime.scope.get("count")).toBe(1);
    });
  });

  describe("state management", () => {
    it("should get current state", () => {
      const runtime = new Runtime({ program: createMultiVarProgram() });
      runtime.scope.set("count", 10);
      runtime.scope.set("name", "updated");

      const state = runtime.getState();
      expect(state).toEqual({
        count: 10,
        name: "updated",
        active: false,
      });
    });

    it("should set state", () => {
      const runtime = new Runtime({ program: createMultiVarProgram() });

      runtime.setState({
        count: 100,
        name: "new name",
        active: true,
      });

      expect(runtime.scope.get("count")).toBe(100);
      expect(runtime.scope.get("name")).toBe("new name");
      expect(runtime.scope.get("active")).toBe(true);
    });

    it("should only set known state variables", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.setState({
        count: 50,
        unknown: 999,
      } as any);

      expect(runtime.scope.get("count")).toBe(50);
      expect(runtime.scope.has("unknown")).toBe(false);
    });

    it("should reset state to initial values", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.scope.set("count", 999);
      expect(runtime.scope.get("count")).toBe(999);

      runtime.resetState();
      expect(runtime.scope.get("count")).toBe(0);
    });

    it("should reset hasRun when resetState is called", () => {
      const program = createCounterProgram();
      program.init = [{ kind: "call", func: "increment", args: [] }];

      const runtime = new Runtime({ program });
      runtime.run();
      expect(runtime.hasRun).toBe(true);

      runtime.resetState();
      expect(runtime.hasRun).toBe(false);
    });

    it("should batch state changes", () => {
      const onChange = vi.fn();
      const runtime = new Runtime({ program: createMultiVarProgram() });
      runtime.onChange(onChange);

      runtime.batch(() => {
        runtime.scope.set("count", 1);
        runtime.scope.set("name", "batched");
        runtime.scope.set("active", true);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("change notifications", () => {
    it("should notify on state change", () => {
      const onChange = vi.fn();
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.onChange(onChange);
      runtime.scope.set("count", 5);

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("should allow unsubscribing", () => {
      const onChange = vi.fn();
      const runtime = new Runtime({ program: createCounterProgram() });

      const unsubscribe = runtime.onChange(onChange);
      runtime.scope.set("count", 1);
      expect(onChange).toHaveBeenCalledTimes(1);

      unsubscribe();
      runtime.scope.set("count", 2);
      expect(onChange).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should support multiple subscribers", () => {
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();
      const runtime = new Runtime({ program: createCounterProgram() });

      runtime.onChange(onChange1);
      runtime.onChange(onChange2);
      runtime.scope.set("count", 5);

      expect(onChange1).toHaveBeenCalledTimes(1);
      expect(onChange2).toHaveBeenCalledTimes(1);
    });

    it("should track state version", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      const v1 = runtime.stateVersion;
      runtime.scope.set("count", 1);
      const v2 = runtime.stateVersion;
      runtime.scope.set("count", 2);
      const v3 = runtime.stateVersion;

      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });
  });

  describe("destroy", () => {
    it("should mark runtime as destroyed", () => {
      const runtime = new Runtime({ program: createCounterProgram() });

      expect(runtime.isDestroyed).toBe(false);
      runtime.destroy();
      expect(runtime.isDestroyed).toBe(true);
    });

    it("should throw when evaluating statement after destroy", () => {
      const runtime = new Runtime({ program: createCounterProgram() });
      runtime.destroy();

      expect(() =>
        runtime.evaluateStmt({
          kind: "assign",
          target: "count",
          expr: { kind: "literal", value: 5 },
        })
      ).toThrow(RuntimeError);
    });

    it("should throw when running after destroy", () => {
      const runtime = new Runtime({ program: createCounterProgram() });
      runtime.destroy();

      expect(() => runtime.run()).toThrow(RuntimeError);
    });

    it("should not notify after destroy", () => {
      const onChange = vi.fn();
      const runtime = new Runtime({ program: createCounterProgram() });
      runtime.onChange(onChange);

      runtime.destroy();

      // Manually trigger - should not notify
      runtime.scope.set("count", 999);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("getProgram", () => {
    it("should return the program", () => {
      const program = createCounterProgram();
      const runtime = new Runtime({ program });

      expect(runtime.getProgram()).toEqual(program);
    });

    it("should return a deep copy (not affected by external mutations)", () => {
      const program = createCounterProgram();
      const runtime = new Runtime({ program });

      // Mutate original
      program.state.vars[0].name = "mutated";

      // Runtime should have its own copy
      expect(runtime.getProgram().state.vars[0].name).toBe("count");
    });
  });

  describe("getStateVarNames", () => {
    it("should return all state variable names", () => {
      const runtime = new Runtime({ program: createMultiVarProgram() });

      expect(runtime.getStateVarNames()).toEqual(["count", "name", "active"]);
    });
  });
});
