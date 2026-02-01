

# Grok Removal and Voice Provider Upgrade Plan

## Overview

This plan removes all xAI Grok integration from the codebase and provides recommendations for upgrading the remaining voice providers (ElevenLabs and OpenAI) to enhance user experience.

---

## Part 1: Complete Grok Removal

### Files to Delete

| File | Purpose | Action |
|------|---------|--------|
| `src/hooks/useGrokConversation.ts` | 761-line Grok WebSocket conversation hook | Delete |
| `src/components/voice/GrokSettingsPanel.tsx` | Grok-specific settings UI | Delete |
| `supabase/functions/grok-voice-relay/index.ts` | 653-line WebSocket relay function | Delete folder |
| `supabase/functions/xai-session-token/index.ts` | Ephemeral token generator | Delete folder |
| `supabase/functions/validate-xai-key/index.ts` | API key validation | Delete folder |
| `supabase/functions/test-xai-connection/index.ts` | Connection testing | Delete folder |

### Files to Modify

#### 1. Voice Types (`src/components/voice/voiceTypes.ts`)
- Remove `GrokVoice` type
- Remove `GrokVoiceSettings` interface
- Remove `GrokSettingsPreset` type
- Remove `GROK_PRESETS` constant
- Remove `DEFAULT_GROK_SETTINGS` constant
- Remove `grokVoices` array
- Remove `VALID_GROK_VOICES` constant
- Remove `'grok'` from `VoiceProvider` type
- Remove `grok` from `providerInfo` object
- Remove `'grok'` from `VALID_PROVIDERS` array

#### 2. Voice Provider Selector (`src/components/voice/VoiceProviderSelector.tsx`)
- Remove Grok-related props (`grokVoice`, `onGrokVoiceChange`, `grokSettings`, `onGrokSettingsChange`)
- Remove `GrokSettingsPanel` import and usage
- Remove Grok voice persistence logic
- Update type re-exports to exclude Grok types

#### 3. Voice Provider Preference Hook (`src/hooks/useVoiceProviderPreference.ts`)
- Remove `grokVoice` and `grokSettings` state
- Remove Grok-related setters
- Remove `grok_voice` and `grok_settings` from profile loading/saving
- Default provider to `'openai'` instead of first available

#### 4. Voice Assistant Hook (`src/hooks/useVoiceAssistant.ts`)
- Remove `useGrokConversation` import and usage
- Remove `grokVoice`, `setGrokVoice`, `grokSettings`, `setGrokSettings` from provider preference
- Remove Grok conversation hook instantiation
- Simplify provider conditional logic (only ElevenLabs and OpenAI)
- Remove fallback mode logic (was Grok-specific)

#### 5. OpenAI Conversation Hook (`src/hooks/useOpenAIConversation.ts`)
- Remove import of types from `useGrokConversation` (move `ConnectionPhase` and `ToolExecution` types locally)

#### 6. Config File (`supabase/config.toml`)
- Remove `[functions.grok-voice-relay]` section
- Remove `[functions.xai-session-token]` section
- Remove `[functions.validate-xai-key]` section
- Remove `[functions.test-xai-connection]` section

### Database Changes
- The `profiles` table has `grok_voice` and `grok_settings` columns
- These can remain for backwards compatibility but will be unused
- Optional: Migration to remove columns (not critical)

---

## Part 2: Existing API Resources Review

### Currently Configured Secrets

| Secret | Provider | Status | Usage |
|--------|----------|--------|-------|
| `ELEVENLABS_API_KEY` | ElevenLabs | Active | Voice sessions |
| `VITE_ELEVENLABS_AGENT_ID` | ElevenLabs | Active | Agent configuration |
| `OPENAI_API_KEY` | OpenAI | Active | Realtime API + embeddings |
| `ANTHROPIC_API_KEY` | Anthropic | Unused | Previously for chat (now Lovable AI) |
| `PERPLEXITY_API_KEY` | Perplexity | Active | Web search |
| `LOVABLE_API_KEY` | Lovable | Active | Chat AI gateway |
| `XAI_API_KEY` | xAI | To Remove | Was for Grok |

### Active Voice Providers After Grok Removal

#### 1. ElevenLabs (Current Implementation)
- **Endpoint**: `voice-session` edge function
- **Features**: Premium voice quality, voice cloning capability
- **Voices**: Configured via agent in ElevenLabs dashboard
- **Latency**: Medium (WebSocket-based)

