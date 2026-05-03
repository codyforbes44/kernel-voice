# Plan — Connect homepage voice demo to real assistant API

## Goal
Drive the homepage `ProductPreviewSection` demo from your real assistant API instead of scripted strings, so the UI states (Listening → Thinking → Speaking) and the agent transcript correspond to genuine model output. Keep the existing visual language: glowing orb, live waveform canvas, state pills, play/pause.

## Why streaming text rather than a live voice session
Starting an actual voice session on the marketing page would:
- Force a microphone permission prompt the moment a user scrolls into the section.
- Open a billable WebRTC/WebSocket session for every visitor (OpenAI Realtime / Gemini Live / VAPI / ElevenLabs).
- Significantly hurt LCP and PWA cache budget.

The truthful, low-risk implementation: use the existing `chat` edge function (Lovable AI Gateway, Gemini 2.5 Flash, with `stream: true` SSE support — already implemented in `supabase/functions/chat/index.ts`). Real prompts go in, real model responses stream out, and the demo's Listening / Thinking / Speaking phases are tied to the real network lifecycle.

## What changes

### 1. New hook: `src/hooks/useDemoAssistant.ts`
A self-contained client hook for the homepage demo. It encapsulates the API call and exposes the state machine the UI needs.

State exposed:
```ts
type DemoState = 'idle' | 'listening' | 'thinking' | 'speaking';
{
  state, userText, agentText, level, paused,
  setPaused, jumpToState, start, stop
}
```

Lifecycle for one turn:
1. Pick the next prompt from a 3-item rotating list ("What can you do for my business?", "Can I embed you in my product?", "How fast does it actually feel?").
2. **Listening** — type the user prompt out (~2.5s). Level signal modulates a "listening" sine.
3. **Thinking** — once typing finishes, POST to the `chat` edge function with `stream: true`. Stay in `thinking` until the first SSE token arrives. Level signal modulates a low "thinking" sine.
4. **Speaking** — as SSE chunks arrive, append to `agentText` and switch to `speaking`. Level modulates a higher "speaking" sine until the stream ends.
5. **Idle** brief pause, then advance turn. Loop.

Error handling:
- On fetch failure, 429, or 402, fall back to a short scripted reply for the current turn so the demo never looks broken.
- Abort the stream if the user pauses or scrolls the section out of view.

Network details:
- `fetch("${VITE_SUPABASE_URL}/functions/v1/chat", { headers: { Authorization: Bearer ${ANON}, apikey: ${ANON}, Content-Type: application/json }, body: JSON.stringify({ messages: [{role:'user',content:prompt}], stream: true }) })`.
- Parse SSE: read `ReadableStream`, split on `\n\n`, look for `data: {...}` lines, extract `choices[0].delta.content`.
- No auth needed — `chat` only persists when `conversationId` + `userId` are passed (we don't).

### 2. Refactor `src/components/landing/ProductPreviewSection.tsx`
- Remove scripted timing logic and `setTurnIndex` machinery.
- Consume `useDemoAssistant()`. Bind `state`, `userText`, `agentText`, `level`, `paused`, `setPaused`, `jumpToState` to existing UI.
- Pause / resume on `useInView`: call `stop()` on exit, `start()` on entry. Honors the perf memory.
- Keep the existing pills, orb, waveform, and CTA. CTA "Try it for real" still navigates to `/assistant`.

### 3. No backend changes
- `supabase/functions/chat/index.ts` already supports `stream: true` with `text/event-stream` CORS — no edits needed.
- No new secrets, no new edge functions.

## Files touched
- `src/hooks/useDemoAssistant.ts` — new.
- `src/components/landing/ProductPreviewSection.tsx` — refactor to consume the hook; preserve visual layout.

## Out of scope
- No live mic / WebRTC / voice provider session on the homepage.
- No changes to `/assistant`, hero, or other landing sections.
- No persistence of demo turns to the database.
