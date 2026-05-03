import { useEffect, useRef } from 'react';

/**
 * Hero background — "make sound visible".
 *
 * A layered acoustic field rendered on a single DPR-aware canvas:
 *
 *   1. Vignette + horizon glow      — atmospheric base
 *   2. Two-tone twinkling stars     — cyan dominant, secondary accent (~12%)
 *   3. Perspective grid             — pulses in waves traveling horizon → viewer
 *   4. Depth haze band              — softens the horizon
 *   5. Concentric propagation rings — emit on a slow cadence (~6s) from a
 *                                     single off-centre source point
 *   6. Frequency ribbon             — a thin sinuous trace across the lower
 *                                     third, layered sines (calm spectrogram)
 *   7. Drifting voice particles     — sparse, with proximity links
 *   8. Rare shooting star           — every 12–20s
 *
 * Performance:
 *   - DPR-aware canvas (cap 2×) for crisp rendering.
 *   - Paused via IntersectionObserver and document visibilitychange.
 *   - `prefers-reduced-motion`: renders one composed static frame.
 *   - Theme-reactive via MutationObserver on <html>.
 *   - Density auto-scales with viewport area; mobile gets fewer elements.
 *
 * Colors come from CSS variables so the scene tracks the active theme.
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
  phase: number;
  speed: number;
  /** Render in secondary accent instead of primary. */
  accent: boolean;
}

interface Ring {
  x: number;
  y: number;
  /** Elapsed lifetime in ms. */
  life: number;
  /** Total lifetime in ms. */
  ttl: number;
  maxRadius: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
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
    const rings: Ring[] = [];
    const shootingStars: ShootingStar[] = [];
    let nextRingAt = 0;
    let nextShootingStarAt = 0;
    let ringSource = { x: 0, y: 0 };

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let isMobile = false;

    let isVisible = true;
    let isTabVisible = !document.hidden;
    let rafId: number | undefined;
    let lastTs = performance.now();

    // Eased pointer parallax (very small offsets).
    const pointer = { x: 0, y: 0 };
    const pointerEased = { x: 0, y: 0 };

    // Theme-derived colors. Re-resolved on theme change.
    let primaryHsl = readHsl('--primary', '180 100% 50%');
    let secondaryHsl = readHsl('--secondary', '195 100% 60%');
    let isDark = document.documentElement.classList.contains('dark');

