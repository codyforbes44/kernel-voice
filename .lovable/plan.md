# Hero background — best-in-class voice AI canvas

## Vision

Today's background is a generic "tech grid + stars + shooting stars" scene. For a real-time voice AI hero, the background should *be* what the product *does*: **make sound visible**. I'll refactor `AnimatedHeroBackground.tsx` into a layered canvas that reads as a living acoustic field — propagation rings, a subtle frequency ribbon, drifting voice particles, a depth grid that recedes to a glowing horizon. Calm, premium, alive. Stripe / Linear / ElevenLabs hero quality.

## What it looks like

Back-to-front layers, all rendered on a single DPR-aware canvas:

1. **Vignette wash** — radial darkening at the edges so type pops; horizon glow at ~55% (cyan→transparent).
2. **Star field** — same density rules as today, but with two-tone colour (mostly `--primary`, occasional `--secondary`), gentler twinkle, halo only on the brightest stars.
3. **Perspective grid** — kept, but lines now subtly **pulse in waves** that travel from horizon → viewer (sin function over depth × time). Reads as "sound moving through space."
4. **Concentric propagation rings** — three faint cyan rings emit from a single off-centre source point on a slow cadence (~every 4–7s), expand, fade, disappear. The visual signature of a voice broadcast.
5. **Frequency ribbon** — a single thin sinuous line crosses the lower third, modulated by layered sines (think a calm spectrogram trace). Sub-pixel anti-aliased, very low alpha. This is the strongest "voice" signal in the scene.
6. **Drifting voice particles + constellation links** — kept, retuned: fewer, smaller, slower; links only between near neighbours, lower alpha. Less "particles.js," more "dust in a sunbeam."
7. **One occasional shooting star** every 12–20s (rarer than today). Optional — feels less generic if dialed back.

The radial primary glow at the top of the section stays, sitting on top of the canvas.

## Sound-DNA details (the soul of it)

- **Cadence over chaos**: every animated layer uses a shared global `time` — propagation rings, grid pulse, ribbon, twinkle all subtly sync. The scene breathes at ~6 BPM (one pulse every ~10s) like a calm conversation.
- **Brand-correct palette**: cyan (`--primary` 180°) as dominant, teal-cyan (`--secondary` 195°) as accent for ~12% of stars and the ribbon highlight. No gold (the previous code mistakenly assumed gold; the actual tokens are cyan).
- **Depth haze**: a low-alpha fog band at the horizon line softens where grid + stars meet — gives real atmospheric depth.
- **Motion budget**: total moving pixels capped low; grid lines redrawn each frame but only the math is animated, not geometry.

## Performance & accessibility

- DPR-aware canvas (cap 2×) — kept.
- Pause via `IntersectionObserver` + `visibilitychange` — kept.
- `prefers-reduced-motion`: render a single static composed frame, no RAF, no rings, no ribbon motion.
- Theme-reactive via `MutationObserver` on `<html>` — kept.
- Density auto-scales with viewport; mobile gets fewer stars/particles and a thinner ribbon.
- No new dependencies. No DOM children. No layout shift.

## Files

- **Rewrite** `src/components/landing/AnimatedHeroBackground.tsx` — single self-contained canvas component, same export, same `<canvas>` placement. No prop API.
- `HeroSection.tsx` — **untouched**.

## Out of scope

- No SVG / image assets, no WebGL.
- No mic-driven reactive audio (keeping homepage zero-permission).
- The mini-orb is already removed; not re-introducing visual focal furniture.
