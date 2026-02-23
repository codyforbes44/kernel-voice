

# Best-in-Class Playground Refactor

## Current State

The `/showcase` page has 12 cards across 4 sections. Several cards are thin demos (static data, no real AI), while the platform has access to **6 API providers** (OpenAI, Gemini, ElevenLabs, Anthropic, Perplexity, Lovable AI). The current cards underutilize these and have overlapping functionality.

### API Resources Available

| Provider | Secret | Capabilities |
|----------|--------|-------------|
| OpenAI | `OPENAI_API_KEY` | Realtime WebRTC voice, GPT-4.1, TTS |
| Gemini | `GEMINI_API_KEY` | Gemini Live (WebSocket voice), Gemini Chat, Gemini 2.5 Flash |
| ElevenLabs | `ELEVENLABS_API_KEY` | TTS (11 Flash v2.5), Scribe STT, Voice cloning |
| Anthropic | `ANTHROPIC_API_KEY` | Claude Sonnet (text reasoning) |
| Perplexity | `PERPLEXITY_API_KEY` | Web-grounded search/answers |
| Lovable AI | `LOVABLE_API_KEY` | Gateway to Gemini 3 Flash Preview, GPT-5, streaming |

### Current Problems

1. **Redundancy** -- MusicPlayerCard, AudioPlayerCard, and TrackListCard all do the same thing (call `widget-tts` with static text). Three cards, one trick.
2. **Fake data** -- LiveStatusCard shows "128 kbps" and random static bars. Not a real demo.
3. **Missing providers** -- No OpenAI Realtime demo, no Perplexity demo, no Anthropic demo, no streaming demo.
4. **No `/playground` route** -- The page is at `/showcase`. Users hitting `/playground` get a 404.
5. **Waveform duplication** -- WaveformCard and ShowcaseWaveform both just visualize the mic with `useShowcaseMic`.
6. **YouTube card missing** -- YouTubePlayerCard exists but is not on the page.

---

## Refactored Card Grid (12 cards, 5 sections)

### Section 1: Voice Agents (live, bidirectional)

| Card | Provider | What it does |
|------|----------|-------------|
| **Gemini Live Agent** (existing AgentOrbsCard, enhanced) | Gemini Live | Animated orb + live bidirectional voice via WebSocket. Already works. Add transcript overlay. |
| **OpenAI Realtime Agent** (new) | OpenAI Realtime | WebRTC-based live voice agent using `useOpenAIConversation`. Mirror the orb pattern but with a different visual (pulsing ring). Shows the 3BI provider in action. |
| **Voice Chat** (existing VoiceChatCard, keep) | Gemini Live | Customer support phone-call style card. Already functional. |

### Section 2: Text Conversations (streaming + non-streaming)

| Card | Provider | What it does |
|------|----------|-------------|
| **AI Chat** (existing ChatConversationCard, upgrade) | Lovable AI Gateway | Switch from `gemini-chat` to the Lovable AI streaming endpoint (`chat` edge function). Render tokens as they arrive for a best-in-class streaming demo. |
| **Web Search** (new) | Perplexity | A compact search card: user types a question, gets a web-grounded answer from Perplexity. Shows the `search` edge function capability. |
| **Widget Chat** (existing WidgetChatCard, keep + upgrade TTS) | Gemini + ElevenLabs | Keep the widget-style chat. Already works with `gemini-chat` + `widget-tts`. |

### Section 3: Voice Input + Processing

| Card | Provider | What it does |
|------|----------|-------------|
| **Voice Fill** (existing, keep) | ElevenLabs Scribe | STT form-fill demo. Already works. |
| **Character TTS** (existing CharacterSelectCard, keep) | ElevenLabs TTS | Voice character selector with audio preview. Already works. |

### Section 4: Visualizations

| Card | Provider | What it does |
|------|----------|-------------|
| **Live Waveform** (merge WaveformCard + ShowcaseWaveform) | Local mic | Consolidate the two waveform cards into one card with a toggle between "bars" and "canvas" visualization modes. Eliminates redundancy. |
| **Audio Player** (existing MusicPlayerCard, keep) | ElevenLabs TTS | Full player with transport controls. Keep as the single TTS playback demo. Remove AudioPlayerCard and TrackListCard (redundant). |

### Section 5: Media

| Card | Provider | What it does |
|------|----------|-------------|
| **YouTube Player** (existing YouTubePlayerCard, add to page) | YouTube API | Already built but missing from the grid. Add it. |
| **Live Status** (existing, simplify) | Gemini Live + local mic | Keep as a multi-mode dashboard card (mic, chat, call). Remove fake "128 kbps" label. |

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/showcase/OpenAIRealtimeCard.tsx` | New card wrapping `useOpenAIConversation` with a pulsing-ring visual and transcript display |
| `src/components/showcase/WebSearchCard.tsx` | New card calling the existing `search` edge function (Perplexity) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/playground` as alias route pointing to `Showcase` |
| `src/pages/Showcase.tsx` | Restructure grid into 5 sections, add new cards, remove AudioPlayerCard + TrackListCard imports, add YouTubePlayerCard, merge waveform cards |
| `src/components/showcase/ChatConversationCard.tsx` | Replace `gemini-chat` invoke with streaming fetch to `chat` edge function. Render tokens incrementally. |
| `src/components/showcase/ShowcaseWaveform.tsx` | Merge with WaveformCard -- add a toggle for "bars" vs "canvas" rendering mode in one unified card |
| `src/components/showcase/LiveStatusCard.tsx` | Remove fake "128 kbps" label, show real connection quality |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/showcase/AudioPlayerCard.tsx` | Redundant with MusicPlayerCard |
| `src/components/showcase/TrackListCard.tsx` | Redundant with MusicPlayerCard |
| `src/components/showcase/WaveformCard.tsx` | Merged into ShowcaseWaveform |

---

## Technical Details

### OpenAI Realtime Card
- Import and use `useOpenAIConversation` from `src/hooks/useOpenAIConversation.ts`
- Render a CSS pulsing ring visual (no canvas needed) that scales with `outputAudioLevel` / `inputAudioLevel`
- Display last 3 transcript lines
- Toggle button: Start / End session

### Streaming Chat Card (Lovable AI)
- Use `fetch` to `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat` with `stream: true`
- Parse SSE line-by-line using the standard pattern from the codebase documentation
- Update assistant message content progressively as tokens arrive
- Handle 429/402 errors with user-visible feedback

### Web Search Card (Perplexity)
- Call existing `search` edge function via `supabase.functions.invoke('search', { body: { query } })`
- Display the answer text and optional source links
- Compact single-input, single-output layout

### Unified Waveform Card
- Combine `ShowcaseWaveform` (frequency bars) and `WaveformCard` (canvas waveform) into one component
- Add a small toggle button (bars icon / wave icon) to switch visualization mode
- Single `useShowcaseMic` instance drives both views

### Route Alias
- Add `<Route path="/playground" element={<Showcase />} />` in App.tsx so both `/showcase` and `/playground` resolve