    const themeObserver = new MutationObserver(() => {
      primaryHsl = readHsl('--primary', '180 100% 50%');
      secondaryHsl = readHsl('--secondary', '195 100% 60%');
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
      isMobile = cssWidth < 640;

      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = cssWidth * cssHeight;
      const particleCount = isMobile
        ? Math.min(28, Math.max(14, Math.floor(area / 32000)))
        : Math.min(48, Math.max(20, Math.floor(area / 26000)));
      const starCount = isMobile
        ? Math.min(90, Math.max(40, Math.floor(area / 12000)))
        : Math.min(160, Math.max(60, Math.floor(area / 9500)));

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.4 + 0.5,
        opacity: Math.random() * 0.45 + 0.15,
      }));

      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        size: Math.random() < 0.92 ? Math.random() * 0.85 + 0.3 : Math.random() * 1.3 + 1.0,
        baseOpacity: Math.random() * 0.55 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        accent: Math.random() < 0.12,
      }));

      // Place the propagation source slightly off-centre, above the horizon.
      ringSource = {
        x: cssWidth * 0.62,
        y: cssHeight * 0.42,
      };

      nextRingAt = performance.now() + 1200;
      nextShootingStarAt = performance.now() + 8000 + Math.random() * 6000;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    };

    /* ---------- Layer 1: vignette + horizon glow ---------- */
    const drawVignette = () => {
      const horizonY = cssHeight * 0.55;

      // Soft edge vignette so type pops.
      const vignette = ctx.createRadialGradient(
        cssWidth * 0.5,
        cssHeight * 0.5,
        Math.min(cssWidth, cssHeight) * 0.35,
        cssWidth * 0.5,
        cssHeight * 0.5,
        Math.max(cssWidth, cssHeight) * 0.75,
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.06)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      // Horizon glow band.
      const horizonGrad = ctx.createLinearGradient(0, horizonY - 80, 0, horizonY + 80);
      horizonGrad.addColorStop(0, 'transparent');
      horizonGrad.addColorStop(0.5, `hsla(${primaryHsl} / ${isDark ? 0.1 : 0.06})`);
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, horizonY - 80, cssWidth, 160);
    };

    /* ---------- Layer 2: stars ---------- */
    const drawStars = (t: number) => {
      const px = pointerEased.x * 6;
      const py = pointerEased.y * 6;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        const opacity = s.baseOpacity * twinkle * (isDark ? 1 : 0.65);
        const sx = s.x + px * (s.size * 0.6);
        const sy = s.y + py * (s.size * 0.6);
        const hue = s.accent ? secondaryHsl : primaryHsl;

        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue} / ${opacity})`;
        ctx.fill();

        if (s.size > 1.05) {
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 5);
          grad.addColorStop(0, `hsla(${hue} / ${opacity * 0.4})`);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(sx, sy, s.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }
    };

    /* ---------- Layer 3: perspective grid with traveling pulse ---------- */
    const drawPerspectiveGrid = (t: number) => {
      const horizonY = cssHeight * 0.55;
      const vanishX = cssWidth * 0.5 + pointerEased.x * 18;
      const vanishY = horizonY + pointerEased.y * 6;

      const baseAlpha = isDark ? 0.075 : 0.06;
      ctx.lineWidth = 1;

      // Vertical-ish radial lines from the vanishing point downward.
      const verticalLines = isMobile ? 12 : 18;
      for (let i = -verticalLines; i <= verticalLines; i++) {
        const k = i / verticalLines;
        const xBottom = cssWidth * 0.5 + k * cssWidth * 1.6;
        const alpha = baseAlpha * (1 - Math.abs(k) * 0.55);
        ctx.strokeStyle = `hsla(${secondaryHsl} / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(xBottom, cssHeight + 20);
        ctx.stroke();
      }

      // Horizontal lines, denser near the horizon (depth cue), pulsing in waves.
      const horizontalLines = isMobile ? 10 : 14;
      for (let i = 1; i <= horizontalLines; i++) {
        const k = (i / horizontalLines) ** 2; // close to horizon → far from viewer
        const y = vanishY + k * (cssHeight - vanishY + 20);
        // Pulse travels horizon → viewer over ~10s.
        const wave = 0.5 + 0.5 * Math.sin(t * 0.001 * 0.6 - k * Math.PI * 2);
        const alpha = baseAlpha * (1 - k * 0.4) * (0.55 + 0.45 * wave);
        ctx.strokeStyle = `hsla(${primaryHsl} / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssWidth, y);
        ctx.stroke();
      }
    };

    /* ---------- Layer 4: depth haze ---------- */
    const drawHaze = () => {
      const horizonY = cssHeight * 0.55;
      const haze = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 60);
      haze.addColorStop(0, 'transparent');
      haze.addColorStop(0.5, isDark ? 'rgba(0, 30, 40, 0.18)' : 'rgba(180, 220, 230, 0.08)');
      haze.addColorStop(1, 'transparent');
      ctx.fillStyle = haze;
      ctx.fillRect(0, horizonY - 60, cssWidth, 120);
    };

    /* ---------- Layer 5: propagation rings ---------- */
    const spawnRing = () => {
      rings.push({
        x: ringSource.x + (Math.random() - 0.5) * 30,
        y: ringSource.y + (Math.random() - 0.5) * 18,
        life: 0,
        ttl: 3800 + Math.random() * 800,
        maxRadius: Math.min(cssWidth, cssHeight) * (0.55 + Math.random() * 0.15),
      });
    };

    const drawRings = (dt: number, now: number) => {
      if (now >= nextRingAt && rings.length < 3) {
        spawnRing();
        // Cadence: a new ring every 4.5–7s.
        nextRingAt = now + 4500 + Math.random() * 2500;
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life += dt;
        if (r.life >= r.ttl) {
          rings.splice(i, 1);
          continue;
        }
        const lifeT = r.life / r.ttl;
        // Ease-out radius growth.
        const radius = r.maxRadius * (1 - Math.pow(1 - lifeT, 2));
        // Fade in fast, fade out slow.
        const alpha =
          (lifeT < 0.15 ? lifeT / 0.15 : 1 - (lifeT - 0.15) / 0.85) * (isDark ? 0.18 : 0.1);

        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${primaryHsl} / ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner accent ring for richness.
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius * 0.985, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${secondaryHsl} / ${alpha * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    };

    /* ---------- Layer 6: frequency ribbon ---------- */
    const drawRibbon = (t: number) => {
      const baseY = cssHeight * 0.78;
      const amp1 = cssHeight * 0.025;
      const amp2 = cssHeight * 0.012;
      const amp3 = cssHeight * 0.006;
      // Step proportional to width so density looks even on all sizes.
      const step = Math.max(4, Math.floor(cssWidth / 220));

      ctx.beginPath();
      for (let x = 0; x <= cssWidth; x += step) {
        const u = x / cssWidth;
        const y =
          baseY +
          Math.sin(u * Math.PI * 2.4 + t * 0.0006) * amp1 +
          Math.sin(u * Math.PI * 5.1 - t * 0.0011) * amp2 +
          Math.sin(u * Math.PI * 9.3 + t * 0.0018) * amp3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Gradient stroke: cyan core, fades at the horizontal edges.
      const grad = ctx.createLinearGradient(0, 0, cssWidth, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.15, `hsla(${primaryHsl} / ${isDark ? 0.45 : 0.3})`);
      grad.addColorStop(0.5, `hsla(${secondaryHsl} / ${isDark ? 0.55 : 0.35})`);
      grad.addColorStop(0.85, `hsla(${primaryHsl} / ${isDark ? 0.45 : 0.3})`);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Soft echo above for thickness/glow.
      ctx.lineWidth = 4;
      ctx.strokeStyle = `hsla(${primaryHsl} / ${isDark ? 0.06 : 0.04})`;
      ctx.stroke();
    };

    /* ---------- Layer 7: drifting voice particles ---------- */
    const drawParticles = (dt: number) => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt * 0.05;
        p.y += p.vy * dt * 0.05;

        if (p.x < -10) p.x = cssWidth + 10;
        else if (p.x > cssWidth + 10) p.x = -10;
        if (p.y < -10) p.y = cssHeight + 10;
        else if (p.y > cssHeight + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryHsl} / ${p.opacity * (isDark ? 0.65 : 0.45)})`;
        ctx.fill();

        if (p.size > 1.1) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
          grad.addColorStop(0, `hsla(${primaryHsl} / ${p.opacity * 0.3})`);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Constellation links — only between near neighbours.
      const linkDist = 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * (isDark ? 0.14 : 0.09);
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

    /* ---------- Layer 8: rare shooting star ---------- */
    const spawnShootingStar = () => {
      const startX = Math.random() * cssWidth * 0.6;
      const startY = Math.random() * cssHeight * 0.4;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      const speed = 0.55 + Math.random() * 0.35;
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
      if (now >= nextShootingStarAt && shootingStars.length < 1) {
        spawnShootingStar();
        // Rare: every 12–20s.
        nextShootingStarAt = now + 12000 + Math.random() * 8000;
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
        const alpha = (1 - Math.abs(lifeT * 2 - 1)) * (isDark ? 0.85 : 0.5);

        const speed = Math.hypot(s.vx, s.vy) || 1;
        const tailX = s.x - (s.vx / speed) * s.length;
        const tailY = s.y - (s.vy / speed) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `hsla(${primaryHsl} / ${alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryHsl} / ${alpha})`;
        ctx.fill();
      }
    };

    /* ---------- Render ---------- */
    const renderFrame = (now: number) => {
      const dt = Math.min(48, now - lastTs);
      lastTs = now;

      pointerEased.x += (pointer.x - pointerEased.x) * 0.06;
      pointerEased.y += (pointer.y - pointerEased.y) * 0.06;

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      drawVignette();
      drawStars(now);
      drawPerspectiveGrid(now);
      drawHaze();
      drawRings(dt, now);
      drawParticles(dt);
      drawRibbon(now);
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
      // Seed one ring so the static frame includes a propagation circle.
      spawnRing();
      rings[0].life = rings[0].ttl * 0.4;
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
