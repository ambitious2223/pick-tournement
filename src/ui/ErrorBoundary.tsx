import { Component, type ErrorInfo, type ReactNode } from "react";
import { useI18n } from "../i18n/index.tsx";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="panel m-6 p-6">
      <h2 className="text-lg font-bold text-hot">{t("error.title")}</h2>
      <p className="mt-2 text-sm text-white/60">{t("error.body")}</p>
      <pre className="mt-3 overflow-auto rounded-lg bg-ink-2 p-3 text-xs text-white/70">{error.message}</pre>
      <div className="mt-4 flex gap-2">
        <button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink" onClick={onRetry}>
          {t("error.tryAgain")}
        </button>
        <a className="rounded-lg border border-line px-3 py-2 text-sm" href="/control">
          {t("error.goControl")}
        </a>
      </div>
    </div>
  );
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
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
