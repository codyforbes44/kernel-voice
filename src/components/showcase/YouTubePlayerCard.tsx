import { useState } from 'react';
import { Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const DEFAULT_VIDEO_ID = 'jNQXAC9IVRw'; // "Me at the zoo"

export function YouTubePlayerCard() {
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  const [inputValue, setInputValue] = useState('');

  const handleInput = (val: string) => {
    setInputValue(val);
    const id = extractVideoId(val);
    if (id) setVideoId(id);
  };

  return (
    <div className="rounded-2xl bg-card border border-border glow-border h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Youtube className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">YouTube Player</h3>
          <p className="text-[10px] text-muted-foreground">Paste any YouTube link</p>
        </div>
      </div>
      <div className="px-4 pb-2">
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          className="h-8 text-xs bg-muted/50 border-border"
        />
      </div>
      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden bg-muted">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0&controls=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
