

# Add ElevenLabs Agent ID to Assistants and Widgets

## Overview

Currently, the ElevenLabs voice integration uses a single global agent ID stored as a secret (`VITE_ELEVENLABS_AGENT_ID`). This change allows users to assign a **specific ElevenLabs Agent ID** per saved assistant and per external widget, so different configurations can use different ElevenLabs agents.

## What Changes

### 1. ElevenLabs Settings -- add `agentId` field

Add an optional `elevenlabsAgentId` field to:
- `ElevenLabsSettings` in `src/components/voice/voiceTypes.ts` (for the main voice assistant)
- `KernelWidgetConfig` in `src/embed/types.ts` (for external widgets)

### 2. Voice Assistant -- pass custom agent ID to edge function

**`src/hooks/useVoiceAssistant.ts`**: When starting an ElevenLabs session, include `elevenlabsAgentId` from the current settings in the request body to the `voice-session` edge function.

**`supabase/functions/voice-session/index.ts`**: Accept an optional `agentId` in the request body. If provided, use it instead of the global `VITE_ELEVENLABS_AGENT_ID` secret.

### 3. ElevenLabs Settings Panel -- Agent ID input

**`src/components/voice/ElevenLabsSettingsPanel.tsx`**: Add an "Agent ID" text input field under the Advanced Settings accordion. Shows a helper text explaining users can find their agent ID in the ElevenLabs dashboard. When empty, the system default is used.

### 4. Saved Agents -- persistence

No schema changes needed. The `elevenlabsAgentId` is stored inside `provider_settings` JSON, which already persists all provider-specific config. The `handleLoadAgent` function already restores `provider_settings` into `elevenlabsSettings`, so it will flow automatically.

### 5. Widget Editor -- Agent ID field

**`src/components/admin/widgets/WidgetEditor.tsx`**: Add an "ElevenLabs Agent ID" input in the Voice & Audio tab (visible when voice conversation is enabled). Stored in the widget config object.

### 6. Widget Voice Conversation -- use custom agent ID

**`src/embed/useWidgetVoiceConversation.ts`**: Accept an optional `elevenlabsAgentId` and pass it to the voice-session edge function when starting voice conversations.

**`src/embed/KernelWidget.tsx`**: Pass the `elevenlabsAgentId` from config to the voice conversation hook.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/voice/voiceTypes.ts` | Add `elevenlabsAgentId?: string` to `ElevenLabsSettings` |
| `src/components/voice/ElevenLabsSettingsPanel.tsx` | Add Agent ID input in Advanced Settings |
| `src/hooks/useVoiceAssistant.ts` | Pass `elevenlabsAgentId` in voice-session request body |
| `supabase/functions/voice-session/index.ts` | Accept optional `agentId` from request body, use instead of env var |
| `src/embed/types.ts` | Add `elevenlabsAgentId?: string` to `KernelWidgetConfig` |
| `src/components/admin/widgets/WidgetEditor.tsx` | Add Agent ID input in Voice & Audio tab, persist in config |
| `src/embed/useWidgetVoiceConversation.ts` | Accept and pass `elevenlabsAgentId` to voice-session |
| `src/embed/KernelWidget.tsx` | Forward `elevenlabsAgentId` from config to voice hook |

## Technical Notes

- The global `VITE_ELEVENLABS_AGENT_ID` secret remains the fallback -- no breaking change for existing setups
- Agent ID validation is left to the ElevenLabs API (invalid IDs will return clear errors)
- The field is always optional; when empty/undefined, the system default agent is used
- Saved agents automatically persist this via the existing `provider_settings` JSON column

