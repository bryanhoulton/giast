import { Button } from './Button.js';
import {
  Runtime,
  Scope,
  UINode,
} from './types.js';

export type RenderArgs = {
  runtime: Runtime;
  ui: UINode;
  index?: number;
  scope: Scope;
};

export function renderText(text: string, scope: Scope): string {
  const templateVars = text.match(/{{.*?}}/g);
  if (!templateVars) {
    return text;
  }
  const vars = templateVars.map((value) => value.slice(2, -2));
  const values = vars.map((varName) => scope.get(varName));
  for (let i = 0; i < vars.length; i++) {
    text = text.replace(templateVars[i], values[i].toString());
  }
  return text;
}

export function render(args: RenderArgs): React.ReactNode {
  const { ui, runtime, index = 0, scope } = args;
  switch (ui.type) {
    case "Text":
      return <div key={index}>{renderText(ui.text || "", scope)}</div>;
    case "Button":
      return (
        <Button
          key={index}
          onClick={() => {
            if (!ui.onClick) return;
            if (Array.isArray(ui.onClick)) {
              ui.onClick.forEach((stmt) => {
                // runtime.evaluateStmt(stmt);
                console.log("Button clicked:", stmt);
              });
            } else {
              // runtime.evaluateStmt(ui.onClick);
              console.log("Button clicked:", ui.onClick);
            }
          }}
        >
          {renderText(ui.text || "", scope)}
        </Button>
      );
    case "Column":
      return (
        <div
          className="flex flex-col gap-2 border border-dashed border-gray-500 rounded-lg p-2"
          key={index}
        >
          {ui.children?.map((child, i) =>
            render({ ...args, ui: child, index: i, scope })
          )}
        </div>
      );
    case "Container":
      return (
        <div
          className="flex gap-2 border border-dashed border-gray-500 rounded-lg p-2"
          key={index}
        >
          {ui.children?.map((child, i) =>
            render({ ...args, ui: child, index: i, scope })
          )}
        </div>
      );
  }
}
