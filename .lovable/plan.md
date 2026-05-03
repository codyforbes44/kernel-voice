## Goal
Remove the "POWERED BY ElevenLabs · Gemini Live · OpenAI Realtime · VAPI" strip from the homepage, scrub the same technology attribution from the rest of the landing page (it duplicates the strip and conflicts with the project's white-label / privacy-first stance), and tighten the homepage flow into a best-in-class structure for the use case (a real-time voice assistant you can use today and embed tomorrow).

## What changes

### 1. Remove the Powered By strip
- Delete `src/components/landing/SocialProofStrip.tsx`.
- Remove its import and usage from `src/pages/LandingPage.tsx`.

### 2. Scrub provider names from the rest of the homepage
Per the white-label / privacy-first memory, public marketing copy should not name third-party voice tech.

- `src/pages/LandingPage.tsx` — rewrite `description` and `keywords` so they no longer list ElevenLabs / Gemini Live / OpenAI Realtime / VAPI. Replace with capability-focused copy ("multi-engine voice", "real-time voice AI", "embeddable assistant").
- `src/components/landing/PlatformCapabilitiesSection.tsx` — change the Multi-Provider Voice card description from naming the four providers to something like "Pick the voice engine that best matches your brand and budget — switch any time."
- `src/components/landing/FAQTeaserSection.tsx` — rewrite the answer about voice providers to "ƷBI ships with four production-grade voice engines, available on every paid tier" (no vendor names).

### 3. Refactor the homepage into a tighter, best-in-class flow
Current order: Hero → SocialProofStrip → ProductPreview → TwoTracks → PlatformCapabilities → HowItWorks → PricingTeaser → FAQTeaser → FinalCTA.

New order in `src/pages/LandingPage.tsx`:

```text
Hero (try it / build with it)
ProductPreviewSection      ← show the product immediately after the hero
TwoTracksSection           ← Talk vs Build positioning
PlatformCapabilitiesSection
HowItWorksSection
PricingTeaserSection
FAQTeaserSection
FinalCTASection
```

Rationale:
- Removing the social-proof strip eliminates a low-signal row that is now also off-brand.
- Moving `ProductPreviewSection` directly under the hero means visitors see the actual assistant before any feature copy — strongest possible "use today" signal for this use case.
- `TwoTracks` then frames the two audiences (end users vs builders) before diving into capabilities.
- The rest of the funnel (capabilities → how → pricing → FAQ → CTA) is preserved.

### 4. Hero trust strip
Keep the hero's existing trust strip ("No credit card · 4 voice providers · Embed anywhere"). It already conveys multi-provider value without naming vendors, so it stays.

## Files touched
- `src/pages/LandingPage.tsx` — remove SocialProofStrip, reorder sections, rewrite SEO copy.
- `src/components/landing/SocialProofStrip.tsx` — delete.
- `src/components/landing/PlatformCapabilitiesSection.tsx` — rewrite one card description.
- `src/components/landing/FAQTeaserSection.tsx` — rewrite one FAQ answer.

## Out of scope
- No changes to Hero, ProductPreview, TwoTracks, HowItWorks, PricingTeaser, FinalCTA visual design.
- No changes to provider selection UI inside `/assistant` (that's product surface, not marketing).
- No new sections — refactor focuses on removing noise and resequencing.