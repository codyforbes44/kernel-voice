

# Ultimate YouTube Player UX

Transform the basic YouTube embed into a rich, interactive media player that matches the polish of the other showcase cards (MusicPlayerCard, AudioPlayerCard).

## Features

### 1. YouTube IFrame API Integration (not just a passive embed)
- Load the official YouTube IFrame Player API (`YT.Player`) instead of a raw `<iframe>`
- This unlocks programmatic control: play/pause, seek, volume, duration, current time, and player state events

### 2. Custom Transport Controls
- **Play/Pause** button matching the showcase card style (rounded primary button)
- **Skip forward/back 10s** buttons
- **Progress bar** using the existing `<Slider>` component with seek support
- **Time display** showing elapsed / total duration (e.g., `1:23 / 4:56`)
- **Volume slider** with mute toggle, matching MusicPlayerCard's style

### 3. Video Thumbnail + Overlay
- When paused or before first play, show the YouTube thumbnail as a poster image with a centered play overlay
- Once playing, show the actual video player (hidden native controls via `controls=0`)

### 4. Playlist / Queue Support
- A small array of preset video IDs (curated AI/voice demos) shown as clickable chips below the player
- Users can still paste any custom URL via the input field
- Active video chip is highlighted with the primary color

### 5. Visual Polish
- Animated waveform bars (like MusicPlayerCard) that react to player state (playing vs paused)
- Smooth transitions between loading/playing/paused states
- Loading spinner while the player initializes
- Fullscreen toggle button

### 6. Keyboard Shortcuts
- Space: play/pause
- Arrow left/right: seek -/+ 5s
- Arrow up/down: volume -/+ 10%

## Technical Approach

### YouTube IFrame API
Load the API script dynamically and create a `YT.Player` instance targeting a div. Use `onStateChange` events to sync React state (playing, progress, duration). A `setInterval` polls `getCurrentTime()` while playing.

```text
State flow:
  URL Input --> extractVideoId() --> loadVideoById()
  Preset Chip Click --> loadVideoById()
  YT.PlayerState.PLAYING --> start progress polling
  YT.PlayerState.PAUSED --> stop polling
  YT.PlayerState.ENDED --> reset progress, show thumbnail
```

### Component Structure

```text
YouTubePlayerCard
  +-- Header (YouTube icon + title + loading spinner)
  +-- Video Container (YT.Player div with poster overlay)
  +-- Progress Slider + Time Labels
  +-- Transport Controls (skip back, play/pause, skip forward, fullscreen)
  +-- Volume Slider
  +-- Preset Video Chips
  +-- URL Input Field
```

### Preset Videos
A curated list of 3-4 short videos relevant to the product theme (AI, voice tech, demos). Each shows as a small labeled chip.

## Files

| File | Action |
|------|--------|
| `src/components/showcase/YouTubePlayerCard.tsx` | Rewrite -- full-featured player with YT IFrame API, custom controls, presets, keyboard shortcuts |

No other files need changes. The Showcase grid already renders this component in the correct position.

