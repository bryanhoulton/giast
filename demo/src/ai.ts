import {
  type GaistProgram,
  parseUI,
  type UIElement,
} from 'gaist-react';

import Anthropic from '@anthropic-ai/sdk';

import { catalog } from './catalog';

// ============================================================================
// Types
// ============================================================================

export type GenerateResult =
  | {
      success: true;
      program: GaistProgram;
      dsl: string;
    }
  | {
      success: false;
      error: string;
    };

// ============================================================================
// DSL Prompt Generator
// ============================================================================

function generateDSLPrompt(): string {
  const lines: string[] = [
    "You generate UIs using a custom DSL syntax. Output a single DSL program with three sections:",
    "",
    "## DSL Format",
    "",
    "```",
    "state {",
    "  variableName = initialValue;",
    "  anotherVar = \"string value\";",
    "  isActive = false;",
    "}",
    "",
    "logic {",
    "  function funcName() {",
    "    varName = expression;",
    "  }",
    "  ",
    "  function withParams(param1, param2) {",
    "    varName = param1 + param2;",
    "  }",
    "  ",
    "  function conditional() {",
    "    if condition {",
    "      varName = value;",
    "    } else {",
    "      varName = otherValue;",
    "    }",
    "  }",
    "}",
    "",
    "ui {",
    "  ComponentName(prop: value) {",
    "    ChildComponent(prop: value)",
    "  }",
    "}",
    "```",
    "",
    "## State Section",
    "- Declare variables with `name = value;`",
    "- Supported types: numbers, strings (quoted), booleans (true/false)",
    "",
    "## Logic Section", 
    "- Define functions with `function name(params) { body }`",
    "- Assignment: `varName = expression;`",
    "- Function calls: `funcName(args);`",
    "- Conditionals: `if condition { ... } else { ... }`",
    "- Operators: +, -, *, /, ==, !=, <, <=, >, >=, &&, ||",
    "",
    "## UI Section",
    "- Components use PascalCase names",
    "- Props in parentheses: `Component(prop: value, prop2: value2)`",
    "- String values use quotes: `content: \"Hello\"`",
    "- Children in braces: `Card { Child() }`",
    "- Actions: `Button(label: \"Go\") { onClick: funcName }`",
    "- Action with args: `Button(label: \"Add\") { onClick: add(5) }`",
    "",
    "### Available Components:",
    "",
  ];

  for (const [name, schema] of Object.entries(catalog.schema.components)) {
    lines.push(`#### ${name}`);
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
      lines.push("Action: yes - add `{ onClick: funcName }` or `{ onSubmit: funcName }`");
    }
    lines.push("");
  }

  lines.push("### Text Interpolation");
  lines.push("Use {{varName}} in string props to display state values.");
  lines.push('Example: `content: "Count: {{count}}"`');
  lines.push("");

  return lines.join("\n");
}

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

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `${generateDSLPrompt()}

## Complete Example

Here's a counter example:

\`\`\`
state {
  count = 0;
}

logic {
  function increment() {
    count = count + 1;
  }
  
  function decrement() {
    count = count - 1;
  }
  
  function add(amount) {
    count = count + amount;
  }
  
  function reset() {
    count = 0;
  }
}

ui {
  Card(title: "Counter") {
    Column(gap: "lg") {
      Text(content: "Current count: {{count}}", variant: "heading")
      Row(gap: "sm") {
        Button(label: "-1", variant: "outline") { onClick: decrement }
        Button(label: "+1", variant: "outline") { onClick: increment }
        Button(label: "+10", variant: "secondary") { onClick: add(10) }
      }
      Button(label: "Reset", variant: "ghost") { onClick: reset }
    }
  }
}
\`\`\`

## Guidelines

1. Create clean, professional UIs with proper spacing
2. Use Card to wrap main content
3. Use Column for vertical layouts, Row for horizontal
4. Use appropriate text variants (heading for titles, muted for descriptions)
5. Use appropriate button variants (destructive for delete, ghost for secondary actions)
6. Always declare state variables before using them in UI
7. Define functions in logic before referencing them in onClick

## IMPORTANT: Dynamic Text Pattern

The interpolation system ONLY supports simple variable replacement like \`{{varName}}\`.

DO NOT use ternary expressions or JavaScript in templates:
- WRONG: \`content: "{{isLoggedIn}} ? 'Logout' : 'Login'"\`
- WRONG: \`content: "Count: {{count + 1}}"\`

Instead, use STATE VARIABLES that get updated by your LOGIC functions.

## Conditional Actions (Toggle Pattern)

For buttons that do different things based on state (like Login/Logout), use a SINGLE function with if/else:

\`\`\`
function toggle() {
  if isOn {
    isOn = false;
    label = "Turn On";
  } else {
    isOn = true;
    label = "Turn Off";
  }
}
\`\`\`

## Output Format

Output ONLY the DSL code. No markdown fences, no explanations. Just the raw DSL starting with \`state {\` or \`logic {\` or \`ui {\`.`;

