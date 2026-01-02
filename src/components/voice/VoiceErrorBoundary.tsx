import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for voice-related components.
 * Catches and displays errors gracefully with recovery options.
 */
export class VoiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[VoiceErrorBoundary] Error caught:', error);
    console.error('[VoiceErrorBoundary] Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Voice Assistant Error</CardTitle>
            </div>
            <CardDescription>
              Something went wrong with the voice interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm font-mono text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If this problem persists, try refreshing the page or clearing your browser cache.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default VoiceErrorBoundary;
