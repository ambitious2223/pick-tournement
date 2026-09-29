import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Error boundaries must be class components (React has no hook for this).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[pick-league] page error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="panel m-6 p-6">
          <h2 className="text-lg font-bold text-hot">This page hit an error</h2>
          <p className="mt-2 text-sm text-white/60">
            The rest of the app is fine. You can reload, or go back to the Control Room.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-ink-2 p-3 text-xs text-white/70">{this.state.error.message}</pre>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <a className="rounded-lg border border-line px-3 py-2 text-sm" href="/control">
              Go to Control Room
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
