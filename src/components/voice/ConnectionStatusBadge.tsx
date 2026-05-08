import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectionPhase, VoiceProvider } from '@/components/voice/voiceTypes';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  errorMessage?: string;
  provider: VoiceProvider;
  authMethod?: string;
  connectionPhase?: ConnectionPhase;
  onRetry?: () => void;
  className?: string;
}

export const ConnectionStatusBadge = ({
  isConnected,
  isConnecting,
  hasError,
  errorMessage,
  provider,
  authMethod,
  connectionPhase,
  onRetry,
  className,
}: ConnectionStatusBadgeProps) => {
  // Get phase-specific status for OpenAI/VAPI
  const getPhaseInfo = () => {
    if ((provider !== 'openai' && provider !== 'vapi') || !connectionPhase) return null;
    
    switch (connectionPhase) {
      case 'getting_token':
        return { label: 'Getting token...', step: 1 };
      case 'connecting_webrtc':
        return { label: provider === 'vapi' ? 'Connecting to VAPI...' : 'Connecting to OpenAI...', step: 2 };
      case 'configuring':
        return { label: 'Configuring session...', step: 3 };
      case 'ready':
        return { label: 'Ready', step: 4 };
      case 'error':
        return { label: 'Connection failed', step: 0 };
      default:
        return null;
    }
  };
  
  const phaseInfo = getPhaseInfo();
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

  const providerLabel = provider === 'elevenlabs' ? 'EL' : provider === 'vapi' ? 'VAPI' : '3ʙɪ';
  const providerFullName = provider === 'elevenlabs' ? 'ƷBI v2' : provider === 'vapi' ? 'VAPI Voice' : '3ʙɪ Realtime';
  const authLabel = isConnected && authMethod ? `:${authMethod}` : '';

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-medium">Connection Details</div>
      <div className="text-muted-foreground">
        <span className="text-foreground">Provider:</span> {providerFullName}
      </div>
      <div className="text-muted-foreground">
        <span className="text-foreground">Status:</span> {status.label}
      </div>
      {isConnected && authMethod && (
        <div className="text-muted-foreground">
          <span className="text-foreground">Auth param:</span> {authMethod}
        </div>
      )}
      {isConnecting && (provider === 'openai' || provider === 'vapi') && phaseInfo && (
        <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
          <div className="font-medium text-foreground">Connection Progress</div>
          <div className="space-y-1.5">
            {[
              { step: 1, label: 'Get session token' },
              { step: 2, label: provider === 'vapi' ? 'Connect to VAPI' : 'Connect to 3ʙɪ' },
              { step: 3, label: 'Configure session' },
              { step: 4, label: 'Ready to talk' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-2">
                {phaseInfo.step > step ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : phaseInfo.step === step ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                )}
                <span className={cn(
                  phaseInfo.step >= step ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {isConnecting && provider === 'elevenlabs' && (
        <div className="text-muted-foreground italic">
          Connecting to ElevenLabs...
        </div>
      )}
      {hasError && (
        <div className="mt-2 pt-2 border-t border-destructive/20 space-y-2">
          {errorMessage && (
            <div className="text-destructive">
              <span className="font-medium">Error:</span> {errorMessage}
            </div>
          )}
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-7 text-xs gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
            >
              <RefreshCw className="h-3 w-3" />
              Retry Connection
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Badge
            variant={status.variant}
            className={cn(
              'gap-1.5 px-2.5 py-1 text-xs font-medium transition-all duration-300 cursor-help',
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
              ({providerLabel}{authLabel})
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
