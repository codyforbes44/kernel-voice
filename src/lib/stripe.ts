// Stripe Price IDs for Kernel Pro subscriptions
export const STRIPE_PRICES = {
  PRO_MONTHLY: 'price_1SgV4E2MfT7Ozvjxa9RyAT59',
  PRO_YEARLY: 'price_1SgV4F2MfT7OzvjxHgQYF1vC',
} as const;

// Stripe Product IDs
export const STRIPE_PRODUCTS = {
  KERNEL_PRO_MONTHLY: 'prod_TdmdVkA3JmKFhQ',
  KERNEL_PRO_YEARLY: 'prod_Tdmd0XQ3F3Lhx9',
} as const;

// All Pro product IDs for subscription checking
export const PRO_PRODUCT_IDS = [
  STRIPE_PRODUCTS.KERNEL_PRO_MONTHLY,
  STRIPE_PRODUCTS.KERNEL_PRO_YEARLY,
] as const;

export type StripePriceId = typeof STRIPE_PRICES[keyof typeof STRIPE_PRICES];
export type StripeProductId = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];

// Pricing information for display
export const PRICING_INFO = {
  monthly: {
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    productId: STRIPE_PRODUCTS.KERNEL_PRO_MONTHLY,
    amount: 19,
    interval: 'month' as const,
    label: 'Monthly',
  },
  yearly: {
    priceId: STRIPE_PRICES.PRO_YEARLY,
    productId: STRIPE_PRODUCTS.KERNEL_PRO_YEARLY,
    amount: 190,
    interval: 'year' as const,
    label: 'Yearly',
    savings: 38, // $19 * 12 = $228, save $38/year
  },
} as const;