#### 2. OpenAI Realtime (Current Implementation)
- **Endpoint**: `openai-realtime-token` edge function
- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Features**: WebRTC, 8 voices, tool calling, server VAD
- **Latency**: Low (WebRTC peer-to-peer)

---

## Part 3: Voice Provider Upgrade Recommendations

### Option A: Upgrade OpenAI to `gpt-realtime` (Recommended)

OpenAI released `gpt-realtime` (August 2025) with significant improvements:

**New Features Available:**
- Two new voices: **Cedar** and **Marin** (most natural sounding)
- MCP server support for external tool integration
- **Image input support** - users can send images during voice conversations
- **SIP phone calling support** - direct phone integration
- Improved instruction following and tool calling precision
- Better multi-language switching mid-conversation

**Implementation Changes:**
1. Update model from `gpt-4o-realtime-preview-2024-12-17` to `gpt-realtime`
2. Add Cedar and Marin to voice options
3. (Optional) Add image upload during voice sessions
4. (Optional) Add SIP integration for phone-based access

**User Experience Benefits:**
- More natural, expressive speech
- Better reasoning and complex task handling
- Improved reliability for production use

---

### Option B: Upgrade ElevenLabs to Conversational AI 2.0

ElevenLabs released Conversational AI 2.0 (January 2026) with major enhancements:

**New Features Available:**
- **State-of-the-art turn-taking model** - understands "um", "ah", pauses
- **Integrated RAG** - knowledge base access with low latency
- **Automatic language detection** - seamless multilingual conversations
- **Multi-character switching** - multiple personas in one agent
- **Voice + Text modality** - combined text chat with voice
- **Outbound telephony** - batch call scheduling, SIP trunking
- **HIPAA compliance** - healthcare-ready

**Implementation Changes:**
1. Update ElevenLabs agent configuration in dashboard
2. Enable RAG integration with knowledge base
3. Enable automatic language detection
4. (Optional) Add text + voice combined mode

**User Experience Benefits:**
- Natural conversation flow (no awkward interruptions)
- Access knowledge base during voice conversations
- Automatic language switching for global users

---

### Option C: Add Hume AI EVI (Emotional Voice Interface)

Hume AI offers a unique emotional intelligence voice API:

**Unique Features:**
- **Emotion detection** - understands user emotional state
- **Empathic responses** - responds with emotional intelligence
- **Expression analysis** - confidence scores for emotions
- **WebSocket-based** - similar architecture to current implementation

**Implementation Effort:** Medium (new integration)

**User Experience Benefits:**
- AI responds appropriately to frustrated/happy/confused users
- More empathetic customer support interactions
- Unique differentiation from competitors

---

## Part 4: Recommended Implementation Path

### Phase 1: Grok Removal (Immediate)
1. Delete Grok-related files and edge functions
2. Update type definitions and hooks
3. Set OpenAI as default voice provider
4. Update config.toml
5. Test ElevenLabs and OpenAI providers

### Phase 2: OpenAI Upgrade (Short-term)
1. Update to `gpt-realtime` model
2. Add Cedar and Marin voices
3. Improve voice settings UI with new presets
4. Test and validate improvements

### Phase 3: ElevenLabs Enhancement (Medium-term)
1. Enable Conversational AI 2.0 features in dashboard
2. Integrate RAG with knowledge base
3. Enable automatic language detection
4. Add voice + text combined mode option

### Phase 4: Consider Hume AI (Future)
1. Evaluate emotional intelligence use cases
2. Prototype integration if valuable for user base
3. Add as third provider option

---

## Technical Summary

### Files to Delete
- `src/hooks/useGrokConversation.ts`
- `src/components/voice/GrokSettingsPanel.tsx`
- `supabase/functions/grok-voice-relay/` (folder)
- `supabase/functions/xai-session-token/` (folder)
- `supabase/functions/validate-xai-key/` (folder)
- `supabase/functions/test-xai-connection/` (folder)

### Files to Modify
- `src/components/voice/voiceTypes.ts`
- `src/components/voice/VoiceProviderSelector.tsx`
- `src/hooks/useVoiceProviderPreference.ts`
- `src/hooks/useVoiceAssistant.ts`
- `src/hooks/useOpenAIConversation.ts`
- `supabase/config.toml`

### Edge Functions to Delete
1. `grok-voice-relay`
2. `xai-session-token`
3. `validate-xai-key`
4. `test-xai-connection`

### Post-Removal Default
- Default voice provider: **OpenAI Realtime**
- Fallback provider: **ElevenLabs**
- No Grok references remain in codebase

