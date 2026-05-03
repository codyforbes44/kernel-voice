import { useEffect, useRef } from 'react';

/**
 * Animated hero background.
 *
 * Layers (back to front):
 *   1. Twinkling star field (static positions, sin-phased opacity)
 *   2. Perspective grid converging toward a horizon (depth)
 *   3. Drifting particles + constellation links (foreground glow)
 *   4. Occasional shooting star streak with trail
 *
 * Performance:
 *   - DPR-aware canvas for crisp rendering on HiDPI displays.
 *   - Paused via IntersectionObserver when off-screen.
 *   - Paused via document visibilitychange when the tab is hidden.
 *   - Honors `prefers-reduced-motion`: renders a single static frame.
 *   - Theme-reactive via MutationObserver on <html> (no per-frame DOM reads).
 *
 * Colors are read from CSS variables (`--primary`, `--secondary`) so the
 * background matches the active theme (OLED dark + warm-white light).
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  /** Phase offset so stars don't twinkle in unison. */
  phase: number;
  /** Twinkle frequency (radians/sec). */
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Elapsed lifetime in ms. */
  life: number;
  /** Total lifetime in ms. */
  ttl: number;
  length: number;
}

const readHsl = (varName: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};

export const AnimatedHeroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let particles: Particle[] = [];
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarAt = 0;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let isVisible = true;
    let isTabVisible = !document.hidden;
    let rafId: number | undefined;
    let lastTs = performance.now();

    // Pointer parallax (very small offsets, eased every frame).
    const pointer = { x: 0, y: 0 };
    const pointerEased = { x: 0, y: 0 };

    // Theme-derived colors. Re-resolved on theme change.
    let primaryHsl = readHsl('--primary', '40 90% 60%');
    let secondaryHsl = readHsl('--secondary', '180 70% 55%');
    let isDark = document.documentElement.classList.contains('dark');

    const themeObserver = new MutationObserver(() => {
      primaryHsl = readHsl('--primary', '40 90% 60%');
      secondaryHsl = readHsl('--secondary', '180 70% 55%');
      isDark = document.documentElement.classList.contains('dark');
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      cssWidth = parent.offsetWidth;
      cssHeight = parent.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with viewport area but is capped to stay cheap.
      const area = cssWidth * cssHeight;
      const particleCount = Math.min(60, Math.max(20, Math.floor(area / 22000)));
      const starCount = Math.min(160, Math.max(50, Math.floor(area / 9000)));

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.6 + 0.6,
        opacity: Math.random() * 0.5 + 0.15,
      }));

      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        size: Math.random() < 0.92 ? Math.random() * 0.9 + 0.3 : Math.random() * 1.4 + 1.0,
        baseOpacity: Math.random() * 0.55 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
      }));
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Normalized -1..1 around center; clamp to avoid wild jumps.
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    };

    const drawStars = (t: number) => {
      const px = pointerEased.x * 6;
      const py = pointerEased.y * 6;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        const opacity = s.baseOpacity * twinkle * (isDark ? 1 : 0.7);
        const sx = s.x + px * (s.size * 0.6);
        const sy = s.y + py * (s.size * 0.6);
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryHsl} / ${opacity})`;
        ctx.fill();

        // Subtle halo on the brightest stars.
        if (s.size > 1.1) {
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 5);
          grad.addColorStop(0, `hsla(${primaryHsl} / ${opacity * 0.45})`);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(sx, sy, s.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }
    };

    const drawPerspectiveGrid = () => {
      // Horizon line sits ~55% down. Lines converge toward the vanishing point.
      const horizonY = cssHeight * 0.55;
      const vanishX = cssWidth * 0.5 + pointerEased.x * 18;
      const vanishY = horizonY + pointerEased.y * 6;

      const baseAlpha = isDark ? 0.08 : 0.07;
      ctx.lineWidth = 1;

      // Vertical-ish lines radiating from the vanishing point downward.
      const verticalLines = 18;
      for (let i = -verticalLines; i <= verticalLines; i++) {
        const t = i / verticalLines;
        // Spread lines across the bottom edge.
        const xBottom = cssWidth * 0.5 + t * cssWidth * 1.6;
        const alpha = baseAlpha * (1 - Math.abs(t) * 0.55);
        ctx.strokeStyle = `hsla(${secondaryHsl} / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(xBottom, cssHeight + 20);
        ctx.stroke();
      }

      // Horizontal lines, denser near the horizon (depth cue).
      const horizontalLines = 14;
      for (let i = 1; i <= horizontalLines; i++) {
        // Quadratic spacing — closer near horizon, farther near viewer.
        const k = (i / horizontalLines) ** 2;
        const y = vanishY + k * (cssHeight - vanishY + 20);
        const alpha = baseAlpha * (1 - k * 0.4);
        ctx.strokeStyle = `hsla(${secondaryHsl} / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssWidth, y);
        ctx.stroke();
      }

      // Soft horizon glow.
      const horizonGrad = ctx.createLinearGradient(0, vanishY - 40, 0, vanishY + 40);
      horizonGrad.addColorStop(0, 'transparent');
      horizonGrad.addColorStop(0.5, `hsla(${primaryHsl} / ${isDark ? 0.08 : 0.05})`);
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, vanishY - 40, cssWidth, 80);
    };

    const drawParticles = (dt: number) => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;

        if (p.x < -10) p.x = cssWidth + 10;
        else if (p.x > cssWidth + 10) p.x = -10;
        if (p.y < -10) p.y = cssHeight + 10;
        else if (p.y > cssHeight + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryHsl} / ${p.opacity * (isDark ? 0.7 : 0.5)})`;
        ctx.fill();

        if (p.size > 1.2) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
          grad.addColorStop(0, `hsla(${primaryHsl} / ${p.opacity * 0.35})`);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Constellation links.
      const linkDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * (isDark ? 0.18 : 0.12);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${primaryHsl} / ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const spawnShootingStar = () => {
      // Diagonal streak from upper-left quadrant headed down-right.
      const startX = Math.random() * cssWidth * 0.6;
      const startY = Math.random() * cssHeight * 0.4;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // ~45° ± 14°
      const speed = 0.6 + Math.random() * 0.4; // px/ms
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 900 + Math.random() * 600,
        length: 90 + Math.random() * 80,
      });
    };

    const drawShootingStars = (dt: number, now: number) => {
      if (now >= nextShootingStarAt && shootingStars.length < 2) {
        spawnShootingStar();
        // Next streak in 6–12s.
        nextShootingStarAt = now + 6000 + Math.random() * 6000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life += dt;
        if (s.life >= s.ttl) {
          shootingStars.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const lifeT = s.life / s.ttl;
        // Fade in then out.
        const alpha = (1 - Math.abs(lifeT * 2 - 1)) * (isDark ? 0.9 : 0.55);

        const speed = Math.hypot(s.vx, s.vy) || 1;
        const tailX = s.x - (s.vx / speed) * s.length;
        const tailY = s.y - (s.vy / speed) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `hsla(${primaryHsl} / ${alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Bright head.
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryHsl} / ${alpha})`;
        ctx.fill();
      }
    };

    const renderFrame = (now: number) => {
      const dt = Math.min(48, now - lastTs); // clamp dt across tab pauses
      lastTs = now;

      // Ease pointer toward target for smooth parallax.
      pointerEased.x += (pointer.x - pointerEased.x) * 0.06;
      pointerEased.y += (pointer.y - pointerEased.y) * 0.06;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      drawStars(now);
      drawPerspectiveGrid();
      drawParticles(dt);
      drawShootingStars(dt, now);
    };

    const loop = (now: number) => {
      if (!isVisible || !isTabVisible) {
        rafId = undefined;
        return;
      }
      renderFrame(now);
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId !== undefined) return;
      lastTs = performance.now();
      rafId = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onPointerMove);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isTabVisible && !reduceMotion) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isVisible && isTabVisible && !reduceMotion) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (reduceMotion) {
      // Render one composed static frame and stop.
      renderFrame(performance.now());
    } else {
      start();
    }

    return () => {
      stop();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};
