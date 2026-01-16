import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createCatalog } from "./catalog.js";
import { parseUI } from "./ui-dsl.js";

// ============================================================================
// Test Catalog (matches demo catalog)
// ============================================================================

const catalog = createCatalog({
  components: {
    Card: {
      props: z.object({ title: z.string().optional() }),
      children: true,
    },
    Column: {
      props: z.object({ gap: z.enum(["none", "sm", "md", "lg"]).optional() }),
      children: true,
    },
    Row: {
      props: z.object({
        gap: z.enum(["none", "sm", "md", "lg"]).optional(),
        align: z.enum(["start", "center", "end"]).optional(),
      }),
      children: true,
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(["default", "muted", "heading", "label"]).optional(),
      }),
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "secondary", "outline", "ghost", "destructive"]).optional(),
      }),
      action: true,
    },
    Input: {
      props: z.object({
        placeholder: z.string().optional(),
        bind: z.string().optional(),
      }),
      action: true,
    },
    Divider: {
      props: z.object({}),
    },
  },
});

// ============================================================================
// Interpolation helper (copy from catalog-renderer)
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

// ============================================================================
// Example UI Tests
// ============================================================================

describe("Example UIs", () => {
  describe("String Length Checker", () => {
    const uiDsl = `
      Card(title: "String Length Checker") {
        Column(gap: "lg") {
          Input(placeholder: "Type something...", bind: "inputText")
          Button(label: "Check Length", variant: "default") { onClick: updateLength }
          Divider
          Text(content: "Length: {{length}} characters", variant: "heading")
        }
      }
    `;

    it("should parse the UI correctly", () => {
      const ui = parseUI(catalog, uiDsl);

      expect(ui.type).toBe("Card");
      expect(ui.props?.title).toBe("String Length Checker");
      expect(ui.children).toHaveLength(1);

      const column = ui.children![0];
      expect(column.type).toBe("Column");
      expect(column.children).toHaveLength(4);

      const text = column.children![3];
      expect(text.type).toBe("Text");
      expect(text.props?.content).toBe("Length: {{length}} characters");
    });

    it("should interpolate with initial state (length = 0)", () => {
      const ui = parseUI(catalog, uiDsl);
      const text = ui.children![0].children![3];
      const state = { inputText: "", length: 0 };

      const interpolated = interpolateProps(text.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Length: 0 characters");
    });

    it("should interpolate with updated state (length = 5)", () => {
      const ui = parseUI(catalog, uiDsl);
      const text = ui.children![0].children![3];
      const state = { inputText: "hello", length: 5 };

      const interpolated = interpolateProps(text.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Length: 5 characters");
    });
  });

  describe("Counter", () => {
    const uiDsl = `
      Card(title: "Counter") {
        Column(gap: "lg") {
          Text(content: "Current count: {{count}}", variant: "heading")
          Row(gap: "sm") {
            Button(label: "-1", variant: "outline") { onClick: decrement }
            Button(label: "+1", variant: "outline") { onClick: increment }
            Button(label: "+10", variant: "secondary") { onClick: addTen }
          }
          Button(label: "Reset", variant: "ghost") { onClick: reset }
        }
      }
    `;

    it("should parse the UI correctly", () => {
      const ui = parseUI(catalog, uiDsl);

      expect(ui.type).toBe("Card");
      expect(ui.props?.title).toBe("Counter");

      const column = ui.children![0];
      const text = column.children![0];
      expect(text.props?.content).toBe("Current count: {{count}}");

      const row = column.children![1];
      expect(row.children).toHaveLength(3);
    });

    it("should interpolate count = 0", () => {
      const ui = parseUI(catalog, uiDsl);
      const text = ui.children![0].children![0];
      const state = { count: 0 };

      const interpolated = interpolateProps(text.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Current count: 0");
    });

    it("should interpolate count = 42", () => {
      const ui = parseUI(catalog, uiDsl);
      const text = ui.children![0].children![0];
      const state = { count: 42 };

      const interpolated = interpolateProps(text.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Current count: 42");
    });

    it("should interpolate negative count", () => {
      const ui = parseUI(catalog, uiDsl);
      const text = ui.children![0].children![0];
      const state = { count: -5 };

      const interpolated = interpolateProps(text.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Current count: -5");
    });
  });

  describe("Login Form", () => {
    const uiDsl = `
      Card(title: "Login") {
        Column(gap: "md") {
          Text(content: "Welcome, {{username}}!", variant: "heading")
          Input(placeholder: "Username", bind: "username")
          Input(placeholder: "Password", bind: "password")
          Button(label: "Sign In") { onClick: login }
          Text(content: "Status: {{status}}", variant: "muted")
        }
      }
    `;

    it("should parse and interpolate multiple variables", () => {
      const ui = parseUI(catalog, uiDsl);
      const column = ui.children![0];
      const welcomeText = column.children![0];
      const statusText = column.children![4];
      const state = { username: "john", password: "secret", status: "Ready" };

      const welcomeInterpolated = interpolateProps(
        welcomeText.props as Record<string, unknown>,
        state
      );
      const statusInterpolated = interpolateProps(
        statusText.props as Record<string, unknown>,
        state
      );

      expect(welcomeInterpolated.content).toBe("Welcome, john!");
      expect(statusInterpolated.content).toBe("Status: Ready");
    });

    it("should handle empty username", () => {
      const ui = parseUI(catalog, uiDsl);
      const welcomeText = ui.children![0].children![0];
      const state = { username: "", status: "Please enter username" };

      const interpolated = interpolateProps(
        welcomeText.props as Record<string, unknown>,
        state
      );

      expect(interpolated.content).toBe("Welcome, !");
    });
  });

  describe("Score Display", () => {
    const uiDsl = `
      Column(gap: "md") {
        Text(content: "Player: {{playerName}}", variant: "heading")
        Text(content: "Score: {{score}} / {{maxScore}}")
        Text(content: "Level {{level}} - {{levelName}}", variant: "muted")
      }
    `;

    it("should interpolate multiple variables in one string", () => {
      const ui = parseUI(catalog, uiDsl);
      const scoreText = ui.children![1];
      const state = { playerName: "Alice", score: 150, maxScore: 200, level: 3, levelName: "Forest" };

      const interpolated = interpolateProps(scoreText.props as Record<string, unknown>, state);

      expect(interpolated.content).toBe("Score: 150 / 200");
    });

    it("should handle all text elements", () => {
      const ui = parseUI(catalog, uiDsl);
      const state = { playerName: "Bob", score: 0, maxScore: 100, level: 1, levelName: "Tutorial" };

      const results = ui.children!.map((child) =>
        interpolateProps(child.props as Record<string, unknown>, state)
      );

      expect(results[0].content).toBe("Player: Bob");
      expect(results[1].content).toBe("Score: 0 / 100");
      expect(results[2].content).toBe("Level 1 - Tutorial");
    });
  });
});
