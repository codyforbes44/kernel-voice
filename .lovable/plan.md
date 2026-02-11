

# Fix: Voice Agent Accepting Random Audio as Input

## Problem

The voice agent responds to background noise, keyboard clicks, and ambient sounds as if they were user answers. This happens because Voice Activity Detection (VAD) settings are too sensitive across providers, and Gemini Live has no audio gating at all.

## Root Causes

1. **OpenAI**: Default VAD threshold (0.5) and "Snappy" preset (0.25) are too low -- ambient noise triggers turn detection
2. **Gemini Live**: Streams ALL captured audio continuously with zero client-side filtering -- any sound is treated as speech
3. **Silence duration too short**: 250-500ms means the agent jumps in before the user finishes thinking

## Solution

### 1. Raise Default VAD Thresholds and Silence Durations

**File**: `src/components/voice/voiceTypes.ts`

- Change "Snappy" preset: `vadThreshold` from `0.25` to `0.45`, `silenceDuration` from `250` to `400`
- Change "Natural" (balanced) preset: `vadThreshold` from `0.4` to `0.55`, `silenceDuration` from `400` to `600`
- Change "Thoughtful" preset: `vadThreshold` from `0.55` to `0.7`, `silenceDuration` from `800` to `1000`
- Increase `prefix_padding_ms` in edge function from `300` to `500` (captures more audio before speech start to avoid cutting off beginnings)

### 2. Increase OpenAI Edge Function Defaults

**File**: `supabase/functions/openai-realtime-token/index.ts`

- Default `threshold` from `0.5` to `0.6`
- Default `silence_duration_ms` from `500` to `600`
- Default `prefix_padding_ms` from `300` to `500`

### 3. Add Client-Side Audio Gate for Gemini Live

**File**: `src/hooks/useGeminiLiveConversation.ts`

Add an RMS energy gate in the `onaudioprocess` handler so audio chunks are only sent when the input level exceeds a minimum threshold:

- Calculate RMS of each audio buffer before sending
- Only send audio when RMS exceeds a configurable gate threshold (e.g., 0.01 -- well above silence/noise floor)
- Send silence packets (empty or zero-filled) when below threshold to maintain the WebSocket stream
- This prevents background noise from being interpreted as speech

### 4. Add VAD Sensitivity Control for Gemini Live Settings

**File**: `src/components/voice/voiceTypes.ts`

- Add `audioGateThreshold: number` (0.005 - 0.05) to `GeminiLiveSettings`
- Default to `0.01` (filters out typical ambient noise)

**File**: `src/components/voice/GeminiLiveSettingsPanel.tsx`

- Add a "Noise Gate" slider in the Gemini settings panel so users can tune sensitivity
- Label: "Noise Gate Sensitivity" with description "Higher = filters more background noise"

### 5. Widen the VAD Slider Range for OpenAI

**File**: `src/components/voice/OpenAISettingsPanel.tsx`

- Change VAD slider min from `0.1` to `0.2` (prevent users from setting dangerously low values)
- Add a warning badge when threshold is below 0.3: "May pick up background noise"

## Files Changed

| File | Change |
|------|--------|
| `src/components/voice/voiceTypes.ts` | Raise all preset VAD thresholds and silence durations; add `audioGateThreshold` to Gemini settings |
| `supabase/functions/openai-realtime-token/index.ts` | Raise default threshold and silence_duration_ms; increase prefix_padding_ms |
| `src/hooks/useGeminiLiveConversation.ts` | Add RMS audio gate before sending PCM chunks over WebSocket |
| `src/components/voice/OpenAISettingsPanel.tsx` | Raise VAD slider minimum to 0.2; add low-threshold warning |
| `src/components/voice/GeminiLiveSettingsPanel.tsx` | Add noise gate sensitivity slider |

## No Database Changes Required

