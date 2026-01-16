import type { ComponentRegistry } from "./registry.js";
import { defaultComponents } from "./registry.js";
import type { Scope, Stmt, UINode } from "./types.js";
import { Runtime } from "./types.js";

// ============================================================================
// Types
// ============================================================================

export type RenderArgs = {
  runtime: Runtime;
  ui: UINode;
  index?: number;
  scope: Scope;
  components?: Partial<ComponentRegistry>;
  onRuntimeError?: (error: Error | null) => void;
};

// ============================================================================
// Text Interpolation
// ============================================================================

/**
 * Interpolate {{variable}} placeholders in text with scope values.
 * Returns the original placeholder if variable is not found (with warning).
 */
export function renderText(text: string, scope: Scope): string {
  if (!text) return "";

  return text.replace(/{{(.*?)}}/g, (match, rawVarName: string) => {
    const varName = rawVarName.trim();
    if (!varName) return match;

    const value = scope.tryGet(varName);
    if (value === undefined) {
      console.warn(`[Gaist] Variable "${varName}" not found in scope`);
      return match;
    }

    return typeof value === "string" ? value : String(value);
  });
}

// ============================================================================
// Statement Execution
// ============================================================================

/**
 * Execute one or more statements, reporting errors via callback.
 */
function runStatements(
  runtime: Runtime,
  statements: Stmt | Stmt[],
  onRuntimeError?: (error: Error | null) => void
): void {
  const stmts = Array.isArray(statements) ? statements : [statements];

  for (const stmt of stmts) {
    try {
      runtime.evaluateStmt(stmt);
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      onRuntimeError?.(normalized);
      return; // Stop execution on first error
    }
  }
}

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Render a UINode tree to React elements using the provided component registry.
 */
export function render(args: RenderArgs): React.ReactNode {
  const {
    ui,
    runtime,
    index = 0,
    scope,
    components: customComponents,
    onRuntimeError,
  } = args;

  // Merge custom components with defaults
  const components: ComponentRegistry = {
    ...defaultComponents,
    ...customComponents,
  };

  if (!ui) {
    return null;
  }

  switch (ui.type) {
    case "Text": {
      const Text = components.Text;
      return (
        <Text key={index} variant={ui.variant}>
          {renderText(ui.text ?? "", scope)}
        </Text>
      );
    }

    case "Button": {
      const Button = components.Button;
      return (
        <Button
          key={index}
          variant={ui.variant}
          size={ui.size}
          onClick={() => {
            if (!ui.onClick) return;
            runStatements(runtime, ui.onClick, onRuntimeError);
          }}
        >
          {renderText(ui.text ?? "", scope)}
        </Button>
      );
    }

    case "Input": {
      const Input = components.Input;
      const currentValue = ui.value ? scope.tryGet(ui.value) ?? "" : "";
      return (
        <Input
          key={index}
          placeholder={ui.placeholder}
          value={String(currentValue)}
          onChange={(value) => {
            if (ui.value) {
              scope.set(ui.value, value);
            }
          }}
          onSubmit={() => {
            if (ui.onSubmit) {
              runStatements(runtime, ui.onSubmit, onRuntimeError);
            }
          }}
        />
      );
    }

    case "Column": {
      const Column = components.Column;
      return (
        <Column key={index} gap={ui.gap}>
          {renderChildren(args, ui.children)}
        </Column>
      );
    }

    case "Row": {
      const Row = components.Row;
      return (
        <Row key={index} gap={ui.gap} align={ui.align}>
          {renderChildren(args, ui.children)}
        </Row>
      );
    }

    case "Card": {
      const Card = components.Card;
      return <Card key={index}>{renderChildren(args, ui.children)}</Card>;
    }

    case "Badge": {
      const Badge = components.Badge;
      return (
        <Badge key={index} variant={ui.variant}>
          {renderText(ui.text ?? "", scope)}
        </Badge>
      );
    }

    case "Divider": {
      const Divider = components.Divider;
      return <Divider key={index} />;
    }

    // Legacy Container support
    case "Container": {
      const Container = components.Container;
      return (
        <Container key={index}>{renderChildren(args, ui.children)}</Container>
      );
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = ui;
      console.warn(
        `[Gaist] Unknown UI node type: ${(_exhaustive as UINode).type}`
      );
      return null;
    }
  }
}

/**
 * Helper to render child nodes
 */
function renderChildren(
  parentArgs: RenderArgs,
  children: UINode[] | undefined
): React.ReactNode {
  if (!children || children.length === 0) {
    return null;
  }

  return children.map((child, i) =>
    render({
      ...parentArgs,
      ui: child,
      index: i,
    })
  );
}
