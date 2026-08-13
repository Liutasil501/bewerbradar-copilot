export type StripePlan = 'pro' | 'premium';
export type StripeBillingPeriod = 'monthly' | 'yearly';

const developmentPrices = {
  pro: {
    monthly: 'price_1TcOg0D0cevOfghZBZMitg30',
    yearly: 'price_1TcOg6D0cevOfghZ8bc5Q4PJ',
  },
  premium: {
    monthly: 'price_1TcOgBD0cevOfghZo1XlQcjO',
    yearly: 'price_1TcOgFD0cevOfghZnDIGi73j',
  },
} as const;

const allowDevelopmentFallbacks = process.env.NODE_ENV !== 'production';

export const STRIPE_CONFIG = {
  prices: {
    pro: {
      monthly:
        process.env.STRIPE_PRICE_ID_PRO_MONTHLY ||
        (allowDevelopmentFallbacks ? developmentPrices.pro.monthly : ''),
      yearly:
        process.env.STRIPE_PRICE_ID_PRO_YEARLY ||
        (allowDevelopmentFallbacks ? developmentPrices.pro.yearly : ''),
    },
    premium: {
      monthly:
        process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY ||
        (allowDevelopmentFallbacks ? developmentPrices.premium.monthly : ''),
      yearly:
        process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY ||
        (allowDevelopmentFallbacks ? developmentPrices.premium.yearly : ''),
    },
  },
  coupons: {
    firstMonthDiscount: process.env.STRIPE_COUPON_FIRST_MONTH || '',
  },
  portalConfigurationId: process.env.STRIPE_PORTAL_CONFIGURATION_ID || '',
};

export function getConfiguredPriceId(
  plan: StripePlan,
  billingPeriod: StripeBillingPeriod
): string | null {
  return STRIPE_CONFIG.prices[plan][billingPeriod] || null;
}

export function resolvePlanFromPriceId(priceId?: string | null): StripePlan | null {
  if (!priceId) return null;

  if (
    priceId === STRIPE_CONFIG.prices.pro.monthly ||
    priceId === STRIPE_CONFIG.prices.pro.yearly
  ) {
    return 'pro';
  }

  if (
    priceId === STRIPE_CONFIG.prices.premium.monthly ||
    priceId === STRIPE_CONFIG.prices.premium.yearly
  ) {
    return 'premium';
  }

  return null;
}

export function isPaidSubscriptionStatus(status?: string | null): boolean {
  return status === 'active' || status === 'trialing';
}

export function hasCompleteStripePriceConfiguration(): boolean {
  return Object.values(STRIPE_CONFIG.prices).every((prices) =>
    Object.values(prices).every(Boolean)
  );
}
