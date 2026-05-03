import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Listens for online/offline events.
 * - Toasts on transitions.
 * - Renders a fixed bottom-center badge while offline (above safe-area).
 */
export const OfflineIndicator = () => {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success("You're back online");
    };
    const handleOffline = () => {
      setOnline(false);
      toast.error("You're offline. Some features may not work.");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[60] bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-4 py-2 text-sm shadow-lg"
    >
      <WifiOff className="h-4 w-4 text-destructive" aria-hidden />
      <span>Offline</span>
    </div>
  );
};
