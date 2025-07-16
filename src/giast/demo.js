import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState, } from 'react';
import { compile } from './compiler';
import { RuntimeComponent } from './runtime/component';
const exampleCode = `// Example giast program - Counter app
state {
  count = 0;
}

logic {
  function add(x) {
    count = count + x;
  }
  
  function reset() {
    count = 0;
  }
}

init {
  add(1);
}

ui {
  Container {
    Button {
      text: "Click me {{count}}";
      onClick: add(1);
    }
    
    Button {
      text: "Reset";
      onClick: reset();
    }
    
    Text {
      text: "Current count: {{count}}";
    }
  }
}`;
export function CompilerDemo() {
    const [code, setCode] = useState(exampleCode);
    const [program, setProgram] = useState(null);
    const [error, setError] = useState(null);
    const runParser = () => {
        try {
            setError(null);
            const program = compile(code);
            return program;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Parser error: ${errorMessage}`);
            console.error("Parser error:", err);
        }
    };
    useEffect(() => {
        setError(null);
        const program = runParser();
        setProgram(program ?? null);
    }, [code]);
    const programComponent = useMemo(() => {
        if (!program)
            return null;
        return (_jsx(RuntimeComponent, { config: {
                program,
                loggerConfig: {
                    printTypes: ["expr", "stmt", "scope"],
                    storeTypes: ["expr", "stmt", "scope"],
                },
            } }));
    }, [program]);
    return (_jsxs("div", { className: "w-full h-full grid grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("h2", { children: "Giast Compiler Demo" }), _jsx("textarea", { value: code, onChange: (e) => {
                            setCode(e.target.value);
                        }, className: "bg-gray-800 border border-gray-700 text-white rounded-md p-2 w-full grow", children: exampleCode }), error && (_jsxs("div", { style: {
                            color: "red",
                            backgroundColor: "#ffebee",
                            padding: "10px",
                            borderRadius: "4px",
                            marginBottom: "20px",
                        }, children: [_jsx("strong", { children: "Error:" }), " ", error] }))] }), _jsx("div", { className: "flex flex-col gap-4 justify-center items-center", children: programComponent })] }));
}
