import {
  Component,
  HTMLProps,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import type { ComponentRegistry } from "./registry.js";
import { render } from "./render.js";
import { Literal, Runtime, RuntimeConfig } from "./types.js";

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary specifically for Gaist runtime errors.
 * Catches errors during render and provides a fallback UI.
 */
export class GaistErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="text-red-500 flex flex-col gap-2 bg-red-500/10 p-4 rounded-md">
          <div className="font-bold">Runtime Error</div>
          <div className="text-sm font-mono">{this.state.error.message}</div>
          <button
            onClick={this.reset}
            className="text-xs underline self-start hover:no-underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// Hook: useGaistRuntime
// ============================================================================

export interface UseGaistRuntimeOptions {
  /** Initial state to hydrate from */
  initialState?: Record<string, Literal>;
  /** Called when state changes */
  onStateChange?: (state: Record<string, Literal>) => void;
}

/**
 * Hook to create and manage a Gaist runtime instance.
 * Uses useSyncExternalStore for efficient React integration.
 */
export function useGaistRuntime(
  config: RuntimeConfig,
  options: UseGaistRuntimeOptions = {}
) {
  const { initialState, onStateChange } = options;

  // Create runtime instance - memoized on config reference
  const runtime = useMemo(() => {
    return new Runtime({
      ...config,
      initialState,
    });
  }, [config, initialState]);

  // Subscribe to state changes using useSyncExternalStore
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = runtime.onChange(() => {
        onStoreChange();
        onStateChange?.(runtime.getState());
      });
      return unsubscribe;
    },
    [runtime, onStateChange]
  );

  const getSnapshot = useCallback(() => runtime.stateVersion, [runtime]);

  // This triggers re-render when state version changes
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Note: We don't call runtime.destroy() on unmount because:
  // 1. React StrictMode double-mounts, but useMemo returns the same runtime
  // 2. The runtime doesn't hold external resources (sockets, timers, etc.)
  // 3. Garbage collection will handle cleanup when the runtime is no longer referenced

  return runtime;
}

// ============================================================================
// RuntimeComponent
// ============================================================================

export interface RuntimeComponentProps
  extends Omit<HTMLProps<HTMLDivElement>, "children" | "onError"> {
  config: RuntimeConfig;
  /** Initial state to hydrate from */
  initialState?: Record<string, Literal>;
  /** Called when state changes */
  onStateChange?: (state: Record<string, Literal>) => void;
  /** Custom error rendering */
  renderError?: (error: Error, reset: () => void) => ReactNode;
  /** Called when a runtime error occurs */
  onRuntimeError?: (error: Error) => void;
  /** Custom component registry for rendering UI nodes */
  components?: Partial<ComponentRegistry>;
}

/**
 * Renders a Gaist program as a React component.
 *
 * Features:
 * - Automatic state synchronization with React
 * - Error boundary for runtime errors
 * - Hydration support via initialState
 * - State change callbacks for persistence
 */
export function RuntimeComponent({
  config,
  initialState,
  onStateChange,
  renderError,
  onRuntimeError,
  components,
  ...props
}: RuntimeComponentProps) {
  const runtime = useGaistRuntime(config, { initialState, onStateChange });

  // Run init block on mount
  useEffect(() => {
    if (!runtime.hasRun) {
      runtime.run();
    }
  }, [runtime]);

  // Handle runtime errors during event handlers
  const handleRuntimeError = useCallback(
    (error: Error | null) => {
      if (error) {
        onRuntimeError?.(error);
        // Re-throw to be caught by error boundary
        throw error;
      }
    },
    [onRuntimeError]
  );

  // Render the UI tree
  const renderedTree = render({
    runtime,
    ui: config.program.ui,
    scope: runtime.scope,
    components,
    onRuntimeError: handleRuntimeError,
  });

  return (
    <GaistErrorBoundary fallback={renderError} onError={onRuntimeError}>
      <div {...props}>{renderedTree}</div>
    </GaistErrorBoundary>
  );
}

// ============================================================================
// Controlled RuntimeComponent
// ============================================================================

export interface ControlledRuntimeComponentProps
  extends Omit<HTMLProps<HTMLDivElement>, "children" | "onError"> {
  /** Pre-created runtime instance */
  runtime: Runtime;
  /** Custom error rendering */
  renderError?: (error: Error, reset: () => void) => ReactNode;
  /** Called when a runtime error occurs */
  onRuntimeError?: (error: Error) => void;
  /** Custom component registry for rendering UI nodes */
  components?: Partial<ComponentRegistry>;
}

/**
 * RuntimeComponent that accepts an externally-managed runtime instance.
 * Useful when you need direct access to the runtime for imperative operations.
 */
export function ControlledRuntimeComponent({
  runtime,
  renderError,
  onRuntimeError,
  components,
  ...props
}: ControlledRuntimeComponentProps) {
  // Subscribe to state changes
  const subscribe = useCallback(
    (onStoreChange: () => void) => runtime.onChange(onStoreChange),
    [runtime]
  );
  const getSnapshot = useCallback(() => runtime.stateVersion, [runtime]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Run init block
  useEffect(() => {
    if (!runtime.hasRun) {
      runtime.run();
    }
  }, [runtime]);

  const handleRuntimeError = useCallback(
    (error: Error | null) => {
      if (error) {
        onRuntimeError?.(error);
        throw error;
      }
    },
    [onRuntimeError]
  );

  const program = runtime.getProgram() as RuntimeConfig["program"];

  const renderedTree = render({
    runtime,
    ui: program.ui,
    scope: runtime.scope,
    components,
    onRuntimeError: handleRuntimeError,
  });

  return (
    <GaistErrorBoundary fallback={renderError} onError={onRuntimeError}>
      <div {...props}>{renderedTree}</div>
    </GaistErrorBoundary>
  );
}
