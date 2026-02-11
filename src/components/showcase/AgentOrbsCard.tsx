import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGeminiLiveConversation } from '@/hooks/useGeminiLiveConversation';

type OrbState = 'idle' | 'listening' | 'talking';

export function AgentOrbsCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [manualState, setManualState] = useState<OrbState>('idle');

  const gemini = useGeminiLiveConversation({
    onTranscript: (t) => console.log('[AgentOrbs]', t.role, t.text),
    systemPrompt: 'You are a friendly showcase voice assistant. Keep responses very short (1-2 sentences).',
  });

  const isLive = gemini.status === 'connected';
  const orbState: OrbState = isLive
    ? gemini.isSpeaking ? 'talking' : 'listening'
    : manualState;

  const liveLevel = isLive
    ? gemini.isSpeaking ? gemini.outputAudioLevel : gemini.inputAudioLevel
    : 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const t = Date.now() / 1000;
    const baseR = Math.min(w, h) * 0.32;

    const glowIntensity = orbState === 'talking'
      ? 0.6 + 0.3 * Math.sin(t * 6) + liveLevel * 0.3
      : orbState === 'listening'
      ? 0.4 + 0.2 * Math.sin(t * 3) + liveLevel * 0.4
      : 0.2;
    const glowR = baseR * (1.3 + glowIntensity * 0.4);
    const glow = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, glowR);
    glow.addColorStop(0, `hsla(180, 100%, 50%, ${glowIntensity * 0.5})`);
    glow.addColorStop(0.5, `hsla(195, 100%, 55%, ${glowIntensity * 0.25})`);
    glow.addColorStop(1, 'hsla(195, 100%, 55%, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    const pulse = orbState === 'talking'
      ? Math.sin(t * 8) * 4 + liveLevel * 6
      : orbState === 'listening'
      ? Math.sin(t * 3) * 2 + liveLevel * 4
      : 0;
    const r = baseR + pulse;
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, 'hsl(180, 80%, 85%)');
    grad.addColorStop(0.4, 'hsl(180, 100%, 50%)');
    grad.addColorStop(0.8, 'hsl(195, 100%, 55%)');
    grad.addColorStop(1, 'hsl(200, 80%, 15%)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    const hl = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.05, cx - r * 0.15, cy - r * 0.2, r * 0.5);
    hl.addColorStop(0, 'rgba(255,255,255,0.35)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    frameRef.current = requestAnimationFrame(draw);
  }, [orbState, liveLevel]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const handleButton = (s: OrbState) => {
    if (s === 'listening' && !isLive) {
      gemini.startSession();
    } else if (s === 'idle' && isLive) {
      gemini.endSession();
    }
    setManualState(s);
  };

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-sm font-semibold text-foreground font-display">Agent Orbs</h3>
        <p className="text-xs text-muted-foreground">
          {isLive ? (gemini.isSpeaking ? 'Agent speaking…' : 'Listening…') : 'Interactive animated orb visualization'}
        </p>
      </div>
      <canvas ref={canvasRef} className="w-full aspect-square max-h-32 flex-1 min-h-0" />
      <div className="flex gap-2">
        {(['idle', 'listening', 'talking'] as OrbState[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={orbState === s ? 'default' : 'outline'}
            onClick={() => handleButton(s)}
            disabled={gemini.status === 'connecting'}
            className={`flex-1 text-xs capitalize min-h-[48px] ${orbState === s ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground bg-transparent'}`}
          >
            {s === 'listening' && gemini.status === 'connecting' ? 'Connecting…' : s}
          </Button>
        ))}
      </div>
    </div>
  );
}
