import { cn } from '@/lib/utils';
import { Mic, Volume2 } from 'lucide-react';

interface AudioLevelMeterProps {
  level: number; // 0-1
  type: 'input' | 'output';
  isActive: boolean;
  className?: string;
}

export const AudioLevelMeter = ({
  level,
  type,
  isActive,
  className,
}: AudioLevelMeterProps) => {
  const Icon = type === 'input' ? Mic : Volume2;
  const barCount = 8;
  const activeLevel = Math.round(level * barCount);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn(
        'h-4 w-4 transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )} />
      <div className="flex items-center gap-0.5">
        {Array.from({ length: barCount }).map((_, i) => {
          const isBarActive = i < activeLevel;
          const intensity = i / barCount;
          
          return (
            <div
              key={i}
              className={cn(
                'w-1.5 rounded-full transition-all duration-75',
                isActive && isBarActive
                  ? intensity > 0.75
                    ? 'bg-red-500'
                    : intensity > 0.5
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  : 'bg-muted-foreground/30'
              )}
              style={{
                height: `${8 + i * 2}px`,
                opacity: isActive && isBarActive ? 1 : 0.3,
                transform: isActive && isBarActive ? 'scaleY(1.1)' : 'scaleY(1)',
              }}
            />
          );
        })}
      </div>
      <span className="text-[10px] text-muted-foreground w-8 tabular-nums">
        {isActive ? `${Math.round(level * 100)}%` : '—'}
      </span>
    </div>
  );
};

interface AudioLevelVisualizerProps {
  inputLevel: number;
  outputLevel: number;
  isConnected: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const AudioLevelVisualizer = ({
  inputLevel,
  outputLevel,
  isConnected,
  isSpeaking,
  className,
}: AudioLevelVisualizerProps) => {
  return (
    <div className={cn(
      'flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border border-border/50',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Audio Levels</span>
        <div className={cn(
          'h-2 w-2 rounded-full transition-colors',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
        )} />
      </div>
      <div className="flex flex-col gap-1.5">
        <AudioLevelMeter
          level={inputLevel}
          type="input"
          isActive={isConnected && !isSpeaking}
        />
        <AudioLevelMeter
          level={outputLevel}
          type="output"
          isActive={isConnected && isSpeaking}
        />
      </div>
    </div>
  );
};

// WaveformOrb is deprecated - use LiveWaveformCanvas instead
// Kept as a re-export for any remaining references
export { LiveWaveformCanvas as WaveformOrb } from './LiveWaveformCanvas';
