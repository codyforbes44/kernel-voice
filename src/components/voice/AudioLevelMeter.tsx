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

// Circular waveform visualization for the orb
interface WaveformOrbProps {
  level: number;
  isActive: boolean;
  className?: string;
}

export const WaveformOrb = ({ level, isActive, className }: WaveformOrbProps) => {
  const bars = 24;
  const radius = 50;

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {Array.from({ length: bars }).map((_, i) => {
          const angle = (i / bars) * 360;
          const radians = (angle * Math.PI) / 180;
          
          // Create varying bar heights based on level
          const variance = Math.sin(i * 0.8 + Date.now() * 0.003) * 0.3 + 0.7;
          const barHeight = isActive ? 8 + level * 12 * variance : 4;
          
          const x1 = 60 + Math.cos(radians) * radius;
          const y1 = 60 + Math.sin(radians) * radius;
          const x2 = 60 + Math.cos(radians) * (radius + barHeight);
          const y2 = 60 + Math.sin(radians) * (radius + barHeight);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-75',
                isActive ? 'text-primary' : 'text-muted-foreground/30'
              )}
              style={{
                opacity: isActive ? 0.6 + level * 0.4 : 0.2,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};
