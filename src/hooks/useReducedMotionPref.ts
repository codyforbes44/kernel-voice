import { useEffect, useState } from 'react';

/**
 * Returns true if the user has requested reduced motion via OS settings.
 * Use to guard heavy animations (parallax, large transforms, infinite loops).
 */
export function useReducedMotionPref(): boolean {
  const [prefers, setPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return prefers;
}
