

# Refactor /showcase for Best Mobile-First UX

## Overview
Remove the YouTube Player link card and restructure the showcase grid from 13 cards down to 12 with an optimized mobile-first layout that groups cards by category, uses responsive grid sizing, and ensures every card looks great on all screen sizes.

## What Changes

### 1. Remove YouTube Player Link Card
- Remove `YouTubePlayerLinkCard` import and usage from `Showcase.tsx`
- Delete `src/components/showcase/YouTubePlayerLinkCard.tsx` file
- Grid goes from 13 cards to 12 (a cleaner 4x3 on desktop)

### 2. Restructure Grid Layout (Mobile-First)
Current grid uses a flat `grid-cols-1 / sm:grid-cols-2 / lg:grid-cols-3` with a forced `lg:grid-rows-[repeat(5,...)]` that creates awkward spacing. The new layout:

- **Mobile (default)**: Single column, full-width cards with natural height
- **Tablet (sm/md)**: 2-column grid with select cards spanning 2 columns for visual hierarchy
- **Desktop (lg+)**: 3-column grid, 4 rows, with featured cards spanning strategically

### 3. Categorized Card Sections
Group the 12 cards into logical sections with subtle section labels for scannability:

- **Voice Input** (3 cards): WaveformCard, VoiceFillCard, AgentOrbsCard
- **Audio Playback** (3 cards): MusicPlayerCard, AudioPlayerCard, TrackListCard
- **Visualizations** (2 cards): ShowcaseWaveform, CharacterSelectCard
- **Conversations** (4 cards): VoiceChatCard, ChatConversationCard, LiveStatusCard, WidgetChatCard

### 4. Card Height Improvements for Mobile
- Remove fixed `h-full` stretching that causes awkward empty space on mobile
- Let cards size naturally on mobile; only stretch to fill on larger grids
- Ensure all interactive elements maintain 48px minimum touch targets (already in place)

### 5. Safe Area and Spacing Polish
- Keep `safe-area-inset` for notch-aware padding
- Reduce top padding on mobile (`pt-6` instead of `pt-10`)
- Increase bottom padding for FAB clearance (`pb-24`)
- Use `gap-3` on mobile, `gap-4` on tablet, `gap-5` on desktop

---

## Technical Details

### Files Modified
- `src/pages/Showcase.tsx` -- Complete restructure of the grid layout with category sections and responsive spanning

### Files Deleted
- `src/components/showcase/YouTubePlayerLinkCard.tsx` -- No longer needed

### Grid CSS Strategy
```text
Mobile:    grid-cols-1, gap-3
Tablet:    grid-cols-2, gap-4, select cards span-2
Desktop:   grid-cols-3, gap-5, natural row flow (no forced min-height)
```

### Card Ordering (Priority for Mobile Scroll)
1. AgentOrbsCard (hero/visual impact first)
2. VoiceChatCard (primary interactive demo)
3. WaveformCard (mic visualization)
4. ChatConversationCard (text interaction)
5. VoiceFillCard (form dictation)
6. ShowcaseWaveform (visualization)
7. MusicPlayerCard (audio playback)
8. CharacterSelectCard (voice selection)
9. AudioPlayerCard (simple player)
10. TrackListCard (track list)
11. LiveStatusCard (multi-mode support)
12. WidgetChatCard (widget demo)

### Featured Card Spanning
On tablet (sm), the first card (AgentOrbsCard) and ChatConversationCard span 2 columns for visual hierarchy. On desktop, the grid flows naturally in 3 columns x 4 rows.

