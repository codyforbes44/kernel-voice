import { useMemo } from 'react';

export function ShowcaseWaveform() {
  const bars = useMemo(() => Array.from({ length: 60 }, () => 0.15 + Math.random() * 0.85), []);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Waveform</h3>
        <p className="text-xs text-zinc-500">Real-time audio visualization with smooth scrolling animation</p>
      </div>
      <div className="flex items-center gap-[2px] h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-violet-500/70"
            style={{ height: `${h * 100}%`, opacity: 0.4 + h * 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}
