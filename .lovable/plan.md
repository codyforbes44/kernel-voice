
## Goal

Make ƷBI Voice best-in-class on every device. Mobile-first, accessible (WCAG AA), resilient under flaky networks, and polished. No visual regressions, no behavior changes to working voice/auth flows.

This builds on prior responsive/design-system passes — it does NOT redo them. It addresses the gaps those passes left: the Voice Assistant page, the authenticated app shell, the admin panel, and global performance/a11y/resilience plumbing.

---

## 1. Foundations (touched once, reused everywhere)

**Global CSS / tokens (`src/index.css`, `tailwind.config.ts`)**
- Add safe-area utilities: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` (env(safe-area-inset-*)).
- Add `min-h-dvh` / `h-dvh` utilities (fall back to `100vh`).
- Standardize touch target: `.tap-target { @apply min-h-[44px] min-w-[44px]; }`.
- Add `.focus-ring` class with high-contrast `outline-2 outline-offset-2 outline-ring` for both themes.
- Verify color contrast: muted-foreground ≥ 4.5:1 on background in both themes; bump if needed.
- Add `.sr-live` helper and document `aria-live` patterns.

**Shared components**
- `src/components/shared/AsyncBoundary.tsx` — combines `ErrorBoundary` + `Suspense` with branded fallback + retry.
- `src/components/shared/RouteErrorBoundary.tsx` — per-route boundary; logs to console + shows recover UI.
- `src/components/shared/OfflineIndicator.tsx` — listens to `online`/`offline`, shows toast + persistent badge in Header when offline.
- `src/components/shared/EmptyState.tsx` — promote and standardize (currently a UI primitive, ensure consistent usage).
- `src/components/shared/PageHeader.tsx` — title + subtitle + actions slot, used by Profile, Admin pages, Pricing.

**App shell (`src/App.tsx`)**
- Wrap each Route element in `RouteErrorBoundary` so a crash in one page doesn't blank the app.
- Mount `OfflineIndicator` near Toaster.
- Tune `QueryClient`: add `networkMode: 'offlineFirst'`, exponential backoff retry, `refetchOnReconnect: true`.
- Add `<HelmetProvider>` `<Helmet>` defaults at root for fallback OG/Twitter.

---

## 2. Voice Assistant page (highest user value)

`src/pages/VoiceAssistant.tsx`

**Mobile**
- Use `min-h-dvh` + `pb-safe` instead of `h-[100dvh] safe-area-inset` (true viewport on iOS Safari address-bar collapse).
- Move FAB above home-bar (`bottom-[max(1.5rem,env(safe-area-inset-bottom))]`).
- Pin transcripts to a scrollable region with `aria-live="polite"` so screen readers announce assistant turns.
- Add swipe-down-to-dismiss on the bottom Sheet (already supported by `vaul`-based sheet — verify).
- Keyboard handling: when text input is focused on iOS, pad bottom for visual viewport so the FAB doesn't cover the input. Use `visualViewport.addEventListener('resize')`.
- Add subtle haptic on connect/end (already in core memory — verify wired through `useVoiceAssistant`).

**Desktop**
- Settings panel transition uses CSS `width` which causes layout thrash; switch to `transform: translateX` only and overlay via `position: absolute` for smoother motion.
- Sidebar: when collapsed, keep a hover-to-expand handle so users don't lose conversation list.

**A11y**
- All icon buttons get `aria-label` (audit: FAB, settings close, mute, end call).
- Connection state announced via `aria-live="polite"` region (Connecting → Connected → Disconnected).
- Voice orb state (`isSpeaking`, `isListening`) mirrored to `aria-label` on the main mic button.

**Resilience**
- If `useVoiceAssistant` reports `connectionError`, show a retry CTA with backoff timer (don't auto-spam).
- On `offline`, disable Start button with tooltip "You're offline" and pause wake-word listener (saves battery).

---

## 3. Authenticated app shell

**Header (`src/components/layout/Header.tsx`)**
- On mobile, brand wordmark visible at `xs+` so users always know where they are.
- Mobile drawer: focus-trap when open (already via Radix Sheet), add Escape handling, return focus to trigger on close.
- Active nav item: stronger contrast in light mode (current 0.5px underline can disappear).

**Profile page (`src/pages/Profile.tsx`)**
- Use `PageHeader` for consistency.
- Replace bespoke loading screen with `AsyncBoundary`.
- Avatar upload: show progress + cancel button; preview before upload (FileReader).
- Add unsaved-changes guard (`beforeunload` + in-app dirty check).

**Pricing / SubscriptionSuccess / Install / Privacy / Terms**
- Wrap in `RouteErrorBoundary`.
- Confirm `PageHeader` + shared section components (already mostly done in last pass — audit for stragglers).

**Showcase / Playground (`src/pages/Showcase.tsx`)**
- Drag-and-drop is keyboard-inaccessible; add keyboard sensor from `@dnd-kit/core` + screen-reader announcements via `Announcements` API.
- On mobile, disable drag by default (long-press already gated 200ms — but cards should be reorderable via a "Reorder" mode toggle button instead, easier for thumbs).

---

## 4. Admin dashboard

`src/components/admin/AdminLayout.tsx` + `AdminSidebar.tsx` + `src/pages/admin/*`

**Mobile (current admin is desktop-only-ish)**
- Convert `AdminSidebar` to use shadcn `Sidebar` primitive with `collapsible="offcanvas"` so it slides on mobile.
- Add `SidebarTrigger` to admin header bar (always visible).
- Replace fixed `container max-w-7xl px-6 py-8` with `px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8`.

**Tables → cards on mobile**
- `src/pages/admin/Users.tsx`, `Conversations.tsx`, `Documents.tsx`, `KnowledgeBase.tsx`, `AuditLogs.tsx`: use `<Table>` only at `md+`, render a card list at `<md`. Bulk actions stay (each card has a checkbox).
- Sticky table headers (`sticky top-0 bg-card`) on desktop for long lists.
- Pagination controls become full-width buttons on mobile.

**Polish**
- Standardize `StatsCard` skeletons (currently inconsistent loading states across admin pages).
- `BulkActionToolbar` becomes a bottom-fixed bar on mobile when items are selected.
- Command palette: ensure ⌘K / Ctrl+K and add discoverable button on mobile (lives in admin header).

---

## 5. Performance & Core Web Vitals

**Bundle**
- Audit `lazy()` boundaries; ensure `Showcase`, `Admin*`, `VoiceAssistant`, `WidgetEditor` are split (mostly done).
- Move heavy showcase cards to `lazy()` inside `ShowcaseCardRegistry` so Playground entry is light.
- Verify `framer-motion` is tree-shaken; replace one-off `motion.div` with CSS where possible.

**Fonts**
- `@import` of Google Fonts in `index.css` blocks render. Move to `<link rel="preconnect">` + `<link rel="preload">` in `index.html`, OR use `font-display: swap` query param (`&display=swap` already present — verify all weights actually used).
- Self-host critical weights for offline-first (optional, defer if scope creeps).

**Images**
- `loading="lazy"` + `decoding="async"` on all non-hero images.
- Set explicit `width`/`height` on avatars and stat icons to prevent CLS.

**React Query**
- Already 5min stale / 10min gc — good. Add `placeholderData: keepPreviousData` to admin pagination queries to avoid flicker.

**Edge function calls**
- Debounce/throttle high-frequency actions (search, KB inspector).
- Add request cancellation via `AbortController` on route change.

---

## 6. Accessibility audit

- Run a manual pass against each public + authenticated page for:
  - Heading hierarchy (no skipped levels)
  - Color contrast (light + dark)
  - Keyboard reachability (Tab through every interactive element, no traps except dialogs)
  - Focus rings visible on all interactive controls
  - Reduced-motion: confirm framer-motion respects it (wrap in `useReducedMotion`)
- Add a single `prefers-reduced-motion` audit utility hook `useReducedMotionPref` and use across animated components.

---

## 7. Out of scope (call out, don't change)

- Voice provider business logic (`useVoiceAssistant`, hooks under `src/hooks/use*Conversation.ts`) — only error/loading UX wrapping.
- Database schema, RLS, edge function internals.
- Embeddable widget (`src/embed/*`) — separate effort.
- Auth flows (already polished last pass).

---

## Technical notes

**File touch list (~25 files, no rename/restructure):**

```text
src/index.css, tailwind.config.ts
src/App.tsx, index.html, vite.config.ts
src/components/shared/{AsyncBoundary,RouteErrorBoundary,OfflineIndicator,PageHeader}.tsx (new)
src/components/layout/{Header,PageWrapper,ErrorBoundary}.tsx
src/components/admin/{AdminLayout,AdminSidebar,BulkActionToolbar,StatsCard}.tsx
src/pages/VoiceAssistant.tsx
src/pages/Profile.tsx
src/pages/Showcase.tsx
src/pages/admin/{Dashboard,Users,Conversations,Documents,KnowledgeBase,AuditLogs,Settings,Widgets}.tsx
src/hooks/useReducedMotionPref.ts (new)
```

**Verification after build:**
- Visual QA at 360px, 414px, 768px, 1024px, 1440px.
- Keyboard-only navigation pass on Voice Assistant + Admin Users.
- Lighthouse mobile score target: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- Smoke test: voice connect, send text, navigate admin tables on a 360px viewport.

**Commit cadence:** one logical group per pass (Foundations → Voice → Shell → Admin → Perf), so any regression is bisectable.
