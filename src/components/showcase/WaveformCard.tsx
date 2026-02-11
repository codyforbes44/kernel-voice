import { useShowcaseMic } from '@/hooks/useShowcaseMic';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';
import { Mic } from 'lucide-react';

export function WaveformCard() {
  const { audioLevel, isActive, start, stop } = useShowcaseMic();

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-4">
      <div className="h-24 relative">
        {!isActive && (
          <button
            onClick={start}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60 rounded-lg hover:bg-zinc-800/60 transition-colors z-10"
          >
            <Mic className="h-5 w-5 text-violet-400" />
            <span className="text-xs text-zinc-400">Tap to activate mic</span>
          </button>
        )}
        <LiveWaveformCanvas level={isActive ? audioLevel : 0.05} isActive={isActive} barColor="#a78bfa" barWidth={3} barGap={2} />
      </div>
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-400">{audioLevel > 0.15 ? 'Speaking' : 'Listening'}</span>
            <button onClick={stop} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Stop</button>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-500">Inactive</span>
          </>
        )}
      </div>
    </div>
  );
}
