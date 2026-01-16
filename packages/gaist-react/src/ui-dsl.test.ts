import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { createCatalog } from './catalog.js';
import {
  ParseError,
  parseUI,
  parseUIElements,
} from './ui-dsl.js';

// ============================================================================
// Test Catalog
// ============================================================================

function createTestCatalog() {
  return createCatalog({
    components: {
      Text: {
        props: z.object({
          content: z.string(),
          variant: z.enum(["default", "heading", "muted"]).optional(),
        }),
        description: "Display text content",
      },
      Button: {
        props: z.object({
          label: z.string(),
          size: z.enum(["sm", "md", "lg"]).optional(),
          disabled: z.boolean().optional(),
        }),
        action: true,
        description: "Clickable button",
      },
      Input: {
        props: z.object({
          placeholder: z.string().optional(),
          value: z.string().optional(),
        }),
        action: true,
        description: "Text input field",
      },
      Card: {
        props: z.object({
          title: z.string().optional(),
        }),
        children: true,
        description: "Container card",
      },
      Row: {
        props: z.object({
          gap: z.enum(["sm", "md", "lg"]).optional(),
          align: z.enum(["start", "center", "end"]).optional(),
        }),
        children: true,
        description: "Horizontal layout",
      },
      Column: {
        props: z.object({
          gap: z.enum(["sm", "md", "lg"]).optional(),
        }),
        children: true,
        description: "Vertical layout",
      },
      Divider: {
        props: z.object({}),
        description: "Horizontal divider",
      },
      Badge: {
        props: z.object({
          text: z.string(),
          variant: z.enum(["default", "success", "warning", "error"]).optional(),
        }),
        description: "Status badge",
      },
    },
  });
}

// ============================================================================
// Basic Parsing Tests
// ============================================================================

