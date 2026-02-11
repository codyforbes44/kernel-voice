import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Sparkles, Music } from 'lucide-react';

export function MusicPlayerCard() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const bars = useMemo(() => Array.from({ length: 80 }, () => 0.1 + Math.random() * 0.9), []);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-4 row-span-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">II - 00</h3>
            <p className="text-xs text-zinc-500">ElevenLabs Music</p>
          </div>
        </div>
        <Music className="h-4 w-4 text-zinc-500" />
      </div>

      {/* Waveform progress */}
      <div className="flex items-end gap-[1px] h-12">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 100}%`,
              backgroundColor: i < 24 ? '#8b5cf6' : '#3f3f46',
              opacity: i < 24 ? 0.8 : 0.5,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>0:00</span>
        <span>1:37</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors"
        >
          {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
        </button>
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Vinyl discs */}
      <div className="flex justify-center gap-3 py-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 w-16 rounded-full border-4 border-zinc-800"
            style={{
              background: `conic-gradient(from ${i * 120}deg, #18181b, #27272a, #18181b, #27272a, #18181b)`,
              animation: playing ? `spin ${3 + i}s linear infinite` : 'none',
            }}
          >
            <div className="h-full w-full rounded-full flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-6">🔊</span>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1 [&_[role=slider]]:bg-violet-500 [&_[role=slider]]:border-violet-400 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_span:first-child]:bg-zinc-700 [&_span:first-child_span]:bg-violet-500" />
        <span className="text-xs text-zinc-400 w-8 text-right">{volume[0]}%</span>
      </div>
    </div>
  );
}
