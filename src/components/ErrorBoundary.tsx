import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type State = { error: Error | null };

/** Global React Error Boundary. Wrap the app root or risky subtrees. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward to PostHog / Sentry if loaded
    const w = window as any;
    w?.posthog?.captureException?.(error, { componentStack: info.componentStack });
    w?.Sentry?.captureException?.(error, { extra: { componentStack: info.componentStack } });
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-[60vh] grid place-items-center p-8">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground break-words">{this.state.error.message}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={this.reset} variant="outline">Try again</Button>
            <Button onClick={() => location.reload()}>Reload</Button>
          </div>
        </div>
      </div>
    );
  }
}
