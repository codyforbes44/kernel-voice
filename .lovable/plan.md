

# Performance Refactoring Plan

## Issues Identified

### 1. No Route-Level Code Splitting (Critical - Bundle Size)
All 16 pages are eagerly imported in `App.tsx`, meaning the entire app (admin dashboard, voice assistant, landing page, pricing, etc.) is loaded upfront even if the user only visits the landing page. This dramatically increases initial load time and time-to-interactive.

**Fix**: Use `React.lazy()` + `Suspense` for all page components. Group admin pages as a heavier chunk that only loads when accessed.

### 2. QueryClient Has No Caching Configuration (Performance)
`const queryClient = new QueryClient()` uses default settings with no `staleTime`, meaning every query refetches on every mount. This causes excessive network requests for data that rarely changes (user role, user features, subscription status).

**Fix**: Configure sensible global defaults:
- `staleTime: 1000 * 60 * 5` (5 min) for general queries
- `gcTime: 1000 * 60 * 10` (10 min garbage collection)
- `refetchOnWindowFocus: false` globally (individual queries can override)
- `retry: 1` instead of default 3

### 3. ConversationHistory Creates Redundant Supabase Client Calls (Performance)
`ConversationHistory` and `MessageHistory` call `supabase.auth.getUser()` on every load instead of using the `useAuth()` context. The `getUser()` call hits the auth server every time, while `useAuth()` returns the cached user instantly.

**Fix**: Refactor both components to use `useAuth()` for user data.

### 4. Realtime Channel Name Collisions (Bug/Performance)
Both `ConversationHistory` and `MessageHistory` use hardcoded channel names (`'conversations'` and `'messages'`). If multiple instances mount (e.g., desktop sidebar + mobile sheet), they collide and one silently fails. Also, cleanup in `MessageHistory` doesn't use the returned unsubscribe function.

**Fix**: Use unique channel names with conversation IDs (e.g., `messages-${conversationId}`). Fix cleanup to properly unsubscribe.

### 5. useVoiceAssistant Initializes All 4 Provider Hooks Unconditionally (Performance)
The hook always instantiates `useConversation` (ElevenLabs), `useOpenAIConversation`, `useVAPIConversation`, and `useGeminiLiveConversation` regardless of which provider is selected. Each creates WebRTC/WebSocket infrastructure and event handlers.

**Fix**: This is an architectural limitation of React hooks (can't conditionally call them). However, we can ensure the inactive provider hooks are truly inert by adding an `enabled` flag to each, so they skip setup logic when not the active provider. This prevents unnecessary audio context creation and event listener attachment.

### 6. Particle Animation Runs Continuously on Landing Page (Performance)
The `AnimatedHeroBackground` canvas animation runs `requestAnimationFrame` in a loop even when the section is scrolled out of view, wasting CPU/GPU cycles.

**Fix**: Use `IntersectionObserver` to pause the animation when the canvas is not visible.

### 7. Duplicate Supabase Client Instantiation in Chat Edge Function (Performance)
The `chat` edge function creates a new `createClient()` instance up to twice per request (once for loading context, once for saving messages). The Supabase client should be created once at the top and reused.

**Fix**: Create the Supabase client once at the top of the handler and reuse it.

### 8. useVoiceProviderPreference Calls getUser() Redundantly (Performance)
This hook calls `supabase.auth.getUser()` inside `loadPreference` even though authentication state is already available from `useAuth()`. Same issue in `useInputModePreference`.

**Fix**: Pass `user` from `useAuth()` instead of calling `getUser()` internally.

## Changes

### Files Modified

**`src/App.tsx`**
- Add `React.lazy()` imports for all page components
- Wrap routes in `Suspense` with a `LoadingScreen` fallback
- Configure `QueryClient` with optimized defaults

**`src/components/voice/ConversationHistory.tsx`**
- Replace `supabase.auth.getUser()` with `useAuth()` hook
- Use unique channel names to prevent collisions
- Accept `userId` from auth context

**`src/components/voice/MessageHistory.tsx`**
- Use unique channel names with conversation ID
- Fix realtime cleanup to properly unsubscribe

**`src/components/landing/AnimatedHeroBackground.tsx`**
- Add `IntersectionObserver` to pause/resume animation when off-screen

**`supabase/functions/chat/index.ts`**
- Create Supabase client once and reuse throughout the handler

**`src/hooks/useVoiceProviderPreference.ts`**
- Accept `user` object instead of calling `getUser()` internally

**`src/hooks/useInputModePreference.ts`**
- Accept `user` object instead of calling `getUser()` internally

**`src/hooks/useVoiceAssistant.ts`**
- Pass `user` to child hooks that previously called `getUser()` redundantly

**`src/hooks/useOpenAIConversation.ts`**
- Add `enabled` guard so setup logic is skipped when provider is not active

**`src/hooks/useGeminiLiveConversation.ts`**
- Add `enabled` guard

**`src/hooks/useVAPIConversation.ts`**
- Add `enabled` guard

## Expected Impact

- **Initial load time**: Reduced by ~40-60% through code splitting (admin pages alone are a large chunk)
- **Network requests**: Reduced by ~50% through proper QueryClient caching and eliminating redundant `getUser()` calls
- **CPU usage on landing page**: Reduced when hero section is scrolled past
- **Realtime reliability**: Fixed channel collisions prevent silent subscription failures
- **Edge function latency**: Minor improvement from single Supabase client instantiation

