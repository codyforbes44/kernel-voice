
# Pause/Resume Conversation Feature

## Overview
When a user says "pause the conversation" during a voice session, the agent goes on hold -- microphone is muted, output audio is silenced, and a visual "Paused" state is shown. A secondary speech recognition listener activates to detect "continue the conversation" (or "resume the conversation"), which restores the session without disconnecting.

## How It Works

1. **Detection**: The `useVoiceAssistant` hook monitors incoming user transcripts for pause trigger phrases ("pause the conversation", "pause conversation")
2. **Pause**: Mutes the microphone, silences output (volume to 0), and sets an `isPaused` flag
3. **Hold listener**: A dedicated `useWakeWordDetection` instance listens for resume phrases ("continue the conversation", "resume the conversation", "unpause")
4. **Resume**: Unmutes mic, restores volume, clears the paused state -- the existing WebRTC connection stays alive throughout

## Technical Changes

### `src/hooks/useVoiceAssistant.ts`
- Add `isPaused` state (boolean) and `togglePause`/`pauseConversation`/`resumeConversation` actions
- Store `volumeBeforePause` in a ref so volume restores to the user's previous level
- Add a `useEffect` that watches `liveTranscripts` for pause trigger phrases -- when a user transcript contains "pause the conversation", call `pauseConversation()`
- Expose `isPaused` in the return type
- On `endConversation`, reset `isPaused` to false

### `src/pages/VoiceAssistant.tsx`
- Destructure `isPaused` and `resumeConversation` from `useVoiceAssistant`
- Add a second `useWakeWordDetection` instance with `wakeWords: ['continue the conversation', 'resume the conversation', 'unpause']` that is `enabled` only when `isPaused && isConnected`
- On detection, call `resumeConversation()`
- Pass `isPaused` down to `VoiceInterfaceCard`

### `src/components/voice/VoiceInterfaceCard.tsx`
- Accept `isPaused` prop
- When paused, show a "Paused" overlay on the microphone orb area and update the status text from "Listening..." to "Paused -- say 'continue the conversation' to resume"

### `src/components/voice/VoiceControlPanel.tsx`
- Accept `isPaused` prop
- When paused and connected, show the orb in a dimmed/amber state instead of the active green/primary gradient
- Add a manual "Resume" button as a fallback (in case speech recognition doesn't pick up the resume phrase)

### `src/components/voice/voiceInterfaceTypes.ts`
- Add `isPaused: boolean` and `onResume: () => void` to `VoiceInterfaceCardProps`

### No changes needed to:
- Provider hooks (OpenAI, ElevenLabs, VAPI, Gemini) -- muting/unmuting is handled at the `useVoiceAssistant` level via existing `toggleMute` and `setVolume`
- Wake word detection hook -- reused as-is with different wake words

## UI Behavior

- **Paused state orb**: Amber/yellow gradient with a pause icon replacing the mic icon
- **Status text**: "Paused" with subtitle "Say 'continue the conversation' to resume"
- **Manual resume button**: Appears next to the "End" button when paused, in case verbal resume fails
- **Transcript entry**: A system message "Conversation paused" / "Conversation resumed" appears in the live transcripts for clarity
