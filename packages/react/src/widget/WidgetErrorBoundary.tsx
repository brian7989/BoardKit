import { Component, type ReactNode } from 'react';
import { WidgetFallback } from './WidgetFallback.js';

export interface WidgetErrorBoundaryProps {
  readonly title: string;
  readonly onError?: (error: Error) => void;
  readonly children: ReactNode;
}

interface WidgetErrorBoundaryState {
  readonly error: Error | null;
}

/** A crashing widget renders WidgetFallback instead of taking down the board, and reports through onError. */
export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  public override state: WidgetErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  public override render(): ReactNode {
    if (this.state.error) return <WidgetFallback title={this.props.title} />;
    return this.props.children;
  }
}
