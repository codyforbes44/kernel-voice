

# API & Voice Provider Updates

## Overview

This plan covers five areas: updating edge function models, upgrading TTS, modernizing Deno imports, and adding a new Gemini Live voice provider.

---

## 1. widget-chat: Update to latest GPT model

**Current**: `gpt-4o-mini` (fallback) and `claude-3-5-sonnet-20241022` (primary)
**Update to**: `gpt-4.1-mini` (fallback) and `claude-sonnet-4-20250514` (primary)

Changes in `supabase/functions/widget-chat/index.ts`:
- Line 294: `claude-3-5-sonnet-20241022` -> `claude-sonnet-4-20250514`
- Line 315: `gpt-4o-mini` -> `gpt-4.1-mini`

---

## 2. analyze-document: Update GPT + add Gemini option

**Current**: `gpt-4o` only via OpenAI
**Update to**: `gpt-4.1` as default, with `gemini-2.5-pro` as selectable option

Changes in `supabase/functions/analyze-document/index.ts`:
- Accept a new `provider` parameter (`openai` | `gemini`, default `openai`)
- Update OpenAI model from `gpt-4o` to `gpt-4.1`
- Add Gemini Direct API path using `GEMINI_API_KEY` with `gemini-2.5-pro` model
- Gemini supports multimodal (image + text) via `inlineData` in its API
- Remove the outdated `xhr` polyfill import
- Use `Deno.serve()` instead of imported `serve()`

---

## 3. widget-tts: Upgrade to eleven_flash_v2_5

**Current**: `eleven_turbo_v2_5`
**Update to**: `eleven_flash_v2_5`

Changes in `supabase/functions/widget-tts/index.ts`:
- Line 46: `eleven_turbo_v2_5` -> `eleven_flash_v2_5`
- Remove `serve` import, use `Deno.serve()` natively
- Remove `base64Encode` import, use native `btoa()` with chunked encoding or `Uint8Array` approach

---

## 4. Deno Standard Library Updates

Modernize all edge functions by replacing `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"` with native `Deno.serve()`. Functions affected:

| Function | Current | Update |
|---|---|---|
| `analyze-document` | `serve()` import + `xhr` polyfill | `Deno.serve()` |
| `widget-tts` | `serve()` import + `base64` import | `Deno.serve()` + native encoding |
| `chat` | `serve()` import | `Deno.serve()` |
| `generate-content` | `serve()` import | `Deno.serve()` |
| `openai-realtime-token` | `serve()` import + `xhr` polyfill | `Deno.serve()` |
| `voice-session` | `serve()` import | `Deno.serve()` |
| `vapi-session` | `serve()` import | `Deno.serve()` |

Note: `widget-chat`, `elevenlabs-scribe-token`, and Stripe functions already use `Deno.serve()` or will be updated in their respective changes.

For base64 encoding in `widget-tts`, replace the Deno std import with a safe chunked approach:
```typescript
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
```

---

## 5. New Voice Provider: Gemini Live (Voice AI)

**Available resource**: `GEMINI_API_KEY` is already configured and can access the Gemini Live API for real-time voice conversations.

**Model**: `gemini-2.5-flash-native-audio-preview-12-2025` -- provides low-latency voice with native audio, 30 HD voices in 24 languages, and tool calling support.

### Implementation Plan

**A. New edge function: `gemini-live-token/index.ts`**
- Generates a temporary API token/config for client-side Gemini Live WebSocket connection
- Uses `GEMINI_API_KEY`
- Returns configuration needed for the client to establish a WebSocket connection to `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`
- Feature-gated behind premium access (same as ElevenLabs/VAPI)

**B. New hook: `useGeminiLiveConversation.ts`**
- WebSocket-based connection to Gemini Live API
- Handles audio capture (PCM 16kHz input) and playback (PCM 24kHz output)
- Processes real-time transcripts and tool calls
- Follows the same interface pattern as `useOpenAIConversation.ts`

**C. Update voice provider types** in `src/components/voice/voiceTypes.ts`:
- Add `'gemini'` to `VoiceProvider` type
- Add `GeminiLiveSettings` interface (model selection, language, voice name)
- Add provider info entry for Gemini Live
- Add to `VALID_PROVIDERS` array

**D. Update `VoiceProviderSelector.tsx`**:
- Gemini Live appears in the dropdown as a premium provider (gated by `elevenlabs_voice` feature like VAPI)
- Add `GeminiLiveSettingsPanel` component for voice/language selection

**E. Update `useVoiceProviderPreference.ts`**:
- Add Gemini Live settings state and persistence

**F. Update `useVoiceAssistant.ts`**:
- Add Gemini Live as a provider option, routing to the new hook

### Gemini Live Voice Options (30 HD voices)
Examples: Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr -- these will be selectable in the settings panel.

---

## Summary of All File Changes

| File | Action |
|---|---|
| `supabase/functions/widget-chat/index.ts` | Update model strings |
| `supabase/functions/analyze-document/index.ts` | Rewrite: add Gemini provider, update GPT model, modernize Deno |
| `supabase/functions/widget-tts/index.ts` | Update TTS model, modernize Deno |
| `supabase/functions/chat/index.ts` | Modernize Deno import |
| `supabase/functions/generate-content/index.ts` | Modernize Deno import |
| `supabase/functions/openai-realtime-token/index.ts` | Modernize Deno import |
| `supabase/functions/voice-session/index.ts` | Modernize Deno import |
| `supabase/functions/vapi-session/index.ts` | Modernize Deno import |
| `supabase/functions/gemini-live-token/index.ts` | **New** -- Gemini Live session endpoint |
| `supabase/config.toml` | Add `gemini-live-token` function config |
| `src/components/voice/voiceTypes.ts` | Add Gemini provider type, settings, voices |
| `src/components/voice/VoiceProviderSelector.tsx` | Add Gemini Live option |
| `src/components/voice/GeminiLiveSettingsPanel.tsx` | **New** -- Settings UI for Gemini Live |
| `src/hooks/useGeminiLiveConversation.ts` | **New** -- WebSocket voice hook |
| `src/hooks/useVoiceProviderPreference.ts` | Add Gemini settings state |
| `src/hooks/useVoiceAssistant.ts` | Route Gemini provider to new hook |

