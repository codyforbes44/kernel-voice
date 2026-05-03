## Audit summary

Standard authenticated (non-admin) user routes that exist in `App.tsx`:
`/`, `/assistant`, `/profile`, `/pricing`, `/faq`, `/privacy`, `/terms`, `/subscription-success` (post-checkout only).

Three nav surfaces a signed-in user touches:

1. **Header avatar dropdown** — `src/components/layout/UserMenu.tsx`
2. **Global command palette (⌘K)** — `src/components/layout/GlobalCommandPalette.tsx`
3. **Voice Assistant left sidebar** — `src/pages/VoiceAssistant.tsx` (Conversation History + Document Upload)

### Findings

**UserMenu (avatar dropdown)** — partially inaccurate for standard users:
- Shows: Profile, Admin (admin-only), Assistant, Sign Out.
- Label "Assistant" uses a `Settings` (gear) icon — misleading; it goes to `/assistant` (voice assistant), not settings.
- Missing common destinations a signed-in user expects: Home, Pricing, FAQ.
- No theme toggle entry (handy for parity with the palette).

**Global Command Palette (⌘K)** — mostly correct:
- Has Home, Assistant, Pricing, Profile, Admin (admin-only), Privacy, Terms, theme toggle, Sign in/out.
- Missing: **FAQ**.

**Voice Assistant sidebar** — accurate for its purpose (per-page tool panel: Conversations + Documents). It is gated behind `va.isAuthenticated`, which is correct. No change needed.

**Footer** — only Privacy/Terms. Acceptable as a legal footer; not in scope.

## Refactor

### 1. `src/components/layout/UserMenu.tsx`
Reorganize into clear groups for any authenticated user, using accurate icons:

- Account group: **Profile** (UserCircle), **Assistant** (Mic, not Settings)
- Browse group: **Home** (Home), **Pricing** (CreditCard), **FAQ** (HelpCircle)
- Admin group (only if `isAdmin`): **Admin Dashboard** (Shield)
- Sign out (destructive)

Use `DropdownMenuSeparator` between groups. Keep current avatar trigger and profile loading logic unchanged.

### 2. `src/components/layout/GlobalCommandPalette.tsx`
Add a single `CommandItem` for **FAQ** (HelpCircle icon) in the "Navigate" group, after Pricing. No other changes.

### 3. No changes
- `VoiceAssistant.tsx` sidebar — content matches its purpose.
- `Header.tsx`, `Footer.tsx`, `AdminSidebar.tsx` — out of scope (admin-only or correct).

## Acceptance check
After the change, a standard authenticated user can reach every public/account route they're entitled to from either the avatar menu or ⌘K, with consistent icons and labels, and no admin-only links leak.