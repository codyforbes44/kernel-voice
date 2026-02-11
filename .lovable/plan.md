

# Refactor /Showcase to Match Brand Colors, Logo, and Mobile-First UX

## Problem

All 12 showcase cards use hardcoded `violet/indigo/purple` (`#8b5cf6`, `#6366f1`) and `zinc-900/800` colors. The app's brand system is **cyan/teal** (`hsl(180 100% 50%)`) with OLED-optimized true black backgrounds and CSS custom properties (`--primary`, `--secondary`, `--primary-glow`). The page also lacks a header, logo, proper mobile spacing, and touch-friendly sizing.

## Design Direction

- Replace all `violet/indigo/purple` references with brand `primary` (cyan) and `secondary` (sky-blue) via CSS variables and Tailwind utilities
- Use OLED true black (`bg-background`) instead of hardcoded `bg-black` / `bg-zinc-900/80`
- Add the brand logo and page header with "ƷBI Voice" branding
- Mobile-first: single column, 48px min touch targets, safe-area padding, comfortable thumb-zone spacing
- Use existing utility classes (`glow-border`, `card-glow`, `text-gradient`, `glow-hover`) for consistency
- Apply `font-display` (Orbitron) for card titles, `font-body` (Inter) for descriptions

## Page-Level Changes

**File: `src/pages/Showcase.tsx`**
- Wrap in `PageWrapper` (or at minimum add Header/Footer) for consistent navigation
- Add a branded hero strip at top with logo + "ƷBI Voice Showcase" title using `text-gradient`
- Force `dark` class for OLED optimization
- Switch from CSS `columns` masonry to a responsive CSS Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `auto-rows-auto` for better mobile control
- Add `safe-area-inset` padding, `px-4 pb-20` for mobile FAB clearance
- Add subtle entrance animations via framer-motion `staggerChildren`

## Color Mapping (applied across all 12 cards)

| Old (violet) | New (brand) |
|--------------|-------------|
| `bg-violet-600` | `bg-primary` |
| `bg-violet-600/20`, `bg-violet-600/30` | `bg-primary/20`, `bg-primary/30` |
| `text-violet-400` | `text-primary` |
| `text-violet-300` | `text-primary/80` |
| `text-violet-200` | `text-primary/70` |
| `border-violet-500/30` | `border-primary/30` |
| `hover:bg-violet-500` | `hover:bg-primary/90` |
| `shadow-violet-500/20` | `shadow-glow-subtle` or `shadow-primary/20` |
| `#8b5cf6` (hex in canvas/inline) | `hsl(180, 100%, 50%)` (cyan) |
| `#a78bfa` (bar color) | `hsl(180, 100%, 65%)` (light cyan) |
| `from-violet-500 to-indigo-600` gradient | `from-primary to-secondary` |
| `bg-zinc-900/80` | `bg-card` or `bg-muted` |
| `border-zinc-800` | `border-border` |
| `bg-zinc-800` | `bg-input` or `bg-muted` |
| `text-zinc-100` | `text-foreground` |
| `text-zinc-400/500` | `text-muted-foreground` |
| `text-zinc-600` | `text-muted-foreground/60` |

## Card-by-Card Changes

All 12 component files in `src/components/showcase/` receive the same treatment:

1. **WaveformCard** -- Replace `bg-zinc-900/80 border-zinc-800` with `bg-card border-border glow-border`. Change `barColor="#a78bfa"` to brand cyan. Replace `text-violet-400` with `text-primary`. Mic button gets min-h/w of 48px.

2. **VoiceFillCard** -- Same container swap. Voice Fill button: `bg-primary/20 text-primary border-primary/30`. Input fields: `bg-input border-border`. Labels: `text-muted-foreground`.

3. **AgentOrbsCard** -- Container swap. Canvas gradient colors change from violet/indigo HSL to cyan/teal HSL (`hsl(180,100%,50%)` etc). Buttons: active uses `bg-primary` instead of `bg-violet-600`. Min touch target 48px.

