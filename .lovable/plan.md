
# Refactor /Showcase Grid to Optimize Window Usage

## Problem

The current 3-column CSS Grid (`auto-rows-auto`) creates severe layout imbalances:
- `ChatConversationCard` and `MusicPlayerCard` use `lg:row-span-2`, forcing adjacent cells to match their tall heights, leaving huge empty vertical gaps
- The bottom row has an empty cell (only 2 of 3 columns filled)
- Cards like WaveformCard and CharacterSelectCard are short but stretched by taller neighbors
- On mobile, all 12 cards stack linearly causing excessive scroll depth
- No attempt to fit content within the viewport -- the page scrolls 3+ screens on desktop

## Solution

Redesign the grid layout to eliminate wasted space, remove row-spans that cause imbalance, and compact all cards to use the viewport efficiently.

## Changes

### 1. Showcase Page Layout (`src/pages/Showcase.tsx`)

- Remove `lg:row-span-2` from MusicPlayerCard and ChatConversationCard -- these cause the row-height imbalance
- Reorder cards to create a visually balanced flow:
  - Row 1: WaveformCard, VoiceFillCard, AgentOrbsCard (input-focused)
  - Row 2: CharacterSelectCard, ShowcaseWaveform, MusicPlayerCard (audio/viz)
  - Row 3: VoiceChatCard, ChatConversationCard, TrackListCard (conversation)
  - Row 4: AudioPlayerCard, LiveStatusCard, WidgetChatCard (playback/support)
- Use `lg:grid-rows-[repeat(4,minmax(0,1fr))]` so all 4 rows share equal height on desktop, filling the viewport
- Add `lg:min-h-[calc(100vh-120px)]` to the grid container so rows expand to fill the window below the header+hero strip

### 2. Card Height Optimization (all 12 cards)

Make each card fill its grid cell with `h-full` and tighten internal spacing:

- **WaveformCard**: Reduce waveform canvas from `h-24` to `h-16`. Already has `h-full` implicitly via flex.
- **VoiceFillCard**: Reduce internal gaps from `gap-4` to `gap-2`. Input height stays `h-9`.
- **AgentOrbsCard**: Reduce canvas `max-h-48` to `max-h-32`. Reduce button gap.
- **CharacterSelectCard**: Already compact -- just ensure `h-full` and `justify-between` to fill cell.
- **ShowcaseWaveform**: Reduce waveform `h-16` to `h-12`.
- **MusicPlayerCard**: Remove vinyl disc section (3 spinning circles) that adds ~100px of height. Keep transport controls and volume slider. Remove `h-full` override.
- **VoiceChatCard**: Reduce orb from `h-20 w-20` to `h-16 w-16`. Reduce transcript area `max-h-20` to `max-h-12`.
- **ChatConversationCard**: Reduce max scroll height from `max-h-52` to `max-h-28`. Use `flex-1` with `min-h-0` for proper flex overflow.
- **TrackListCard**: Already compact. Add `h-full` wrapper.
- **AudioPlayerCard**: Already compact. Add `h-full` wrapper.
- **LiveStatusCard**: Already compact. Add `h-full` wrapper.
- **WidgetChatCard**: Reduce empty-state orb from `h-24 w-24` to `h-16 w-16`. Reduce `max-h-48` scroll area to `max-h-24`.

### 3. Mobile Improvements

- On mobile (`grid-cols-1`), keep natural auto-row sizing (cards stack normally)
- On `sm:grid-cols-2`, use auto rows
- Only on `lg:grid-cols-3`, apply the equal-height 4-row fill behavior

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Showcase.tsx` | Remove row-spans, reorder cards, add viewport-fill grid sizing |
| `src/components/showcase/WaveformCard.tsx` | Reduce canvas height |
| `src/components/showcase/VoiceFillCard.tsx` | Tighten gaps |
| `src/components/showcase/AgentOrbsCard.tsx` | Smaller canvas, compact buttons |
| `src/components/showcase/CharacterSelectCard.tsx` | Add h-full + justify-between |
| `src/components/showcase/ShowcaseWaveform.tsx` | Reduce bar height |
| `src/components/showcase/MusicPlayerCard.tsx` | Remove vinyl discs, compact layout |
| `src/components/showcase/VoiceChatCard.tsx` | Smaller orb, compact transcripts |
| `src/components/showcase/ChatConversationCard.tsx` | Reduce scroll height |
| `src/components/showcase/TrackListCard.tsx` | Add h-full |
| `src/components/showcase/AudioPlayerCard.tsx` | Add h-full |
| `src/components/showcase/LiveStatusCard.tsx` | Add h-full |
| `src/components/showcase/WidgetChatCard.tsx` | Smaller empty-state orb, reduce scroll |
