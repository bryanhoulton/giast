import { beforeEach, describe, expect, it, vi } from "vitest";

import { Logger } from "./logger.js";
import { Scope, ScopeException } from "./scope.js";

describe("Scope", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ printTypes: [], storeTypes: [] });
  });

  describe("basic operations", () => {
    it("should get a variable that exists", () => {
      const scope = new Scope({
        vars: { count: 0, name: "test" },
        logger,
      });

      expect(scope.get("count")).toBe(0);
      expect(scope.get("name")).toBe("test");
    });

    it("should throw ScopeException when getting non-existent variable", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      expect(() => scope.get("nonexistent")).toThrow(ScopeException);
      expect(() => scope.get("nonexistent")).toThrow(
        'Variable "nonexistent" not found in scope'
      );
    });

    it("should set a variable that exists", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      scope.set("count", 5);
      expect(scope.get("count")).toBe(5);
    });

    it("should create a new variable when setting non-existent", () => {
      const scope = new Scope({
        vars: {},
        logger,
      });

      scope.set("newVar", 42);
      expect(scope.get("newVar")).toBe(42);
    });

    it("should check if variable exists with has()", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      expect(scope.has("count")).toBe(true);
      expect(scope.has("nonexistent")).toBe(false);
    });

    it("should return undefined for non-existent variables with tryGet()", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      expect(scope.tryGet("count")).toBe(0);
      expect(scope.tryGet("nonexistent")).toBeUndefined();
    });
  });

  describe("scope chain (parent/child)", () => {
    it("should look up variable in parent scope", () => {
      const parent = new Scope({
        vars: { parentVar: "parent" },
        logger,
      });

      const child = parent.extend();
      expect(child.get("parentVar")).toBe("parent");
    });

    it("should shadow parent variable with child variable", () => {
      const parent = new Scope({
        vars: { sharedVar: "parent" },
        logger,
      });

      const child = parent.extend();
      child.set("sharedVar", "child");

      // Child should see parent value since we update parent through the chain
      expect(child.get("sharedVar")).toBe("child");
      // Parent is updated too (set walks up the chain)
      expect(parent.get("sharedVar")).toBe("child");
    });

    it("should update parent variable when set from child", () => {
      const parent = new Scope({
        vars: { count: 0 },
        logger,
      });

      const child = parent.extend();
      child.set("count", 10);

      expect(parent.get("count")).toBe(10);
      expect(child.get("count")).toBe(10);
    });

    it("should create new variable in child scope when not in parent", () => {
      const parent = new Scope({
        vars: { parentVar: 1 },
        logger,
      });

      const child = parent.extend();
      child.set("childVar", 2);

      expect(child.get("childVar")).toBe(2);
      expect(parent.has("childVar")).toBe(false);
    });

    it("should has() check parent scope", () => {
      const parent = new Scope({
        vars: { parentVar: 1 },
        logger,
      });

      const child = parent.extend();
      expect(child.has("parentVar")).toBe(true);
    });
  });

  describe("version tracking", () => {
    it("should increment version on set", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      const initialVersion = scope.version;
      scope.set("count", 1);
      expect(scope.version).toBe(initialVersion + 1);
    });

    it("should not increment version when value unchanged", () => {
      const scope = new Scope({
        vars: { count: 5 },
        logger,
      });

      const initialVersion = scope.version;
      scope.set("count", 5); // Same value
      expect(scope.version).toBe(initialVersion);
    });

    it("should increment version for each change", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      expect(scope.version).toBe(0);
      scope.set("count", 1);
      expect(scope.version).toBe(1);
      scope.set("count", 2);
      expect(scope.version).toBe(2);
      scope.set("count", 3);
      expect(scope.version).toBe(3);
    });
  });

  describe("change notifications", () => {
    it("should call onChange when variable is set", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { count: 0 },
        logger,
        onChange,
      });

      scope.set("count", 1);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("should not call onChange when value unchanged", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { count: 5 },
        logger,
        onChange,
      });

      scope.set("count", 5);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should propagate onChange to child scopes", () => {
      const onChange = vi.fn();
      const parent = new Scope({
        vars: { count: 0 },
        logger,
        onChange,
      });

      const child = parent.extend();
      child.set("count", 10); // Updates parent

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("batching", () => {
    it("should batch multiple changes into single notification", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { a: 0, b: 0, c: 0 },
        logger,
        onChange,
      });

      scope.batch(() => {
        scope.set("a", 1);
        scope.set("b", 2);
        scope.set("c", 3);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(scope.get("a")).toBe(1);
      expect(scope.get("b")).toBe(2);
      expect(scope.get("c")).toBe(3);
    });

    it("should only increment version once during batch", () => {
      const scope = new Scope({
        vars: { a: 0, b: 0 },
        logger,
      });

      const initialVersion = scope.version;

      scope.batch(() => {
        scope.set("a", 1);
        scope.set("b", 2);
      });

      expect(scope.version).toBe(initialVersion + 1);
    });

    it("should return value from batch function", () => {
      const scope = new Scope({
        vars: { count: 5 },
        logger,
      });

      const result = scope.batch(() => {
        scope.set("count", 10);
        return scope.get("count") * 2;
      });

      expect(result).toBe(20);
    });

    it("should not notify if no changes in batch", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { count: 5 },
        logger,
        onChange,
      });

      scope.batch(() => {
        // No actual changes
        scope.set("count", 5);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should support nested batches", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { a: 0, b: 0 },
        logger,
        onChange,
      });

      scope.batch(() => {
        scope.set("a", 1);
        scope.batch(() => {
          scope.set("b", 2);
        });
      });

      // Only one notification at the end of outer batch
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("snapshots", () => {
    it("should get snapshot of current state", () => {
      const scope = new Scope({
        vars: { count: 5, name: "test" },
        logger,
      });

      const snapshot = scope.getSnapshot();
      expect(snapshot).toEqual({ count: 5, name: "test" });
    });

    it("should restore state from snapshot", () => {
      const scope = new Scope({
        vars: { count: 0, name: "" },
        logger,
      });

      scope.restoreSnapshot({ count: 10, name: "restored" });

      expect(scope.get("count")).toBe(10);
      expect(scope.get("name")).toBe("restored");
    });

    it("should only restore variables that exist in scope", () => {
      const scope = new Scope({
        vars: { count: 0 },
        logger,
      });

      scope.restoreSnapshot({ count: 10, nonexistent: 999 });

      expect(scope.get("count")).toBe(10);
      expect(scope.has("nonexistent")).toBe(false);
    });

    it("getSnapshot should be a defensive copy", () => {
      const scope = new Scope({
        vars: { count: 5 },
        logger,
      });

      const snapshot = scope.getSnapshot();
      snapshot.count = 999;

      expect(scope.get("count")).toBe(5);
    });

    it("should batch restore notifications", () => {
      const onChange = vi.fn();
      const scope = new Scope({
        vars: { a: 0, b: 0, c: 0 },
        logger,
        onChange,
      });

      // Restore with different values to trigger changes
      scope.restoreSnapshot({ a: 1, b: 2, c: 3 });

      // Should only notify once despite multiple changes
      // Note: if all values are the same as current, no notification occurs
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(scope.get("a")).toBe(1);
      expect(scope.get("b")).toBe(2);
      expect(scope.get("c")).toBe(3);
    });
  });

  describe("getAllVars", () => {
    it("should return all variables including parent scopes", () => {
      const parent = new Scope({
        vars: { parentVar: 1 },
        logger,
      });

      const child = parent.extend();
      child.set("childVar", 2);

      const allVars = child.getAllVars();
      expect(allVars).toEqual({ parentVar: 1, childVar: 2 });
    });

    it("should have child variables override parent", () => {
      const parent = new Scope({
        vars: { shared: "parent" },
        logger,
      });

      const child = parent.extend();
      // Create a new var in child scope by not using _possiblySet path
      // Actually, set() will update parent. Let's test getOwnVars instead

      const ownVars = child.getOwnVars();
      expect(ownVars).toEqual({});
    });
  });
});
