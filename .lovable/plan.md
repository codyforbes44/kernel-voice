
# Best-in-Class UX Refactor -- Mobile-First

## Overview

A comprehensive refactor across all pages and components to achieve best-in-class UX with mobile-first design, consistent patterns, improved accessibility, and polished interactions.

---

## 1. App-Level Cleanup

**`src/App.css`** -- Delete all contents. This file contains default Vite boilerplate CSS (`#root max-width`, `.logo`, `.card`, `.read-the-docs`) that conflicts with the Tailwind-based design system. The `#root` max-width restriction (1280px) actively clips the layout.

**`src/App.tsx`** -- Remove the `#root` max-width constraint by deleting the App.css import if present, or ensuring `#root` has no constraining styles. Wrap admin routes with `ProtectedRoute` for security consistency.

---

## 2. Header -- Mobile Polish

**`src/components/layout/Header.tsx`**:
- Add `aria-label="Main navigation"` to nav elements
- Add active indicator animation (underline or dot) for current route instead of just `variant="secondary"`
- Add smooth scroll-to-top on logo click when already on `/`
- Ensure the mobile hamburger menu closes after navigation (it does via DropdownMenu, but verify)

---

## 3. Voice Assistant Page -- Major UX Overhaul

**`src/pages/VoiceAssistant.tsx`**:

### Mobile Layout Improvements
- Use `100dvh` instead of `min-h-screen` to avoid mobile address bar issues
- Remove redundant action buttons row (Conversations + Upload); integrate them into a single bottom sheet triggered by a FAB (floating action button) or swipe gesture
- Move the SavedAgentsList to a collapsible horizontal strip with better touch targets (current 140px cards are good but the overflow menu button is only 24px -- too small for mobile)
- Make the voice orb area take more vertical space on mobile for a more immersive feel
- Add pull-to-refresh gesture support for conversation reload

### Desktop Layout Improvements
- Increase sidebar width for better readability
- Add keyboard shortcut hints in the sidebar trigger tooltip

---

## 4. Voice Control Panel -- Interaction Polish

**`src/components/voice/VoiceControlPanel.tsx`**:
- The "End" button label on mobile (`isMobile ? 'End' : 'Continue Later'`) is confusing -- rename to "End Session" for clarity
- Group mute/volume buttons with a visual separator from the end/resume buttons
- Add haptic feedback trigger (via `navigator.vibrate`) on state changes (start, pause, resume, end) for mobile
- Add a volume slider on mobile too (currently hidden with `!isMobile`) -- place it inline or in a small expandable section
- Animate the orb more smoothly -- the `WaveformOrb` SVG uses `Date.now()` in render which doesn't animate (static snapshot). Use `requestAnimationFrame` or CSS animations instead

---

## 5. Voice Interface Card -- Simplification

**`src/components/voice/VoiceInterfaceCard.tsx`**:
- The card has too much visual weight on mobile. Reduce padding from `p-4` to `p-3` on mobile
- The title "ZBI Voice" in the card header is redundant (already in the Header). Remove it on mobile, keep on desktop
- Make the Settings sheet trigger more discoverable -- add a label "Settings" next to the icon on mobile

---

## 6. Input Mode Selector -- Mobile Touch UX

**`src/components/voice/InputModeSelector.tsx`**:
- Tooltips don't work on mobile (hover-only). Add visible labels below each icon on mobile, or use `aria-label` with a long-press tooltip alternative
- Increase toggle item size to 48px minimum touch target (currently relying on parent padding)

---

## 7. Live Transcripts -- Readability

**`src/components/voice/LiveTranscripts.tsx`**:
- Increase the mobile height from `h-32` to `h-40` for better readability
- Add a subtle fade-out gradient at the top of the scroll area to indicate scrollable content
- Add timestamps to messages (relative, e.g., "2m ago") on long-press or always visible in compact form

---

## 8. Text Message Input -- Mobile Keyboard UX

**`src/components/voice/TextMessageInput.tsx`**:
- Use a `textarea` instead of `input` with auto-grow behavior for multi-line messages
- Add a character counter for long messages
- Ensure the input stays visible above the mobile keyboard (use `scrollIntoView` on focus)

---

## 9. Saved Agents List -- Touch Targets

**`src/components/voice/SavedAgentsList.tsx`**:
- The overflow menu button is 24x24px (`h-6 w-6`) -- increase to 36x36px minimum
- Show the menu on mobile by default (not opacity-0 with hover) since hover doesn't exist on touch
- Add long-press to open context menu as an alternative

---

