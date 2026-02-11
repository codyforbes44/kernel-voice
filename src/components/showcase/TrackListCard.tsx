import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const tracks = [
  { id: 'II-02', duration: '—:——', text: 'The morning light filtered through the curtains, painting golden stripes across the wooden floor.' },
  { id: 'II-03', duration: '—:——', text: 'A gentle breeze carried the scent of jasmine through the open window.' },
  { id: 'II-04', duration: '—:——', text: 'Footsteps echoed in the empty corridor, a rhythm of solitude and thought.' },
  { id: 'II-05', duration: '—:——', text: 'The clock struck midnight as the city finally surrendered to silence.' },
];

export function TrackListCard() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = useCallback(async (idx: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (activeIdx === idx && playing) {
      setPlaying(false);
      setActiveIdx(null);
      return;
    }

    setLoadingIdx(idx);
    setActiveIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('widget-tts', {
        body: { text: tracks[idx].text, voiceId: 'EXAVITQu4vr4xnSDxMaL' },
      });
      if (error || !data?.audioContent) return;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.addEventListener('ended', () => { setPlaying(false); setActiveIdx(null); });
      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error('[TrackList]', err);
    } finally {
      setLoadingIdx(null);
    }
  }, [activeIdx, playing]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 flex flex-col gap-1">
      {tracks.map((track, i) => (
        <button
          key={track.id}
          onClick={() => playTrack(i)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors group w-full text-left min-h-[48px]"
        >
          <span className="text-xs text-muted-foreground/60 w-4">{i + 1}</span>
          {loadingIdx === i ? (
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
          ) : activeIdx === i && playing ? (
            <Pause className="h-3 w-3 text-primary" />
          ) : (
            <Play className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          )}
          <span className={`text-sm flex-1 ${activeIdx === i ? 'text-primary/80' : 'text-foreground'}`}>{track.id}</span>
          <span className="text-xs text-muted-foreground/60">{track.duration}</span>
        </button>
      ))}
    </div>
  );
}
