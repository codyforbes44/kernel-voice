
# Update Pricing to 3-Tier Structure

Migrate from the current Free/Pro two-tier model to a three-tier paid model: Starter ($4.95), Plus ($14.95), and Pro ($29.95) per month.

## New Stripe Products Created

| Tier | Product ID | Price ID | Monthly |
|------|-----------|----------|---------|
| Starter | `prod_Txeqgboqm2OQh6` | `price_1SzjX72MfT7OzvjxyqWpTfXN` | $4.95 |
| Plus | `prod_TxeqNEggefCFi8` | `price_1SzjX72MfT7OzvjxYrQnQ8xP` | $14.95 |
| Pro | `prod_TxeqCb8U1jeGEN` | `price_1SzjX82MfT7Ozvjx9Oc4THYA` | $29.95 |

## Tier Features

**Starter -- $4.95/mo**
- 3BI Voice Assistant
- Basic conversation history (7 days)
- Standard voice quality
- Community support

**Plus -- $14.95/mo** (Most Popular)
- Everything in Starter
- Premium ElevenLabs voices
- Extended conversation history (30 days)
- Advanced voice customization
- Priority response quality
- Email support

**Pro -- $29.95/mo**
- Everything in Plus
- Gemini Live and OpenAI Realtime providers
- Unlimited conversation history
- Custom agent personalities
- Priority support
- Early access to new features
- API access

## Files Changed

| File | Change |
|------|--------|
| `src/lib/stripe.ts` | Replace old 2-tier product/price constants with 3-tier (Starter, Plus, Pro); remove yearly pricing; update `PRO_PRODUCT_IDS` to include all 3 paid tiers; update `PRICING_INFO` |
| `src/pages/Pricing.tsx` | Rewrite to show 3 pricing cards in a 3-column grid; remove the monthly/yearly toggle; update feature lists and card logic |
| `src/components/subscription/PricingCard.tsx` | No structural changes needed -- already supports all required props |
| `src/hooks/useSubscription.ts` | Update `isSubscribed` check to match any of the 3 new product IDs; add a `tierName` derived field (starter/plus/pro) |
| `src/hooks/useUserFeatures.ts` | Update `hasFeature` to gate `elevenlabs_voice` on Plus or Pro tiers only (not Starter) |
| `src/components/subscription/UpgradeBanner.tsx` | Update copy from "ƷBI Voice Pro" to "Kernel Plus" / generic upgrade messaging |
| `src/components/subscription/UpgradeButton.tsx` | Update default `priceId` to Starter; update button label |

## Key Behavior Changes

- Any paid subscription (Starter, Plus, or Pro) counts as "subscribed"
- ElevenLabs premium voices require Plus or Pro (not Starter)
- The yearly billing toggle is removed for now (only monthly pricing)
- The `check-subscription` and `create-checkout` edge functions require no changes -- they already work with any Stripe price ID and return the product ID dynamically

## No Database Changes Required
