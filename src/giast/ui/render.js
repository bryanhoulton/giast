import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from './Button';
export function renderText(text, scope) {
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
export function render(args) {
    const { ui, runtime, index = 0, scope } = args;
    switch (ui.type) {
        case "Text":
            return _jsx("div", { children: renderText(ui.text, scope) }, index);
        case "Button":
            return (_jsx(Button, { onClick: () => {
                    if (!ui.onClick)
                        return;
                    if (Array.isArray(ui.onClick)) {
                        ui.onClick.forEach((stmt) => {
                            runtime.evaluateStmt(stmt);
                        });
                    }
                    else {
                        runtime.evaluateStmt(ui.onClick);
                    }
                }, children: renderText(ui.text, scope) }, index));
        case "Column":
            return (_jsx("div", { children: ui.children?.map((child, i) => render({ ...args, ui: child, index: i, scope })) }, index));
        case "Container":
            return (_jsx("div", { children: ui.children?.map((child, i) => render({ ...args, ui: child, index: i, scope })) }, index));
    }
}
