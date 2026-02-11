

# New Page: Voice Components Showcase

A standalone showcase page at `/showcase` displaying interactive voice/audio UI components in a dark masonry-style grid layout, replicating the reference design.

## Components to Build

The page will contain 8 distinct card sections arranged in a responsive 3-column masonry grid:

### 1. Audio Waveform Card
- Animated bar waveform using the existing `LiveWaveformCanvas` component
- "Speaking" status label below
- Simulated audio level via `requestAnimationFrame` sine wave

### 2. Voice Fill Card
- Title "Voice Fill" with "Powered by ElevenLabs Scribe" subtitle
- A "Voice Fill" badge/button
- Two form fields: First Name (placeholder "John") and Last Name (placeholder "Doe") with required markers

### 3. Agent Orbs Card
- Title "Agent Orbs" with description
- A canvas-drawn animated orb (gradient sphere with subtle lighting/reflection in purple/blue tones)
- Three state toggle buttons: Idle, Listening, Talking - clicking changes the orb animation

### 4. Character Selector Card
- A select dropdown with an agent icon and name "Rachel"
- Uses the existing `Select` component from Radix UI

### 5. Waveform Card
- Title "Waveform" with description "Real-time audio visualization with smooth scrolling animation"
- Static/animated waveform bars in a horizontal strip

### 6. Music Player Card
- Track title "II - 00" with "ElevenLabs Music" subtitle
- Sparkle and music note icons
- Waveform progress indicator
- Time display (0:00 / 1:37)
- Transport controls: Previous, Play, Next
- Three vinyl/disc visuals (dark circular elements)
- Volume slider with percentage (70%)

### 7. Customer Support Voice Chat Card
- Avatar circle (gradient orb)
- "Customer Support" title, "Tap to start voice chat" subtitle
- Phone call button (circular, primary color)

### 8. Chat Conversation Card
- Agent messages (dark bubbles with avatar) showing a customer support conversation about order tracking
- User message in a lighter bubble
- Scrollable message area

### 9. Track List Card
- Numbered list of tracks (II-02 through II-05) with row highlight on hover

### 10. Audio Player Mini Card
- Track title "II - 09"
- Play button with progress bar and duration

### 11. Live Status Card
- Waveform visualization
- "Live" indicator with red dot and "128 kbps"
- "Customer Support" label with mic, chat, and phone icons

### 12. Widget Chat Card
- "Customer Support" header with avatar
- Gradient orb visual
- "Start a conversation" prompt
- Message input with send and sparkle buttons

## Page Layout

- Route: `/showcase`
- Full-page dark background (`bg-black` forced, ignoring theme)
- 3-column CSS grid on desktop, 2 on tablet, 1 on mobile
- Cards use `bg-zinc-900/80` with subtle borders matching the OLED dark theme
- No header/footer -- standalone showcase

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Showcase.tsx` | Main page with all showcase cards |
| `src/components/showcase/WaveformCard.tsx` | Audio waveform with "Speaking" label |
| `src/components/showcase/VoiceFillCard.tsx` | Voice fill form card |
| `src/components/showcase/AgentOrbsCard.tsx` | Interactive orb with state buttons |
| `src/components/showcase/MusicPlayerCard.tsx` | Full music player UI |
| `src/components/showcase/VoiceChatCard.tsx` | Customer support call card |
| `src/components/showcase/ChatConversationCard.tsx` | Chat message thread |
| `src/components/showcase/TrackListCard.tsx` | Track listing |
| `src/components/showcase/AudioPlayerCard.tsx` | Mini audio player |
| `src/components/showcase/LiveStatusCard.tsx` | Live streaming status card |
| `src/components/showcase/WidgetChatCard.tsx` | Chat widget preview |
| `src/components/showcase/CharacterSelectCard.tsx` | Character/voice selector |
| `src/components/showcase/ShowcaseWaveform.tsx` | Static waveform display card |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Add lazy route for `/showcase` |

### Key Implementation Notes
- All animations use `requestAnimationFrame` and CSS transitions (no extra dependencies)
- The Agent Orbs canvas draws a radial gradient sphere with animated glow based on active state
- Music player vinyl discs are CSS circles with conic gradients
- Reuses existing UI primitives: `Button`, `Slider`, `Select`, `Input`, `Card`
- Forced dark styling via `className="dark"` wrapper on the page root so it always appears dark regardless of theme setting
- No backend or database changes needed -- purely presentational

