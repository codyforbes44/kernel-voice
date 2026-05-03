/**
 * Lightweight analytics dispatcher.
 *
 * Forwards events to whichever providers are present on the page:
 *  - Google Analytics (gtag / dataLayer)
 *  - Plausible
 *  - PostHog
 *
 * Also dispatches a `CustomEvent('lov:track', { detail })` on `window` so
 * any custom listener (or a future provider) can hook in without changes.
 *
 * Safe to call from any environment: SSR-guarded and never throws.
 */

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: TrackProps }) => void;
    posthog?: { capture: (event: string, props?: TrackProps) => void };
  }
}

export function track(event: string, props: TrackProps = {}): void {
  if (typeof window === 'undefined') return;

  const detail = { event, props, ts: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent('lov:track', { detail }));
  } catch {
    /* noop */
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, props);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...props });
    }
  } catch {
    /* noop */
  }

  try {
    window.plausible?.(event, { props });
  } catch {
    /* noop */
  }

  try {
    window.posthog?.capture(event, props);
  } catch {
    /* noop */
  }

  if (import.meta.env.DEV) {
    // Helpful while wiring up new events.
    // eslint-disable-next-line no-console
    console.debug('[track]', event, props);
  }
}
