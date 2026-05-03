## Goal

Reposition the homepage as a dual-track product that speaks to two audiences in parallel — **end users** who want a personal AI voice assistant, and **builders** who want to embed agents and widgets — and rebuild pricing to match those two journeys with a real free tier and clearer value ladders.

## 1. Pricing restructure (Stripe + code)

Retire the current Starter / Plus / Pro mix and replace with four tiers that map to the two audiences:

| Tier      | Audience  | Price (USD/mo) | Stripe action               |
|-----------|-----------|----------------|-----------------------------|
| Free      | Both      | $0             | No Stripe product (gated in app) |
| Personal  | End users | $9             | New product + monthly price |
| Builder   | Devs      | $29            | New product + monthly price |
| Team      | Devs      | $99            | New product + monthly price |

What each tier unlocks (used in homepage teaser + Pricing page):

- **Free** — Voice assistant (3BI / Gemini Live), 7-day history, 1 saved agent, community support.
- **Personal** — Premium ElevenLabs voices, 30-day history, 5 saved agents, advanced voice customization, email support.
- **Builder** — Everything in Personal + 1 embeddable widget (10k widget messages/mo), knowledge base (100 docs), VAPI provider, custom agents unlimited, API access.
- **Team** — Everything in Builder + 5 widgets / 100k widget messages, 1k docs, 5 seats, priority support, SSO-ready, early access.

Stripe + code work:

1. Create 4 new Stripe products with monthly USD prices via Stripe tools.
2. Rewrite `src/lib/stripe.ts` so `STRIPE_PRICES` / `STRIPE_PRODUCTS` / `PRICING_INFO` use the new IDs and `TierName = 'free' | 'personal' | 'builder' | 'team'`. Keep the old constant names exported as deprecated aliases mapping to the closest new tier so nothing in the app breaks immediately.
3. Update `getTierName` and `PLUS_PRODUCT_IDS` (used for ElevenLabs gating) → rename to `PREMIUM_PRODUCT_IDS` = `[personal, builder, team]`. Add `BUILDER_PRODUCT_IDS = [builder, team]` for widget/API gating.
4. Audit usages of `STARTER` / `PLUS` / `PRO` constants and `useSubscription` consumers (gating in voice provider selector, widget editor, knowledge base) and rewire to the new product IDs.

## 2. Pricing page rewrite (`src/pages/Pricing.tsx`)

- Switch grid from 3 cards to 4 cards (Free, Personal, Builder, Team) with `lg:grid-cols-4`, mobile remains stacked.
- Add a **Monthly / Annual** toggle (UI only for now — annual prices will be added to Stripe in a follow-up). Annual displays a "save 20%" badge and crossed-out monthly equivalent.
- Free card has CTA `Get started` → `/auth` (no Stripe call).
- Mark Builder as `isPopular`.
- Add a comparison table below the cards (sticky first column on mobile via `overflow-x-auto`) with rows grouped by: Voice, Agents, Widgets & API, Support.
- Keep FAQ; add two new entries: "What's the difference between Personal and Builder?" and "Do I need an account to try it?".
- Add a small footnote: "Prices in USD. Cancel anytime."

## 3. Homepage refactor (`src/pages/LandingPage.tsx` + sections)

New section order:

```text
Hero (dual-track)
  ├─ Use ƷBI    → /assistant
  └─ Build with ƷBI → #build
SocialProofStrip (logos / stats)
ProductPreview (existing, polished)
TwoTracksSection  (NEW — side-by-side: Personal vs Builder)
PlatformCapabilities (existing, regrouped)
HowItWorks (existing — duplicated mini-flows per track)
PricingTeaser (NEW 4-tier version)
FAQTeaser (3 questions, link to /pricing)
FinalCTA (NEW — "Start free, upgrade when you outgrow it")
```

Section-level changes:

