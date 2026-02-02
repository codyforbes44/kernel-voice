

# Plan: Additional AI Voice Provider Options

## Overview

Expand the voice assistant with additional AI voice providers to offer users more choices, specialized capabilities, and competitive differentiation. The newly added `VAPI_API_KEY` enables immediate integration of VAPI, with opportunities for 3 more premium providers.

## Suggested Providers

### 1. VAPI - AI Voice Agents Platform
**Priority: High** (API key already configured)

| Feature | Details |
|---------|---------|
| **Key Strength** | Full-stack voice AI with phone calling, outbound/inbound support |
| **Unique Capabilities** | Phone number integration, call transfers, voicemail detection |
| **Connection Type** | WebSocket / WebRTC |
| **Use Case** | Business automation, customer service, appointment scheduling |
| **Tier** | Premium (Kernel Pro) |

**Implementation Notes:**
- Uses `@vapi-ai/client-sdk-react` SDK
- Supports real-time voice with function calling
- Can connect to phone lines (PSTN integration)
- Requires `VAPI_API_KEY` (already configured)

### 2. Deepgram - Fastest STT + TTS
**Priority: Medium**

| Feature | Details |
|---------|---------|
| **Key Strength** | Industry-leading transcription speed and accuracy |
| **Unique Capabilities** | <300ms latency, speaker diarization, custom vocabulary |
| **Connection Type** | WebSocket streaming |
| **Use Case** | Transcription-heavy workflows, multi-speaker scenarios |
| **Tier** | Premium (Kernel Pro) |
| **Required Secret** | `DEEPGRAM_API_KEY` |

**Implementation Notes:**
- Uses `@deepgram/sdk` 
- Best-in-class speech-to-text accuracy
- Multiple TTS voice options (Aura voices)
- Can be used as STT layer for other providers

### 3. Hume AI - Emotion-Aware Voice
**Priority: Medium**

| Feature | Details |
|---------|---------|
| **Key Strength** | Empathic Voice Interface (EVI) - understands and responds to emotional cues |
| **Unique Capabilities** | Real-time emotion detection, prosody analysis, adaptive responses |
| **Connection Type** | WebSocket |
| **Use Case** | Mental health support, coaching, emotionally-intelligent assistants |
| **Tier** | Premium (Kernel Pro) |
| **Required Secrets** | `HUME_API_KEY`, `HUME_SECRET_KEY` |

**Implementation Notes:**
- Uses `@humeai/voice-react` SDK
- Detects 48+ emotional expressions in voice
- Responds with emotional intelligence
- Unique differentiator in the market

### 4. Azure AI Speech - Enterprise Grade
**Priority: Low**

| Feature | Details |
|---------|---------|
| **Key Strength** | Enterprise reliability, compliance, multi-region |
| **Unique Capabilities** | Custom Neural Voice, pronunciation assessment, keyword spotting |
| **Connection Type** | WebSocket / REST |
| **Use Case** | Enterprise deployments, education, accessibility |
| **Tier** | Premium (Kernel Pro) |
| **Required Secrets** | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` |

**Implementation Notes:**
- Uses `microsoft-cognitiveservices-speech-sdk`
- 400+ voices across 140+ languages
- HIPAA, SOC 2, ISO 27001 compliant
- Custom voice cloning available

## Recommended Implementation Order

```text
Phase 1 (Immediate):
┌─────────────────────────────────────────────┐
│  VAPI Integration                           │
│  • API key already configured               │
│  • Strong business use case                 │
│  • Phone calling differentiator             │
└─────────────────────────────────────────────┘

Phase 2 (Near-term):
┌─────────────────────────────────────────────┐
│  Deepgram Integration                       │
│  • Can serve as universal STT layer         │
│  • Improves transcription quality           │
│  • Fast integration                         │
└─────────────────────────────────────────────┘

Phase 3 (Future):
┌─────────────────────────────────────────────┐
│  Hume AI (Empathic Voice)                   │
│  • Unique market positioning                │
│  • Premium differentiator                   │
│  • Longer integration timeline              │
└─────────────────────────────────────────────┘
```

## Technical Changes for VAPI Integration

### 1. Update Voice Types

Add VAPI as a new provider in `src/components/voice/voiceTypes.ts`:

```typescript
export type VoiceProvider = 'elevenlabs' | 'openai' | 'vapi';

export interface VAPISettings {
  assistantId: string;
  enableRecording: boolean;
  hipaaEnabled: boolean;
  backgroundDenoisingEnabled: boolean;
}

export const DEFAULT_VAPI_SETTINGS: VAPISettings = {
  assistantId: '',
  enableRecording: false,
  hipaaEnabled: false,
  backgroundDenoisingEnabled: true,
};
```

### 2. Create Edge Function

New `supabase/functions/vapi-session/index.ts` to authenticate and create VAPI sessions.

### 3. Create VAPI Conversation Hook

New `src/hooks/useVAPIConversation.ts` mirroring the pattern of `useOpenAIConversation.ts`.

### 4. Create Settings Panel

New `src/components/voice/VAPISettingsPanel.tsx` for provider-specific configuration.

### 5. Update Provider Selector

Modify `VoiceProviderSelector.tsx` to include VAPI as an option with appropriate feature badges.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/voice/voiceTypes.ts` | Modify | Add VAPI type definitions |
| `supabase/functions/vapi-session/index.ts` | Create | VAPI authentication endpoint |
| `src/hooks/useVAPIConversation.ts` | Create | VAPI conversation management |
| `src/components/voice/VAPISettingsPanel.tsx` | Create | VAPI settings UI |
| `src/hooks/useVoiceAssistant.ts` | Modify | Integrate VAPI provider |
| `src/components/voice/VoiceProviderSelector.tsx` | Modify | Add VAPI option |
| `supabase/config.toml` | Modify | Add vapi-session function config |

## Provider Comparison Matrix

| Feature | 3ʙɪ (OpenAI) | ElevenLabs | VAPI | Deepgram | Hume |
|---------|--------------|------------|------|----------|------|
| Realtime Voice | ✅ | ✅ | ✅ | ✅ | ✅ |
| Languages | 1 | 29+ | 20+ | 36+ | 1 |
| Emotion Detection | ❌ | ❌ | ❌ | ❌ | ✅ |
| Phone Integration | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tool Calling | ✅ | ✅ | ✅ | ❌ | ✅ |
| STT Accuracy | Good | Excellent | Good | Best | Good |
| Latency | ~200ms | ~300ms | ~400ms | ~150ms | ~400ms |
| Tier | Free | Pro | Pro | Pro | Pro |

## Security Considerations

1. All new API keys stored as Supabase secrets
2. Edge functions validate JWT before issuing session tokens
3. Feature gating via `user_features` table (like ElevenLabs)
4. Rate limiting at edge function level

## User Experience

### Free Users
- Access to 3ʙɪ (OpenAI Realtime) only
- See "Pro" badges on all premium providers

### Pro Subscribers
- Full access to ElevenLabs, VAPI, and future providers
- Provider switching in settings panel
- Provider-specific customization options

