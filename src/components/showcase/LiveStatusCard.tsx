import { useEffect, useRef, useState } from 'react';
import { Mic, MessageSquare, Phone } from 'lucide-react';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';

export function LiveStatusCard() {
  const [level, setLevel] = useState(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const t = (Date.now() - startRef.current) / 1000;
      setLevel(0.2 + 0.5 * Math.abs(Math.sin(t * 2.2) * Math.cos(t * 0.9)));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 flex flex-col gap-3">
      <div className="h-12">
        <LiveWaveformCanvas level={level} isActive barColor="#8b5cf6" barWidth={2} barGap={1} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-400">Live</span>
          <span className="text-xs text-zinc-600">128 kbps</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">Customer Support</span>
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors" />
          <MessageSquare className="h-4 w-4 text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors" />
          <Phone className="h-4 w-4 text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
}