4. **CharacterSelectCard** -- Container swap. Avatar gradient: `from-primary to-secondary`. Select trigger: `bg-input border-border`. Loading spinner: `text-primary`.

5. **ShowcaseWaveform** -- Container swap. Bars: `bg-primary/70` instead of `bg-violet-500/70`. Activate button: `text-primary`.

6. **MusicPlayerCard** -- Container swap. Sparkles icon: `text-primary`. Waveform bars: played color becomes `hsl(180,100%,50%)`. Play button: `bg-primary hover:bg-primary/90`. Slider thumb: `bg-primary border-primary`. Volume track: `bg-primary`.

7. **VoiceChatCard** -- Container swap. Orb gradient: `from-primary via-secondary to-accent`. Phone button: `bg-primary hover:bg-primary/90` (active: `bg-destructive`). Shadow: `shadow-glow-subtle`. Min 48px touch target on phone button.

8. **ChatConversationCard** -- Container swap. User bubble: `bg-primary/20 text-primary/80 border-primary/20`. Agent avatar: `from-primary to-secondary`. Send button: `text-primary`. Input: `bg-input border-border focus:border-primary/50`.

9. **TrackListCard** -- Container swap. Active track text: `text-primary/80`. Play icon hover: `text-primary`. Row min-height 48px for touch.

10. **AudioPlayerCard** -- Container swap. Play button: `bg-primary hover:bg-primary/90`. Slider: brand colors. Progress bar fill: brand primary.

11. **LiveStatusCard** -- Container swap. Waveform `barColor` to cyan. Mic/chat/phone buttons: `text-primary` when active. Chat input: `bg-input border-border`. Min 48px touch targets on icon buttons.

12. **WidgetChatCard** -- Container swap. Header avatar: `from-primary to-secondary`. Orb: `from-primary via-secondary to-accent`. User bubble: `bg-primary/20`. Sparkles/Send buttons: `hover:text-primary`. Input container: `bg-input`.

## Mobile-First UX Improvements (all cards)

- All interactive buttons: `min-h-[48px] min-w-[48px]` for touch compliance
- Card padding: `p-4` on mobile, `p-6` on `sm:` and up
- Page container: `px-4 pt-4 pb-20` (clearance for mobile FAB from main app)
- Grid gap: `gap-3 sm:gap-4`
- Chat scroll areas: `-webkit-overflow-scrolling: touch` via `scrollbar-hide`
- Input fields: `text-base` on mobile (prevents iOS zoom on focus)
- `ChatConversationCard` and `WidgetChatCard`: span 2 rows on desktop grid (`lg:row-span-2`)

## Files Changed Summary

| File | Action |
|------|--------|
| `src/pages/Showcase.tsx` | Modify -- add header, grid layout, framer-motion stagger, brand classes |
| `src/components/showcase/WaveformCard.tsx` | Modify -- brand colors |
| `src/components/showcase/VoiceFillCard.tsx` | Modify -- brand colors |
| `src/components/showcase/AgentOrbsCard.tsx` | Modify -- brand colors + canvas HSL |
| `src/components/showcase/CharacterSelectCard.tsx` | Modify -- brand colors |
| `src/components/showcase/ShowcaseWaveform.tsx` | Modify -- brand colors |
| `src/components/showcase/MusicPlayerCard.tsx` | Modify -- brand colors + inline hex |
| `src/components/showcase/VoiceChatCard.tsx` | Modify -- brand colors + touch targets |
| `src/components/showcase/ChatConversationCard.tsx` | Modify -- brand colors |
| `src/components/showcase/TrackListCard.tsx` | Modify -- brand colors + row height |
| `src/components/showcase/AudioPlayerCard.tsx` | Modify -- brand colors |
| `src/components/showcase/LiveStatusCard.tsx` | Modify -- brand colors + touch targets |
| `src/components/showcase/WidgetChatCard.tsx` | Modify -- brand colors |

## No New Dependencies

All changes use existing Tailwind utilities, CSS custom properties, and the already-installed `framer-motion` package.

