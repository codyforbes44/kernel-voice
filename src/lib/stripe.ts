// Stripe Price IDs for Kernel subscriptions
export const STRIPE_PRICES = {
  STARTER_MONTHLY: 'price_1SzjX72MfT7OzvjxyqWpTfXN',
  PLUS_MONTHLY: 'price_1SzjX72MfT7OzvjxYrQnQ8xP',
  PRO_MONTHLY: 'price_1SzjX82MfT7Ozvjx9Oc4THYA',
} as const;

// Stripe Product IDs
export const STRIPE_PRODUCTS = {
  KERNEL_STARTER: 'prod_Txeqgboqm2OQh6',
  KERNEL_PLUS: 'prod_TxeqNEggefCFi8',
  KERNEL_PRO: 'prod_TxeqCb8U1jeGEN',
} as const;

// All paid product IDs for subscription checking
export const PAID_PRODUCT_IDS = [
  STRIPE_PRODUCTS.KERNEL_STARTER,
  STRIPE_PRODUCTS.KERNEL_PLUS,
  STRIPE_PRODUCTS.KERNEL_PRO,
] as const;

// Keep backward compat alias
export const PRO_PRODUCT_IDS = PAID_PRODUCT_IDS;

// Plus-or-above product IDs (for ElevenLabs gating)
export const PLUS_PRODUCT_IDS = [
  STRIPE_PRODUCTS.KERNEL_PLUS,
  STRIPE_PRODUCTS.KERNEL_PRO,
] as const;

export type StripePriceId = typeof STRIPE_PRICES[keyof typeof STRIPE_PRICES];
export type StripeProductId = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];

export type TierName = 'starter' | 'plus' | 'pro';

export function getTierName(productId: string | null): TierName | null {
  switch (productId) {
    case STRIPE_PRODUCTS.KERNEL_STARTER: return 'starter';
    case STRIPE_PRODUCTS.KERNEL_PLUS: return 'plus';
    case STRIPE_PRODUCTS.KERNEL_PRO: return 'pro';
    default: return null;
  }
}

// Pricing information for display
export const PRICING_INFO = {
  starter: {
    priceId: STRIPE_PRICES.STARTER_MONTHLY,
    productId: STRIPE_PRODUCTS.KERNEL_STARTER,
    amount: 4.95,
    interval: 'month' as const,
    label: 'Starter',
  },
  plus: {
    priceId: STRIPE_PRICES.PLUS_MONTHLY,
    productId: STRIPE_PRODUCTS.KERNEL_PLUS,
    amount: 14.95,
    interval: 'month' as const,
    label: 'Plus',
  },
  pro: {
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    productId: STRIPE_PRODUCTS.KERNEL_PRO,
    amount: 29.95,
    interval: 'month' as const,
    label: 'Pro',
  },
} as const;
