import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizePaywallTrigger,
  sanitizeReturnIntent,
  CheckoutInputSchema,
  ReturnIntentSchema,
} from './schema';
import {
  setPendingCheckoutIntent,
  consumePendingCheckoutIntent,
  clearPendingCheckoutIntent,
} from './pending-intent';
import { verifyStripeSubscriptionSession } from './verify';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

// Mock sessionStorage for Node environment test runner
if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as unknown as Record<string, unknown>).sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('Billing Schema, Sanitizers & Pending Intent Logic (F-405, F-404)', () => {
  it('sanitizes paywall triggers against closed allowlists', () => {
    assert.strictEqual(sanitizePaywallTrigger('export_paid_format'), 'export_paid_format');
    assert.strictEqual(sanitizePaywallTrigger('resume_limit'), 'resume_limit');
    assert.strictEqual(sanitizePaywallTrigger('trial_used'), 'trial_used');
    assert.strictEqual(sanitizePaywallTrigger('paid_template'), 'paid_template');
    assert.strictEqual(sanitizePaywallTrigger('public_share'), 'public_share');
    assert.strictEqual(sanitizePaywallTrigger('premium_ai_feature'), 'premium_ai_feature');
    assert.strictEqual(sanitizePaywallTrigger('malicious_string'), 'unknown');
    assert.strictEqual(sanitizePaywallTrigger(null), 'unknown');
    assert.strictEqual(sanitizePaywallTrigger(123), 'unknown');
  });

  it('validates return intents strictly', () => {
    const valid = {
      type: 'export' as const,
      format: 'pdf' as const,
      resumeId: 'res_123',
    };
    assert.strictEqual(ReturnIntentSchema.safeParse(valid).success, true);
    assert.deepStrictEqual(sanitizeReturnIntent(valid), valid);
    assert.deepStrictEqual(sanitizeReturnIntent(JSON.stringify(valid)), valid);

    const invalidType = { type: 'hack_database' };
    assert.strictEqual(ReturnIntentSchema.safeParse(invalidType).success, false);
    assert.strictEqual(sanitizeReturnIntent(invalidType), undefined);
  });

  it('validates checkout input schema strictly', () => {
    const valid = {
      tier: 'pro' as const,
      plan: 'monthly' as const,
      trigger: 'export_paid_format' as const,
      locale: 'de' as const,
    };
    assert.strictEqual(CheckoutInputSchema.safeParse(valid).success, true);

    const invalidTier = {
      tier: 'admin_god_mode',
      plan: 'monthly',
    };
    assert.strictEqual(CheckoutInputSchema.safeParse(invalidTier).success, false);
  });

  it('matches pending checkout intents accurately and prevents false events (F-404)', () => {
    clearPendingCheckoutIntent();

    setPendingCheckoutIntent(
      { type: 'ai_feature', featureKey: 'cover_letter', resumeId: 'res_1' },
      'premium_ai_feature'
    );

    // Mismatched action type should fail and NOT consume
    assert.strictEqual(consumePendingCheckoutIntent('export'), false);

    // Mismatched feature key should fail and NOT consume
    assert.strictEqual(consumePendingCheckoutIntent('ai_feature', 'grammar_check'), false);

    // Matching action type AND feature key should succeed and consume
    assert.strictEqual(consumePendingCheckoutIntent('ai_feature', 'cover_letter'), true);

    // Subsequent calls should fail because intent was already consumed
    assert.strictEqual(consumePendingCheckoutIntent('ai_feature', 'cover_letter'), false);
  });
});

describe('Real Production Stripe Verification Logic (F-401, F-406)', () => {
  const validUser = { id: 'usr_100', stripeCustomerId: 'cus_100' };
  const validSession = {
    mode: 'subscription',
    customer: 'cus_100',
    subscription: 'sub_100',
    metadata: { userId: 'usr_100', trigger: 'export_paid_format' },
  };
  const validSub = {
    status: 'active',
    items: {
      data: [{ price: { id: STRIPE_CONFIG.prices.pro.monthly } }],
    },
  };

  it('verifies active subscription with matching ownership and price ID', () => {
    const res = verifyStripeSubscriptionSession(validUser, validSession, validSub);
    assert.strictEqual(res.verified, true);
    if (res.verified) {
      assert.strictEqual(res.plan, 'pro');
      assert.strictEqual(res.trigger, 'export_paid_format');
    }
  });

  it('verifies trialing subscription', () => {
    const trialingSub = { ...validSub, status: 'trialing' };
    const res = verifyStripeSubscriptionSession(validUser, validSession, trialingSub);
    assert.strictEqual(res.verified, true);
  });

  it('rejects canceled or inactive subscription', () => {
    const canceledSub = { ...validSub, status: 'canceled' };
    const resCanceled = verifyStripeSubscriptionSession(validUser, validSession, canceledSub);
    assert.strictEqual(resCanceled.verified, false);
    assert.strictEqual(resCanceled.error, 'Subscription is not active');

    const pastDueSub = { ...validSub, status: 'past_due' };
    const resPastDue = verifyStripeSubscriptionSession(validUser, validSession, pastDueSub);
    assert.strictEqual(resPastDue.verified, false);
    assert.strictEqual(resPastDue.error, 'Subscription is not active');
  });

  it('rejects session with user ID mismatch', () => {
    const wrongUserSession = {
      ...validSession,
      metadata: { userId: 'usr_hacker' },
    };
    const res = verifyStripeSubscriptionSession(validUser, wrongUserSession, validSub);
    assert.strictEqual(res.verified, false);
    assert.strictEqual(res.error, 'Session ownership mismatch');
  });

  it('rejects session with Stripe customer ID mismatch', () => {
    const wrongCustomerSession = {
      ...validSession,
      customer: 'cus_hacker',
    };
    const res = verifyStripeSubscriptionSession(validUser, wrongCustomerSession, validSub);
    assert.strictEqual(res.verified, false);
    assert.strictEqual(res.error, 'Session ownership mismatch');
  });

  it('rejects session with unknown or unconfigured price ID (fails closed)', () => {
    const unknownPriceSub = {
      status: 'active',
      items: { data: [{ price: { id: 'price_unknown_hacker_price_id' } }] },
    };
    const res = verifyStripeSubscriptionSession(validUser, validSession, unknownPriceSub);
    assert.strictEqual(res.verified, false);
    assert.strictEqual(res.error, 'Unknown or unconfigured price ID');
  });
});