- **`HeroSection.tsx`** — Replace single headline with two-line dual headline (`Talk to ƷBI. Or build with it.`) and two primary CTAs side-by-side: `Try the assistant` and `Build a widget`. Keep parallax orb. Add a small trust strip under the buttons (`No credit card · 4 voice providers · WCAG AA`).
- **New `SocialProofStrip.tsx`** — One-line stat row (e.g. `Powered by ElevenLabs · Gemini Live · OpenAI Realtime · VAPI`) in muted tokens. No fake logos.
- **New `TwoTracksSection.tsx`** — Two large cards anchored at `#build` and `#use`. Left card "For people" → personal use cases (daily briefings, voice journaling, hands-free Q&A) → CTA `Open the assistant`. Right card "For builders" → embed widgets, knowledge base, custom agents, API → CTA `Start building`. Each card lists 4 outcome bullets.
- **`PlatformCapabilitiesSection.tsx`** — Regroup the 6 features into two visually labeled clusters ("Talk" and "Build") so the grid maps to the same dual-track story.
- **`HowItWorksSection.tsx`** — Add a small tab toggle at the top: `For talking` (Choose voice → Speak → Save agent) / `For building` (Configure widget → Add knowledge → Embed). Same 3-step layout, content swaps via state.
- **Replace `PricingTeaserSection.tsx`** — 4-card teaser using new `PRICING_INFO` (Free, Personal, Builder featured, Team). Each card has price, 3 highlights, and CTA → `/pricing`. Honors the monthly/annual toggle if present.
- **New `FinalCTASection.tsx`** — Full-width band with `Start free` (primary → `/auth`) and `View pricing` (outline → `/pricing`).

## 4. Accessibility, performance, SEO

- Every new section uses semantic `<section aria-labelledby>` and the existing `SectionHeading` / `SectionWrapper` primitives.
- Tab toggle in HowItWorks uses `role="tablist"` with proper `aria-selected` and arrow-key navigation.
- All Framer Motion `whileInView` blocks respect `useReducedMotionPref` (already in repo) — disable transforms when reduced motion is requested.
- Lazy-load `TwoTracksSection`, `FinalCTASection`, and the new pricing teaser via dynamic import to keep LCP focused on the hero.
- Update `<PageWrapper>` description on LandingPage to reflect dual-track positioning. Add JSON-LD `Product` snippets for the 4 plans on `/pricing` for richer SERP results.

## Technical details

- **Stripe creation** uses `stripe--create_stripe_product_and_price` three times (Personal $9, Builder $29, Team $99 — recurring monthly). Free has no Stripe product. Resulting IDs are written into `src/lib/stripe.ts`.
- **Backwards compatibility**: keep `STARTER_MONTHLY` / `PLUS_MONTHLY` / `PRO_MONTHLY` exports pointing at Personal / Builder / Team respectively so any in-flight subscriptions (and `check-subscription` mapping) keep resolving to a known tier. Existing customers on the old Stripe products will continue to be honored by `getTierName` via a legacy ID map.
- **Gating updates**: `useSubscription` consumers — `VoiceProviderSelector`, widget editor, knowledge base uploader — switch from `PLUS_PRODUCT_IDS`/`PRO_PRODUCT_IDS` to `PREMIUM_PRODUCT_IDS` and `BUILDER_PRODUCT_IDS`.
- **Annual toggle**: state lives in the Pricing page only for now; annual prices computed as `monthly * 12 * 0.8` for display. A follow-up task can add real annual Stripe prices and wire them in.
- **No DB migration required.** Subscription state is still resolved live from Stripe by `check-subscription`.

## Files

Created:
- `src/components/landing/SocialProofStrip.tsx`
- `src/components/landing/TwoTracksSection.tsx`
- `src/components/landing/FinalCTASection.tsx`
- `src/components/landing/FAQTeaserSection.tsx`

Edited:
- `src/lib/stripe.ts` (new product/price IDs, new tier names, legacy aliases)
- `src/pages/LandingPage.tsx` (new section order)
- `src/pages/Pricing.tsx` (4 cards, annual toggle, comparison table, JSON-LD)
- `src/components/landing/HeroSection.tsx` (dual-track copy + CTAs)
- `src/components/landing/PlatformCapabilitiesSection.tsx` (Talk / Build clusters)
- `src/components/landing/HowItWorksSection.tsx` (tab toggle)
- `src/components/landing/PricingTeaserSection.tsx` (4-tier rewrite)
- `src/components/voice/VoiceProviderSelector.tsx` (gating constants)
- Any other `useSubscription`/`PLUS_PRODUCT_IDS` consumers found during the gating audit.

## Out of scope (call out, don't build)

- Real annual Stripe prices (UI-only for now).
- Seat management for the Team plan (display only; multi-seat onboarding is a separate workstream).
- Migrating existing subscribers from old Starter/Plus/Pro products — they keep working via the legacy ID map; a proactive migration is a follow-up.
