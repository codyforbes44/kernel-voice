# Remove the microphone icon from the hero orb

## What changes

Right now the hero shows a gradient orb with a big white **microphone glyph** in the middle. I'll remove that glyph and refactor the orb so it still feels like a confident, branded focal point — not an empty circle.

## New orb (replacement)

- Same size, same glow halo, same `animate-glow-pulse`.
- Keep the warm-gold → secondary gradient base.
- Add a slowly rotating **conic gradient** layer (Warm Gold → Secondary → Primary Glow → Warm Gold) — this matches the existing animated `BrandLogo` identity.
- Add a soft inner ring + subtle glass highlight so it reads as a polished sphere, not a flat disc.
- Stays purely decorative (`aria-hidden="true"`, no semantic change).

## Other mic icons on the page

I'll keep the two **smaller** mic icons because they're labels for text, not standalone glyphs:

- "**4 voice providers**" trust pill — the icon clarifies the metric.
- "**Try the assistant**" CTA — the icon reinforces the action.

If you'd rather strip those too, say the word and I'll swap them for `Sparkles` / `Volume2` or remove them outright.

## Files

- **Edit** `src/components/landing/HeroSection.tsx` — replace the orb's inner JSX (lines 59–64). No other file touched.
- The `Mic` import stays (still used by the trust strip + CTA).

## What you won't see change

- Layout, spacing, parallax scroll, headline, CTAs, trust strip, animated background — all unchanged.
- No new dependencies.
