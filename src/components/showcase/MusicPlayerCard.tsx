import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Sparkles, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SAMPLES = [
  { title: 'II - 00', text: 'In the quiet hum of dawn, the city awakens, stretching its limbs of steel and glass toward a pale horizon.' },
  { title: 'II - 01', text: 'Waves crash against the rocky shore, a timeless rhythm echoing through the salt-kissed air of morning.' },
  { title: 'II - 02', text: 'Through the canopy of ancient oaks, light filters down in golden threads, weaving stories in the dust.' },
];

export function MusicPlayerCard() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bars = useMemo(() => Array.from({ length: 80 }, () => 0.1 + Math.random() * 0.9), []);

  const track = SAMPLES[trackIdx];

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const startPlayback = useCallback(async () => {
    stopPlayback();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('widget-tts', {
        body: { text: track.text, voiceId: 'EXAVITQu4vr4xnSDxMaL' },
      });
      if (error || !data?.audioContent) return;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audio.volume = volume[0] / 100;
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('ended', () => { setPlaying(false); setProgress(0); });

      timerRef.current = setInterval(() => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      }, 100);

      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error('[MusicPlayer]', err);
    } finally {
      setLoading(false);
    }
  }, [track.text, volume, stopPlayback]);

  const togglePlay = () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    } else if (!playing && audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      startPlayback();
    }
  };

  const changeTrack = (dir: number) => {
    stopPlayback();
    setTrackIdx((prev) => (prev + dir + SAMPLES.length) % SAMPLES.length);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume[0] / 100;
  }, [volume]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const playedBars = Math.floor((progress / 100) * bars.length);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground font-display">{track.title}</h3>
            <p className="text-xs text-muted-foreground">ElevenLabs Music</p>
          </div>
        </div>
        {loading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Music className="h-4 w-4 text-muted-foreground" />}
      </div>

      <div className="flex items-end gap-[1px] h-12">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 100}%`,
              backgroundColor: i < playedBars ? 'hsl(180, 100%, 50%)' : 'hsl(0, 0%, 15%)',
              opacity: i < playedBars ? 0.8 : 0.5,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{duration > 0 ? formatTime((progress / 100) * duration) : '0:00'}</span>
        <span>{duration > 0 ? formatTime(duration) : '—:——'}</span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={() => changeTrack(-1)} className="text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"><SkipBack className="h-5 w-5" /></button>
        <button onClick={togglePlay} disabled={loading} className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50">
          {playing ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground ml-0.5" />}
        </button>
        <button onClick={() => changeTrack(1)} className="text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"><SkipForward className="h-5 w-5" /></button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-6">🔊</span>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_span:first-child]:bg-muted [&_span:first-child_span]:bg-primary" />
        <span className="text-xs text-muted-foreground w-8 text-right">{volume[0]}%</span>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
