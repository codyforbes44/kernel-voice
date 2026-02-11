import { useMemo } from 'react';
import { useShowcaseMic } from '@/hooks/useShowcaseMic';
import { Mic } from 'lucide-react';

export function ShowcaseWaveform() {
  const { frequencyData, isActive, start, stop } = useShowcaseMic();
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
            {isActive ? 'Real-time mic visualization' : 'Real-time audio visualization with smooth scrolling animation'}
          </p>
        </div>
        {isActive ? (
          <button onClick={stop} className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">Stop</button>
        ) : (
          <button onClick={start} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors min-h-[48px] min-w-[48px] justify-center">
            <Mic className="h-3 w-3" /> Activate
          </button>
        )}
      </div>
      <div className="flex items-center gap-[2px] h-12 flex-1 min-h-0">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-primary/70 transition-all duration-75"
            style={{ height: `${h * 100}%`, opacity: 0.4 + h * 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}
