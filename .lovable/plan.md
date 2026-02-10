
# Comprehensive Refactoring Plan

## 1. Incomplete Brand Rename (High Priority)

The rename from "Kernel" to "ƷBI Voice" was only partially completed. Several files still reference "Kernel":

**Files needing updates:**
- `src/pages/VoiceAssistant.tsx` -- wake words still `['hey kernel', 'ok kernel', 'kernel']` and SEO title "Kernel - Voice Assistant"
- `src/hooks/useVAPIConversation.ts` -- assistant name is `'Kernel Voice Assistant'`
- `src/embed/index.tsx` -- `window.KernelConfig`, `window.KernelWidget`, `kernel-widget-root`
- `src/embed/KernelWidget.tsx` -- CSS vars `--kernel-bg`, `--kernel-radius`, `--kernel-shadow`
- `src/embed/WidgetHeader.tsx` -- CSS var references
- `src/embed/WidgetTheme.tsx` -- CSS var names
- `src/embed/types.ts` -- `KernelWidgetConfig` interface name
- `supabase/functions/create-checkout/index.ts` -- fallback origin `kernel-voice.lovable.app`
- `supabase/functions/customer-portal/index.ts` -- fallback origin `kernel-voice.lovable.app`

**Action:** Update all user-facing strings to "ƷBI Voice". Internal code identifiers (interface names, CSS variables, file names) can remain as-is per the original plan, but user-facing text like the VAPI assistant name and SEO titles must be fixed.

---

## 2. Security Issues (High Priority)

From the database linter:

### 2a. Overly Permissive RLS Policy
The `widget_analytics` table has an INSERT policy with `WITH CHECK (true)`, allowing anyone to insert arbitrary analytics data. This should be scoped to the edge function or authenticated users.

### 2b. Extension in Public Schema
The `vector` extension is installed in the `public` schema. Best practice is to move it to a dedicated `extensions` schema to reduce attack surface.

### 2c. Leaked Password Protection Disabled
Password leak detection is currently off. Enable it to prevent users from using known compromised passwords.

---

## 3. useVoiceAssistant Hook -- Too Large (Medium Priority)

At 597 lines, this hook manages auth, conversation state, voice connections for 3 providers, text messaging, guest mode, and tool calls. It's the single largest source of complexity.

**Refactoring approach:**
- Extract `useAuthState` hook (auth check + session management, ~30 lines)
- Extract `useConversationManager` hook (conversation ID/title, auto-load last conversation, ~40 lines)  
- Extract `useProviderSwitch` hook (provider selection logic, computing `isConnected`, `connectionError`, etc. from active provider, ~80 lines)
- Keep `useVoiceAssistant` as a thin orchestrator that composes these hooks

---

## 4. Duplicated Auth State Checks (Medium Priority)

Multiple hooks independently call `supabase.auth.getUser()` and subscribe to `onAuthStateChange`:
- `useVoiceAssistant.ts`
- `useSubscription.ts`
- `useUserFeatures.ts`
- `useUserRole.ts`
- `Profile.tsx`

**Refactoring approach:** Create a shared `AuthProvider` context at the app root that provides `user`, `session`, and `isAuthenticated`. All hooks and components consume from this single source instead of each making their own auth calls.

---

## 5. Provider-Specific Logic Duplication (Medium Priority)

In `useVoiceAssistant`, the pattern of selecting between 3 providers is repeated ~12 times:

```typescript
const connectionError = voiceProvider === 'openai' 
  ? openaiConversation.connectionError 
  : voiceProvider === 'vapi'
    ? vapiConversation.connectionError
    : null;
```

**Refactoring approach:** All three conversation hooks already share the same return shape. Create a `getActiveConversation()` utility or store the active conversation object directly, eliminating the ternary chains.

---

## 6. Stale Ref Pattern Overuse (Low-Medium Priority)

`useVoiceAssistant` uses 8+ refs to mirror state for stable callbacks. This is a code smell indicating the callbacks depend on too many values.

**Refactoring approach:** Using `useRef` for the active provider conversation object and `useCallback` with proper dependencies would eliminate most of these. The provider switch extraction (item 3) naturally resolves this.

---

## 7. Missing Error Boundaries on Routes (Low Priority)

Only the voice interface has a `VoiceErrorBoundary`. Other pages (admin, profile, pricing) have no error boundaries and would show a blank screen on crash.

**Refactoring approach:** Add a top-level error boundary in `App.tsx` wrapping all routes.

---

## 8. Inconsistent Toast Usage (Low Priority)

The app uses two toast systems simultaneously:
- `@/hooks/use-toast` (Radix-based, used in hooks)
- `sonner` (used in `Profile.tsx`)

**Refactoring approach:** Standardize on one. Sonner is simpler; migrate the remaining `useToast` calls, or vice versa.

---

## 9. Missing Route Protection (Medium Priority)

Protected pages like `/profile` do their own auth check and redirect. Admin pages use `AdminGuard`. There is no unified route protection layer.

**Refactoring approach:** Create a `ProtectedRoute` wrapper component that handles auth checking and redirects, used in the router definition. This removes auth boilerplate from individual pages.

---

## 10. Build Version Hardcoded (Low Priority)

`useOpenAIConversation.ts` has `const BUILD_VERSION = '2024-12-22-v1'` hardcoded. This is stale and not useful.

**Action:** Remove or replace with `import.meta.env.VITE_BUILD_TIME` injected at build time.

---

## Implementation Priority Order

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Fix remaining "Kernel" references (#1) | Small |
| 2 | Fix security issues (#2) | Small |
| 3 | Create AuthProvider context (#4) | Medium |
| 4 | Create ProtectedRoute wrapper (#9) | Small |
| 5 | Extract sub-hooks from useVoiceAssistant (#3, #5, #6) | Large |
| 6 | Add top-level error boundary (#7) | Small |
| 7 | Standardize toast library (#8) | Small |
| 8 | Remove stale build version (#10) | Trivial |
