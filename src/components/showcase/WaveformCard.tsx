import { useShowcaseMic } from '@/hooks/useShowcaseMic';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';
import { Mic } from 'lucide-react';

export function WaveformCard() {
  const { audioLevel, isActive, start, stop } = useShowcaseMic();

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-4">
      <div className="h-24 relative">
        {!isActive && (
          <button
            onClick={start}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/60 rounded-lg hover:bg-muted/60 transition-colors z-10 min-h-[48px]"
          >
            <Mic className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Tap to activate mic</span>
          </button>
        )}
        <LiveWaveformCanvas level={isActive ? audioLevel : 0.05} isActive={isActive} barColor="hsl(180, 100%, 65%)" barWidth={3} barGap={2} />
      </div>
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">{audioLevel > 0.15 ? 'Speaking' : 'Listening'}</span>
            <button onClick={stop} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">Stop</button>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Inactive</span>
          </>
        )}
      </div>
    </div>
  );
}
