# Plan — Settings panel (voice / language / persona) for the homepage demo

## Heads-up: prerequisites still pending
The two previous plans I wrote — wiring the demo to the real `chat` API, and adding a real microphone capture mode — were never approved or implemented. The current `ProductPreviewSection` is still the scripted simulation.

A settings panel only matters if there's a live assistant to apply the settings to. So this plan rolls all three pieces together into one approval:

1. **Live API wiring** — stream real responses from the existing `chat` edge function (no backend change; SSE already supported).
2. **Real microphone mode** — browser-native `SpeechRecognition` for STT, `speechSynthesis` for TTS (zero new deps, zero per-visitor cost).
3. **Settings panel** — voice / language / persona controls for both modes.

If you want any of (1) or (2) implemented differently (e.g. ElevenLabs Scribe + ElevenLabs TTS instead of the browser APIs), say so before approving.

## What the settings panel controls

A single "Settings" gear button in the window-chrome row opens a Radix `Popover` (desktop) / `Sheet` (mobile via `useIsMobile`) with three controls:

### Voice
Populated from `speechSynthesis.getVoices()` on mount. Filtered to voices whose `lang` matches the currently selected language. Shows the voice's `name` plus a small "Default" badge for the system default. Selecting a voice immediately swaps the `SpeechSynthesisUtterance.voice` used by the next utterance.
- A "Preview voice" button speaks "Hi, I'm ƷBI. How can I help today?" so you can hear the choice without running a full turn.
- If no voices are available yet (Chrome loads them async), show a skeleton until `onvoiceschanged` fires.

### Language
A short curated list (English US/UK, Spanish, French, German, Italian, Portuguese-BR, Japanese — extend later). Selecting a language:
- Sets `recognition.lang` on the `SpeechRecognition` instance for the **listening** phase.
- Filters the voice dropdown to that language and auto-picks the first matching voice.
- Adds a hidden system instruction in the `chat` request: `Respond in {language}.` so the assistant's reply matches.

### Persona
A small fixed list of 4 presets that map to system-prompt fragments:
- **Friendly assistant** (default): "You are ƷBI, a warm, concise voice assistant. Reply in 1–2 short sentences."
- **Sales agent**: "You are ƷBI, a confident sales rep for a voice-AI platform. Lead with value, end with a soft call to action."
- **Technical expert**: "You are ƷBI, a senior engineer. Be precise, mention tradeoffs, keep replies short."
- **Playful**: "You are ƷBI, witty and concise. Light humor okay. Keep replies under 2 sentences."

Plus a **"Custom"** option that reveals a `Textarea` (max 500 chars) so you can paste your own system prompt for testing.

A reset button restores defaults: voice = system default, language = English (US), persona = Friendly assistant.

## How settings are wired through

### New: `src/hooks/useDemoSettings.ts`
Single source of truth for the three values. Persists to `localStorage` under `demo_settings_v1` so refreshes keep your choices. Exposes `{ voiceURI, language, personaId, customPersona, set..., reset }` plus a derived `effectiveSystemPrompt` and `effectiveVoice` (resolved against `speechSynthesis.getVoices()`).

### Wired into `useDemoMic` (from the mic plan)
- `recognition.lang = settings.language` before each `start()`.
- `utterance.voice = settings.effectiveVoice; utterance.lang = settings.language` before each `speak()`.
- On language change while a session is in progress, abort the current recognition/utterance and re-init.

### Wired into `useDemoAssistant` (from the live API plan)
The fetch to `/functions/v1/chat` gains an extra system message at the top of `messages`:
```ts
[
  { role: 'system', content: settings.effectiveSystemPrompt },
  ...history,
  { role: 'user', content: userText },
]
```
The existing `chat` function already accepts arbitrary message arrays — no edge function change needed.

(If you'd prefer the system prompt stay server-side, I can move the persona presets into the `chat` function and pass only a `personaId` from the client. Either way, no schema change.)

## UI changes in `ProductPreviewSection`
- New `<Settings />` icon button in the window chrome, next to the existing Pause / mode toggle.
- Popover content uses existing `Select`, `RadioGroup`, `Textarea`, `Button` components from `src/components/ui/*`. No new shadcn install.
- Min 44px touch targets; sheet on mobile per the mobile-first memory.
- A small inline summary chip under the chrome bar shows the current settings, e.g. `EN-US · Default voice · Friendly` so it's obvious what's active without opening the panel.

## Files touched
- `src/hooks/useDemoSettings.ts` — new (settings state + persistence + derived values).
- `src/hooks/useDemoMic.ts` — new from the prior plan; consumes `useDemoSettings` for `lang` and `voice`.
- `src/hooks/useDemoAssistant.ts` — new from the prior plan; consumes `useDemoSettings` for the system prompt.
- `src/components/landing/ProductPreviewSection.tsx` — refactor to use the three hooks; add settings popover/sheet, mode toggle, summary chip.
- `src/components/landing/DemoSettingsPanel.tsx` — new presentational component for the panel body (kept separate so it lazy-loads cleanly inside the popover).

## Out of scope
- No changes to `/assistant` or its `useVoiceAssistant`.
- No new edge functions, no new dependencies, no new secrets.
- No persistence of demo conversations to the database.
- No multi-voice provider picker on the homepage (ElevenLabs / OpenAI Realtime / Gemini Live / VAPI stay on `/assistant`). Voice choice on the homepage means a `SpeechSynthesisVoice`.