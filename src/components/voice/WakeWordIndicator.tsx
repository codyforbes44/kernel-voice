import { useState, useEffect } from 'react';
import { Mic, AlertCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  const [showDetectedAnimation, setShowDetectedAnimation] = useState(false);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);

  // Trigger animation when lastHeard changes (wake word detected)
  useEffect(() => {
    if (lastHeard) {
      setDetectedWord(lastHeard);
      setShowDetectedAnimation(true);
      
      // Reset animation after delay
      const timer = setTimeout(() => {
        setShowDetectedAnimation(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [lastHeard]);

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
    <div className="relative">
      {/* Wake word detected overlay animation */}
      {showDetectedAnimation && (
        <div className="absolute inset-0 -inset-x-4 -inset-y-2 flex items-center justify-center pointer-events-none z-10">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div 
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-gradient-to-r from-primary to-primary/80",
              "text-primary-foreground shadow-lg shadow-primary/30",
              "animate-scale-in"
            )}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium whitespace-nowrap">
              Heard: "{detectedWord}"
            </span>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isListening ? 'default' : 'secondary'} 
            className={cn(
              "gap-1.5 cursor-help transition-all duration-300",
              showDetectedAnimation && "opacity-0",
              className
            )}
          >
            <Mic className={cn(
              "h-3 w-3 transition-transform",
              isListening && "animate-pulse"
            )} />
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
    </div>
  );
}