describe("UI DSL Parser", () => {
  describe("basic components", () => {
    it("should parse a simple component with no props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, "Divider");

      expect(ui).toEqual({ type: "Divider" });
    });

    it("should parse a component with string props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Hello World")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Hello World" },
      });
    });

    it("should parse a component with multiple props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Title", variant: "heading")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Title", variant: "heading" },
      });
    });

    it("should parse a component with boolean props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Submit", disabled: true)');

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Submit", disabled: true },
      });
    });

    it("should parse a component with enum props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Click", size: "lg")');

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Click", size: "lg" },
      });
    });
  });

  describe("children", () => {
    it("should parse a component with a single child", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Card {
          Text(content: "Inside card")
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [{ type: "Text", props: { content: "Inside card" } }],
      });
    });

    it("should parse a component with multiple children", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Card {
          Text(content: "First")
          Text(content: "Second")
          Text(content: "Third")
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [
          { type: "Text", props: { content: "First" } },
          { type: "Text", props: { content: "Second" } },
          { type: "Text", props: { content: "Third" } },
        ],
      });
    });

    it("should parse deeply nested components", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Card {
          Column {
            Row {
              Text(content: "Deeply nested")
            }
          }
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [
          {
            type: "Column",
            children: [
              {
                type: "Row",
                children: [{ type: "Text", props: { content: "Deeply nested" } }],
              },
            ],
          },
        ],
      });
    });

    it("should parse component with props and children", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Row(gap: "md", align: "center") {
          Button(label: "Left")
          Button(label: "Right")
        }
      `
      );

      expect(ui).toEqual({
        type: "Row",
        props: { gap: "md", align: "center" },
        children: [
          { type: "Button", props: { label: "Left" } },
          { type: "Button", props: { label: "Right" } },
        ],
      });
    });
  });

  describe("actions", () => {
    it("should parse onClick action", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Click") { onClick: handleClick }');

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Click" },
        onClick: { func: "handleClick" },
      });
    });

    it("should parse onSubmit action", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        'Input(placeholder: "Enter text") { onSubmit: handleSubmit }'
      );

      expect(ui).toEqual({
        type: "Input",
        props: { placeholder: "Enter text" },
        onSubmit: { func: "handleSubmit" },
      });
    });

    it("should parse action with arguments", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Add 5") { onClick: addAmount(5) }');

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Add 5" },
        onClick: {
          func: "addAmount",
          args: [{ kind: "literal", value: 5 }],
        },
      });
    });

    it("should parse action with multiple arguments", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        'Button(label: "Set") { onClick: setValue("test", 42, true) }'
      );

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Set" },
        onClick: {
          func: "setValue",
          args: [
            { kind: "literal", value: "test" },
            { kind: "literal", value: 42 },
            { kind: "literal", value: true },
          ],
        },
      });
    });

    it("should parse action with variable reference argument", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Use count") { onClick: setTo(count) }');

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Use count" },
        onClick: {
          func: "setTo",
          args: [{ kind: "var", name: "count" }],
        },
      });
    });
  });

  describe("complex structures", () => {
    it("should parse a counter UI", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Card {
          Text(content: "Count: {{count}}", variant: "heading")
          Row(gap: "md") {
            Button(label: "-") { onClick: decrement }
            Button(label: "+") { onClick: increment }
          }
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [
          {
            type: "Text",
            props: { content: "Count: {{count}}", variant: "heading" },
          },
          {
            type: "Row",
            props: { gap: "md" },
            children: [
              {
                type: "Button",
                props: { label: "-" },
                onClick: { func: "decrement" },
              },
              {
                type: "Button",
                props: { label: "+" },
                onClick: { func: "increment" },
              },
            ],
          },
        ],
      });
    });

    it("should parse a form-like UI", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Column(gap: "md") {
          Text(content: "Login", variant: "heading")
          Input(placeholder: "Username", value: "username")
          Input(placeholder: "Password", value: "password")
          Button(label: "Submit", size: "lg") { onClick: handleLogin }
        }
      `
      );

      expect(ui).toEqual({
        type: "Column",
        props: { gap: "md" },
        children: [
          { type: "Text", props: { content: "Login", variant: "heading" } },
          { type: "Input", props: { placeholder: "Username", value: "username" } },
          { type: "Input", props: { placeholder: "Password", value: "password" } },
          {
            type: "Button",
            props: { label: "Submit", size: "lg" },
            onClick: { func: "handleLogin" },
          },
        ],
      });
    });
  });

  describe("comments", () => {
    it("should ignore single-line comments", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        // This is a comment
        Card {
          // Another comment
          Text(content: "Hello")
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [{ type: "Text", props: { content: "Hello" } }],
      });
    });

    it("should ignore multi-line comments", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        /* 
         * Multi-line comment
         */
        Card {
          Text(content: "Hello")
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        children: [{ type: "Text", props: { content: "Hello" } }],
      });
    });
  });

  describe("string handling", () => {
    it("should handle double-quoted strings", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Double quoted")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Double quoted" },
      });
    });

    it("should handle single-quoted strings", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, "Text(content: 'Single quoted')");

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Single quoted" },
      });
    });

    it("should handle escaped characters in strings", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Line 1\\nLine 2")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Line 1\nLine 2" },
      });
    });

    it("should handle escaped quotes", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Say \\"Hello\\"")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: 'Say "Hello"' },
      });
    });

    it("should preserve template interpolation syntax", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Value: {{myVar}}")');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Value: {{myVar}}" },
      });
    });
  });

  describe("numbers", () => {
    it("should parse integer numbers", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Add") { onClick: add(42) }');

      expect(ui.onClick?.args?.[0]).toEqual({ kind: "literal", value: 42 });
    });

    it("should parse decimal numbers", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Set") { onClick: set(3.14) }');

      expect(ui.onClick?.args?.[0]).toEqual({ kind: "literal", value: 3.14 });
    });

    it("should parse negative numbers", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Button(label: "Sub") { onClick: add(-10) }');

      expect(ui.onClick?.args?.[0]).toEqual({ kind: "literal", value: -10 });
    });
  });

  describe("parseUIElements", () => {
    it("should parse multiple root elements", () => {
      const catalog = createTestCatalog();
      const elements = parseUIElements(
        catalog,
        `
        Text(content: "First")
        Text(content: "Second")
      `
      );

      expect(elements).toEqual([
        { type: "Text", props: { content: "First" } },
        { type: "Text", props: { content: "Second" } },
      ]);
    });

    it("parseUI should wrap multiple roots in Column", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Text(content: "First")
        Text(content: "Second")
      `
      );

      expect(ui).toEqual({
        type: "Column",
        children: [
          { type: "Text", props: { content: "First" } },
          { type: "Text", props: { content: "Second" } },
        ],
      });
    });
  });

  describe("visible prop", () => {
    it("should parse visible prop with variable reference", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Secret", visible: isLoggedIn)');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Secret" },
        visible: { kind: "var", name: "isLoggedIn" },
      });
    });

    it("should parse visible prop with boolean literal", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(catalog, 'Text(content: "Always visible", visible: true)');

      expect(ui).toEqual({
        type: "Text",
        props: { content: "Always visible" },
        visible: { kind: "literal", value: true },
      });
    });

    it("should parse visible with other props", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        'Button(label: "Admin Only", size: "lg", visible: isAdmin)'
      );

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Admin Only", size: "lg" },
        visible: { kind: "var", name: "isAdmin" },
      });
    });

    it("should parse visible on components with children", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Card(visible: showCard) {
          Text(content: "Inside card")
        }
      `
      );

      expect(ui).toEqual({
        type: "Card",
        visible: { kind: "var", name: "showCard" },
        children: [{ type: "Text", props: { content: "Inside card" } }],
      });
    });

    it("should parse visible on nested elements", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        `
        Column {
          Text(content: "Always shown")
          Text(content: "Conditionally shown", visible: showExtra)
        }
      `
      );

      expect(ui).toEqual({
        type: "Column",
        children: [
          { type: "Text", props: { content: "Always shown" } },
          {
            type: "Text",
            props: { content: "Conditionally shown" },
            visible: { kind: "var", name: "showExtra" },
          },
        ],
      });
    });

    it("should parse visible with action", () => {
      const catalog = createTestCatalog();
      const ui = parseUI(
        catalog,
        'Button(label: "Delete", visible: canDelete) { onClick: handleDelete }'
      );

      expect(ui).toEqual({
        type: "Button",
        props: { label: "Delete" },
        visible: { kind: "var", name: "canDelete" },
        onClick: { func: "handleDelete" },
      });
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("UI DSL Parser Errors", () => {
  describe("unknown components", () => {
    it("should throw for unknown component name", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, "UnknownComponent")).toThrow(ParseError);
      expect(() => parseUI(catalog, "UnknownComponent")).toThrow(/Unknown component/);
    });

    it("should list available components in error", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, "Foo")).toThrow(/Available:/);
    });
  });

  describe("invalid props", () => {
    it("should throw for unknown prop name", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, 'Text(unknownProp: "value")')).toThrow(ParseError);
      expect(() => parseUI(catalog, 'Text(unknownProp: "value")')).toThrow(
        /Unknown property/
      );
    });

    it("should throw for invalid enum value", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, 'Text(content: "Hi", variant: "invalid")')).toThrow(
        ParseError
      );
    });

    it("should throw for wrong prop type", () => {
      const catalog = createTestCatalog();

      // content expects string, not number
      expect(() => parseUI(catalog, "Text(content: 123)")).toThrow(ParseError);
    });
  });

  describe("children validation", () => {
    it("should throw when adding children to component that doesn't accept them", () => {
      const catalog = createTestCatalog();

      expect(() =>
        parseUI(
          catalog,
          `
          Text(content: "Hi") {
            Text(content: "Child")
          }
        `
        )
      ).toThrow(ParseError);
      expect(() =>
        parseUI(
          catalog,
          `
          Text(content: "Hi") {
            Text(content: "Child")
          }
        `
        )
      ).toThrow(/does not accept children/);
    });
  });

  describe("syntax errors", () => {
    it("should throw for missing closing paren", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, 'Text(content: "Hi"')).toThrow(ParseError);
    });

    it("should throw for missing closing brace", () => {
      const catalog = createTestCatalog();

      expect(() =>
        parseUI(
          catalog,
          `
          Card {
            Text(content: "Hi")
        `
        )
      ).toThrow(ParseError);
    });

    it("should throw for missing colon in props", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, 'Text(content "Hi")')).toThrow(ParseError);
    });

    it("should throw for unterminated string", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, 'Text(content: "unterminated)')).toThrow(ParseError);
      expect(() => parseUI(catalog, 'Text(content: "unterminated)')).toThrow(
        /Unterminated string/
      );
    });

    it("should throw for empty input", () => {
      const catalog = createTestCatalog();

      expect(() => parseUI(catalog, "")).toThrow(ParseError);
      expect(() => parseUI(catalog, "   ")).toThrow(ParseError);
    });

    it("should throw for invalid action name on non-child component", () => {
      const catalog = createTestCatalog();

      // Button doesn't accept children, so { onHover: ... } fails
      // because onHover isn't a valid action keyword
      expect(() =>
        parseUI(catalog, 'Button(label: "Hi") { onHover: handleHover }')
      ).toThrow(ParseError);
      expect(() =>
        parseUI(catalog, 'Button(label: "Hi") { onHover: handleHover }')
      ).toThrow(/does not accept children/);
    });

    it("should throw for invalid action keyword in action block", () => {
      const catalog = createTestCatalog();

      // For a component that accepts children, putting an invalid action
      // results in parsing children (which is valid), then failing on the
      // colon syntax since "onHover: handleHover" isn't a valid child
      expect(() =>
        parseUI(catalog, 'Card { onHover: handleHover }')
      ).toThrow(ParseError);
    });
  });

  describe("error location", () => {
    it("should report line and column in error", () => {
      const catalog = createTestCatalog();

      try {
        parseUI(
          catalog,
          `
Card {
  UnknownThing
}
        `
        );
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const error = e as ParseError;
        expect(error.line).toBe(3);
      }
    });
  });
});

