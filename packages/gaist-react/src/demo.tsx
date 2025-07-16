import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { RuntimeComponent } from './component.js';
import { Program } from './types.js';

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

// Placeholder compile function (in real scenario, this would import from gaist package)
function compile(code: string): Program {
  return {
    spec: "gaist/0.1",
    state: { vars: [{ name: "count", init: { type: "literal", value: 0 } }] },
    logic: { funcs: [] },
    init: [],
    ui: {
      type: "Container",
      children: [
        {
          type: "Button",
          text: "Click me {{count}}",
          onClick: {
            type: "call",
            name: "add",
            args: [{ type: "literal", value: 1 }],
          },
        },
        {
          type: "Button",
          text: "Reset",
          onClick: { type: "call", name: "reset", args: [] },
        },
        {
          type: "Text",
          text: "Current count: {{count}}",
        },
      ],
    },
  };
}

export function CompilerDemo() {
  const [code, setCode] = useState(exampleCode);
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runParser = () => {
    try {
      setError(null);
      const program = compile(code);
      return program;
    } catch (err) {
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
    if (!program) return null;
    return (
      <RuntimeComponent
        config={{
          program,
          loggerConfig: {
            printTypes: ["expr", "stmt", "scope"],
            storeTypes: ["expr", "stmt", "scope"],
          },
        }}
      />
    );
  }, [program]);

  return (
    <div className="w-full h-full grid grid-cols-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-bold">Giast Demo</h2>
        <p className="text-lg">
          Giast is a generative interface abstract syntax tree, shipped with a
          compiler for easy use. It can also be used via a JSON AST instead,
          which makes it ideal for output by LLMs.
        </p>

        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
          className="bg-gray-800 border border-gray-700 text-white rounded-md p-2 w-full grow"
        >
          {exampleCode}
        </textarea>

        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffebee",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 justify-center items-center">
        {programComponent}
      </div>
    </div>
  );
}
