import { useState, useCallback, useRef } from 'react';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
export type ConnectionPhase = 'idle' | 'getting_token' | 'connecting_xai' | 'connecting_webrtc' | 'configuring' | 'ready' | 'error';

export interface ConnectionRetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface UseConnectionStateOptions {
  onError?: (error: Error) => void;
  onRetry?: () => void;
  retryConfig?: ConnectionRetryConfig;
}

export interface UseConnectionStateReturn {
  status: ConnectionStatus;
  phase: ConnectionPhase;
  error: string | null;
  retryCount: number;
  setStatus: (status: ConnectionStatus) => void;
  setPhase: (phase: ConnectionPhase) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  scheduleRetry: (retryFn: () => Promise<void>) => void;
  cancelRetry: () => void;
  resetRetryCount: () => void;
}

const DEFAULT_RETRY_CONFIG: Required<ConnectionRetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 16000,
};

/**
 * Shared hook for managing connection state with retry logic.
 * Used by both Grok and OpenAI conversation hooks.
 */
export function useConnectionState(options: UseConnectionStateOptions = {}): UseConnectionStateReturn {
  const { onError, onRetry, retryConfig = {} } = options;
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [phase, setPhase] = useState<ConnectionPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRetryingRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    isRetryingRef.current = false;
  }, []);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    cancelRetry();
  }, [cancelRetry]);

  const scheduleRetry = useCallback((retryFn: () => Promise<void>) => {
    if (retryCount >= config.maxRetries) {
      console.log('[ConnectionState] Max retries reached');
      setError('Max connection retries reached. Please try again.');
      setPhase('error');
      onError?.(new Error('Max connection retries reached'));
      return;
    }

    const delay = Math.min(
      config.baseDelayMs * Math.pow(2, retryCount),
      config.maxDelayMs
    );
    const jitter = Math.random() * 500;
    const totalDelay = delay + jitter;

    console.log(`[ConnectionState] Retry ${retryCount + 1}/${config.maxRetries} in ${Math.round(totalDelay)}ms`);
    setError(`Reconnecting in ${Math.round(totalDelay / 1000)}s (attempt ${retryCount + 1}/${config.maxRetries})`);
    setRetryCount(prev => prev + 1);
    isRetryingRef.current = true;

    retryTimerRef.current = setTimeout(async () => {
      isRetryingRef.current = false;
      onRetry?.();
      await retryFn();
    }, totalDelay);
  }, [retryCount, config.maxRetries, config.baseDelayMs, config.maxDelayMs, onError, onRetry]);

  return {
    status,
    phase,
    error,
    retryCount,
    setStatus,
    setPhase,
    setError,
    clearError,
    scheduleRetry,
    cancelRetry,
    resetRetryCount,
  };
}
