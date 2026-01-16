import Anthropic from "@anthropic-ai/sdk";
import type { GaistProgram } from "gaist-react";
import { catalog } from "./catalog";

// ============================================================================
// Types
// ============================================================================

export type GenerateResult =
  | {
      success: true;
      program: GaistProgram;
    }
  | {
      success: false;
      error: string;
    };

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `${catalog.generatePrompt()}

## Example Program

Here's a complete counter example:

\`\`\`json
{
  "state": [
    { "name": "count", "init": 0 }
  ],
  "logic": [
    {
      "name": "increment",
      "body": [
        {
          "kind": "assign",
          "target": "count",
          "expr": {
            "kind": "binary",
            "op": "+",
            "left": { "kind": "var", "name": "count" },
            "right": { "kind": "literal", "value": 1 }
          }
        }
      ]
    },
    {
      "name": "add",
      "params": ["amount"],
      "body": [
        {
          "kind": "assign",
          "target": "count",
          "expr": {
            "kind": "binary",
            "op": "+",
            "left": { "kind": "var", "name": "count" },
            "right": { "kind": "var", "name": "amount" }
          }
        }
      ]
    },
    {
      "name": "reset",
      "body": [
        {
          "kind": "assign",
          "target": "count",
          "expr": { "kind": "literal", "value": 0 }
        }
      ]
    }
  ],
  "ui": {
    "type": "Card",
    "props": { "title": "Counter" },
    "children": [
      {
        "type": "Column",
        "props": { "gap": "lg" },
        "children": [
          { "type": "Text", "props": { "content": "Current count: {{count}}", "variant": "heading" } },
          {
            "type": "Row",
            "props": { "gap": "sm" },
            "children": [
              { "type": "Button", "props": { "label": "-1", "variant": "outline" }, "onClick": { "func": "add", "args": [{ "kind": "literal", "value": -1 }] } },
              { "type": "Button", "props": { "label": "+1", "variant": "outline" }, "onClick": { "func": "increment" } },
              { "type": "Button", "props": { "label": "+10", "variant": "secondary" }, "onClick": { "func": "add", "args": [{ "kind": "literal", "value": 10 }] } }
            ]
          },
          { "type": "Button", "props": { "label": "Reset", "variant": "ghost" }, "onClick": { "func": "reset" } }
        ]
      }
    ]
  }
}
\`\`\`

## Guidelines

1. Create clean, professional UIs with proper spacing
2. Use Card to wrap main content
3. Use Column for vertical layouts, Row for horizontal
4. Use appropriate text variants (heading for titles, muted for descriptions)
5. Use appropriate button variants (destructive for delete, ghost for secondary actions)
6. Always declare state variables before using them
7. Define functions in logic before referencing them in onClick

## IMPORTANT: Dynamic Text Pattern

The interpolation system ONLY supports simple variable replacement like \`{{varName}}\`.

DO NOT use ternary expressions or JavaScript in templates:
- WRONG: \`"label": "{{isLoggedIn}} ? 'Logout' : 'Login'"\`
- WRONG: \`"content": "Count: {{count + 1}}"\`

Instead, use STATE VARIABLES that get updated by your LOGIC functions:

\`\`\`json
{
  "state": [
    { "name": "isLoggedIn", "init": false },
    { "name": "buttonLabel", "init": "Sign In" },
    { "name": "statusText", "init": "Enter credentials" }
  ],
  "logic": [
    {
      "name": "login",
      "body": [
        { "kind": "assign", "target": "isLoggedIn", "expr": { "kind": "literal", "value": true } },
        { "kind": "assign", "target": "buttonLabel", "expr": { "kind": "literal", "value": "Sign Out" } },
        { "kind": "assign", "target": "statusText", "expr": { "kind": "literal", "value": "Welcome back!" } }
      ]
    },
    {
      "name": "logout",
      "body": [
        { "kind": "assign", "target": "isLoggedIn", "expr": { "kind": "literal", "value": false } },
        { "kind": "assign", "target": "buttonLabel", "expr": { "kind": "literal", "value": "Sign In" } },
        { "kind": "assign", "target": "statusText", "expr": { "kind": "literal", "value": "Enter credentials" } }
      ]
    }
  ],
  "ui": {
    "type": "Button",
    "props": { "label": "{{buttonLabel}}" },
    "onClick": { "func": "login" }
  }
}
\`\`\`

This pattern: State holds the current text → Logic functions update the text → UI displays \`{{stateVar}}\`

## Conditional Actions (Toggle Pattern)

For buttons that do different things based on state (like Login/Logout), use a SINGLE function that checks state internally:

\`\`\`json
{
  "name": "toggleAuth",
  "body": [
    {
      "kind": "if",
      "cond": { "kind": "var", "name": "isLoggedIn" },
      "then": [
        { "kind": "assign", "target": "isLoggedIn", "expr": { "kind": "literal", "value": false } },
        { "kind": "assign", "target": "buttonLabel", "expr": { "kind": "literal", "value": "Sign In" } }
      ],
      "else": [
        { "kind": "assign", "target": "isLoggedIn", "expr": { "kind": "literal", "value": true } },
        { "kind": "assign", "target": "buttonLabel", "expr": { "kind": "literal", "value": "Sign Out" } }
      ]
    }
  ]
}
\`\`\`

The button always calls \`toggleAuth\` - the function handles the conditional logic internally.

## Conditional Visibility

Any UI element can have a \`visible\` expression. If it evaluates to false, the element is not rendered:

\`\`\`json
{
  "type": "Text",
  "props": { "content": "Welcome back!", "variant": "heading" },
  "visible": { "kind": "var", "name": "isLoggedIn" }
}
\`\`\`

You can use comparison expressions:

\`\`\`json
{
  "type": "Badge",
  "props": { "text": "Low stock!", "variant": "warning" },
  "visible": {
    "kind": "binary",
    "op": "<",
    "left": { "kind": "var", "name": "quantity" },
    "right": { "kind": "literal", "value": 10 }
  }
}
\`\`\`

This is useful for showing/hiding elements based on state (e.g., show logout button only when logged in).

Output ONLY valid JSON. No markdown fences or explanations.`;

// ============================================================================
// Generate Function
// ============================================================================

export async function generateUI(
  apiKey: string,
  prompt: string,
  onRetry?: (attempt: number, error: string) => void
): Promise<GenerateResult> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  let lastError: string | undefined;

  // Try up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const messages: Anthropic.MessageParam[] = [];

      if (attempt === 1) {
        messages.push({
          role: "user",
          content: prompt,
        });
      } else {
        messages.push({
          role: "user",
          content: `${prompt}\n\nPrevious attempt had an error: ${lastError}\n\nPlease fix and output valid JSON only.`,
        });
      }

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }

      let jsonText = textBlock.text.trim();

      // Strip markdown code fences if present
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
      }

      console.log("[Anthropic] Response:", jsonText);

      // Parse JSON
      const program = JSON.parse(jsonText) as GaistProgram;

      // Basic validation
      if (!program.ui) {
        throw new Error("Program missing 'ui' field");
      }

      return {
        success: true,
        program,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        lastError = `Invalid JSON: ${error.message}`;
      } else if (error instanceof Error) {
        lastError = error.message;
      } else {
        lastError = String(error);
      }

      onRetry?.(attempt, lastError);

      if (attempt === 3) {
        return {
          success: false,
          error: `Failed after 3 attempts. Last error: ${lastError}`,
        };
      }
    }
  }

  return {
    success: false,
    error: "Unexpected error",
  };
}
