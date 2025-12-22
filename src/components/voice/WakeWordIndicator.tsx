import { Mic, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WakeWordIndicatorProps {
  isListening: boolean;
  isSupported: boolean;
  lastHeard?: string | null;
  className?: string;
}

export function WakeWordIndicator({
  isListening,
  isSupported,
  lastHeard,
  className = '',
}: WakeWordIndicatorProps) {
  if (!isSupported) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 text-muted-foreground ${className}`}>
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Voice detection unavailable</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Your browser doesn't support voice wake word detection
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={isListening ? 'default' : 'secondary'} 
          className={`gap-1.5 cursor-help ${className}`}
        >
          <Mic className={`h-3 w-3 ${isListening ? 'animate-pulse' : ''}`} />
          <span className="text-xs">
            {isListening ? 'Say "Hey Assistant"' : 'Voice detection paused'}
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium mb-1">Wake Word Detection</p>
        <p className="text-xs text-muted-foreground">
          Say "Hey Assistant" to switch to voice mode
        </p>
        {lastHeard && (
          <p className="text-xs mt-1 text-muted-foreground/70">
            Last heard: "{lastHeard}"
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
