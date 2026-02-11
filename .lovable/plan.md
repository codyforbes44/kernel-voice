

# Voice Settings -- Side Panel UX Refactor

## Problem

The current desktop settings live in a narrow Popover (320px wide) that overlays the main content, closes on outside click, and requires re-opening for every tweak. This is inefficient for a settings-heavy interface with provider selection, voice config, system prompt, and input mode controls.

## Solution

Replace the Popover with a persistent, collapsible **right-side panel** on desktop. On mobile, keep the bottom Sheet (it already works well).

### Desktop Layout Change

```text
+--------------------------------------------------+
|  Header                                          |
+----------+----------------------------+----------+
| Sidebar  |   Voice Interface Card     | Settings |
| (convos) |   (orb, controls, text)    |  Panel   |
|          |                            |  (right) |
+----------+----------------------------+----------+
```

- The Settings panel slides in from the right as a fixed-width column (w-80 / 320px)
- A toggle button (gear icon) in the VoiceInterfaceCard header opens/closes it
- The panel is always visible when open -- no click-outside dismiss
- The main content area flexes to fill remaining space
- When closed, the gear icon remains in the card header as today

### Mobile -- No Change

The bottom Sheet stays as-is. It already provides good mobile UX with scroll and swipe-to-dismiss.

## Technical Approach

### 1. Edit `src/pages/VoiceAssistant.tsx` (Desktop Layout)

- Add a `settingsOpen` state (`useState<boolean>(false)`)
- In the desktop layout, add a right-side panel after `SidebarInset`:
  - Render a `div` with `w-80 border-l bg-card` that conditionally appears based on `settingsOpen`
  - Contains `ScrollArea` wrapping `VoiceSettingsPanel`
  - Has a close button in its header
- Pass `settingsOpen` and `setSettingsOpen` down to `VoiceInterfaceCard` (or use a simpler callback)

### 2. Edit `src/components/voice/VoiceInterfaceCard.tsx`

- Remove the desktop `Popover` entirely (lines 108-139)
- Remove the `VoiceSettingsPanel` import and all settings-panel rendering for desktop
- Keep the mobile `Sheet` as-is
- The gear button on desktop now calls `onToggleSettings?.()` callback instead of opening a Popover
- Add `onToggleSettings?: () => void` and `settingsOpen?: boolean` to the props interface

### 3. Edit `src/components/voice/voiceInterfaceTypes.ts`

- Add `onToggleSettings?: () => void` and `settingsOpen?: boolean` to `VoiceInterfaceCardProps`

### 4. No changes to `VoiceSettingsPanel.tsx` or `VoiceProviderSelector.tsx`

These components are layout-agnostic and render the same regardless of container. They just need a wider container, which the side panel provides.

## UX Details

- The right panel header shows "Settings" title with a close (X) button
- The panel has a subtle slide-in animation using CSS transition (`translate-x` or `w-0` to `w-80`)
- The gear icon in VoiceInterfaceCard shows an active/highlighted state when the panel is open
- Settings are disabled (greyed out) when a voice session is connected, same as today
- The panel scrolls independently from the main content

## Files Changed

| File | Change |
|------|--------|
| `src/pages/VoiceAssistant.tsx` | Add `settingsOpen` state, render right settings panel in desktop layout |
| `src/components/voice/VoiceInterfaceCard.tsx` | Remove desktop Popover, add `onToggleSettings` callback for gear button |
| `src/components/voice/voiceInterfaceTypes.ts` | Add `onToggleSettings` and `settingsOpen` optional props |

