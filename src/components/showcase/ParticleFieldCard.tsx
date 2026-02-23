import { useRef, useEffect, useCallback, useState } from 'react';
import { Sparkles, Magnet, Shield } from 'lucide-react';

const PARTICLE_COUNT = 120;
const CONNECTION_DIST = 80;
const MOUSE_RADIUS = 120;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export function ParticleFieldCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef<number>(0);
  const [interacting, setInteracting] = useState(false);
  const [mode, setMode] = useState<'repel' | 'attract'>('repel');
  const modeRef = useRef<'repel' | 'attract'>('repel');

  const initParticles = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 1.5,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.current.length === 0) initParticles(rect.width, rect.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const pts = particles.current;

      for (const p of pts) {
        // Mouse interaction
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.8;
          const dir = modeRef.current === 'repel' ? 1 : -1;
          p.vx += (dx / dist) * force * dir;
          p.vy += (dy / dist) * force * dir;
        }

        // Damping
        p.vx *= 0.97;
        p.vy *= 0.97;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.3;
            ctx.strokeStyle = `hsla(var(--primary) / ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of pts) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = dist < MOUSE_RADIUS ? 1 : 0.4;
        ctx.fillStyle = `hsla(var(--primary) / ${glow})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, [initParticles]);

  const handlePointer = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setInteracting(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouse.current = { x: -1000, y: -1000 };
    setInteracting(false);
  }, []);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-card-foreground font-display">Particle Field</h3>
            <p className="text-[10px] text-muted-foreground">Interactive node network</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = mode === 'repel' ? 'attract' : 'repel';
              setMode(next);
              modeRef.current = next;
            }}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors min-h-[28px] ${
              mode === 'attract'
                ? 'bg-secondary/20 text-secondary border-secondary/40'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {mode === 'attract' ? <Magnet className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
            {mode === 'attract' ? 'Attract' : 'Repel'}
          </button>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${interacting ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'}`}>
            {interacting ? 'Active' : 'Hover'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 min-h-[200px] mx-4 mb-4 rounded-lg overflow-hidden bg-muted/30 relative cursor-crosshair"
        onPointerMove={handlePointer}
        onPointerLeave={handlePointerLeave}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          mouse.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
          setInteracting(true);
        }}
        onTouchEnd={handlePointerLeave}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}
