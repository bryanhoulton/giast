import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState, } from 'react';
import { Runtime, } from './';
export function RuntimeComponent({ config, ...props }) {
    const [, forceUpdate] = useState({});
    const [error, setError] = useState(null);
    const runtime = useMemo(() => new Runtime(config), [config]);
    useEffect(() => {
        // Subscribe to runtime changes
        const unsubscribe = runtime.onChange(() => {
            forceUpdate({});
        });
        return unsubscribe;
    }, []);
    useEffect(() => {
        if (!runtime.hasRun) {
            try {
                runtime.run();
            }
            catch (error) {
                setError(error);
            }
        }
    }, [runtime]);
    return (_jsx("div", { ...props, children: error ? (_jsxs("div", { className: "text-red-500 flex flex-col gap-2 bg-red-500/10 p-4 rounded-md", children: [_jsx("div", { className: "font-bold", children: "Runtime Error" }), _jsx("div", { className: "text-sm", children: error.message })] })) : (runtime.render()) }));
}
