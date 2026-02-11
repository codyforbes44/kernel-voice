

# Fix: Ensure Agent Cannot Hear During Pause

## Problem

The current pause implementation only sets React state flags (`isMuted = true`, `volume = 0`) but these flags are **never applied** to the actual audio infrastructure. The WebRTC microphone track continues streaming audio to the AI provider, and the output `<audio>` element volume is unchanged. The agent can still hear the user even after "pause."

## Root Cause

- `isMuted` is a UI-only boolean -- it changes icons/labels but never calls `mediaStreamTrack.enabled = false`
- `setVolume(0)` updates React state but never sets `audioElement.volume = 0`

## Fix

### 1. `src/hooks/useOpenAIConversation.ts` -- expose mute/volume controls

- Add a `setMicEnabled(enabled: boolean)` method that sets `mediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = enabled)`
- Add a `setOutputVolume(vol: number)` method that sets `audioElRef.current.volume = vol`
- Return both methods from the hook

### 2. `src/hooks/useVoiceAssistant.ts` -- wire up real mute/volume

- Call the provider's `setMicEnabled(false)` inside `pauseConversation()` and `setMicEnabled(true)` inside `resumeConversation()`
- Call the provider's `setOutputVolume(0)` on pause and `setOutputVolume(volumeBeforePauseRef.current)` on resume
- Also wire `toggleMute` to call `setMicEnabled` so the existing mute button works at the hardware level too
- Do the same for ElevenLabs (the `@11labs/react` `useConversation` hook likely exposes a `setVolume` method -- we need to verify and use it)

### 3. `src/hooks/useGeminiLiveConversation.ts` and `src/hooks/useVAPIConversation.ts`

- Apply the same pattern: expose `setMicEnabled` and `setOutputVolume` so pause works for all providers

### 4. Verification points

After the fix:
- When paused, `mediaStreamTrack.enabled` is `false` -- the browser sends silence frames over WebRTC
- When paused, `audioElement.volume` is `0` -- no agent audio is audible
- When resumed, both are restored to their previous values
- The wake word detection (browser SpeechRecognition API) operates on a **separate** audio pipeline and is unaffected by disabling the WebRTC track

## What stays the same

- The wake word detection for resume phrases continues to work independently (it uses the browser's SpeechRecognition API, not the WebRTC stream)
- The UI state flags (`isPaused`, `isMuted`) and visual indicators remain as-is
- The WebRTC connection stays alive throughout

