import { z } from 'zod';

export const ALLOWED_PAYWALL_TRIGGERS = [
  'export_paid_format',
  'resume_limit',
  'trial_used',
  'paid_template',
  'public_share',
  'premium_ai_feature',
  'premium_feature',
  'unknown',
] as const;

export type PaywallTrigger = (typeof ALLOWED_PAYWALL_TRIGGERS)[number];

export const ALLOWED_RETURN_INTENT_TYPES = [
  'export',
  'template',
  'share',
  'ai_feature',
  'dashboard_import',
] as const;

export type ReturnIntentType = (typeof ALLOWED_RETURN_INTENT_TYPES)[number];

export const ALLOWED_EXPORT_FORMATS = ['pdf', 'docx', 'html'] as const;
export type ExportFormat = (typeof ALLOWED_EXPORT_FORMATS)[number];

export const ALLOWED_FEATURE_KEYS = [
  'cover_letter',
  'grammar_check',
  'jd_analysis',
  'translate',
  'generate_resume',
  'interview',
] as const;
export type FeatureKey = (typeof ALLOWED_FEATURE_KEYS)[number];

export const ReturnIntentSchema = z.object({
  type: z.enum(ALLOWED_RETURN_INTENT_TYPES),
  format: z.enum(ALLOWED_EXPORT_FORMATS).optional(),
  templateId: z.string().max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  featureKey: z.enum(ALLOWED_FEATURE_KEYS).optional(),
  resumeId: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

export type ReturnIntent = z.infer<typeof ReturnIntentSchema>;

export const CheckoutInputSchema = z.object({
  tier: z.enum(['pro', 'premium']),
  plan: z.enum(['monthly', 'yearly']),
  trigger: z.enum(ALLOWED_PAYWALL_TRIGGERS).optional().default('unknown'),
  returnIntent: ReturnIntentSchema.optional(),
  locale: z.enum(['de', 'en']).optional().default('de'),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

export function sanitizePaywallTrigger(input: unknown): PaywallTrigger {
  if (typeof input === 'string' && (ALLOWED_PAYWALL_TRIGGERS as readonly string[]).includes(input)) {
    return input as PaywallTrigger;
  }
  return 'unknown';
}

export function sanitizeReturnIntent(input: unknown): ReturnIntent | undefined {
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      return undefined;
    }
  }
  const result = ReturnIntentSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
