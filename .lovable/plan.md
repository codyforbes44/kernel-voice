
# Plan: Anonymize Voice Provider Name (OpenAI → 3ʙɪ)

## Overview
This plan replaces all user-facing instances of "OpenAI" with the white-labeled name "3ʙɪ" to maintain the privacy-first approach and anonymize backend provider branding. Internal code (type names, variable names, localStorage keys) will remain unchanged to avoid breaking changes.

## Scope of Changes

### User-Facing Text to Update

| File | Location | Current Text | New Text |
|------|----------|--------------|----------|
| `src/components/voice/voiceTypes.ts` | `providerInfo.openai.name` | `'OpenAI'` | `'3ʙɪ'` |
| `src/components/voice/voiceTypes.ts` | `providerInfo.openai.description` | `'GPT-4o Realtime, low latency'` | `'Realtime AI, low latency'` |
| `src/components/voice/OpenAISettingsPanel.tsx` | Voice label | `'OpenAI Voice'` | `'3ʙɪ Voice'` |
| `src/components/voice/OpenAISettingsPanel.tsx` | Reset dialog title | `'Reset OpenAI Settings?'` | `'Reset 3ʙɪ Settings?'` |
| `src/components/voice/ConnectionStatusBadge.tsx` | Provider label | `'OpenAI'` | `'3ʙɪ'` |
| `src/components/voice/ConnectionStatusBadge.tsx` | Provider full name | `'OpenAI Realtime'` | `'3ʙɪ Realtime'` |
| `src/components/voice/ConnectionStatusBadge.tsx` | Connection step | `'Connect to OpenAI'` | `'Connect to 3ʙɪ'` |
| `src/components/voice/VoiceInterfaceCard.tsx` | Provider display | `'Using... OpenAI'` | `'Using... 3ʙɪ'` |
| `src/components/admin/UserDetailDrawer.tsx` | Default provider fallback | `'OpenAI'` | `'3ʙɪ'` |
| `src/pages/admin/Dashboard.tsx` | Chart data | `{ name: 'OpenAI', ...}` | `{ name: '3ʙɪ', ...}` |
| `src/pages/admin/Settings.tsx` | Provider badge | `'OpenAI'` | `'3ʙɪ'` |

### Console/Debug Messages to Update

| File | Current Message | New Message |
|------|-----------------|-------------|
| `src/hooks/useVoiceAssistant.ts` | `'Connected to OpenAI Realtime voice service'` | `'Connected to 3ʙɪ Realtime voice service'` |
| `src/hooks/useVoiceAssistant.ts` | `'Voice assistant is ready (OpenAI)'` | `'Voice assistant is ready (3ʙɪ)'` |
| `src/hooks/useVoiceAssistant.ts` | `'Starting OpenAI Realtime voice session'` | `'Starting 3ʙɪ Realtime voice session'` |
| `src/hooks/useVoiceAssistant.ts` | `'Disconnected from OpenAI voice service'` | `'Disconnected from 3ʙɪ voice service'` |
| `src/hooks/useVoiceAssistant.ts` | `'OpenAI voice service error'` | `'3ʙɪ voice service error'` |
| `src/hooks/useVoiceAssistant.ts` | `'OpenAI message received'` | `'3ʙɪ message received'` |
| `src/hooks/useVoiceAssistant.ts` | `'OpenAI transcript'` | `'3ʙɪ transcript'` |
| `src/hooks/useVoiceProviderPreference.ts` | `'...falling back to OpenAI'` | `'...falling back to 3ʙɪ'` |

## What Will NOT Change

The following will remain unchanged to avoid breaking changes:

- **Type names**: `OpenAIVoice`, `OpenAIVoiceSettings`, `OpenAISettingsPreset`
- **Variable names**: `openaiVoice`, `openaiSettings`, `openaiConversation`
- **Component filenames**: `OpenAISettingsPanel.tsx`
- **Function/hook names**: `useOpenAIConversation`
- **localStorage keys**: `openai_voice`, `openai_settings`
- **Database column names**: `openai_voice`, `openai_settings`
- **Provider key literals**: `'openai'` (used in conditionals and type unions)
- **Edge function names**: `openai-realtime-token`

These internal identifiers are not visible to users and changing them would require extensive refactoring across the codebase.

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/voice/voiceTypes.ts` | Modify | Update `providerInfo.openai.name` and `description` |
| `src/components/voice/OpenAISettingsPanel.tsx` | Modify | Update label and dialog text |
| `src/components/voice/ConnectionStatusBadge.tsx` | Modify | Update provider labels and connection step |
| `src/components/voice/VoiceInterfaceCard.tsx` | Modify | Update provider display text |
| `src/components/admin/UserDetailDrawer.tsx` | Modify | Update default fallback text |
| `src/pages/admin/Dashboard.tsx` | Modify | Update chart data label |
| `src/pages/admin/Settings.tsx` | Modify | Update badge text |
| `src/hooks/useVoiceAssistant.ts` | Modify | Update console logs and toast messages |
| `src/hooks/useVoiceProviderPreference.ts` | Modify | Update console log message |

## Technical Details

### Central Provider Name Constant
The `providerInfo` object in `voiceTypes.ts` is the source of truth for provider display names. Most UI components already reference this object, so updating it will cascade the change to several places:

```typescript
// Current
openai: {
  name: 'OpenAI',
  description: 'GPT-4o Realtime, low latency',
  ...
}

// Updated
openai: {
  name: '3ʙɪ',
  description: 'Realtime AI, low latency',
  ...
}
```

### Hardcoded Instances
Some files have hardcoded "OpenAI" strings that need individual updates:
- Toast notifications in `useVoiceAssistant.ts`
- Connection status labels in `ConnectionStatusBadge.tsx`
- Ternary operators in `VoiceInterfaceCard.tsx`

## User Experience

### Before
- Voice Provider dropdown shows "OpenAI"
- Connection badge shows "OpenAI" or "OpenAI Realtime"
- Admin dashboard chart shows "OpenAI" in legend
- Toast notifications reference "OpenAI"

### After
- Voice Provider dropdown shows "3ʙɪ"
- Connection badge shows "3ʙɪ" or "3ʙɪ Realtime"
- Admin dashboard chart shows "3ʙɪ" in legend
- Toast notifications reference "3ʙɪ"

This maintains the privacy-first approach by hiding backend provider branding while keeping internal code identifiers unchanged for stability.
