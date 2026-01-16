import { describe, expect, it } from "vitest";

// Copy of interpolateProps from catalog-renderer.tsx for isolated testing
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

describe("interpolateProps", () => {
  const cases: Array<{
    name: string;
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    expected: Record<string, unknown>;
  }> = [
    {
      name: "single variable",
      props: { content: "Count: {{count}}" },
      state: { count: 42 },
      expected: { content: "Count: 42" },
    },
    {
      name: "zero value",
      props: { content: "Length: {{length}} characters" },
      state: { length: 0 },
      expected: { content: "Length: 0 characters" },
    },
    {
      name: "empty string value",
      props: { content: "Input: '{{inputText}}'" },
      state: { inputText: "" },
      expected: { content: "Input: ''" },
    },
    {
      name: "missing variable (unchanged)",
      props: { content: "Missing: {{notDefined}}" },
      state: {},
      expected: { content: "Missing: {{notDefined}}" },
    },
    {
      name: "boolean value",
      props: { content: "Active: {{isActive}}" },
      state: { isActive: true },
      expected: { content: "Active: true" },
    },
    {
      name: "multiple variables",
      props: { content: "Text: {{inputText}}, Length: {{length}}" },
      state: { inputText: "hello", length: 5 },
      expected: { content: "Text: hello, Length: 5" },
    },
    {
      name: "non-string props unchanged",
      props: { content: "Hello", count: 42, active: true },
      state: { length: 10 },
      expected: { content: "Hello", count: 42, active: true },
    },
    {
      name: "user scenario: string length checker",
      props: { content: "Length: {{length}} characters", variant: "heading" },
      state: { inputText: "", length: 0 },
      expected: { content: "Length: 0 characters", variant: "heading" },
    },
  ];

  for (const { name, props, state, expected } of cases) {
    it(name, () => {
      const result = interpolateProps(props, state);
      expect(result).toEqual(expected);
    });
  }
});
