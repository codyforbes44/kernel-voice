import { Play } from 'lucide-react';

const tracks = [
  { id: 'II-02', duration: '2:14' },
  { id: 'II-03', duration: '1:58' },
  { id: 'II-04', duration: '3:21' },
  { id: 'II-05', duration: '2:47' },
];

export function TrackListCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex flex-col gap-1">
      {tracks.map((track, i) => (
        <button
          key={track.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/80 transition-colors group w-full text-left"
        >
          <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
          <Play className="h-3 w-3 text-zinc-600 group-hover:text-violet-400 transition-colors" />
          <span className="text-sm text-zinc-300 flex-1">{track.id}</span>
          <span className="text-xs text-zinc-600">{track.duration}</span>
        </button>
      ))}
    </div>
  );
}