// ============================================================================
// DSL Parser (state/logic sections)
// ============================================================================

interface ParsedProgram {
  state: GaistProgram["state"];
  logic: GaistProgram["logic"];
  uiDsl: string;
}

function parseDSL(dsl: string): ParsedProgram {
  const state: GaistProgram["state"] = [];
  const logic: GaistProgram["logic"] = [];
  let uiDsl = "";

  // Extract sections using regex
  const stateMatch = dsl.match(/state\s*\{([\s\S]*?)\}(?=\s*(?:logic|ui|$))/);
  const logicMatch = dsl.match(/logic\s*\{([\s\S]*?)\}(?=\s*(?:ui|$))/);
  const uiMatch = dsl.match(/ui\s*\{([\s\S]*)\}$/);

  // Parse state section
  if (stateMatch) {
    const stateBody = stateMatch[1];
    const varMatches = stateBody.matchAll(/(\w+)\s*=\s*([^;]+);/g);
    for (const match of varMatches) {
      const name = match[1];
      const valueStr = match[2].trim();
      let init: unknown;
      
      if (valueStr === "true") {
        init = true;
      } else if (valueStr === "false") {
        init = false;
      } else if (valueStr.startsWith('"') || valueStr.startsWith("'")) {
        init = valueStr.slice(1, -1);
      } else if (!isNaN(Number(valueStr))) {
        init = Number(valueStr);
      } else {
        init = valueStr;
      }
      
      state.push({ name, init });
    }
  }

  // Parse logic section
  if (logicMatch) {
    const logicBody = logicMatch[1];
    const funcMatches = logicBody.matchAll(/function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}(?=\s*(?:function|$))/g);
    
    for (const match of funcMatches) {
      const name = match[1];
      const paramsStr = match[2].trim();
      const bodyStr = match[3];
      
      const params = paramsStr ? paramsStr.split(",").map(p => p.trim()).filter(Boolean) : undefined;
      const body = parseStatements(bodyStr);
      
      logic.push({ name, params, body });
    }
  }

  // Extract UI section content
  if (uiMatch) {
    uiDsl = uiMatch[1].trim();
  }

  return { state, logic, uiDsl };
}

function parseStatements(code: string): GaistProgram["logic"][0]["body"] {
  const statements: GaistProgram["logic"][0]["body"] = [];
  let remaining = code.trim();
  
  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (!remaining) break;
    
    // Check for if statement
    const ifMatch = remaining.match(/^if\s+(.+?)\s*\{([\s\S]*?)\}(?:\s*else\s*\{([\s\S]*?)\})?/);
    if (ifMatch) {
      const condStr = ifMatch[1];
      const thenStr = ifMatch[2];
      const elseStr = ifMatch[3];
      
      statements.push({
        kind: "if",
        cond: parseExpression(condStr),
        then: parseStatements(thenStr),
        ...(elseStr ? { else: parseStatements(elseStr) } : {}),
      });
      
      remaining = remaining.slice(ifMatch[0].length).trim();
      continue;
    }
    
    // Check for function call: funcName(args);
    const callMatch = remaining.match(/^(\w+)\s*\(([^)]*)\)\s*;/);
    if (callMatch) {
      const func = callMatch[1];
      const argsStr = callMatch[2].trim();
      const args = argsStr ? argsStr.split(",").map(a => parseExpression(a.trim())) : [];
      
      statements.push({ kind: "call", func, args });
      remaining = remaining.slice(callMatch[0].length).trim();
      continue;
    }
    
    // Check for assignment: varName = expr;
    const assignMatch = remaining.match(/^(\w+)\s*=\s*([^;]+);/);
    if (assignMatch) {
      const target = assignMatch[1];
      const exprStr = assignMatch[2];
      
      statements.push({
        kind: "assign",
        target,
        expr: parseExpression(exprStr),
      });
      
      remaining = remaining.slice(assignMatch[0].length).trim();
      continue;
    }
    
    // Skip unknown content
    const nextSemi = remaining.indexOf(";");
    if (nextSemi > -1) {
      remaining = remaining.slice(nextSemi + 1).trim();
    } else {
      break;
    }
  }
  
  return statements;
}

