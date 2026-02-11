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
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={loading}
          className="h-8 w-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : playing ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white ml-0.5" />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-zinc-200 font-medium">II - 09</p>
          <div className="flex items-center gap-2 mt-1">
            <Slider value={progress} onValueChange={seek} max={100} className="flex-1 [&_[role=slider]]:bg-violet-500 [&_[role=slider]]:border-violet-400 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_span:first-child]:bg-zinc-700 [&_span:first-child]:h-1 [&_span:first-child_span]:bg-violet-500" />
            <span className="text-xs text-zinc-500 w-8">{duration > 0 ? formatTime(duration) : '—:——'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
