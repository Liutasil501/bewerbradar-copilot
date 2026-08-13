import {
  isPaidSubscriptionStatus,
  resolvePlanFromPriceId,
} from '@/lib/stripe/config';
import { sanitizePaywallTrigger, sanitizeReturnIntent, type ReturnIntent, type PaywallTrigger } from './schema';

export interface StripeSessionForVerify {
  mode: string;
  customer?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string | undefined>;
}

export interface StripeSubscriptionForVerify {
  status: string;
  items: {
    data: Array<{
      price: {
        id: string;
      };
    }>;
  };
  current_period_end?: number;
}

export interface UserForVerify {
  id: string;
  stripeCustomerId?: string | null;
}

export type VerificationResult =
  | {
      verified: true;
      plan: 'pro' | 'premium';
      tier: 'pro' | 'premium';
      billingPeriod: 'monthly' | 'yearly';
      trigger: PaywallTrigger;
      returnIntent?: ReturnIntent;
      subscriptionId: string;
      priceId: string;
      status: string;
      customerId?: string;
    }
  | {
      verified: false;
      error: string;
      status?: string;
    };

export function verifyStripeSubscriptionSession(
  user: UserForVerify,
  session: StripeSessionForVerify,
  subscription: StripeSubscriptionForVerify
): VerificationResult {
  // 1. Ownership check: metadata.userId MUST match user.id AND (if customer exists) customer MUST match user.stripeCustomerId
  const metadataUserIdMatch = session.metadata?.userId === user.id;
  const customerMatch = !user.stripeCustomerId || !session.customer || session.customer === user.stripeCustomerId;

  if (!metadataUserIdMatch || !customerMatch) {
    return { verified: false, error: 'Session ownership mismatch' };
  }

  // 2. Mode check: Session MUST be subscription mode with a valid subscription ID
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  if (session.mode !== 'subscription' || !subscriptionId) {
    return { verified: false, error: 'Not a valid subscription session' };
  }

  // 3. Active Subscription Status check
  if (!isPaidSubscriptionStatus(subscription.status)) {
    return { verified: false, status: subscription.status, error: 'Subscription is not active' };
  }

  // 4. Strict Price Mapping Check: Fail closed on unknown prices!
  const priceId = subscription.items.data[0]?.price?.id;
  const subPlan = resolvePlanFromPriceId(priceId);

  if (!subPlan || !priceId) {
    return { verified: false, error: 'Unknown or unconfigured price ID' };
  }

  const trigger = sanitizePaywallTrigger(session.metadata?.trigger);
  const returnIntent = sanitizeReturnIntent(session.metadata?.returnIntentJson);
  const billingPeriod: 'monthly' | 'yearly' = session.metadata?.plan === 'yearly' ? 'yearly' : 'monthly';

  return {
    verified: true,
    plan: subPlan,
    tier: subPlan,
    billingPeriod,
    trigger,
    returnIntent,
    subscriptionId,
    priceId,
    status: subscription.status,
    customerId: session.customer || undefined,
  };
}
