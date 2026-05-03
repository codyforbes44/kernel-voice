import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional friendly name shown in the fallback (e.g. "Voice Assistant") */
  routeName?: string;
}

/**
 * Per-route error boundary. Prevents one page's crash from blanking the entire app shell.
 * Provides retry (clears error state) + return-home actions.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.routeName ? `:${this.props.routeName}` : ''}]`, error, errorInfo);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 px-4 py-12 text-center"
      >
        <div className="rounded-full bg-destructive/10 p-3" aria-hidden>
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold">
          {this.props.routeName ? `Couldn't load ${this.props.routeName}` : 'Something went wrong'}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm sm:text-base">
          {this.state.error?.message || 'An unexpected error occurred. Try again or return home.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={this.handleReset} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="min-h-[44px]">
            <Home className="h-4 w-4 mr-2" aria-hidden />
            Return home
          </Button>
        </div>
      </div>
    );
  }
}
