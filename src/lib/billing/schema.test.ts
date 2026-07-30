// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  sanitizePaywallTrigger,
  sanitizeReturnIntent,
  CheckoutInputSchema,
  ReturnIntentSchema,
} from './schema';

describe('Billing Schema and Sanitizers (F-405)', () => {
  it('sanitizes paywall triggers against closed allowlists', () => {
    expect(sanitizePaywallTrigger('export_paid_format')).toBe('export_paid_format');
    expect(sanitizePaywallTrigger('resume_limit')).toBe('resume_limit');
    expect(sanitizePaywallTrigger('trial_used')).toBe('trial_used');
    expect(sanitizePaywallTrigger('paid_template')).toBe('paid_template');
    expect(sanitizePaywallTrigger('public_share')).toBe('public_share');
    expect(sanitizePaywallTrigger('premium_ai_feature')).toBe('premium_ai_feature');
    expect(sanitizePaywallTrigger('malicious_string')).toBe('unknown');
    expect(sanitizePaywallTrigger(null)).toBe('unknown');
    expect(sanitizePaywallTrigger(123)).toBe('unknown');
  });

  it('validates return intents strictly', () => {
    const valid = {
      type: 'export',
      format: 'pdf',
      resumeId: 'res_123',
    };
    expect(ReturnIntentSchema.safeParse(valid).success).toBe(true);
    expect(sanitizeReturnIntent(valid)).toEqual(valid);
    expect(sanitizeReturnIntent(JSON.stringify(valid))).toEqual(valid);

    const invalidType = { type: 'hack_database' };
    expect(ReturnIntentSchema.safeParse(invalidType).success).toBe(false);
    expect(sanitizeReturnIntent(invalidType)).toBeUndefined();
  });

  it('validates checkout input schema strictly', () => {
    const valid = {
      tier: 'pro',
      plan: 'monthly',
      trigger: 'export_paid_format',
      locale: 'de',
    };
    expect(CheckoutInputSchema.safeParse(valid).success).toBe(true);

    const invalidTier = {
      tier: 'admin_god_mode',
      plan: 'monthly',
    };
    expect(CheckoutInputSchema.safeParse(invalidTier).success).toBe(false);
  });
});
