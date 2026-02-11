

# Add YouTube Player to Showcase Page

## Overview

Add a YouTube player card above the Voice Fill section in the `/showcase` grid, along with appropriate top margin adjustments. The player will use the YouTube IFrame Player API (which is free and doesn't require a Google API key for basic embed playback).

**Note on Google API Key:** The YouTube IFrame Player API allows embedding and controlling video playback without an API key. A Google/YouTube Data API key is only needed for searching/listing videos programmatically. For playing specific videos, the standard embed approach is the correct solution. If you later want search functionality, we can add a key then.

## Changes

### 1. New Component: `YouTubePlayerCard`

**File: `src/components/showcase/YouTubePlayerCard.tsx`**

- A showcase card matching the existing card styling (`rounded-2xl bg-card border border-border glow-border`)
- Embeds YouTube's IFrame Player API via a `<iframe>` with `enablejsapi=1`
- Features:
  - Video URL input field where users can paste any YouTube link
  - Responsive 16:9 aspect ratio player
  - Default video pre-loaded (a relevant AI/voice demo)
  - Compact header with title "YouTube Player" and subtitle
  - `h-full` to fill the grid cell

### 2. Update Showcase Layout

**File: `src/pages/Showcase.tsx`**

- Add top margin (`mt-4`) to the page content area for better spacing
- Insert `YouTubePlayerCard` as the first card in Row 1 (before WaveformCard)
- Shift cards to accommodate 13 total cards in the grid:
  - Row 1: YouTubePlayerCard, WaveformCard, VoiceFillCard
  - Row 2: AgentOrbsCard, CharacterSelectCard, ShowcaseWaveform
  - Row 3: MusicPlayerCard, VoiceChatCard, ChatConversationCard
  - Row 4: TrackListCard, AudioPlayerCard, LiveStatusCard
  - Row 5 (partial): WidgetChatCard
- Update grid rows to `lg:grid-rows-[repeat(5,minmax(0,1fr))]` to accommodate the extra row, or keep 4 rows and let the 13th card wrap naturally

### 3. Top Margin Adjustment

- Change `pt-6` to `pt-10` on the outer container for more breathing room at the top of the page

## Technical Details

### YouTube IFrame Embed

The player uses a standard YouTube iframe embed with parameters for a clean look:

```text
https://www.youtube.com/embed/{VIDEO_ID}?
  autoplay=0
  &modestbranding=1
  &rel=0
  &controls=1
```

### URL Parsing

Extract video ID from common YouTube URL formats:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`

## Files

| File | Action |
|------|--------|
| `src/components/showcase/YouTubePlayerCard.tsx` | Create -- new YouTube player card component |
| `src/pages/Showcase.tsx` | Modify -- add top margin, insert YouTubePlayerCard, adjust grid |

