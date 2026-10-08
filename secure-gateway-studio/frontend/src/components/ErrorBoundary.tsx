import { Component, type ErrorInfo, type ReactNode } from "react";

export interface ErrorBoundaryCopy {
  title: string;
  body: string;
  detailLabel: string;
  retry: string;
  reload: string;
}

interface ErrorBoundaryProps {
  copy: ErrorBoundaryCopy;
  children: ReactNode;
  /**
   * When this value changes the boundary forgets the last error, so moving to
   * another view or another deployment never shows a stale failure card.
   */
  resetKey?: string | number;
  /**
   * Optional secondary action, e.g. "Back to deployments" for a boundary that
   * wraps a drill-down view. Rendered next to retry and reload.
   */
  secondaryAction?: { label: string; onClick: () => void };
  /** Compact variant for boundaries nested inside a page, not the whole page. */
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * The last line of defence against a render-time exception.
 *
 * Without a boundary React unmounts the entire tree when a component throws,
 * which the operator experiences as a blank white extension page with no way
 * back except closing the tab. Nothing is lost on disk, but nothing says so.
 * This boundary keeps the shell on screen, explains what happened, and offers
 * retry and reload without touching stored state.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Unhandled render error", error, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error !== null && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private readonly handleRetry = () => {
    this.setState({ error: null });
  };

  private readonly handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    const { copy, secondaryAction, compact } = this.props;
    const detail = `${error.name}: ${error.message}`.trim();
    return (
      <section
        aria-live="assertive"
        className={`error-boundary${compact ? " error-boundary-compact" : ""}`}
        role="alert"
      >
        <div className="error-boundary-card">
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <details className="error-boundary-detail">
            <summary>{copy.detailLabel}</summary>
            <code>{detail}</code>
          </details>
          <div className="error-boundary-actions">
            <button className="btn btn-primary" onClick={this.handleRetry} type="button">
              {copy.retry}
            </button>
            {secondaryAction ? (
              <button
                className="btn btn-secondary"
                onClick={secondaryAction.onClick}
                type="button"
              >
                {secondaryAction.label}
              </button>
            ) : null}
            <button className="btn btn-secondary" onClick={this.handleReload} type="button">
              {copy.reload}
            </button>
          </div>
        </div>
      </section>
    );
  }
}
