

# Open All Voice Providers to All Visitors

## Overview
Remove the subscription/login gate from voice providers so every visitor -- guest or authenticated, free or paid -- can use any available provider (3BI, ElevenLabs, VAPI, Gemini Live).

---

## Changes

### 1. `src/hooks/useVoiceProviderPreference.ts`
- Remove the `useUserFeatures` import and the fallback `useEffect` that resets premium providers to `openai` when the user lacks the `elevenlabs_voice` feature.
- Remove the `hasFeature` check inside `updateProvider` that blocks switching to premium providers.
- Remove the `hasElevenLabsAccess` return value (no longer needed).

### 2. `src/components/voice/VoiceProviderSelector.tsx`
- Remove the `useUserFeatures` import and all feature-gating logic (`availableProviders`, `hasPremiumAccess`, `isLocked`).
- Make all 4 providers always selectable (no locked state, no Crown icon).
- Remove the "Premium voices with Pro / Upgrade" banner entirely.
- Simplify `handleProviderChange` to remove the `availableProviders.includes()` check.

### 3. `src/components/voice/voiceTypes.ts`
- Set `isPremium: false` on all providers (ElevenLabs, VAPI, Gemini Live) so no UI component ever interprets them as gated.

---

## What stays the same
- Subscription system, pricing page, and feature flags remain intact for any future use.
- Authentication is still required for conversation persistence, document upload, and other non-voice features.
- The guest registration prompt still triggers after 3 AI responses.

