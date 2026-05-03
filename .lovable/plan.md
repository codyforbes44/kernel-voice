# Enhance hero background — grid + stars

## What you'll see

- **Perspective grid** that converges toward a horizon (~55% down) instead of the current flat grid. Horizontal lines get denser near the horizon — adds real depth.
- **Twinkling star field** — 50–160 static stars (density scales with viewport), each with its own sin-phased opacity so the field shimmers naturally. Brightest stars get a soft halo.
- **Occasional shooting stars** — a streak with motion-blur tail crosses every 6–12 seconds (max 2 alive at once). Subtle, not noisy.
- **Drifting particles + constellation links** — kept, but retuned with brand colors and softer alpha.
- **Pointer parallax** — grid vanishing point and stars drift slightly toward the cursor (eased, very small offsets). Disabled when off-screen or reduced motion.
- **Soft horizon glow** — a thin warm band at the vanishing point ties the layers together.

## Look & feel

- Switches from hardcoded cyan to `--primary` (Warm Gold) for stars/particles and `--secondary` for the grid lines, so it now matches the OLED + brand identity. Re-resolves on theme switch via `MutationObserver` on `<html>` (no per-frame DOM reads).
- Light mode uses lower alphas so the grid stays whisper-quiet on the warm-white surface.

## Performance & accessibility

- **DPR-aware** canvas — fixes the soft/blurry look on retina. Capped at 2× to stay cheap.
- **Pause when off-screen** (existing IntersectionObserver) **and** when tab is hidden (new `visibilitychange` listener).
- **Honors `prefers-reduced-motion`**: renders a single composed static frame and skips the RAF loop entirely. No twinkling, no shooting stars, no parallax.
- **Frame-time clamp** (max 48 ms dt) so returning from a paused tab doesn't fast-forward animations.
- Density auto-scales with viewport area; mobile gets fewer particles/stars.

## Files

- **Rewrite** `src/components/landing/AnimatedHeroBackground.tsx` — single self-contained canvas component, same export, same `<canvas>` placement. No API changes.
- `HeroSection.tsx` is **unchanged** — it already renders `<AnimatedHeroBackground />` inside the parallax `motion.div` with the radial primary glow on top.

## Out of scope

- No new dependencies, no SVG/image asset, no DOM children added.
- The mini-orb, headline animations, and scroll parallax in `HeroSection` are untouched.
