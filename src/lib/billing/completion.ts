import type { AnalyticsEventMap } from '@/lib/analytics';
import {
  consumePendingCheckoutIntent,
  type ConsumeIntentResult,
} from './pending-intent';
import type { ReturnIntentType, TemplateOrigin } from './schema';

export type PaidActionCompletion =
  AnalyticsEventMap['paid_action_completed']['action'];

const ALLOWED_COMPLETIONS_BY_INTENT: Record<
  ReturnIntentType,
  readonly PaidActionCompletion[]
> = {
  export: ['export_paid_format'],
  template: ['paid_template'],
  share: ['public_share'],
  ai_feature: ['premium_ai_feature', 'trial_used', 'resume_limit'],
  dashboard_import: ['trial_used', 'resume_limit'],
  dashboard_create: ['resume_limit'],
  dashboard_duplicate: ['resume_limit'],
};

export function getPaidActionCompletion(
  result: ConsumeIntentResult
): PaidActionCompletion | null {
  if (!result.matched) return null;

  switch (result.trigger) {
    case 'export_paid_format':
    case 'resume_limit':
    case 'trial_used':
    case 'paid_template':
    case 'public_share':
    case 'premium_ai_feature':
      return result.trigger;
    default:
      return null;
  }
}

export function consumePaidActionCompletion(
  expectedAction: ReturnIntentType,
  expectedFeatureKey?: string,
  expectedOrigin?: TemplateOrigin
): PaidActionCompletion | null {
  const completion = getPaidActionCompletion(
    consumePendingCheckoutIntent(
      expectedAction,
      expectedFeatureKey,
      expectedOrigin
    )
  );
  if (!completion) return null;

  return ALLOWED_COMPLETIONS_BY_INTENT[expectedAction].includes(completion)
    ? completion
    : null;
}
