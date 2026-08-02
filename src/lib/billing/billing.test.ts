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
import {
  resolveCheckoutReturnPath,
  resolveTemplateContinuation,
} from './return-resolver';
import { consumePaidActionCompletion } from './completion';
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

    const templateIntent = {
      type: 'template' as const,
      templateId: 'modern',
      origin: 'dashboard_create' as const,
    };
    assert.deepStrictEqual(sanitizeReturnIntent(templateIntent), templateIntent);
    assert.strictEqual(
      ReturnIntentSchema.safeParse({ ...templateIntent, origin: 'malicious_origin' }).success,
      false
    );
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

  it('matches pending checkout intents accurately and returns stored trigger and intent (F-404)', () => {
    clearPendingCheckoutIntent();

    setPendingCheckoutIntent(
      { type: 'ai_feature', featureKey: 'cover_letter', resumeId: 'res_1' },
      'premium_ai_feature'
    );

    // Mismatched action type should fail and NOT consume
    assert.strictEqual(consumePendingCheckoutIntent('export').matched, false);

    // Mismatched feature key should fail and NOT consume
    assert.strictEqual(consumePendingCheckoutIntent('ai_feature', 'grammar_check').matched, false);

    // Matching action type AND feature key should succeed and return stored trigger
    const res = consumePendingCheckoutIntent('ai_feature', 'cover_letter');
    assert.strictEqual(res.matched, true);
    assert.strictEqual(res.trigger, 'premium_ai_feature');
    assert.strictEqual(res.intent?.type, 'ai_feature');

    // Subsequent calls should fail because intent was already consumed
    assert.strictEqual(consumePendingCheckoutIntent('ai_feature', 'cover_letter').matched, false);
  });

  it('matches template origin before consuming a pending intent', () => {
    clearPendingCheckoutIntent();
    setPendingCheckoutIntent(
      {
        type: 'template',
        templateId: 'modern',
        origin: 'dashboard_import',
      },
      'paid_template'
    );

    assert.strictEqual(
      consumePendingCheckoutIntent('template', undefined, 'gallery').matched,
      false
    );
    assert.strictEqual(
      consumePendingCheckoutIntent('template', undefined, 'dashboard_import').matched,
      true
    );
  });
});

describe('Checkout Return Destination Resolver (F-403, F-406)', () => {
  it('routes returns with resumeId directly to editor', () => {
    assert.strictEqual(
      resolveCheckoutReturnPath('de', { type: 'export', format: 'pdf', resumeId: 'res_999' }),
      '/de/editor/res_999'
    );
    assert.strictEqual(
      resolveCheckoutReturnPath('en', { type: 'ai_feature', featureKey: 'cover_letter', resumeId: 'res_888' }),
      '/en/editor/res_888'
    );
  });

  it('routes template gallery returns and dashboard intents through dashboard for verification', () => {
    assert.strictEqual(
      resolveCheckoutReturnPath('de', {
        type: 'template',
        templateId: 'modern',
        origin: 'gallery',
      }),
      '/de/dashboard'
    );
    assert.strictEqual(
      resolveCheckoutReturnPath('en', { type: 'dashboard_create' }),
      '/en/dashboard'
    );
    assert.strictEqual(
      resolveCheckoutReturnPath('de', { type: 'dashboard_import' }),
      '/de/dashboard'
    );
    assert.strictEqual(
      resolveCheckoutReturnPath('de', { type: 'dashboard_duplicate', resumeId: 'res_123' }),
      '/de/dashboard'
    );
  });

  it('resolves every template origin without changing the intended action', () => {
    assert.deepStrictEqual(
      resolveTemplateContinuation({
        type: 'template',
        templateId: 'modern',
        origin: 'gallery',
      }),
      { origin: 'gallery', templateId: 'modern' }
    );
    assert.deepStrictEqual(
      resolveTemplateContinuation({
        type: 'template',
        templateId: 'modern',
        origin: 'dashboard_create',
      }),
      { origin: 'dashboard_create', templateId: 'modern' }
    );
    assert.deepStrictEqual(
      resolveTemplateContinuation({
        type: 'template',
        templateId: 'modern',
        origin: 'dashboard_import',
      }),
      { origin: 'dashboard_import', templateId: 'modern' }
    );
    assert.deepStrictEqual(
      resolveTemplateContinuation({
        type: 'template',
        templateId: 'modern',
        origin: 'editor',
        resumeId: 'res_123',
      }),
      { origin: 'editor', templateId: 'modern', resumeId: 'res_123' }
    );
    assert.strictEqual(
      resolveTemplateContinuation({
        type: 'template',
        templateId: 'modern',
        origin: 'editor',
      }),
      null
    );
    assert.strictEqual(
      resolveCheckoutReturnPath('de', {
        type: 'template',
        templateId: 'modern',
        origin: 'editor',
        resumeId: 'res_123',
      }),
      '/de/editor/res_123'
    );
  });
});

