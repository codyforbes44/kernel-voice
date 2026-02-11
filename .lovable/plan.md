

# Wire Up All Showcase Cards with Live Voice Providers (Direct Gemini API)

Replace all static/simulated animations in the 12 showcase cards with real voice provider integrations. Where the plan would normally use the Lovable AI Gateway for text chat, use the **Direct Gemini API** (`GEMINI_API_KEY`) instead.

---

## Overview

Each card gets a specific provider integration based on its purpose:

| Card | Provider | Integration |
|------|----------|-------------|
| WaveformCard | Browser Mic | Real mic input levels to `LiveWaveformCanvas` |
| VoiceFillCard | ElevenLabs Scribe (STT) | Dictate into form fields via WebSocket STT |
| AgentOrbsCard | Gemini Live | Orb reacts to real VAD from a Gemini Live session |
| CharacterSelectCard | ElevenLabs TTS | Plays voice preview on character change |
| ShowcaseWaveform | Browser Mic | Real mic input drives static waveform bars |
| MusicPlayerCard | ElevenLabs TTS | Generates and plays audio from text, drives waveform progress |
| VoiceChatCard | Gemini Live | Tap phone to start a real voice conversation |
| ChatConversationCard | Direct Gemini API | Type messages and get AI responses in chat bubbles |
| TrackListCard | ElevenLabs TTS | Click a track row to play a TTS preview |
| AudioPlayerCard | ElevenLabs TTS | Play button generates and plays TTS audio with progress |
| LiveStatusCard | Browser Mic | Real mic feed with live waveform and level meter |
| WidgetChatCard | Direct Gemini API + ElevenLabs TTS | Text chat with AI, spoken responses |

---

## New Edge Function: `gemini-chat`

A new edge function that calls the **Gemini REST API directly** using the existing `GEMINI_API_KEY` secret (already configured). This replaces what would otherwise go through the Lovable AI Gateway.

**File:** `supabase/functions/gemini-chat/index.ts`

