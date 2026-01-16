import { z } from "zod";
import type { ReactNode } from "react";

// ============================================================================
// Schema Types (for LLM prompt generation)
// ============================================================================

export type ComponentSchema = {
  /** Zod schema for component props */
  props: z.ZodObject<z.ZodRawShape>;
  /** Whether this component accepts children */
  children?: boolean;
  /** Whether this component has an action (onClick, onSubmit) */
  action?: boolean;
  /** Description for the LLM */
  description?: string;
};

export type CatalogSchema = {
  components: Record<string, ComponentSchema>;
};

// ============================================================================
// Render Types (for your components)
// ============================================================================

export type ElementNode<TProps = Record<string, unknown>> = {
  type: string;
  props: TProps;
  action?: ActionCall;
  children?: ElementNode[];
};

export type ActionCall = {
  func: string;
  args?: unknown[];
};

export type RenderContext<TState = Record<string, unknown>> = {
  /** The element being rendered */
  element: ElementNode;
  /** Rendered children (if component accepts children) */
  children?: ReactNode;
  /** Current state values */
  state: TState;
  /** Update a state value */
  setState: (key: string, value: unknown) => void;
  /** Execute the element's action (if it has one) */
  onAction?: () => void;
};

export type ComponentRenderFn<TState = Record<string, unknown>> = (
  ctx: RenderContext<TState>
) => ReactNode;

export type ComponentRegistry<TState = Record<string, unknown>> = Record<
  string,
  ComponentRenderFn<TState>
>;

// ============================================================================
// Program Types (what the LLM generates)
// ============================================================================

export type StateVar = {
  name: string;
  init: unknown;
};

export type FuncDef = {
  name: string;
  params?: string[];
  body: Statement[];
};

export type Statement =
  | { kind: "assign"; target: string; expr: Expression }
  | { kind: "call"; func: string; args?: Expression[] }
  | { kind: "if"; cond: Expression; then: Statement[]; else?: Statement[] };

export type Expression =
  | { kind: "literal"; value: unknown }
  | { kind: "var"; name: string }
  | { kind: "binary"; op: string; left: Expression; right: Expression };

export type UIElement = {
  type: string;
  props?: Record<string, unknown>;
  children?: UIElement[];
  onClick?: ActionCall;
  onSubmit?: ActionCall;
  /** Optional expression that determines if this element is visible */
  visible?: Expression;
};

export type GaistProgram = {
  state?: StateVar[];
  logic?: FuncDef[];
  ui: UIElement;
};

// ============================================================================
// Catalog Class
// ============================================================================

export class Catalog {
  readonly schema: CatalogSchema;

  constructor(schema: CatalogSchema) {
    this.schema = schema;
  }

  /**
   * Generate a system prompt for the LLM
   */
  generatePrompt(): string {
    const lines: string[] = [
      "You generate UIs as JSON. Output a JSON object with this structure:",
      "",
      "```json",
      "{",
      '  "state": [{ "name": "varName", "init": initialValue }, ...],',
      '  "logic": [{ "name": "funcName", "params": ["p1"], "body": [...] }, ...],',
      '  "ui": { "type": "ComponentName", "props": {...}, "children": [...] }',
      "}",
      "```",
      "",
      "## State",
      "Declare reactive variables that the UI can read and functions can modify.",
      "",
      "## Logic", 
      "Define functions that modify state. Statements can be:",
      '- `{ "kind": "assign", "target": "varName", "expr": <expression> }`',
      '- `{ "kind": "call", "func": "funcName", "args": [<expr>, ...] }`',
      '- `{ "kind": "if", "cond": <expr>, "then": [...], "else": [...] }`',
      "",
      "Expressions can be:",
      '- `{ "kind": "literal", "value": 123 }` or `{ "kind": "literal", "value": "text" }`',
      '- `{ "kind": "var", "name": "varName" }`',
      '- `{ "kind": "binary", "op": "+", "left": <expr>, "right": <expr> }`',
      "",
      "Operators: +, -, *, /, ==, !=, <, <=, >, >=, &&, ||",
      "",
      "## Available Components",
      "",
    ];

    for (const [name, schema] of Object.entries(this.schema.components)) {
      lines.push(`### ${name}`);
      if (schema.description) {
        lines.push(schema.description);
      }

      const shape = schema.props.shape;
      if (Object.keys(shape).length > 0) {
        lines.push("Props:");
        for (const [propName, propSchema] of Object.entries(shape)) {
          lines.push(`  - ${propName}: ${describeZodType(propSchema)}`);
        }
      }

      if (schema.children) {
        lines.push("Children: yes");
      }
      if (schema.action) {
        lines.push('Action: yes - add `"onClick": { "func": "funcName", "args": [...] }`');
      }
      lines.push("");
    }

    lines.push("## Text Interpolation");
    lines.push("Use {{varName}} in string props to display state values.");
    lines.push('Example: `"text": "Count: {{count}}"`');
    lines.push("");

    return lines.join("\n");
  }

