import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export function AudioPlayerCard() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="h-8 w-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {playing ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white ml-0.5" />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-zinc-200 font-medium">II - 09</p>
          <div className="flex items-center gap-2 mt-1">
            <Slider value={progress} onValueChange={setProgress} max={100} className="flex-1 [&_[role=slider]]:bg-violet-500 [&_[role=slider]]:border-violet-400 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_span:first-child]:bg-zinc-700 [&_span:first-child]:h-1 [&_span:first-child_span]:bg-violet-500" />
            <span className="text-xs text-zinc-500 w-8">2:31</span>
          </div>
        </div>
      </div>
    </div>
  );
}
