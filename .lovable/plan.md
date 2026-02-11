

# ElevenLabs UI Integration -- Best-in-Class Voice UX

## Overview

Integrate production-grade voice UX patterns from the ElevenLabs UI library into the voice assistant, replacing custom implementations with polished, audio-reactive equivalents. Includes API modernization, expanded language support, and a chat-style conversation interface matching the reference screenshot.

---

## 1. Canvas-Based Waveform Visualizer

**Problem**: Current `WaveformOrb` uses SVG with `Date.now()` in render -- no smooth animation, no real audio reactivity.

**Solution**: Build a canvas-based `LiveWaveformCanvas` component using `requestAnimationFrame` and the audio level data already available via props.

- Smooth scrolling bar visualization matching the reference screenshot's waveform style
- Configurable bar width, gap, color, and fade edges
- Static mode (for playback) and live mode (for mic input)
- HiDPI canvas rendering for crisp visuals on retina displays

**New file**: `src/components/voice/LiveWaveformCanvas.tsx`

---

## 2. Agent State Orb with Visual Transitions

**Problem**: Orb has basic CSS gradient states but no animated transitions or distinct agent states (Idle / Listening / Talking / Thinking / Paused) as shown in the reference.

**Solution**: Replace the orb implementation in `VoiceControlPanel.tsx` with a Framer Motion-powered orb that:

- Derives state: `idle`, `listening`, `talking`, `thinking` (tool execution), `paused`
- Uses layered radial gradients with smooth color transitions per state
- Adds animated ring/pulse effects (cyan for listening, green/primary for talking, amber for paused, purple for thinking)
- Displays a state label below the orb (e.g., "Listening", "Speaking") matching the reference
- Make the entire orb tappable on mobile as a start/stop toggle
- Replace `WaveformOrb` with the new `LiveWaveformCanvas` as a ring around the orb

**Edit**: `src/components/voice/VoiceControlPanel.tsx`, `src/components/voice/AudioLevelMeter.tsx`

---

## 3. Conversation Container with Auto-Scroll and Empty State

**Problem**: `LiveTranscripts.tsx` force-scrolls on every update (frustrating when reading history), no scroll-to-bottom button, basic empty state.

**Solution**: Inspired by the reference conversation UI:

- Add `IntersectionObserver` sentinel at bottom to detect if user is scrolled to bottom
- Auto-scroll only when already at bottom; show a "scroll to bottom" (ChevronDown) button when scrolled up
- Add a proper empty state with orb icon and "Start a conversation" text matching the reference
- Add Framer Motion `AnimatePresence` for message entry animation (fade + slide up)
- Replace the blinking cursor for partial transcripts with animated typing dots
- Show a "Thinking..." shimmer when `activeToolCall` is present

**Edit**: `src/components/voice/LiveTranscripts.tsx`

---

## 4. Inline Volume Control

**Problem**: Volume slider is hidden on mobile (collapsible) and detached on desktop.

**Solution**: Match the reference's inline volume bar:

- Render an always-visible inline volume slider below the orb (both mobile and desktop) when connected
- Show speaker icon, slider, and percentage label in one row (matching the reference: `speaker icon -- slider -- 70%`)
- Remove the separate desktop slider and the mobile collapsible pattern

**Edit**: `src/components/voice/VoiceControlPanel.tsx`

---

## 5. Chat-Style Message Input with Voice Button

**Problem**: Text input is a plain textarea with only a send button. No voice input option in text mode.

**Solution**: Match the reference's input bar:

- Add a microphone icon button alongside the send button
- When pressed, use `useScribe` from `@elevenlabs/react` (already installed) to stream real-time transcription into the textarea
- Show a "Listening..." indicator above the input while recording
- Add a sparkle/magic button for AI suggestions (visual only, or connected to existing system prompt)
- Input bar layout: `[textarea] [send] [mic] [sparkle]` matching the reference

**Edit**: `src/components/voice/TextMessageInput.tsx`

---

## 6. Microphone Device Selector

**Problem**: No ability to select which microphone to use.

**Solution**: Add a mic selector dropdown:

- Uses `navigator.mediaDevices.enumerateDevices()` for audio input devices
- Renders as a Select dropdown in the settings panel
- Stores selected device ID in localStorage
- Passes `deviceId` to `getUserMedia` constraints

**New file**: `src/components/voice/MicSelector.tsx`
**Edit**: `src/components/voice/VoiceInterfaceCard.tsx`, `src/hooks/useMicrophonePermission.ts`

---

## 7. Modernize Scribe Token Endpoint

**Problem**: Legacy endpoint `/v1/speech-to-text/get-websocket-token` is deprecated.

**Solution**: Update to `/v1/single-use-token/realtime_scribe` and remove unused `createClient` import.

**Edit**: `supabase/functions/elevenlabs-scribe-token/index.ts`

---

## 8. Expand Language Support

**Problem**: Only 13 languages listed. ElevenLabs supports 70+.

**Solution**: Expand to 30+ commonly used languages grouped by region:

- Europe: Dutch, Swedish, Norwegian, Danish, Finnish, Czech, Romanian, Hungarian, Turkish, Ukrainian, Greek
- Asia: Thai, Vietnamese, Indonesian, Malay, Filipino, Bengali, Tamil
- Middle East: Hebrew
- Africa: Swahili
- Group with `SelectGroup` + `SelectLabel` for region headers
- Add a search/filter input at the top of the language selector

**Edit**: `src/components/voice/ElevenLabsSettingsPanel.tsx`

---

## 9. Voice Button States

**Problem**: The "Start Conversation" button is a plain Button with no recording feedback.

**Solution**: Multi-state voice button:

- Idle: Mic icon with subtle pulse animation
- Connecting: Spinner with "Connecting..." text
- Recording (connected + listening): Inline miniature waveform bars inside the button
- Speaking (AI talking): Animated equalizer bars
- Keep separate End Session / Resume / Mute buttons but restyle with rounded pill shapes matching the reference

**Edit**: `src/components/voice/VoiceControlPanel.tsx`

---

## Technical Summary

### Files to Create
1. `src/components/voice/LiveWaveformCanvas.tsx`
2. `src/components/voice/MicSelector.tsx`

### Files to Edit
1. `supabase/functions/elevenlabs-scribe-token/index.ts` -- Update API endpoint
2. `src/components/voice/VoiceControlPanel.tsx` -- Agent state orb, inline volume, voice button states
3. `src/components/voice/AudioLevelMeter.tsx` -- Replace WaveformOrb with canvas component
4. `src/components/voice/LiveTranscripts.tsx` -- Auto-scroll, empty state, message animation
5. `src/components/voice/TextMessageInput.tsx` -- Voice input button, sparkle button
6. `src/components/voice/ElevenLabsSettingsPanel.tsx` -- 30+ languages, grouped, searchable
7. `src/components/voice/VoiceInterfaceCard.tsx` -- Wire MicSelector
8. `src/hooks/useMicrophonePermission.ts` -- Accept deviceId

### Dependencies
No new dependencies. Uses existing `@elevenlabs/react` (useScribe), `framer-motion`, canvas APIs, and Web Audio API.

### No Database Changes Required