  /**
   * Generate JSON schema for structured output
   */
  generateJsonSchema(): object {
    const componentSchemas = Object.entries(this.schema.components).map(
      ([name, schema]) => {
        const properties: Record<string, object> = {
          type: { const: name },
        };
        const required: string[] = ["type"];

        // Props
        if (Object.keys(schema.props.shape).length > 0) {
          properties.props = zodToJsonSchema(schema.props);
        }

        // Children
        if (schema.children) {
          properties.children = {
            type: "array",
            items: { $ref: "#/definitions/UIElement" },
          };
        }

        // Action
        if (schema.action) {
          const actionSchema = {
            type: "object",
            properties: {
              func: { type: "string" },
              args: { type: "array" },
            },
            required: ["func"],
          };
          properties.onClick = actionSchema;
          properties.onSubmit = actionSchema;
        }

        return {
          type: "object",
          properties,
          required,
        };
      }
    );

    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      definitions: {
        Expression: {
          oneOf: [
            {
              type: "object",
              properties: {
                kind: { const: "literal" },
                value: {},
              },
              required: ["kind", "value"],
            },
            {
              type: "object",
              properties: {
                kind: { const: "var" },
                name: { type: "string" },
              },
              required: ["kind", "name"],
            },
            {
              type: "object",
              properties: {
                kind: { const: "binary" },
                op: { type: "string" },
                left: { $ref: "#/definitions/Expression" },
                right: { $ref: "#/definitions/Expression" },
              },
              required: ["kind", "op", "left", "right"],
            },
          ],
        },
        Statement: {
          oneOf: [
            {
              type: "object",
              properties: {
                kind: { const: "assign" },
                target: { type: "string" },
                expr: { $ref: "#/definitions/Expression" },
              },
              required: ["kind", "target", "expr"],
            },
            {
              type: "object",
              properties: {
                kind: { const: "call" },
                func: { type: "string" },
                args: { type: "array", items: { $ref: "#/definitions/Expression" } },
              },
              required: ["kind", "func"],
            },
            {
              type: "object",
              properties: {
                kind: { const: "if" },
                cond: { $ref: "#/definitions/Expression" },
                then: { type: "array", items: { $ref: "#/definitions/Statement" } },
                else: { type: "array", items: { $ref: "#/definitions/Statement" } },
              },
              required: ["kind", "cond", "then"],
            },
          ],
        },
        UIElement: {
          oneOf: componentSchemas,
        },
      },
      type: "object",
      properties: {
        state: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              init: {},
            },
            required: ["name", "init"],
          },
        },
        logic: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              params: { type: "array", items: { type: "string" } },
              body: { type: "array", items: { $ref: "#/definitions/Statement" } },
            },
            required: ["name", "body"],
          },
        },
        ui: { $ref: "#/definitions/UIElement" },
      },
      required: ["ui"],
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCatalog(schema: CatalogSchema): Catalog {
  return new Catalog(schema);
}

// ============================================================================
// Helpers
// ============================================================================

function describeZodType(schema: unknown): string {
  const s = schema as { _def?: { typeName?: string; innerType?: unknown; values?: unknown[] } };
  const typeName = s._def?.typeName;

  switch (typeName) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodEnum": {
      const values = s._def?.values as string[] | undefined;
      return values ? `"${values.join('" | "')}"` : "enum";
    }
    case "ZodOptional":
      return `${describeZodType(s._def?.innerType)} (optional)`;
    case "ZodDefault":
      return `${describeZodType(s._def?.innerType)}`;
    default:
      return "any";
  }
}

function zodToJsonSchema(schema: unknown): object {
  const s = schema as { 
    _def?: { typeName?: string; innerType?: unknown; values?: unknown[] }; 
    shape?: Record<string, unknown> 
  };
  const typeName = s._def?.typeName;

  switch (typeName) {
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodEnum": {
      const values = s._def?.values as string[] | undefined;
      return { type: "string", enum: values ?? [] };
    }
    case "ZodOptional":
    case "ZodDefault":
      return zodToJsonSchema(s._def?.innerType);
    case "ZodObject": {
      const shape = s.shape ?? {};
      const properties: Record<string, object> = {};
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value);
      }
      return { type: "object", properties };
    }
    default:
      return {};
  }
}
