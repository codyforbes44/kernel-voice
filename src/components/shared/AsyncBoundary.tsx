import { Suspense, type ReactNode } from 'react';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

interface AsyncBoundaryProps {
  children: ReactNode;
  routeName?: string;
  fallback?: ReactNode;
}

/**
 * Combines RouteErrorBoundary + Suspense for lazy routes.
 */
export const AsyncBoundary = ({ children, routeName, fallback }: AsyncBoundaryProps) => (
  <RouteErrorBoundary routeName={routeName}>
    <Suspense fallback={fallback ?? <LoadingScreen message="Loading..." />}>{children}</Suspense>
  </RouteErrorBoundary>
);
