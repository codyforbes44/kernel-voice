// Stripe Price IDs for ƷBI subscriptions (new dual-track pricing)
export const STRIPE_PRICES = {
  PERSONAL_MONTHLY: 'price_1TSrmF2MfT7OzvjxoujydZFp',
  BUILDER_MONTHLY: 'price_1TSrmf2MfT7Ozvjx9ips4m4f',
  TEAM_MONTHLY: 'price_1TSrmw2MfT7OzvjxoOB6YFeX',

  // Annual prices (20% off vs monthly), attached to the same products as monthly
  PERSONAL_ANNUAL: 'price_1TSs0Q2MfT7Ozvjx9f5VgwZC',
  BUILDER_ANNUAL: 'price_1TSs0p2MfT7OzvjxX5Sl7kyN',
  TEAM_ANNUAL: 'price_1TSs142MfT7OzvjxWjx6du7J',

  // Legacy aliases — preserve old import paths during transition.
  STARTER_MONTHLY: 'price_1TSrmF2MfT7OzvjxoujydZFp', // -> Personal
  PLUS_MONTHLY: 'price_1TSrmf2MfT7Ozvjx9ips4m4f',    // -> Builder
  PRO_MONTHLY: 'price_1TSrmw2MfT7OzvjxoOB6YFeX',     // -> Team
} as const;

// Stripe Product IDs
export const STRIPE_PRODUCTS = {
  ZBI_PERSONAL: 'prod_URlIFkFpwZfnGn',
  ZBI_BUILDER: 'prod_URlJPqfUA52R5A',
  ZBI_TEAM: 'prod_URlJGBlQWMjWmR',

  // Legacy aliases
  KERNEL_STARTER: 'prod_URlIFkFpwZfnGn',
  KERNEL_PLUS: 'prod_URlJPqfUA52R5A',
  KERNEL_PRO: 'prod_URlJGBlQWMjWmR',
} as const;

// Legacy product IDs from previous pricing structure — kept so existing
// subscribers continue resolving to a known tier via `getTierName`.
const LEGACY_PRODUCT_IDS = {
  STARTER: 'prod_Txeqgboqm2OQh6',
  PLUS: 'prod_TxeqNEggefCFi8',
  PRO: 'prod_TxeqCb8U1jeGEN',
} as const;

// All paid product IDs for subscription checking
export const PAID_PRODUCT_IDS = [
  STRIPE_PRODUCTS.ZBI_PERSONAL,
  STRIPE_PRODUCTS.ZBI_BUILDER,
  STRIPE_PRODUCTS.ZBI_TEAM,
  LEGACY_PRODUCT_IDS.STARTER,
  LEGACY_PRODUCT_IDS.PLUS,
  LEGACY_PRODUCT_IDS.PRO,
] as const;

// Backward compat alias
export const PRO_PRODUCT_IDS = PAID_PRODUCT_IDS;

// Premium = anything paid (unlocks ElevenLabs voices, advanced customization)
export const PREMIUM_PRODUCT_IDS = [
  STRIPE_PRODUCTS.ZBI_PERSONAL,
  STRIPE_PRODUCTS.ZBI_BUILDER,
  STRIPE_PRODUCTS.ZBI_TEAM,
  LEGACY_PRODUCT_IDS.PLUS,
  LEGACY_PRODUCT_IDS.PRO,
] as const;

// Builder-or-above = unlocks widgets, knowledge base, API
export const BUILDER_PRODUCT_IDS = [
  STRIPE_PRODUCTS.ZBI_BUILDER,
  STRIPE_PRODUCTS.ZBI_TEAM,
  LEGACY_PRODUCT_IDS.PRO,
] as const;

// Legacy alias for ElevenLabs gating call sites
export const PLUS_PRODUCT_IDS = PREMIUM_PRODUCT_IDS;

export type StripePriceId = typeof STRIPE_PRICES[keyof typeof STRIPE_PRICES];
export type StripeProductId = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];

export type TierName = 'free' | 'personal' | 'builder' | 'team';

export function getTierName(productId: string | null): TierName | null {
  if (!productId) return null;
  switch (productId) {
    case STRIPE_PRODUCTS.ZBI_PERSONAL:
    case LEGACY_PRODUCT_IDS.STARTER:
      return 'personal';
    case STRIPE_PRODUCTS.ZBI_BUILDER:
    case LEGACY_PRODUCT_IDS.PLUS:
      return 'builder';
    case STRIPE_PRODUCTS.ZBI_TEAM:
    case LEGACY_PRODUCT_IDS.PRO:
      return 'team';
    default:
      return null;
  }
}

// Pricing information for display
export const PRICING_INFO = {
  free: {
    priceId: null,
    productId: null,
    amount: 0,
    interval: 'month' as const,
    label: 'Free',
  },
  personal: {
    priceId: STRIPE_PRICES.PERSONAL_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_PERSONAL,
    amount: 9,
    interval: 'month' as const,
    label: 'Personal',
  },
  builder: {
    priceId: STRIPE_PRICES.BUILDER_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_BUILDER,
    amount: 29,
    interval: 'month' as const,
    label: 'Builder',
  },
  team: {
    priceId: STRIPE_PRICES.TEAM_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_TEAM,
    amount: 99,
    interval: 'month' as const,
    label: 'Team',
  },

  // Legacy keys preserved so older imports don't break.
  starter: {
    priceId: STRIPE_PRICES.PERSONAL_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_PERSONAL,
    amount: 9,
    interval: 'month' as const,
    label: 'Personal',
  },
  plus: {
    priceId: STRIPE_PRICES.BUILDER_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_BUILDER,
    amount: 29,
    interval: 'month' as const,
    label: 'Builder',
  },
  pro: {
    priceId: STRIPE_PRICES.TEAM_MONTHLY,
    productId: STRIPE_PRODUCTS.ZBI_TEAM,
    amount: 99,
    interval: 'month' as const,
    label: 'Team',
  },
} as const;

export type BillingInterval = 'month' | 'year';

/**
 * Resolve the Stripe price ID for a paid tier at the given billing interval.
 * Returns null for the free tier or unknown tiers.
 */
export function getPriceId(
  tier: TierName | null,
  interval: BillingInterval,
): string | null {
  if (!tier || tier === 'free') return null;
  const map: Record<Exclude<TierName, 'free'>, Record<BillingInterval, string>> = {
    personal: {
      month: STRIPE_PRICES.PERSONAL_MONTHLY,
      year: STRIPE_PRICES.PERSONAL_ANNUAL,
    },
    builder: {
      month: STRIPE_PRICES.BUILDER_MONTHLY,
      year: STRIPE_PRICES.BUILDER_ANNUAL,
    },
    team: {
      month: STRIPE_PRICES.TEAM_MONTHLY,
      year: STRIPE_PRICES.TEAM_ANNUAL,
    },
  };
  return map[tier][interval];
}
