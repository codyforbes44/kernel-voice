
# Plan: Stripe Subscription Integration for Kernel Pro

## Overview
Implement a complete Stripe subscription system that unlocks all premium features (ElevenLabs voice, credits, and future features) when users subscribe to Kernel Pro. The integration will use your existing products and prices in Stripe.

## Architecture

```text
User Flow:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Free User                     →    Clicks "Upgrade"                │
│       ↓                                    ↓                        │
│  Sees upgrade prompts          →    Redirected to Stripe Checkout  │
│       ↓                                    ↓                        │
│  Limited features              →    Completes payment               │
│                                            ↓                        │
│                                    Redirected to success page       │
│                                            ↓                        │
│                                    check-subscription called        │
│                                            ↓                        │
│                                    Premium features unlocked        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Subscription Check Flow:
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Frontend  │───→│ check-subscription│───→│   Stripe    │
│             │    │   Edge Function   │    │     API     │
└─────────────┘    └──────────────────┘    └─────────────┘
                            │
                            ↓
                   Returns: subscribed, 
                   product_id, end_date
```

## Existing Stripe Products

Your Stripe account already has these products configured:

| Product | Price ID | Amount | Interval |
|---------|----------|--------|----------|
| Kernel Pro Monthly | price_1SgV4E2MfT7Ozvjxa9RyAT59 | $19/month | Monthly |
| Kernel Pro Yearly | price_1SgV4F2MfT7OzvjxHgQYF1vC | $190/year | Yearly |

## Implementation Steps

### 1. Create Edge Functions

**a) `create-checkout` function**
- Creates a Stripe Checkout session for authenticated users
- Checks if user already has a Stripe customer record
- Redirects to Stripe's hosted checkout page

**b) `check-subscription` function**
- Verifies if user has an active Stripe subscription
- Returns subscription status, product ID, and end date
- Called on page load, after checkout, and periodically

**c) `customer-portal` function**
- Creates a Stripe Customer Portal session
- Allows users to manage billing, cancel, or upgrade plans

### 2. Create Subscription Context/Hook

Create a `useSubscription` hook that:
- Checks subscription status on login and page load
- Auto-refreshes every 60 seconds while connected
- Provides `isSubscribed`, `subscriptionTier`, `subscriptionEnd`
- Integrates with existing `useUserFeatures` for feature checks

### 3. Create Pricing/Subscription Page

New `/pricing` or `/subscribe` page with:
- Plan comparison (Free vs Pro)
- Monthly/yearly toggle
- Feature list highlighting what's included
- Upgrade buttons that trigger checkout

### 4. Update Feature Gating

Modify `useUserFeatures` to also check subscription status:
- If subscribed to Pro → all premium features enabled
- If not subscribed → use existing `user_features` table for admin-granted features

### 5. Add Upgrade Prompts

Show upgrade CTAs in relevant places:
- Voice provider selector (when trying to select ElevenLabs)
- Settings panel
- Optional: in-app banner for free users

### 6. Create Success/Cancel Pages

- `/subscription-success`: Thank you page with confirmation
- `/subscription-canceled`: Encourage to try again later

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/create-checkout/index.ts` | Create | Stripe checkout session creation |
| `supabase/functions/check-subscription/index.ts` | Create | Subscription status verification |
| `supabase/functions/customer-portal/index.ts` | Create | Billing management portal |
| `src/hooks/useSubscription.ts` | Create | Subscription state management |
| `src/hooks/useUserFeatures.ts` | Modify | Integrate subscription check |
| `src/pages/Pricing.tsx` | Create | Pricing page with plan comparison |
| `src/pages/SubscriptionSuccess.tsx` | Create | Post-checkout success page |
| `src/components/subscription/UpgradeButton.tsx` | Create | Reusable upgrade CTA component |
| `src/components/subscription/PricingCard.tsx` | Create | Plan display card component |
| `src/components/voice/VoiceProviderSelector.tsx` | Modify | Add upgrade prompt for ElevenLabs |
| `src/App.tsx` | Modify | Add new routes |
| `supabase/config.toml` | Modify | Add new function configs |

## Technical Details

### Price IDs Configuration
```typescript
// src/lib/stripe.ts
export const STRIPE_PRICES = {
  PRO_MONTHLY: 'price_1SgV4E2MfT7Ozvjxa9RyAT59',
  PRO_YEARLY: 'price_1SgV4F2MfT7OzvjxHgQYF1vC',
} as const;

export const STRIPE_PRODUCTS = {
  KERNEL_PRO_MONTHLY: 'prod_TdmdVkA3JmKFhQ',
  KERNEL_PRO_YEARLY: 'prod_Tdmd0XQ3F3Lhx9',
} as const;
```

### Subscription Hook Interface
```typescript
interface UseSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  refetch: () => void;
}
```

### Feature Access Logic
```typescript
// Combined check: subscription OR admin-granted feature
const hasPremiumVoice = isSubscribed || hasFeature('elevenlabs_voice');
```

## User Experience

### Free Users
- Can use 3ʙɪ voice provider (included)
- See "Pro" badges on premium features
- See pricing prompts in relevant locations

### Pro Subscribers
- Full access to ElevenLabs premium voice
- All current and future Pro features
- Can manage billing via Stripe portal
- See subscription status in profile/settings

## Security Considerations

1. **Server-side verification**: Subscription status is always verified via edge function, never trusted from client
2. **JWT validation**: All edge functions validate the user's JWT before proceeding
3. **No webhooks needed**: Using polling approach per your existing architecture
4. **Customer email matching**: Uses authenticated user's email to find Stripe customer

## Notes

- The Stripe secret key is already configured as `STRIPE_SECRET_KEY`
- No webhooks are used - subscription status is checked on-demand
- The monthly price is $19 and yearly is $190 (save ~17%)
- Portal must be activated in Stripe dashboard before users can manage subscriptions