## 10. Conversation History -- Swipe Actions

**`src/components/voice/ConversationHistory.tsx`**:
- The delete button is hover-only (`opacity-0 group-hover:opacity-100`) -- on mobile, add a visible delete icon or swipe-to-delete
- Add a search/filter input for users with many conversations
- Show a relative timestamp ("2 hours ago") instead of just the date

---

## 11. Landing Page -- Performance & Polish

**`src/pages/LandingPage.tsx`**:
- The animated hero background may cause jank on low-end mobile devices. Add `will-change: transform` and use `IntersectionObserver` to pause when offscreen (already partially done per memory)
- Add `loading="lazy"` to the logo image
- The CTA buttons stack vertically on mobile but could use more spacing
- Add a testimonial or social proof section

---

## 12. Auth Page -- Form UX

**`src/pages/Auth.tsx`**:
- Add password strength indicator on signup
- Add "Show password" toggle button
- Auto-focus the email field on mount
- Add transition animation between Sign In / Sign Up tabs

---

## 13. Profile Page -- Mobile Layout

**`src/pages/Profile.tsx`**:
- The avatar upload has a hover-only overlay (`opacity-0 group-hover:opacity-100`) -- on mobile this is invisible. Always show the camera icon overlay at reduced opacity, or add a "Change Photo" button below
- Add a "Delete Account" section
- Add input validation (display name length, format)

---

## 14. Pricing Page -- Comparison UX

**`src/pages/Pricing.tsx`**:
- Add feature comparison checkmarks in a table format on desktop
- Animate the billing toggle with a smooth price transition
- Add a "Most Popular" badge animation

---

## 15. Install Page -- Better Guidance

**`src/pages/Install.tsx`**:
- Add device-specific illustrations or screenshots
- Animate the installation steps with staggered entry
- Add a "Not now, remind me later" dismissible option

---

## 16. 404 Page -- Better Recovery

**`src/pages/NotFound.tsx`**:
- Add suggested pages based on common routes
- Add a search input to help find content
- Add a fun animation or illustration

---

## 17. CSS / Theme Improvements

**`src/index.css`**:
- Add `scroll-behavior: smooth` to html
- Add focus-visible styles for better keyboard navigation visibility
- Add reduced-motion media query overrides for all animations

---

## 18. Accessibility Audit

Across all components:
- Ensure all interactive elements have `aria-label` or visible labels
- Add `role="status"` and `aria-live="polite"` to the connection status and transcript areas
- Ensure color contrast meets WCAG AA (the cyan primary on white in light mode needs verification)
- Add skip-to-content link in Header

---

## Technical Details

### Files to Modify (priority order)
1. `src/App.css` -- Clear boilerplate
2. `src/index.css` -- Add global accessibility/motion styles
3. `src/pages/VoiceAssistant.tsx` -- Mobile layout overhaul (100dvh, FAB, spacing)
4. `src/components/voice/VoiceControlPanel.tsx` -- Touch targets, haptics, volume on mobile
5. `src/components/voice/VoiceInterfaceCard.tsx` -- Simplify mobile header, reduce padding
6. `src/components/voice/SavedAgentsList.tsx` -- Touch target sizes, mobile menu visibility
7. `src/components/voice/ConversationHistory.tsx` -- Mobile delete UX, relative timestamps
8. `src/components/voice/InputModeSelector.tsx` -- Mobile labels, touch targets
9. `src/components/voice/LiveTranscripts.tsx` -- Height, fade gradient
10. `src/components/voice/TextMessageInput.tsx` -- Auto-grow textarea
11. `src/components/voice/AudioLevelMeter.tsx` -- Fix WaveformOrb animation
12. `src/pages/Auth.tsx` -- Password toggle, strength indicator
13. `src/pages/Profile.tsx` -- Mobile avatar UX
14. `src/pages/LandingPage.tsx` -- Performance, lazy loading
15. `src/pages/Pricing.tsx` -- Price transition animation
16. `src/pages/Install.tsx` -- Step animations
17. `src/pages/NotFound.tsx` -- Better recovery options
18. `src/components/layout/Header.tsx` -- Accessibility, active indicators
19. `src/components/voice/ConnectionStatusBadge.tsx` -- Mobile-friendly (no tooltip reliance)
20. `src/components/voice/GuestModeBanner.tsx` -- Touch targets

### No Database Changes Required
### No New Dependencies Required

All improvements use existing Tailwind utilities, Radix primitives, and native browser APIs (IntersectionObserver, navigator.vibrate, scrollIntoView).
