

# Add ElevenLabs Voice ID Setting

## Overview
Add the ability to specify a custom ElevenLabs Voice ID for the assistant and external widgets. This overrides the default TTS voice used by the ElevenLabs agent, letting users pick any voice from the ElevenLabs voice library.

## What Changes

### 1. Add `voiceId` to ElevenLabs Settings Type
Add an optional `voiceId` field to the `ElevenLabsSettings` interface in `src/components/voice/voiceTypes.ts`. This keeps it alongside the existing `elevenlabsAgentId` override.

### 2. Add Voice ID Input to Settings Panel
Add a new text input field in the Advanced Settings accordion of `src/components/voice/ElevenLabsSettingsPanel.tsx`, right after the Agent ID field. It will have a placeholder of "Default agent voice" and helper text explaining where to find a Voice ID in the ElevenLabs voice library.

### 3. Pass Voice ID to Edge Function
Update `src/hooks/useVoiceAssistant.ts` to include the `voiceId` from ElevenLabs settings in the `voice-session` edge function call body. The edge function already handles `voiceId` and creates a `tts.voiceId` override -- no backend changes needed.

### 4. Persist in Saved Agents
The `provider_settings` JSON column already stores the full `ElevenLabsSettings` object, so saved agents will automatically include the new `voiceId` field with no database changes.

### 5. Widget Support
Add an optional `elevenlabsVoiceId` field to `KernelWidgetConfig` in `src/embed/types.ts` and pass it through the widget voice conversation flow so external widgets can also override the ElevenLabs TTS voice. Update the Widget Editor to include the Voice ID input when ElevenLabs voice conversation is enabled.

---

## Technical Details

### Files Modified

- **`src/components/voice/voiceTypes.ts`** -- Add `voiceId?: string` to `ElevenLabsSettings`
- **`src/components/voice/ElevenLabsSettingsPanel.tsx`** -- Add Voice ID input in Advanced Settings
- **`src/hooks/useVoiceAssistant.ts`** -- Pass `settings.voiceId` in the `voice-session` request body
- **`src/embed/types.ts`** -- Add `elevenlabsVoiceId?: string` to `KernelWidgetConfig`
- **`src/embed/KernelWidget.tsx`** -- Pass `elevenlabsVoiceId` to voice conversation component
- **`src/embed/WidgetVoiceMode.tsx`** -- Accept and forward `elevenlabsVoiceId` to the voice session call
- **`src/components/admin/widgets/WidgetEditor.tsx`** -- Add Voice ID input in the Voice & Audio tab

### No Backend Changes
The `voice-session` edge function (lines 67-76, 128-130) already accepts `voiceId` in the request body and creates a `tts: { voiceId }` override. No edge function modifications are needed.

### No Database Changes
The `provider_settings` JSONB column on `saved_agents` stores the full settings object, so the new field is automatically persisted.

