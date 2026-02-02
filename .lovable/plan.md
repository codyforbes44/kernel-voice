
# Plan: Make OpenAI Default Provider with ElevenLabs as Upgrade Feature

## Overview
This plan changes OpenAI to be the default voice provider while making ElevenLabs an optional premium feature that admins can assign to registered users. This involves database changes, a new user features system, UI updates to the voice provider selector, and admin panel enhancements.

## Architecture

The implementation introduces a **user_features** table to track optional feature upgrades per user. The voice provider selector will check if the current user has the ElevenLabs feature enabled before showing it as an option.

```text
+------------------+     +------------------+     +-------------------+
|    profiles      |     |   user_features  |     |   user_roles      |
|------------------|     |------------------|     |-------------------|
| voice_provider   |<--->| user_id          |<--->| user_id           |
| (default:openai) |     | feature_key      |     | role              |
+------------------+     | enabled          |     +-------------------+
                         | granted_by       |
                         | granted_at       |
                         +------------------+
```

## Changes Required

### 1. Database Migration
Create a new `user_features` table and update defaults:
- Create `user_features` table with columns: `id`, `user_id`, `feature_key`, `enabled`, `granted_by`, `granted_at`, `revoked_at`, `metadata`
- Add RLS policies allowing users to view their features and admins to manage all features
- Update `profiles.voice_provider` default from `'elevenlabs'` to `'openai'`

### 2. New Hook: useUserFeatures
Create `src/hooks/useUserFeatures.ts`:
- Check if current user has specific features enabled
- Cache results with React Query for performance
- Return `hasFeature(featureKey)` helper function
- Provide loading state for UI gating

### 3. Voice Provider Selector Updates
Modify `src/components/voice/VoiceProviderSelector.tsx`:
- Import and use `useUserFeatures` hook
- Show ElevenLabs option only if user has `elevenlabs_voice` feature
- Display an "Upgrade" badge/prompt for users without access
- Keep OpenAI always available as the default

### 4. Voice Provider Preference Hook Updates
Modify `src/hooks/useVoiceProviderPreference.ts`:
- Ensure default state is `'openai'` (already done)
- Add validation that user has access to selected provider
- Fallback to OpenAI if user selects ElevenLabs without access

### 5. Admin Operations Edge Function Updates
Modify `supabase/functions/admin-operations/index.ts`:
- Add new actions: `grantFeature`, `revokeFeature`, `listUserFeatures`
- Enable admins to assign/remove ElevenLabs access per user
- Log feature changes in audit log

### 6. Admin Users Page Updates
Modify `src/pages/admin/Users.tsx`:
- Add a "Features" column showing assigned features (badge icons)
- Fetch user features alongside roles

### 7. User Detail Drawer Updates
Modify `src/components/admin/UserDetailDrawer.tsx`:
- Add "Feature Upgrades" section with toggle switches
- Toggle switch for ElevenLabs access
- Show who granted the feature and when

### 8. Provider Info Display Updates
Modify `src/components/voice/voiceTypes.ts`:
- Mark ElevenLabs as a premium feature in `providerInfo`
- Add `isPremium: true` flag for feature gating

### 9. Voice Session Edge Function Updates
Modify `supabase/functions/voice-session/index.ts`:
- Add optional authentication check
- Validate user has `elevenlabs_voice` feature before issuing tokens
- Return appropriate error if user lacks access

## Technical Details

### Database Schema for user_features

```sql
CREATE TABLE public.user_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

-- Users can view their own features
CREATE POLICY "Users can view own features"
ON public.user_features FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all features
CREATE POLICY "Admins can manage features"
ON public.user_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles default
ALTER TABLE public.profiles 
ALTER COLUMN voice_provider SET DEFAULT 'openai';
```

### Feature Keys
- `elevenlabs_voice` - Access to ElevenLabs voice provider
- Future: `priority_support`, `extended_history`, etc.

### Voice Provider Selector Logic

```typescript
const { hasFeature, loading: featuresLoading } = useUserFeatures();

const availableProviders = useMemo(() => {
  const providers: VoiceProvider[] = ['openai'];
  
  if (hasFeature('elevenlabs_voice')) {
    providers.push('elevenlabs');
  }
  
  return providers;
}, [hasFeature]);
```

### Admin User Management Flow

1. Admin opens User Management page
2. Clicks on a user row to open detail drawer
3. Sees "Feature Upgrades" section with available features
4. Toggles "Premium Voice (ElevenLabs)" switch on
5. System calls `admin-operations` edge function with `grantFeature` action
6. Feature is recorded in `user_features` table
7. User can now select ElevenLabs in voice settings

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx_user_features.sql` | Create | New user_features table and policies |
| `src/hooks/useUserFeatures.ts` | Create | Hook to check user's enabled features |
| `src/components/voice/VoiceProviderSelector.tsx` | Modify | Gate ElevenLabs behind feature flag |
| `src/components/voice/voiceTypes.ts` | Modify | Add isPremium flag to provider info |
| `src/hooks/useVoiceProviderPreference.ts` | Modify | Validate provider access on selection |
| `supabase/functions/admin-operations/index.ts` | Modify | Add feature grant/revoke actions |
| `supabase/functions/voice-session/index.ts` | Modify | Validate feature access before issuing tokens |
| `src/pages/admin/Users.tsx` | Modify | Show feature status in user list |
| `src/components/admin/UserDetailDrawer.tsx` | Modify | Add feature toggle UI |

## User Experience

### For Regular Users
- OpenAI is the default and always available
- ElevenLabs option only appears if admin has granted access
- If ElevenLabs was previously selected but access is revoked, gracefully fallback to OpenAI
- Clear messaging when provider is unavailable

### For Admins
- Can see which users have ElevenLabs access at a glance (badge in user list)
- Simple toggle to grant/revoke access in user detail drawer
- Audit trail of who granted access and when
- Feature changes logged in admin audit log

## Security Considerations
- Feature checks happen both client-side (UI) and server-side (edge functions)
- The `voice-session` edge function validates user has ElevenLabs feature before issuing tokens
- RLS policies ensure users cannot grant themselves features
- Only admins can insert/update/delete in `user_features` table
- All feature changes are logged in `admin_audit_log`
