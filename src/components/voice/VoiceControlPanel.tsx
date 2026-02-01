import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WaveformOrb } from './AudioLevelMeter';

interface VoiceControlPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  isSpeaking: boolean;
  inputAudioLevel: number;
  outputAudioLevel: number;
  isMuted: boolean;
  volume: number;
  isReady: boolean;
  providerLoading: boolean;
  isMobile: boolean;
  onStartConversation: () => void;
  onEndConversation: () => void;
  onRetryConnection: () => void;
  onClearError: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export const VoiceControlPanel = ({
  isConnected,
  isConnecting,
  connectionError,
  isSpeaking,
  inputAudioLevel,
  outputAudioLevel,
  isMuted,
  volume,
  isReady,
  providerLoading,
  isMobile,
  onStartConversation,
  onEndConversation,
  onRetryConnection,
  onClearError,
  onToggleMute,
  onVolumeChange,
}: VoiceControlPanelProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Microphone Orb */}
      <div className="flex items-center justify-center mb-2">
        <div className={`
          relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
          ${isConnected 
            ? 'bg-gradient-to-br from-primary to-primary/50 shadow-glow animate-glow-pulse' 
            : isConnecting
              ? 'bg-gradient-to-br from-primary/30 to-primary/10 shadow-glow-subtle'
              : connectionError
                ? 'bg-gradient-to-br from-destructive/30 to-destructive/10'
                : 'bg-gradient-to-br from-primary/10 to-primary/5 dark:from-muted dark:to-primary/5 border border-primary/20'
          }
          transition-all duration-300
        `}>
          {isConnected && (
            <WaveformOrb 
              level={isSpeaking ? outputAudioLevel : inputAudioLevel} 
              isActive={isConnected}
            />
          )}
          
          {isConnecting ? (
            <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin" />
          ) : connectionError ? (
            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-destructive" />
          ) : (
            <Mic className={`w-10 h-10 md:w-12 md:h-12 ${isConnected ? 'text-primary-foreground' : 'text-primary-foreground/70'}`} />
          )}
          
          {isConnected && !isSpeaking && inputAudioLevel > 0.1 && (
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {connectionError ? (
          <>
            <Button
              onClick={onRetryConnection}
              size="lg"
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Button
              onClick={onClearError}
              variant="outline"
              size="lg"
              className="min-h-[48px]"
            >
              Cancel
            </Button>
          </>
        ) : isConnecting ? (
          <Button
            disabled
            size="lg"
            className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </Button>
        ) : !isConnected ? (
          <Button
            onClick={onStartConversation}
            size="lg"
            className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
            disabled={!isReady || providerLoading}
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Conversation
          </Button>
        ) : (
          <>
            <Button
              onClick={onEndConversation}
              variant="destructive"
              size="lg"
              className="min-h-[48px]"
            >
              {isMobile ? 'End' : 'Continue Later'}
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onToggleMute}
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] min-w-[48px]"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMuted ? 'Unmute microphone' : 'Mute microphone'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] min-w-[48px]"
                  aria-label={volume > 0 ? 'Mute audio' : 'Unmute audio'}
                >
                  {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {volume > 0 ? 'Mute audio' : 'Unmute audio'}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Volume Slider */}
      {isConnected && !isMobile && (
        <div className="flex items-center gap-3 w-48">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            max={100}
            step={1}
            className="flex-1"
            aria-label="Volume"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
