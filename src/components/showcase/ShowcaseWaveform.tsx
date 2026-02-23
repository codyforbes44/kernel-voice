import { useState, useMemo } from 'react';
import { useShowcaseMic } from '@/hooks/useShowcaseMic';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';
import { Mic, BarChart3, Activity } from 'lucide-react';

type ViewMode = 'bars' | 'canvas';

export function ShowcaseWaveform() {
  const { frequencyData, audioLevel, isActive, start, stop } = useShowcaseMic();
  const [mode, setMode] = useState<ViewMode>('bars');
  const barCount = 60;
  const fallbackBars = useMemo(() => Array.from({ length: barCount }, () => 0.15 + Math.random() * 0.85), []);

  const bars = useMemo(() => {
    if (!frequencyData || !isActive) return fallbackBars;
    const step = Math.max(1, Math.floor(frequencyData.length / barCount));
    return Array.from({ length: barCount }, (_, i) => {
      const val = frequencyData[Math.min(i * step, frequencyData.length - 1)] / 255;
      return Math.max(0.05, val);
    });
  }, [frequencyData, isActive, fallbackBars]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-display">Waveform</h3>
          <p className="text-xs text-muted-foreground">
            {isActive ? 'Real-time mic visualization' : 'Tap mic to activate'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <button
            onClick={() => setMode(mode === 'bars' ? 'canvas' : 'bars')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title={mode === 'bars' ? 'Switch to canvas' : 'Switch to bars'}
          >
            {mode === 'bars' ? <Activity className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
          </button>
          {isActive ? (
            <button onClick={stop} className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">Stop</button>
          ) : (
            <button onClick={start} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors min-h-[48px] min-w-[48px] justify-center">
              <Mic className="h-3 w-3" /> Activate
            </button>
          )}
        </div>
      </div>

      {mode === 'bars' ? (
        <div className="flex items-center gap-[2px] h-12 flex-1 min-h-0">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-primary/70 transition-all duration-75"
              style={{ height: `${h * 100}%`, opacity: 0.4 + h * 0.6 }}
            />
          ))}
        </div>
      ) : (
        <div className="h-12 flex-1 min-h-0 relative">
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-xs text-muted-foreground/50">Activate mic to see waveform</span>
            </div>
          )}
          <LiveWaveformCanvas level={isActive ? audioLevel : 0.05} isActive={isActive} barColor="hsl(180, 100%, 65%)" barWidth={3} barGap={2} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
        <span className="text-xs text-muted-foreground">
          {isActive ? (audioLevel > 0.15 ? 'Speaking' : 'Listening') : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
