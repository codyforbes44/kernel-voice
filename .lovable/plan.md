

# Voice Interaction + Widget Customization Refactor

## Overview

Add a full real-time voice conversation mode to the embeddable widget (beyond the existing STT dictation), and restructure the widget customization editor into a cleaner, best-in-class configuration experience.

## Part 1: Voice Interaction Mode for External Widgets

### What Changes

Currently the widget supports:
- **STT (Speech-to-Text)**: Mic button to dictate text messages (native browser or ElevenLabs Scribe)
- **TTS (Text-to-Speech)**: ElevenLabs reads AI responses aloud

**New capability: Full Voice Conversation Mode** -- a dedicated voice interaction state where the widget switches from the chat UI to a voice orb interface. The user speaks, the AI responds with voice, creating a continuous conversation loop without typing.

### New Files

| File | Purpose |
|------|---------|
| `src/embed/WidgetVoiceMode.tsx` | Voice conversation UI -- animated orb with states (idle, listening, thinking, speaking), tap-to-toggle, transcript overlay |
| `src/embed/useWidgetVoiceConversation.ts` | Orchestrates the full voice loop: STT (capture user speech) -> send to widget-chat API -> TTS (speak response). Manages state machine: idle -> listening -> thinking -> speaking -> idle |

### Component Design: `WidgetVoiceMode`

When the user enters voice mode (via a new mic/phone button in the header or input area):
- The chat area transforms into a centered **animated orb** matching the brand color
- Orb states: **idle** (subtle pulse), **listening** (reactive to audio level), **thinking** (spinner/orbit animation), **speaking** (waveform pulse)
- Live transcript text appears below the orb as the user speaks
- A "Back to chat" button returns to text mode
- Messages from voice mode are still appended to the chat history

### Voice Conversation Flow

```text
User taps Voice Mode button
  -> WidgetVoiceMode renders (replaces chat area)
  -> Auto-starts listening (requests mic permission)
  -> STT captures speech (native or ElevenLabs based on config)
  -> On final transcript: sends to widget-chat edge function
  -> Response received: TTS speaks it aloud via widget-tts
  -> After TTS ends: auto-resumes listening
  -> User taps orb to pause/resume, or "End" to exit voice mode
```

### Integration Points

- `KernelWidget.tsx`: Add `voiceMode` state, conditionally render `WidgetVoiceMode` instead of `WidgetChat` + `WidgetInput`
- `WidgetHeader.tsx`: Add a phone/mic icon button to toggle voice mode (only when `enableVoice` is true)
- `types.ts`: Add `enableVoiceConversation?: boolean` to `KernelWidgetConfig` (distinct from `enableVoice` which is just dictation)

## Part 2: Widget Customization Refactor

### Current Problems
- Voice input, TTS, knowledge base, and widget active toggle are all crammed into the "General" tab
- No dedicated voice/audio section
- Feature toggles are mixed with identity fields (name, domains)

### New Tab Structure (5 tabs)

| Tab | Contents |
|-----|----------|
| **Identity** | Widget name, allowed domains, active toggle |
| **Appearance** | Brand name, logo, colors (primary + accent), position, text/background colors |
| **Behavior** | Greeting, placeholder, system prompt (with presets), first message |
| **Voice & Audio** | Enable voice input, voice provider, waveform style, enable voice conversation mode, enable TTS, TTS voice selector, auto-listen toggle |
| **Limits** | Rate limits (per minute, per hour) -- unchanged |

### Additional Customization Options

New fields to add to the widget config:

| Field | Type | Purpose |
|-------|------|---------|
| `enableVoiceConversation` | boolean | Enables full voice conversation mode (the orb UI) |
| `autoListen` | boolean | Auto-start listening after TTS finishes in voice mode |
| `textColor` | string | Custom text color for widget messages |
| `backgroundColor` | string | Custom background color for the chat area |
| `borderRadius` | string | Widget corner radius (sharp, rounded, pill) |
| `headerStyle` | 'gradient' / 'solid' / 'minimal' | Header visual variant |
| `bubbleStyle` | 'rounded' / 'sharp' / 'pill' | Message bubble shape |
| `darkMode` | boolean | Dark theme for the widget |

### Widget Preview Updates

`WidgetPreview.tsx` will be updated to reflect:
- Voice conversation mode preview (shows the orb animation when enabled)
- New appearance options (dark mode, bubble styles, border radius)
- Header style variants

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/embed/WidgetVoiceMode.tsx` | **Create** -- Voice conversation orb UI component |
| `src/embed/useWidgetVoiceConversation.ts` | **Create** -- Voice conversation loop hook (STT -> API -> TTS -> repeat) |
| `src/embed/types.ts` | **Modify** -- Add new config fields (enableVoiceConversation, autoListen, darkMode, headerStyle, bubbleStyle, borderRadius, textColor, backgroundColor) |
| `src/embed/KernelWidget.tsx` | **Modify** -- Add voice mode state, conditionally render WidgetVoiceMode |
| `src/embed/WidgetHeader.tsx` | **Modify** -- Add voice mode toggle button |
| `src/embed/WidgetChat.tsx` | **Modify** -- Support dark mode, bubble style, background color |
| `src/embed/WidgetButton.tsx` | **Modify** -- Support border radius customization |
| `src/embed/WidgetTheme.tsx` | **Modify** -- Add new CSS variables for dark mode, bubble styles |
| `src/components/admin/widgets/WidgetEditor.tsx` | **Modify** -- Refactor tabs (Identity, Appearance, Behavior, Voice & Audio, Limits), add new config fields |
| `src/components/admin/widgets/WidgetPreview.tsx` | **Modify** -- Add voice mode preview, dark mode, new appearance options |

## Technical Notes

- The voice conversation hook reuses existing `useWidgetVoice` / `useElevenLabsSTT` for STT and `useWidgetTTS` for TTS, composing them into a state machine
- All new config fields have sensible defaults so existing widgets continue working unchanged
- The voice orb animation uses pure CSS/inline styles (no Framer Motion dependency in the embed bundle to keep it lightweight)
- Dark mode applies only within the widget container, not affecting the host page

