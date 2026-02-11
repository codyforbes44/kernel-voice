import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';

export function AudioPlayerCard() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const generateAndPlay = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('widget-tts', {
        body: { text: 'The stars whispered secrets to the ocean, and the waves carried them to the shore, where the sand held each one like a precious memory.', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
      });
      if (error || !data?.audioContent) return;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('ended', () => { setPlaying(false); setProgress([0]); stopTimer(); });

      timerRef.current = setInterval(() => {
        if (audio.duration) setProgress([Math.round((audio.currentTime / audio.duration) * 100)]);
      }, 100);

      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error('[AudioPlayer]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = () => {
    if (!audioRef.current || !audioRef.current.src) {
      generateAndPlay();
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const seek = (val: number[]) => {
    setProgress(val);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (val[0] / 100) * audioRef.current.duration;
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  useEffect(() => () => { stopTimer(); if (audioRef.current) { audioRef.current.pause(); } }, []);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={loading}
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50 min-h-[48px] min-w-[48px]"
        >
          {loading ? <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" /> : playing ? <Pause className="h-3 w-3 text-primary-foreground" /> : <Play className="h-3 w-3 text-primary-foreground ml-0.5" />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium font-display">II - 09</p>
          <div className="flex items-center gap-2 mt-1">
            <Slider value={progress} onValueChange={seek} max={100} className="flex-1 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_span:first-child]:bg-muted [&_span:first-child]:h-1 [&_span:first-child_span]:bg-primary" />
            <span className="text-xs text-muted-foreground w-8">{duration > 0 ? formatTime(duration) : '—:——'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
