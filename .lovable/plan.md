# Plan — Real microphone capture + speech output for the homepage demo

## Goal
Add an opt-in "Live mic" mode to `ProductPreviewSection` so you (and any visitor who clicks the toggle) can speak into the browser, see the transcript drive the **Listening** state, get a real streamed response from the existing `chat` edge function during **Thinking** / **Speaking**, and hear it spoken back through the browser.

The scripted-loop demo stays as the default (no surprise mic prompts on scroll). A new control switches the section into "Live mic" mode.

## Why browser-native APIs (Web Speech) instead of ElevenLabs Scribe + ElevenLabs TTS

- **Zero new dependencies** — `@elevenlabs/react` (with `useScribe`) is not installed; only `@elevenlabs/client` and the legacy `@11labs/react` Conversation SDK are.
- **Zero per-visitor cost** — TTS via `widget-tts` and STT via Scribe both burn ElevenLabs credits on every preview.
- **Instant, no token round-trip** — `SpeechRecognition` and `speechSynthesis` are native and start in milliseconds.
- **Already proven in this project** — the verbal pause/resume feature uses the same `SpeechRecognition` API.
- The "Try it for real" CTA still routes to `/assistant`, where the full ElevenLabs / Gemini Live / VAPI / OpenAI Realtime stack lives.

If you'd rather use ElevenLabs Scribe + TTS for the homepage too, say the word and I'll swap the providers — the `useDemoAssistant` hook is the only place that needs to change.

## What changes

### 1. New hook: `src/hooks/useDemoMic.ts`
Encapsulates browser STT + TTS so the section component stays presentational.

Exposes:
```ts
{
  isSupported: boolean;          // SpeechRecognition && speechSynthesis available
  isListening: boolean;
  permission: 'unknown' | 'granted' | 'denied';
  partialTranscript: string;     // live interim transcript during listening
  finalTranscript: string;       // final transcript when user stops talking
  level: number;                 // 0–1 mic RMS for orb / waveform
  error: string | null;

  start: () => Promise<void>;    // request mic, start recognition + level meter
  stop: () => void;              // stop recognition, release tracks
  speak: (text: string, opts?: { onBoundary?: () => void; onEnd?: () => void }) => void;
  cancelSpeech: () => void;
  speakingLevel: number;         // 0–1 simulated level while TTS is speaking
}
```

Implementation:
- **STT**: `window.SpeechRecognition || window.webkitSpeechRecognition`, `continuous=false`, `interimResults=true`, `lang='en-US'`. Wire `onresult` → `partialTranscript` / `finalTranscript`, `onend` → call user callback so the hook can move to the next phase.
- **Mic level meter**: `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })` → `AudioContext` + `AnalyserNode`. RMS over `getByteTimeDomainData` → `level`. RAF loop that pauses when `isListening` is false. Reuses the same shape `LiveWaveformCanvas` already expects.
- **TTS**: `speechSynthesis.speak(new SpeechSynthesisUtterance(text))`. `onboundary` callback ticks `speakingLevel` with a sine + jitter while speaking; `onend` resets it to 0. Cancel any ongoing utterance before starting a new one.
- **Permission state**: pre-check via `navigator.permissions.query({ name: 'microphone' })` when available; persist `granted` to `localStorage` (`demo_mic_granted=1`) so repeat visits skip the prompt UX. Honors the existing mic-permission-persistence memory.
- **Cleanup**: on unmount or `stop()`, `recognition.abort()`, stop all `MediaStreamTrack`s, close the `AudioContext`, `cancelAnimationFrame`, `speechSynthesis.cancel()`.

### 2. Extend `useDemoAssistant` (the hook from the previous step) with a `mic` mode
Existing hook already runs the scripted loop and streams from `chat`. Add a mode switch:

```ts
useDemoAssistant({ mode: 'auto' | 'mic' })
```

- `auto` (default) — current behavior: scripted prompts, looped.
- `mic` — single-turn flow driven by `useDemoMic`:
  1. **Idle** — show "Tap and speak".
  2. User taps the orb → `mic.start()` → state becomes **Listening**, `userText` mirrors `mic.partialTranscript`, `level` mirrors `mic.level`.
  3. `mic` final result fires → state becomes **Thinking**, POST to `chat` (`messages: [{ role: 'user', content: finalTranscript }], stream: true`), keep prior turns in a small in-memory `history` array so multi-turn works.
  4. First SSE chunk arrives → state becomes **Speaking**, append tokens to `agentText`. When the SSE stream closes, call `mic.speak(agentText)` and use `mic.speakingLevel` for the orb / waveform during playback.
  5. `speechSynthesis` end → back to **Idle**, ready for next tap.
- The existing 429 / 402 fallback path stays.

### 3. Update `ProductPreviewSection.tsx`
Small additive UI changes — no layout breakage:

- New segmented control in the window-chrome row: `Auto demo | Live mic`. Default is `Auto demo`.
- When `Live mic` is selected:
  - The orb becomes a tap target (cursor pointer, `aria-label="Tap to speak"`, role button). Tapping toggles `mic.start()` / `mic.stop()`.
  - Show a small "Mic" badge in the header. If the browser doesn't support `SpeechRecognition` (Firefox, some embedded browsers), gracefully disable the toggle with a tooltip "Live mic isn't supported in this browser — open in Chrome or Safari."
  - If permission is denied, show an inline button "Enable microphone" that calls `mic.start()` again.
- The state pills, transcript bubbles, waveform, and CTA all keep working with no changes — they're already bound to `state`, `userText`, `agentText`, `level`.
- Pause-on-off-screen still aborts the stream and stops the mic / speech (perf memory).

### 4. No backend or dependency changes
- `chat` edge function unchanged — already streams SSE.
- No new npm packages.
- No new edge functions, no new secrets.

## Files touched
- `src/hooks/useDemoMic.ts` — new (browser STT + TTS + mic level meter).
- `src/hooks/useDemoAssistant.ts` — extend with `mode: 'auto' | 'mic'` and integrate `useDemoMic`.
- `src/components/landing/ProductPreviewSection.tsx` — add mode toggle, tap-to-speak orb behavior, browser-support fallback UI.

## Out of scope
- ElevenLabs Scribe / TTS on the marketing page (per cost rationale above — happy to swap later).
- Wake-word activation on the marketing page.
- Multi-turn history persistence to the database (kept in memory only).
- Changes to `/assistant` or any other page.
