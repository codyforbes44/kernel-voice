import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  provider: 'elevenlabs' | 'grok';
  className?: string;
}

export const ConnectionStatusBadge = ({
  isConnected,
  isConnecting,
  hasError,
  provider,
  className,
}: ConnectionStatusBadgeProps) => {
  const getStatus = () => {
    if (hasError) {
      return {
        label: 'Error',
        icon: AlertCircle,
        variant: 'destructive' as const,
        dotColor: 'bg-destructive',
        animate: false,
      };
    }
    if (isConnecting) {
      return {
        label: 'Connecting',
        icon: Loader2,
        variant: 'secondary' as const,
        dotColor: 'bg-yellow-500',
        animate: true,
      };
    }
    if (isConnected) {
      return {
        label: 'Connected',
        icon: Wifi,
        variant: 'default' as const,
        dotColor: 'bg-green-500',
        animate: false,
      };
    }
    return {
      label: 'Disconnected',
      icon: WifiOff,
      variant: 'outline' as const,
      dotColor: 'bg-muted-foreground',
      animate: false,
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <Badge
      variant={status.variant}
      className={cn(
        'gap-1.5 px-2.5 py-1 text-xs font-medium transition-all duration-300',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            status.dotColor,
            (status.animate || isConnected) && 'animate-ping'
          )}
        />
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            status.dotColor
          )}
        />
      </span>
      <Icon className={cn('h-3 w-3', status.animate && 'animate-spin')} />
      <span>{status.label}</span>
      <span className="text-[10px] opacity-70">
        ({provider === 'elevenlabs' ? 'EL' : 'Grok'})
      </span>
    </Badge>
  );
};