- Accepts `{ messages, systemPrompt?, stream? }` 
- Calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=GEMINI_API_KEY`
- Non-streaming by default (showcase cards don't need streaming)
- Returns `{ message: string }`
- Handles errors with proper CORS

---

## New Shared Hook: `useShowcaseMic`

**File:** `src/hooks/useShowcaseMic.ts`

A lightweight hook that opens the browser mic and returns a real-time `audioLevel` (0-1) via an AnalyserNode. Used by WaveformCard, ShowcaseWaveform, and LiveStatusCard to replace simulated sine waves with real mic input.

Returns: `{ audioLevel, isActive, start, stop }`

---

## Card-by-Card Changes

### 1. WaveformCard
**File:** `src/components/showcase/WaveformCard.tsx`
- Replace `requestAnimationFrame` sine simulation with `useShowcaseMic`
- Add a "Tap to activate mic" overlay; once tapped, real audio levels drive the waveform
- "Speaking" label toggles based on audio level threshold

### 2. VoiceFillCard
**File:** `src/components/showcase/VoiceFillCard.tsx`
- Import `useElevenLabsSTT` from `src/embed/useElevenLabsSTT.ts`
- "Voice Fill" button activates ElevenLabs Scribe STT
- Transcribed text is parsed and auto-filled into First Name / Last Name fields
- Shows recording indicator (pulsing red dot) while listening
- Uses existing `elevenlabs-scribe-token` edge function

### 3. AgentOrbsCard
**File:** `src/components/showcase/AgentOrbsCard.tsx`
- Import `useGeminiLiveConversation` hook
- "Listening" button starts a Gemini Live session; orb state auto-switches based on `status`, `isSpeaking`, and `inputAudioLevel`
- "Idle" button disconnects session
- "Talking" state driven by real `isSpeaking` from Gemini response audio
- Orb glow intensity scales with `inputAudioLevel` and `outputAudioLevel`

### 4. CharacterSelectCard
**File:** `src/components/showcase/CharacterSelectCard.tsx`
- Map each character name to an ElevenLabs voice ID (Rachel, Drew, Clyde, Aria)
- On selection change, call `widget-tts` edge function with a short sample phrase
- Play the returned base64 audio so users hear the voice preview
- Show a small loading spinner during TTS generation

### 5. ShowcaseWaveform
**File:** `src/components/showcase/ShowcaseWaveform.tsx`
- Replace static random bars with bars driven by `useShowcaseMic` frequency data
- The AnalyserNode's frequency bin data maps directly to bar heights
- Add a "Tap to activate" overlay similar to WaveformCard

### 6. MusicPlayerCard
**File:** `src/components/showcase/MusicPlayerCard.tsx`
- Play button calls `widget-tts` with a musical/poetic text sample
- Audio playback drives the waveform progress bar (track current time vs duration)
- Vinyl discs spin only when audio is actually playing
- Volume slider controls the `HTMLAudioElement.volume`
- Transport controls (prev/next) cycle through different text samples

### 7. VoiceChatCard
**File:** `src/components/showcase/VoiceChatCard.tsx`
- Phone button starts a Gemini Live voice session via `useGeminiLiveConversation`
- Orb avatar animates based on `isSpeaking` and `inputAudioLevel`
- "Tap to start voice chat" changes to "Connected" / "Speaking..."
- Tapping again ends the session
- Transcripts from `onTranscript` callback displayed below the orb

### 8. ChatConversationCard
**File:** `src/components/showcase/ChatConversationCard.tsx`
- Replace static messages with a functional chat
- Add a text input at the bottom
- On send, call the new `gemini-chat` edge function via `supabase.functions.invoke`
- Display user and assistant messages in the existing bubble UI
- Show typing indicator while waiting for response

### 9. TrackListCard
**File:** `src/components/showcase/TrackListCard.tsx`
- Each track row becomes clickable
- Clicking calls `widget-tts` with a unique short phrase per track
- Shows a small play/loading indicator on the active track
- Audio plays inline; clicking another track stops the current one

### 10. AudioPlayerCard
**File:** `src/components/showcase/AudioPlayerCard.tsx`
- Play button calls `widget-tts` to generate audio
- Progress slider tracks `currentTime / duration` of the playing audio
- Duration label updates to real audio duration once loaded
- Pause/resume functionality on the generated audio

### 11. LiveStatusCard
**File:** `src/components/showcase/LiveStatusCard.tsx`
- Replace simulated waveform with `useShowcaseMic` real mic feed
- "Live" indicator pulses when mic is active
- "128 kbps" label remains static (cosmetic)
- Mic, chat, and phone icons become functional:
  - Mic toggles the mic on/off
  - Chat opens a small inline text field (calls `gemini-chat`)
  - Phone starts a Gemini Live session

### 12. WidgetChatCard
**File:** `src/components/showcase/WidgetChatCard.tsx`
- Text input becomes functional
- Send button calls `gemini-chat` edge function
- AI response appears as a message bubble above the input
- Sparkle button triggers ElevenLabs TTS to speak the last assistant message
- Orb animates while TTS is playing

---

## New and Modified Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/gemini-chat/index.ts` | **Create** | Direct Gemini API chat endpoint |
| `src/hooks/useShowcaseMic.ts` | **Create** | Shared mic hook for real audio levels |
| `src/components/showcase/WaveformCard.tsx` | **Modify** | Real mic input |
| `src/components/showcase/VoiceFillCard.tsx` | **Modify** | ElevenLabs Scribe STT |
| `src/components/showcase/AgentOrbsCard.tsx` | **Modify** | Gemini Live orb integration |
| `src/components/showcase/CharacterSelectCard.tsx` | **Modify** | ElevenLabs TTS preview |
| `src/components/showcase/ShowcaseWaveform.tsx` | **Modify** | Real mic frequency bars |
| `src/components/showcase/MusicPlayerCard.tsx` | **Modify** | TTS audio playback |
| `src/components/showcase/VoiceChatCard.tsx` | **Modify** | Gemini Live voice call |
| `src/components/showcase/ChatConversationCard.tsx` | **Modify** | Direct Gemini text chat |
| `src/components/showcase/TrackListCard.tsx` | **Modify** | TTS per track |
| `src/components/showcase/AudioPlayerCard.tsx` | **Modify** | TTS audio with progress |
| `src/components/showcase/LiveStatusCard.tsx` | **Modify** | Real mic + multi-mode |
| `src/components/showcase/WidgetChatCard.tsx` | **Modify** | Gemini chat + TTS |

---

## Dependencies and Secrets

- **`GEMINI_API_KEY`** -- Already configured. Used by the new `gemini-chat` edge function and the existing `gemini-live-token` function.
- **`ELEVENLABS_API_KEY`** -- Already configured. Used by `widget-tts` and `elevenlabs-scribe-token`.
- No new secrets or packages needed.

## Key Architecture Decisions

- **Direct Gemini API** replaces Lovable AI Gateway for all text chat in showcase cards (ChatConversationCard, WidgetChatCard, LiveStatusCard chat mode)
- **Gemini Live** (WebSocket) powers real-time voice interactions (AgentOrbsCard, VoiceChatCard)
- **ElevenLabs** handles all TTS (voice previews, music player, tracks) and STT (voice fill)
- **Browser MediaDevices API** provides raw mic access for waveform visualization cards
- All provider calls go through edge functions -- no API keys exposed to the client