function parseExpression(expr: string): GaistProgram["logic"][0]["body"][0] extends { expr: infer E } ? E : never {
  expr = expr.trim();
  
  // Check for binary operators (in order of precedence)
  const ops = ["||", "&&", "==", "!=", "<=", ">=", "<", ">", "+", "-", "*", "/"];
  
  for (const op of ops) {
    // Find the operator, but not inside strings or parentheses
    let depth = 0;
    let inString = false;
    let stringChar = "";
    
    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i];
      
      if (inString) {
        if (char === stringChar && expr[i - 1] !== "\\") {
          inString = false;
        }
        continue;
      }
      
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (char === ")") depth++;
      if (char === "(") depth--;
      
      if (depth === 0 && expr.slice(i, i + op.length) === op) {
        const left = expr.slice(0, i).trim();
        const right = expr.slice(i + op.length).trim();
        
        if (left && right) {
          return {
            kind: "binary",
            op,
            left: parseExpression(left),
            right: parseExpression(right),
          } as ReturnType<typeof parseExpression>;
        }
      }
    }
  }
  
  // Parenthesized expression
  if (expr.startsWith("(") && expr.endsWith(")")) {
    return parseExpression(expr.slice(1, -1));
  }
  
  // String literal
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return { kind: "literal", value: expr.slice(1, -1) } as ReturnType<typeof parseExpression>;
  }
  
  // Boolean literal
  if (expr === "true") {
    return { kind: "literal", value: true } as ReturnType<typeof parseExpression>;
  }
  if (expr === "false") {
    return { kind: "literal", value: false } as ReturnType<typeof parseExpression>;
  }
  
  // Number literal
  if (!isNaN(Number(expr))) {
    return { kind: "literal", value: Number(expr) } as ReturnType<typeof parseExpression>;
  }
  
  // Variable reference
  return { kind: "var", name: expr } as ReturnType<typeof parseExpression>;
}

// ============================================================================
// Generate Function (Streaming)
// ============================================================================

export interface StreamCallbacks {
  onToken?: (partialDsl: string) => void;
  onRetry?: (attempt: number, error: string) => void;
}

export async function generateUI(
  apiKey: string,
  prompt: string,
  callbacks?: StreamCallbacks | ((attempt: number, error: string) => void)
): Promise<GenerateResult> {
  // Support old signature for backwards compatibility
  const { onToken, onRetry } = typeof callbacks === 'function' 
    ? { onToken: undefined, onRetry: callbacks }
    : (callbacks ?? {});

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
          content: `${prompt}\n\nPrevious attempt had an error: ${lastError}\n\nPlease fix and output valid DSL.`,
        });
      }

      // Use streaming
      let dslText = "";
      
      const stream = client.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          dslText += event.delta.text;
          
          // Strip markdown fences for display
          let displayDsl = dslText.trim();
          if (displayDsl.startsWith("```")) {
            displayDsl = displayDsl.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
          }
          
          onToken?.(displayDsl);
        }
      }

      dslText = dslText.trim();
      
      // Strip markdown fences if present
      if (dslText.startsWith("```")) {
        dslText = dslText.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
      }

      console.log("[Anthropic] Response:", dslText);

      // Parse the DSL
      const { state, logic, uiDsl } = parseDSL(dslText);

      // Parse the UI section
      let ui: UIElement;
      try {
        ui = parseUI(catalog, uiDsl);
      } catch (parseError) {
        throw new Error(`UI parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      const program: GaistProgram = {
        state,
        logic,
        ui,
      };

      return {
        success: true,
        program,
        dsl: dslText,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        lastError = `Invalid syntax: ${error.message}`;
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
