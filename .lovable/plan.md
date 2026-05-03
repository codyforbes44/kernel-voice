## Goal
Replace the static "ƷBI Assistant" mockup in `ProductPreviewSection` with a true interactive voice-interaction demo that represents the platform: a live state machine cycling through Listening → Thinking → Speaking, animated transcript bubbles, a real waveform driven by a simulated audio level, an orb that scales/glows with that level, clickable state pills, play/pause, and a clear CTA into the real assistant.

Why simulated rather than a real mic session: starting an actual voice session on the marketing page would require microphone permission + WebRTC/WebSocket connection on first scroll — bad UX, slow LCP, and surprising. Instead we build a faithful, scripted demo that uses the same visual language (orb, waveform canvas, state names) as the real `/assistant` page, then drive users into the live experience via the existing CTA.

## What changes

### Single file: `src/components/landing/ProductPreviewSection.tsx`

Rewrite the component to include:

1. **State machine** (`idle | listening | thinking | speaking`)
   - Drives a 3-turn scripted conversation that loops.
   - Phase timing: listening 2.6s, thinking 1.1s, speaking 4.2s, 0.7s pause.
   - Pauses entirely when the section is off-screen (uses `useInView` from framer-motion) — honors the performance memory.

2. **Animated transcript bubbles**
   - User bubble (right-aligned, primary tint) types out during `listening`.
   - Agent bubble (left-aligned, muted) types out during `speaking`.
   - Blinking caret while typing.
   - 3 rotating turns covering the platform's value props (real-time, embed, knowledge base).

3. **Live orb + waveform**
   - Reuses the existing `LiveWaveformCanvas` component.
   - A simulated audio-level signal (sine + noise) feeds both the canvas and an orb scale/glow spring.
   - Orb gradient + ring shadow change per state.
   - In `thinking`, orb adds a slow rotating dashed inner ring.

4. **Interactive state pills**
   - Listening / Thinking / Speaking pills below the orb are now buttons.
   - Active pill gets a primary border + tint and a 1.1× icon scale.
   - Clicking a pill jumps the demo to that state immediately.

5. **Play/Pause control** in the window chrome (top-right) so visitors can freeze a state to read the transcript.

6. **CTA underneath**
   - Primary `Try it for real` button → navigates to `/assistant` (matches Hero's primary action).
   - Small "No sign-up required to start" microcopy.

### No copy that names third-party providers (matches the privacy-first / white-label memory).

### Reuses & dependencies
- Uses existing `LiveWaveformCanvas`, `Button`, `SectionWrapper`, `cn`, framer-motion (`motion`, `AnimatePresence`, `useInView`), lucide icons. No new dependencies.

## Files touched
- `src/components/landing/ProductPreviewSection.tsx` — full rewrite of the component body. The section's id (`product-preview`) and surrounding layout are preserved so `LandingPage.tsx` needs no changes.

## Out of scope
- No real microphone capture or live voice session on the homepage.
- No changes to `/assistant`, hero, or other landing sections.
- No new shared components — everything lives in this file.