import { useEffect, useRef, useState } from 'react';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';

export function WaveformCard() {
  const [level, setLevel] = useState(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const t = (Date.now() - startRef.current) / 1000;
      setLevel(0.3 + 0.7 * Math.abs(Math.sin(t * 1.8) * Math.sin(t * 0.7)));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-4">
      <div className="h-24">
        <LiveWaveformCanvas level={level} isActive barColor="#a78bfa" barWidth={3} barGap={2} />
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-zinc-400">Speaking</span>
      </div>
    </div>
  );
}
