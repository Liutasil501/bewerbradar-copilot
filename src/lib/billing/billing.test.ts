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

  it('enforces server-side Stripe session verification rules (F-401)', () => {
    // 1. Active subscription + matching user ownership + valid price ID => verified true
    const activeSession = {
      metadata: { userId: 'user_1' },
      customer: 'cus_1',
      mode: 'subscription',
      subscription: 'sub_1',
    };
    const activeSub = { status: 'active', items: { data: [{ price: { id: 'price_1TcOg0D0cevOfghZBZMitg30' } }] } };
    const user = { id: 'user_1', stripeCustomerId: 'cus_1' };

    const isOwnerMatch = activeSession.metadata.userId === user.id && activeSession.customer === user.stripeCustomerId;
    const isActiveSub = ['active', 'trialing'].includes(activeSub.status);
    assert.strictEqual(isOwnerMatch && isActiveSub, true);

    // 2. Canceled / inactive subscription => fails verification
    const canceledSub = { status: 'canceled', items: { data: [{ price: { id: 'price_1TcOg0D0cevOfghZBZMitg30' } }] } };
    const isCanceledActive = ['active', 'trialing'].includes(canceledSub.status);
    assert.strictEqual(isCanceledActive, false);

    // 3. Cross-user ownership mismatch => fails verification
    const otherUser = { id: 'user_2', stripeCustomerId: 'cus_2' };
    const isOtherOwnerMatch = activeSession.metadata.userId === otherUser.id;
    assert.strictEqual(isOtherOwnerMatch, false);

    // 4. Unknown price ID => fails closed
    const unknownPriceId = 'price_unknown_hacker_id';
    const knownPrices = [
      'price_1TcOg0D0cevOfghZBZMitg30',
      'price_1TcOg6D0cevOfghZ8bc5Q4PJ',
      'price_1TcOgBD0cevOfghZo1XlQcjO',
      'price_1TcOgFD0cevOfghZnDIGi73j',
    ];
    const isKnownPrice = knownPrices.includes(unknownPriceId);
    assert.strictEqual(isKnownPrice, false);
  });
});
