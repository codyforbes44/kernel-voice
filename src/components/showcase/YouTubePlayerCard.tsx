import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Youtube, Play, Pause, SkipBack, SkipForward, Maximize, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

/* ── helpers ── */
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

/* ── YT API loader (singleton) ── */
let ytReady: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise<void>((resolve) => {
    if ((window as any).YT?.Player) { resolve(); return; }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return ytReady;
}

/* ── presets ── */
const PRESETS = [
  { id: 'jNQXAC9IVRw', label: 'First YouTube Video' },
  { id: 'aircAruvnKk', label: 'Google Gemini' },
  { id: 'oQfm2qBfDyM', label: 'AI Voice Demo' },
];

export function YouTubePlayerCard() {
  const [videoId, setVideoId] = useState(PRESETS[0].id);
  const [inputValue, setInputValue] = useState('');
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([70]);
  const [muted, setMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const playerDivId = useMemo(() => `yt-player-${Math.random().toString(36).slice(2, 8)}`, []);

  const bars = useMemo(() => Array.from({ length: 40 }, () => 0.1 + Math.random() * 0.9), []);

  /* ── polling ── */
  const startPoll = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const cur = p.getCurrentTime();
      const dur = p.getDuration();
      if (dur > 0) { setProgress(cur); setDuration(dur); }
    }, 250);
  }, []);
  const stopPoll = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);

  /* ── init player ── */
  useEffect(() => {
    let destroyed = false;
    setLoading(true);
    setReady(false);
    setShowVideo(false);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    stopPoll();

    loadYTApi().then(() => {
      if (destroyed) return;
      // Destroy previous player
      if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
      // Ensure target div exists
      const target = document.getElementById(playerDivId);
      if (!target) return;

      playerRef.current = new (window as any).YT.Player(playerDivId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: (e: any) => {
            if (destroyed) return;
            e.target.setVolume(volume[0]);
            if (muted) e.target.mute(); else e.target.unMute();
            setReady(true);
            setLoading(false);
            setDuration(e.target.getDuration() || 0);
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.PLAYING) { setPlaying(true); setShowVideo(true); startPoll(); }
            else if (e.data === YT.PlayerState.PAUSED) { setPlaying(false); stopPoll(); }
            else if (e.data === YT.PlayerState.ENDED) { setPlaying(false); stopPoll(); setProgress(0); setShowVideo(false); }
            else if (e.data === YT.PlayerState.BUFFERING) { setLoading(true); }
            if (e.data !== (window as any).YT.PlayerState.BUFFERING) setLoading(false);
          },
        },
      });
    });

    return () => { destroyed = true; stopPoll(); if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerDivId]);

  /* ── volume sync ── */
  useEffect(() => { if (playerRef.current?.setVolume) playerRef.current.setVolume(volume[0]); }, [volume]);
  useEffect(() => { if (!playerRef.current) return; if (muted) playerRef.current.mute?.(); else playerRef.current.unMute?.(); }, [muted]);

  /* ── controls ── */
  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else { setShowVideo(true); p.playVideo(); }
  };
  const skip = (s: number) => { const p = playerRef.current; if (p?.seekTo) p.seekTo(Math.max(0, p.getCurrentTime() + s), true); };
  const seek = (val: number[]) => { const p = playerRef.current; if (p?.seekTo && duration > 0) { p.seekTo((val[0] / 100) * duration, true); setProgress((val[0] / 100) * duration); } };
  const goFullscreen = () => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) { if (iframe.requestFullscreen) iframe.requestFullscreen(); }
  };
  const selectPreset = (id: string) => { setVideoId(id); setInputValue(''); };
  const handleInput = (val: string) => { setInputValue(val); const id = extractVideoId(val); if (id) setVideoId(id); };

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-5); break;
        case 'ArrowRight': e.preventDefault(); skip(5); break;
        case 'ArrowUp': e.preventDefault(); setVolume((v) => [Math.min(100, v[0] + 10)]); break;
        case 'ArrowDown': e.preventDefault(); setVolume((v) => [Math.max(0, v[0] - 10)]); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ready]);

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div ref={containerRef} tabIndex={-1} className="rounded-2xl bg-card border border-border glow-border flex flex-col overflow-hidden h-full focus:outline-none">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-card-foreground font-display">YouTube Player</h3>
            <p className="text-[10px] text-muted-foreground">Full playback control</p>
          </div>
        </div>
        {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
      </div>

      {/* Video area */}
      <div className="relative mx-4 rounded-lg overflow-hidden bg-muted" style={{ paddingBottom: '56.25%' }}>
        {/* Thumbnail overlay */}
        {!showVideo && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer bg-cover bg-center"
            style={{ backgroundImage: `url(${thumbUrl})` }}
          >
            <div className="h-14 w-14 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-colors shadow-lg">
              <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
            </div>
          </button>
        )}
        <div id={playerDivId} className="absolute inset-0 w-full h-full" style={{ opacity: showVideo ? 1 : 0, pointerEvents: showVideo ? 'auto' : 'none' }} />
      </div>

      {/* Waveform bars */}
      <div className="flex items-end gap-[1px] h-6 mx-4 mt-2">
        {bars.map((h, i) => {
          const playedBars = Math.floor((progressPct / 100) * bars.length);
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-150"
              style={{
                height: `${(playing ? h * (0.5 + Math.random() * 0.5) : h * 0.3) * 100}%`,
                backgroundColor: i < playedBars ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                opacity: i < playedBars ? 0.8 : 0.2,
              }}
            />
          );
        })}
      </div>

      {/* Progress */}
      <div className="px-4 mt-1">
        <Slider
          value={[progressPct]}
          onValueChange={seek}
          max={100}
          step={0.1}
          className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_span:first-child]:bg-muted [&_span:first-child]:h-1 [&_span:first-child_span]:bg-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>{fmt(progress)}</span>
          <span>{duration > 0 ? fmt(duration) : '—:——'}</span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-4 py-1">
        <button onClick={() => skip(-10)} className="text-muted-foreground hover:text-foreground transition-colors p-2"><SkipBack className="h-4 w-4" /></button>
        <button onClick={togglePlay} disabled={!ready && !loading} className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50">
          {playing ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground ml-0.5" />}
        </button>
        <button onClick={() => skip(10)} className="text-muted-foreground hover:text-foreground transition-colors p-2"><SkipForward className="h-4 w-4" /></button>
        <button onClick={goFullscreen} className="text-muted-foreground hover:text-foreground transition-colors p-2"><Maximize className="h-3.5 w-3.5" /></button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-4">
        <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground transition-colors">
          {muted || volume[0] === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
        <Slider value={muted ? [0] : volume} onValueChange={(v) => { setVolume(v); setMuted(false); }} max={100} step={1} className="flex-1 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_span:first-child]:bg-muted [&_span:first-child]:h-1 [&_span:first-child_span]:bg-primary" />
        <span className="text-[10px] text-muted-foreground w-7 text-right">{muted ? 0 : volume[0]}%</span>
      </div>

      {/* Preset chips */}
      <div className="flex gap-1.5 px-4 mt-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p.id)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${videoId === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      <div className="px-4 pt-2 pb-4">
        <Input
          placeholder="Paste YouTube URL..."
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          className="h-7 text-xs bg-muted/50 border-border"
        />
      </div>
    </div>
  );
}