// ============================================================================
// Renderability Tests - Ensure output matches expected UIElement shape
// ============================================================================

describe("Renderability", () => {
  it("should produce valid UIElement for GaistRenderer", () => {
    const catalog = createTestCatalog();
    const ui = parseUI(
      catalog,
      `
      Card {
        Text(content: "Hello")
        Button(label: "Click") { onClick: handleClick }
      }
    `
    );

    // Verify structure matches UIElement type
    expect(ui.type).toBe("Card");
    expect(Array.isArray(ui.children)).toBe(true);

    const [text, button] = ui.children!;

    // Text element
    expect(text.type).toBe("Text");
    expect(text.props).toEqual({ content: "Hello" });
    expect(text.children).toBeUndefined();
    expect(text.onClick).toBeUndefined();

    // Button element
    expect(button.type).toBe("Button");
    expect(button.props).toEqual({ label: "Click" });
    expect(button.onClick).toEqual({ func: "handleClick" });
    expect(button.children).toBeUndefined();
  });

  it("should produce UIElement compatible with text interpolation", () => {
    const catalog = createTestCatalog();
    const ui = parseUI(catalog, 'Text(content: "Count: {{count}}, Name: {{name}}")');

    // The interpolation syntax should be preserved as-is
    // The renderer will handle substitution at runtime
    expect(ui.props?.content).toBe("Count: {{count}}, Name: {{name}}");
  });

  it("should produce action calls with correct Expression types", () => {
    const catalog = createTestCatalog();
    const ui = parseUI(
      catalog,
      'Button(label: "Test") { onClick: myFunc("str", 42, true, varRef) }'
    );

    const args = ui.onClick?.args as Array<{ kind: string; value?: unknown; name?: string }>;
    expect(args).toHaveLength(4);

    // String literal
    expect(args[0]).toEqual({ kind: "literal", value: "str" });

    // Number literal
    expect(args[1]).toEqual({ kind: "literal", value: 42 });

    // Boolean literal
    expect(args[2]).toEqual({ kind: "literal", value: true });

    // Variable reference
    expect(args[3]).toEqual({ kind: "var", name: "varRef" });
  });

  it("should output structure that can be JSON serialized", () => {
    const catalog = createTestCatalog();
    const ui = parseUI(
      catalog,
      `
      Column(gap: "lg") {
        Card(title: "My Card") {
          Text(content: "Content here")
          Row(gap: "sm", align: "center") {
            Badge(text: "Status", variant: "success")
            Button(label: "Action") { onClick: doAction }
          }
        }
        Divider
      }
    `
    );

    // Should serialize and deserialize without loss
    const json = JSON.stringify(ui);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(ui);
  });
});
