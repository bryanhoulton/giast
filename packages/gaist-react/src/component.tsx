import { Component, ReactNode } from "react";

// ============================================================================
// Error Boundary
// ============================================================================

export interface GaistErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary for Gaist runtime errors.
 * Catches errors during render and provides a fallback UI.
 */
export class GaistErrorBoundary extends Component<
  GaistErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: GaistErrorBoundaryProps) {
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
