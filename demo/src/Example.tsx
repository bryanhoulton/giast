import { useMemo, useState } from "react";

import {
  type Expression,
  type GaistProgram,
  GaistRenderer,
  parseUI,
  type Statement,
  type UIElement,
} from "gaist-react";

import { catalog } from "./catalog";
import { components } from "./components";

// ============================================================================
// Types
// ============================================================================

export type ExampleTab = "rendered" | "gaist" | "json";

interface ExampleProps {
  dsl: string;
  initialTab?: ExampleTab;
  title?: string;
}

// ============================================================================
// DSL Parser
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
    const funcMatches = logicBody.matchAll(
      /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}(?=\s*(?:function|$))/g
    );

    for (const match of funcMatches) {
      const name = match[1];
      const paramsStr = match[2].trim();
      const bodyStr = match[3];

      const params = paramsStr
        ? paramsStr
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined;
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

function parseStatements(code: string): Statement[] {
  const statements: Statement[] = [];
  let remaining = code.trim();

  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (!remaining) break;

    // Check for if statement
    const ifMatch = remaining.match(
      /^if\s+(.+?)\s*\{([\s\S]*?)\}(?:\s*else\s*\{([\s\S]*?)\})?/
    );
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
      const args = argsStr
        ? argsStr.split(",").map((a) => parseExpression(a.trim()))
        : [];

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

function parseExpression(expr: string): Expression {
  expr = expr.trim();

  // Check for binary operators (in order of precedence)
  const ops = [
    "||",
    "&&",
    "==",
    "!=",
    "<=",
    ">=",
    "<",
    ">",
    "+",
    "-",
    "*",
    "/",
  ];

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
          };
        }
      }
    }
  }

  // Parenthesized expression
  if (expr.startsWith("(") && expr.endsWith(")")) {
    return parseExpression(expr.slice(1, -1));
  }

  // String literal
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  ) {
    return { kind: "literal", value: expr.slice(1, -1) };
  }

  // Boolean literal
  if (expr === "true") {
    return { kind: "literal", value: true };
  }
  if (expr === "false") {
    return { kind: "literal", value: false };
  }

  // Number literal
  if (!isNaN(Number(expr))) {
    return { kind: "literal", value: Number(expr) };
  }

  // Function call: funcName(args)
  const funcMatch = expr.match(/^(\w+)\s*\((.*)?\)$/);
  if (funcMatch) {
    const func = funcMatch[1];
    const argsStr = funcMatch[2]?.trim() || "";

    // Parse arguments, handling nested function calls
    const args: Expression[] = [];
    if (argsStr) {
      let depth = 0;
      let current = "";

      for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "," && depth === 0) {
          args.push(parseExpression(current.trim()));
          current = "";
        } else {
          current += char;
        }
      }
      if (current.trim()) {
        args.push(parseExpression(current.trim()));
      }
    }

    return { kind: "call", func, args };
  }

  // Variable reference
  return { kind: "var", name: expr };
}

// ============================================================================
// Compile DSL to Program
// ============================================================================

function compileDSL(dsl: string): { program: GaistProgram; error?: string } {
  try {
    const { state, logic, uiDsl } = parseDSL(dsl);

    let ui: UIElement;
    try {
      ui = parseUI(catalog, uiDsl);
    } catch (parseError) {
      return {
        program: { state: [], logic: [], ui: { type: "Column", props: {}, children: [] } },
        error: `UI parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      };
    }

    return {
      program: { state, logic, ui },
    };
  } catch (error) {
    return {
      program: { state: [], logic: [], ui: { type: "Column", props: {}, children: [] } },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Example Component
// ============================================================================

export function Example({ dsl, initialTab = "rendered", title }: ExampleProps) {
  const [tab, setTab] = useState<ExampleTab>(initialTab);

  const { program, error } = useMemo(() => compileDSL(dsl), [dsl]);

  const tabLabel = (t: ExampleTab) => {
    switch (t) {
      case "rendered":
        return "Preview";
      case "gaist":
        return ".gaist";
      case "json":
        return ".json";
    }
  };

  return (
    <div className="border border-[#eee] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eee] flex items-center justify-between">
        <span className="text-xs text-[#999] font-mono">
          {title || "example"}
        </span>
        <div className="flex items-center gap-1">
          {(["rendered", "gaist", "json"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                tab === t
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#999] hover:text-[#666] hover:bg-[#f0f0f0]"
              }`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white">
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {tab === "rendered" && (
          <div className="p-6">
            <GaistRenderer
              key={dsl}
              catalog={catalog}
              components={components}
              program={program}
            />
          </div>
        )}

        {tab === "gaist" && (
          <div className="p-4 bg-[#1a1a1a] overflow-x-auto">
            <pre className="text-sm font-mono text-[#e6e6e6] leading-relaxed whitespace-pre-wrap">
              {dsl}
            </pre>
          </div>
        )}

        {tab === "json" && (
          <div className="p-4 bg-[#1a1a1a] overflow-x-auto">
            <pre className="text-sm font-mono text-[#e6e6e6] leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(program, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
