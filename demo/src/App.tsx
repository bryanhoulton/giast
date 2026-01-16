import { useCallback, useState } from "react";
import { GaistRenderer, type GaistProgram } from "gaist-react";
import { generateUI } from "./ai";
import { catalog } from "./catalog";
import { components } from "./components";

// ============================================================================
// Spinner Component
// ============================================================================

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Default Program
// ============================================================================

const DEFAULT_PROGRAM: GaistProgram = {
  state: [],
  logic: [],
  ui: {
    type: "Column",
    props: { gap: "md" },
    children: [
      {
        type: "Text",
        props: {
          content: "Enter a prompt and press Shift+Enter to generate a UI",
          variant: "muted",
        },
      },
    ],
  },
};

// ============================================================================
// App Component
// ============================================================================

export function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("anthropic-api-key") || ""
  );
  const [prompt, setPrompt] = useState("");
  const [program, setProgram] = useState<GaistProgram>(DEFAULT_PROGRAM);
  const [currentState, setCurrentState] = useState<Record<string, unknown>>({});
  const [showState, setShowState] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryInfo, setRetryInfo] = useState<string | null>(null);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem("anthropic-api-key", value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setRetryInfo(null);

    const result = await generateUI(apiKey, prompt, (attempt, err) => {
      setRetryInfo(`Attempt ${attempt} failed: ${err}. Retrying...`);
    });

    setIsGenerating(false);
    setRetryInfo(null);

    if (result.success) {
      setProgram(result.program);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const handleStateChange = useCallback((state: Record<string, unknown>) => {
    setCurrentState(state);
  }, []);

  return (
    <div className="h-screen max-h-screen overflow-hidden flex bg-gray-50">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 min-h-0">
        {/* API Key Input */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Anthropic API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Prompt Input (Top) */}
        <div className="h-1/2 flex flex-col border-b border-gray-200 bg-white min-h-0">
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Prompt
            </h2>
          </div>
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.metaKey || e.ctrlKey) &&
                  !isGenerating &&
                  prompt.trim() &&
                  apiKey.trim()
                ) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe the UI you want to create... (Cmd+Enter to generate)

Example: Create a counter with increment, decrement, and reset buttons. Show the current count prominently."
              className="flex-1 w-full resize-none bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-0"
            />

            {/* Error/Retry Info */}
            {(error || retryInfo) && (
              <div
                className={`mt-2 p-3 rounded-lg text-sm ${
                  error
                    ? "bg-red-50 text-red-600"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {error || retryInfo}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              {isGenerating && <Spinner />}
              {isGenerating ? "Generating..." : "Generate UI"}
            </button>
          </div>
        </div>

        {/* JSON Output (Bottom) */}
        <div className="flex-1 flex flex-col bg-white min-h-0">
          <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Generated JSON
            </h2>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(program, null, 2))}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <Spinner className="w-6 h-6 text-gray-400" />
              </div>
            ) : (
              <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(program, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Rendered UI */}
      <div className="w-1/2 flex flex-col bg-white min-h-0">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Preview
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJson(!showJson)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showJson
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setShowState(!showState)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showState
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              State
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-auto min-h-0">
          {/* Rendered Component */}
          <div className="p-6">
            {isGenerating ? (
              <div className="flex items-center justify-center h-32">
                <Spinner className="w-6 h-6 text-gray-400" />
              </div>
            ) : (
              <GaistRenderer
                key={JSON.stringify(program)}
                catalog={catalog}
                components={components}
                program={program}
                onStateChange={handleStateChange}
              />
            )}
          </div>

          {/* State Popover */}
          {showState && (
            <div className="absolute bottom-4 right-4 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  State
                </h3>
              </div>
              <div className="p-3 max-h-48 overflow-auto">
                {Object.keys(currentState).length > 0 ? (
                  <pre className="text-xs font-mono text-gray-700">
                    {JSON.stringify(currentState, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-gray-400 italic">No state</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
