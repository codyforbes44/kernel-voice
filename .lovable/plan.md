
# Plan: Add Initial First Message for 3ʙɪ Voice Assistant

## Overview
This feature adds a configurable first message (greeting) for the 3ʙɪ voice assistant, similar to how ElevenLabs handles first messages. When a conversation starts, the AI will automatically speak the configured greeting instead of waiting for the user to speak first.

## Architecture

The first message will be stored in the OpenAI settings and triggered after the WebRTC connection is established:

```text
User clicks Connect
        ↓
WebRTC connection established
        ↓
Data channel opens
        ↓
Session update sent (tools, transcription)
        ↓
session.created received
        ↓
Send first message trigger ← NEW
        ↓
AI speaks greeting
```

## Changes Required

### 1. Update Voice Types
Modify `src/components/voice/voiceTypes.ts`:
- Add `firstMessage` field to `OpenAIVoiceSettings` interface
- Add default first message to `DEFAULT_OPENAI_SETTINGS`
- Update preset descriptions if needed

### 2. Update OpenAI Settings Panel
Modify `src/components/voice/OpenAISettingsPanel.tsx`:
- Add a textarea input for the first message
- Place it near the system prompt editor (they're related concepts)
- Include a character limit hint
- Allow empty value to disable the greeting

### 3. Update Voice Provider Preference Hook
Modify `src/hooks/useVoiceProviderPreference.ts`:
- Ensure `firstMessage` is included when loading/saving settings
- Merge with defaults to handle existing users without this field

### 4. Update OpenAI Conversation Hook
Modify `src/hooks/useOpenAIConversation.ts`:
- Accept `firstMessage` in options
- After receiving `session.created`, check if first message is configured
- Send a `response.create` event with the first message as a system-injected prompt
- The AI will speak the greeting as its first response

### 5. Update Voice Assistant Hook
Modify `src/hooks/useVoiceAssistant.ts`:
- Pass `firstMessage` from settings to `useOpenAIConversation`

## Technical Details

### OpenAI Realtime First Message Implementation

The OpenAI Realtime API doesn't have a built-in "first message" parameter like ElevenLabs. Instead, we trigger an initial response by:

1. After the session is created, send a `conversation.item.create` with a hidden system message
2. Immediately follow with `response.create` to trigger the AI to respond

```typescript
// After session.created is received
if (firstMessage) {
  dc.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text: `[System: Greet the user with this message: "${firstMessage}"]`
      }]
    }
  }));
  
  dc.send(JSON.stringify({
    type: 'response.create'
  }));
}
```

Alternative approach (cleaner): Use the instructions to include the greeting behavior and just trigger an empty response:

```typescript
// In the edge function, append to instructions:
const fullInstructions = firstMessage 
  ? `${instructions}\n\nIMPORTANT: When the conversation starts, greet the user by saying: "${firstMessage}"`
  : instructions;

// After session.created, just trigger response:
dc.send(JSON.stringify({ type: 'response.create' }));
```

### Settings Schema Update

```typescript
interface OpenAIVoiceSettings {
  temperature: number;
  vadThreshold: number;
  silenceDuration: number;
  firstMessage: string;  // NEW
}

const DEFAULT_OPENAI_SETTINGS: OpenAIVoiceSettings = {
  temperature: 0.8,
  vadThreshold: 0.4,
  silenceDuration: 400,
  firstMessage: "Hello! How can I help you today?",  // NEW
};
```

### UI Layout

The first message editor will appear in the OpenAI Settings Panel:

```
┌─────────────────────────────────────────┐
│ 3ʙɪ Voice                               │
│ [Dropdown: Alloy, Echo, etc.]           │
├─────────────────────────────────────────┤
│ Response Style                          │
│ [Snappy] [Natural] [Thoughtful]         │
├─────────────────────────────────────────┤
│ ▶ Advanced Settings                     │
├─────────────────────────────────────────┤
│ First Message (Greeting)          NEW   │
│ ┌─────────────────────────────────────┐ │
│ │ Hello! How can I help you today?   │ │
│ └─────────────────────────────────────┘ │
│ Leave empty to skip automatic greeting  │
├─────────────────────────────────────────┤
│ System Prompt                           │
│ ┌─────────────────────────────────────┐ │
│ │ You are a helpful assistant...     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/voice/voiceTypes.ts` | Modify | Add `firstMessage` to `OpenAIVoiceSettings` and defaults |
| `src/components/voice/OpenAISettingsPanel.tsx` | Modify | Add first message textarea input |
| `src/hooks/useVoiceProviderPreference.ts` | Modify | Handle `firstMessage` in settings load/save |
| `src/hooks/useOpenAIConversation.ts` | Modify | Accept `firstMessage` option, trigger greeting after connect |
| `src/hooks/useVoiceAssistant.ts` | Modify | Pass `firstMessage` to OpenAI conversation hook |

## User Experience

### Default Behavior
- New users will see a default greeting: "Hello! How can I help you today?"
- The greeting is spoken automatically when the connection is established
- Users can customize or disable (by clearing) the greeting

### Customization
- Users can edit the first message in the settings panel
- Empty first message = no automatic greeting (wait for user to speak first)
- The greeting respects the selected voice and tone settings

### Transcript Display
- The greeting will appear in the live transcripts as an assistant message
- This provides visual confirmation that the AI is ready and listening

## Edge Cases

1. **Empty first message**: If the user clears the first message, skip the greeting trigger entirely
2. **Long first message**: The AI will naturally break up long greetings, but we should add a hint about keeping it brief
3. **Settings migration**: Existing users without `firstMessage` in their saved settings will get the default value via spread with defaults