describe('Production Paid Completion Mapping (F-404)', () => {
  it('returns no completion without an exact verified pending intent', () => {
    clearPendingCheckoutIntent();
    assert.strictEqual(consumePaidActionCompletion('export'), null);

    setPendingCheckoutIntent({ type: 'share', resumeId: 'res_123' }, 'public_share');
    assert.strictEqual(consumePaidActionCompletion('export'), null);
    assert.strictEqual(consumePaidActionCompletion('share'), 'public_share');
  });

  it('maps dashboard create, import and duplicate from the stored trigger', () => {
    clearPendingCheckoutIntent();
    setPendingCheckoutIntent({ type: 'dashboard_create' }, 'resume_limit');
    assert.strictEqual(consumePaidActionCompletion('dashboard_create'), 'resume_limit');

    setPendingCheckoutIntent({ type: 'dashboard_import' }, 'trial_used');
    assert.strictEqual(consumePaidActionCompletion('dashboard_import'), 'trial_used');

    setPendingCheckoutIntent({ type: 'dashboard_import' }, 'resume_limit');
    assert.strictEqual(consumePaidActionCompletion('dashboard_import'), 'resume_limit');

    setPendingCheckoutIntent({ type: 'dashboard_duplicate', resumeId: 'res_123' }, 'resume_limit');
    assert.strictEqual(consumePaidActionCompletion('dashboard_duplicate'), 'resume_limit');
  });

  it('preserves resume_limit attribution for BYOK AI generation', () => {
    clearPendingCheckoutIntent();
    setPendingCheckoutIntent(
      { type: 'ai_feature', featureKey: 'generate_resume' },
      'resume_limit'
    );
    assert.strictEqual(
      consumePaidActionCompletion('ai_feature', 'generate_resume'),
      'resume_limit'
    );
  });

  it('requires the exact template origin before recording paid template value', () => {
    clearPendingCheckoutIntent();
    setPendingCheckoutIntent(
      {
        type: 'template',
        templateId: 'modern',
        origin: 'dashboard_create',
      },
      'paid_template'
    );

    assert.strictEqual(
      consumePaidActionCompletion('template', undefined, 'gallery'),
      null
    );
    assert.strictEqual(
      consumePaidActionCompletion('template', undefined, 'dashboard_create'),
      'paid_template'
    );
  });

  it('discards unsupported completion triggers instead of inventing an action', () => {
    clearPendingCheckoutIntent();
    setPendingCheckoutIntent(
      { type: 'ai_feature', featureKey: 'cover_letter' },
      'premium_feature'
    );
    assert.strictEqual(
      consumePaidActionCompletion('ai_feature', 'cover_letter'),
      null
    );

    setPendingCheckoutIntent(
      { type: 'export', format: 'pdf', resumeId: 'res_123' },
      'public_share'
    );
    assert.strictEqual(consumePaidActionCompletion('export'), null);
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

  it('preserves a sanitized template origin through production verification', () => {
    const sessionWithTemplateIntent = {
      ...validSession,
      metadata: {
        ...validSession.metadata,
        returnIntentJson: JSON.stringify({
          type: 'template',
          templateId: 'modern',
          origin: 'dashboard_import',
        }),
      },
    };
    const res = verifyStripeSubscriptionSession(
      validUser,
      sessionWithTemplateIntent,
      validSub
    );
    assert.strictEqual(res.verified, true);
    if (res.verified) {
      assert.deepStrictEqual(res.returnIntent, {
        type: 'template',
        templateId: 'modern',
        origin: 'dashboard_import',
      });
    }
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
