import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LiveWaveformCanvasProps {
  level: number; // 0-1 audio level
  isActive: boolean;
  mode?: 'bars' | 'ring';
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  fadeEdges?: boolean;
  className?: string;
}

export function LiveWaveformCanvas({
  level,
  isActive,
  mode = 'bars',
  barWidth = 3,
  barGap = 2,
  barColor,
  fadeEdges = true,
  className,
}: LiveWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const historyRef = useRef<number[]>([]);
  const timeRef = useRef(0);

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

    // Push current level into history
    const history = historyRef.current;
    history.push(isActive ? level : 0);
    const totalBars = Math.floor(w / (barWidth + barGap));
    while (history.length > totalBars) history.shift();
    while (history.length < totalBars) history.unshift(0);

    timeRef.current += 0.02;

    // Resolve color from CSS variable
    const computedStyle = getComputedStyle(canvas);
    const color = barColor || computedStyle.getPropertyValue('color').trim() || 'hsl(var(--primary))';

    for (let i = 0; i < totalBars; i++) {
      const val = history[i];
      // Add slight sine variation for organic feel
      const variance = Math.sin(i * 0.5 + timeRef.current * 3) * 0.15 + 0.85;
      const barH = Math.max(2, val * h * 0.8 * variance);
      const x = i * (barWidth + barGap);
      const y = (h - barH) / 2;

      // Fade edges
      let alpha = isActive ? 0.4 + val * 0.6 : 0.15;
      if (fadeEdges) {
        const edgeFade = Math.min(i / 6, (totalBars - i - 1) / 6, 1);
        alpha *= edgeFade;
      }

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    animFrameRef.current = requestAnimationFrame(draw);
  }, [level, isActive, barWidth, barGap, barColor, fadeEdges]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full text-primary', className)}
      aria-hidden="true"
    />
  );
}
