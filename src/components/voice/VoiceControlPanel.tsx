import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, RefreshCw, Pause, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LiveWaveformCanvas } from './LiveWaveformCanvas';
import { motion, AnimatePresence } from 'framer-motion';

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
  isPaused?: boolean;
  activeToolCall?: boolean;
  onStartConversation: () => void;
  onEndConversation: () => void;
  onRetryConnection: () => void;
  onClearError: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onResume?: () => void;
}

type AgentState = 'idle' | 'connecting' | 'listening' | 'talking' | 'thinking' | 'paused' | 'error';

const STATE_CONFIG: Record<AgentState, { label: string; emoji: string; orbClass: string; glowColor: string }> = {
  idle: {
    label: 'Ready',
    emoji: '',
    orbClass: 'from-primary/10 to-primary/5 border border-primary/20',
    glowColor: 'transparent',
  },
  connecting: {
    label: 'Connecting...',
    emoji: '',
    orbClass: 'from-primary/30 to-primary/10',
    glowColor: 'hsl(var(--primary) / 0.2)',
  },
  listening: {
    label: 'Listening',
    emoji: '👂',
    orbClass: 'from-cyan-500/70 to-primary/50',
    glowColor: 'hsl(190 80% 50% / 0.35)',
  },
  talking: {
    label: 'Speaking',
    emoji: '🗣️',
    orbClass: 'from-primary to-primary/50',
    glowColor: 'hsl(var(--primary) / 0.4)',
  },
  thinking: {
    label: 'Thinking...',
    emoji: '🔧',
    orbClass: 'from-purple-500/70 to-violet-500/40',
    glowColor: 'hsl(270 70% 55% / 0.35)',
  },
  paused: {
    label: 'Paused',
    emoji: '⏸️',
    orbClass: 'from-amber-500/60 to-amber-600/30',
    glowColor: 'hsl(38 92% 50% / 0.3)',
  },
  error: {
    label: 'Error',
    emoji: '',
    orbClass: 'from-destructive/30 to-destructive/10',
    glowColor: 'hsl(var(--destructive) / 0.3)',
  },
};

const haptic = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

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
  isPaused,
  activeToolCall,
  onResume,
}: VoiceControlPanelProps) => {
  // Derive agent state
  const agentState: AgentState = connectionError
    ? 'error'
    : isConnecting
      ? 'connecting'
      : !isConnected
        ? 'idle'
        : isPaused
          ? 'paused'
          : activeToolCall
            ? 'thinking'
            : isSpeaking
              ? 'talking'
              : 'listening';

  const config = STATE_CONFIG[agentState];
  const currentLevel = isSpeaking ? outputAudioLevel : inputAudioLevel;

  const handleStart = () => {
    haptic(50);
    onStartConversation();
  };
  const handleEnd = () => {
    haptic([30, 50, 30]);
    onEndConversation();
  };
  const handleResume = () => {
    haptic(50);
    onResume?.();
  };
  const handleMuteToggle = () => {
    haptic(20);
    onToggleMute();
  };

  const handleOrbClick = () => {
    if (isMobile) {
      if (!isConnected && !isConnecting && !connectionError) {
        handleStart();
      } else if (isConnected) {
        handleEnd();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Agent State Orb */}
      <div className="flex flex-col items-center mb-2">
        <motion.div
          className="relative cursor-pointer"
          onClick={handleOrbClick}
          whileTap={isMobile ? { scale: 0.95 } : undefined}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-3 rounded-full"
            animate={{
              boxShadow: `0 0 ${isConnected ? 30 + currentLevel * 20 : 0}px ${config.glowColor}`,
              opacity: isConnected ? 0.8 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Ping ring for listening */}
          <AnimatePresence>
            {agentState === 'listening' && inputAudioLevel > 0.1 && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* Main orb */}
          <motion.div
            className={`
              relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center
              bg-gradient-to-br ${config.orbClass}
              transition-colors duration-500
            `}
            animate={{
              scale: isConnected ? 1 + currentLevel * 0.05 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Waveform ring around orb */}
            {isConnected && (
              <div className="absolute inset-[-6px] rounded-full overflow-hidden">
                <LiveWaveformCanvas
                  level={currentLevel}
                  isActive={isConnected && !isPaused}
                  barWidth={2}
                  barGap={1}
                  fadeEdges
                />
              </div>
            )}

            {/* Center icon */}
            {isConnecting ? (
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin" />
            ) : connectionError ? (
              <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-destructive" />
            ) : isPaused ? (
              <Pause className="w-10 h-10 md:w-12 md:h-12 text-amber-100" />
            ) : (
              <Mic className={`w-10 h-10 md:w-12 md:h-12 ${isConnected ? 'text-primary-foreground' : 'text-primary/70'}`} />
            )}
          </motion.div>
        </motion.div>

        {/* State label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={agentState}
            className="mt-3 text-sm font-medium text-muted-foreground"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {config.emoji && <span className="mr-1">{config.emoji}</span>}
            {config.label}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Inline Volume Control - visible when connected */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            className="flex items-center gap-3 w-56"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={volume > 0 ? 'Mute' : 'Unmute'}
            >
              {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => onVolumeChange(v / 100)}
              max={100}
              step={1}
              className="flex-1"
              aria-label="Volume"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {connectionError ? (
          <>
            <Button
              onClick={onRetryConnection}
              size="lg"
              className="rounded-full px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Button
              onClick={onClearError}
              variant="outline"
              size="lg"
              className="rounded-full min-h-[48px]"
            >
              Cancel
            </Button>
          </>
        ) : isConnecting ? (
          <Button
            disabled
            size="lg"
            className="rounded-full px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </Button>
        ) : !isConnected ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="rounded-full px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px] group"
            disabled={!isReady || providerLoading}
          >
            <Mic className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            Start Conversation
          </Button>
        ) : (
          <>
            <Button
              onClick={handleEnd}
              variant="destructive"
              size="lg"
              className="rounded-full min-h-[48px]"
            >
              End Session
            </Button>

            {isPaused && onResume && (
              <Button
                onClick={handleResume}
                size="lg"
                className="rounded-full min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Play className="mr-2 h-5 w-5" />
                Resume
              </Button>
            )}

            <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

            <Button
              onClick={handleMuteToggle}
              variant="outline"
              size="lg"
              className="rounded-full min-h-[48px] min-w-[48px]"
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
