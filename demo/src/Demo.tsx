import {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  type GaistProgram,
  GaistRenderer,
} from 'gaist-react';
import { Link } from 'react-router-dom';

import { generateUI } from './ai';
import { catalog } from './catalog';
import { components } from './components';

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
          content: "Enter a prompt and press Cmd+Enter to generate a UI",
          variant: "muted",
        },
      },
    ],
  },
};

const DEFAULT_DSL = `state {
  // No state yet
}

logic {
  // No logic yet
}

ui {
  Column(gap: "md") {
    Text(content: "Enter a prompt and press Cmd+Enter to generate a UI", variant: "muted")
  }
}`;

// ============================================================================
// Demo Component
// ============================================================================

type OutputTab = "dsl" | "json";

export function Demo() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("anthropic-api-key") || ""
  );
  const [prompt, setPrompt] = useState("");
  const [program, setProgram] = useState<GaistProgram>(DEFAULT_PROGRAM);
  const [dsl, setDsl] = useState(DEFAULT_DSL);
  const [currentState, setCurrentState] = useState<Record<string, unknown>>({});
  const [showState, setShowState] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryInfo, setRetryInfo] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>("dsl");
  const abortControllerRef = useRef<AbortController | null>(null);

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

    // Store previous state to restore on error
    const previousDsl = dsl;
    const previousProgram = program;

    // Create new AbortController for this generation
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);
    setRetryInfo(null);

    const result = await generateUI(apiKey, prompt, {
      onToken: (partialDsl) => {
        setDsl(partialDsl);
      },
      onRetry: (attempt, err) => {
        setRetryInfo(`Attempt ${attempt} failed: ${err}. Retrying...`);
        // Reset to previous on retry
        setDsl(previousDsl);
      },
      signal: abortControllerRef.current.signal,
    });

    setIsGenerating(false);
    setRetryInfo(null);
    abortControllerRef.current = null;

    if (result.success) {
      setProgram(result.program);
      setDsl(result.dsl);
      setError(null);
    } else {
      // Reset to previous on final error (unless stopped by user)
      if (result.error !== "Generation stopped") {
        setDsl(previousDsl);
        setProgram(previousProgram);
        setError(result.error);
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleStateChange = useCallback((state: Record<string, unknown>) => {
    setCurrentState(state);
  }, []);

  const handleCopy = () => {
    if (outputTab === "dsl") {
      navigator.clipboard.writeText(dsl);
    } else {
      navigator.clipboard.writeText(JSON.stringify(program, null, 2));
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-white">
      {/* Header */}
      <header className="px-4 py-3 border-b border-[#eee] flex items-center justify-between shrink-0">
        <Link
          to="/"
          className="text-sm text-[#999] hover:text-[#666] transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-sm font-medium text-[#1a1a1a]">Gaist Demo</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <div className="w-1/2 flex flex-col border-r border-[#eee] min-h-0">
          {/* API Key Input */}
          <div className="px-4 py-3 border-b border-[#eee] shrink-0">
            <label className="block text-xs text-[#999] uppercase tracking-wide mb-2">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 bg-[#fafafa] border border-[#eee] rounded-lg text-sm text-[#1a1a1a] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
            />
          </div>

          {/* Prompt Input (Top) */}
          <div className="h-1/3 flex flex-col border-b border-[#eee] min-h-0">
            <div className="px-4 py-3 border-b border-[#f5f5f5] shrink-0">
              <h2 className="text-xs text-[#999] uppercase tracking-wide">
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
                className="flex-1 w-full resize-none bg-[#fafafa] border border-[#eee] rounded-lg p-4 text-sm text-[#1a1a1a] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent min-h-0"
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

              <div className="mt-4 flex items-center gap-2 shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-full hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating && <Spinner />}
                  {isGenerating ? "Generating..." : "Generate UI"}
                </button>
                {isGenerating && (
                  <button
                    onClick={handleStop}
                    className="w-9 h-9 bg-[#f5f5f5] hover:bg-[#eee] rounded-full flex items-center justify-center transition-colors"
                    title="Stop generation"
                  >
                    <svg className="w-3.5 h-3.5 text-[#666]" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="3" y="3" width="10" height="10" rx="1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Output (Bottom) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-[#f5f5f5] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOutputTab("dsl")}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    outputTab === "dsl"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                  }`}
                >
                  DSL
                </button>
                <button
                  onClick={() => setOutputTab("json")}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    outputTab === "json"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                  }`}
                >
                  JSON
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs text-[#999] hover:text-[#666] transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {outputTab === "dsl" ? (
                <div className="relative">
                  {isGenerating && (
                    <div className="absolute top-0 right-0 flex items-center gap-2 text-xs text-[#999]">
                      <Spinner className="w-3 h-3" />
                      <span>Streaming...</span>
                    </div>
                  )}
                  <pre className={`text-xs font-mono whitespace-pre-wrap ${isGenerating ? "text-[#999]" : "text-[#666]"}`}>
                    {dsl}
                  </pre>
                </div>
              ) : (
                <pre className="text-xs font-mono text-[#666] whitespace-pre-wrap">
                  {JSON.stringify(program, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Rendered UI */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between shrink-0">
            <h2 className="text-xs text-[#999] uppercase tracking-wide">
              Preview
            </h2>
            <button
              onClick={() => setShowState(!showState)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showState
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
              }`}
            >
              State
            </button>
          </div>

          <div className="flex-1 relative overflow-auto min-h-0">
            {/* Rendered Component */}
            <div className="p-6 relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-sm text-[#666]">
                    <Spinner className="w-4 h-4" />
                    <span>Generating...</span>
                  </div>
                </div>
              )}
              <GaistRenderer
                key={JSON.stringify(program)}
                catalog={catalog}
                components={components}
                program={program}
                onStateChange={handleStateChange}
              />
            </div>

            {/* State Popover */}
            {showState && (
              <div className="absolute bottom-4 right-4 w-64 bg-white border border-[#eee] rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 py-2 bg-[#fafafa] border-b border-[#eee]">
                  <h3 className="text-xs text-[#999] uppercase tracking-wide">
                    State
                  </h3>
                </div>
                <div className="p-3 max-h-48 overflow-auto">
                  {Object.keys(currentState).length > 0 ? (
                    <pre className="text-xs font-mono text-[#666]">
                      {JSON.stringify(currentState, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-[#999] italic">No state</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
