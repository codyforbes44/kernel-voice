

# Remove YouTube Player & Refactor Showcase

## What Changes

### Files to Delete
- `src/components/showcase/YouTubePlayerCard.tsx` -- the YouTube player component
- `src/pages/YouTubePlayer.tsx` -- the standalone `/youtube-player` page

### Files to Modify

**`src/App.tsx`**
- Remove the `YouTubePlayer` lazy import (line 26)
- Remove the `/youtube-player` route (line 80)

**`src/pages/Showcase.tsx`**
- Remove the `YouTubePlayerCard` import (line 13)
- Remove the "Media" section label and the YouTube card from the grid (lines 84-87)
- Move `LiveStatusCard` into the "Visualizations" section alongside ShowcaseWaveform and MusicPlayerCard, making it a clean 3-column row instead of having a lone "Media" section

### Resulting Grid Layout

| Section | Cards |
|---------|-------|
| Voice Agents | AgentOrbsCard, OpenAIRealtimeCard, VoiceChatCard |
| Text Conversations | ChatConversationCard, WebSearchCard, ClaudeReasoningCard, WidgetChatCard |
| Voice Input | VoiceFillCard, CharacterSelectCard |
| Visualizations | ShowcaseWaveform, MusicPlayerCard, LiveStatusCard |

The "Media" section is removed entirely since LiveStatusCard fits naturally under Visualizations, and YouTube was the only other card there.

