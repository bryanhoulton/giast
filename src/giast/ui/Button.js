import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../utils';
export function Button({ onClick, className, children }) {
    return (_jsx("button", { className: cn("bg-black border text-white px-2 py-1 rounded-md cursor-pointer", className), onClick: onClick, children: children }));
}
