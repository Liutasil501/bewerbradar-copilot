export type SubscriptionPlan = 'free' | 'pro' | 'premium' | string | null | undefined;
export type ServerFundedAIFeature = 'resume_import' | 'advanced_ai';

export interface AIEntitlementSubject {
  subscriptionPlan?: SubscriptionPlan;
  aiImportsCount?: number | null;
}

/**
 * Canonical server-funded AI matrix.
 *
 * - Premium funds every AI feature.
 * - Pro funds resume imports, but advanced AI requires BYOK or Premium.
 * - Free funds exactly the first resume import.
 * - BYOK is handled before this function and never consumes our provider key.
 */
export function canUseServerFundedAI(
  user: AIEntitlementSubject | null | undefined,
  feature: ServerFundedAIFeature
): boolean {
  const plan = user?.subscriptionPlan || 'free';

  if (plan === 'premium') return true;
  if (feature === 'advanced_ai') return false;
  if (plan === 'pro') return true;

  return plan === 'free' && (user?.aiImportsCount || 0) < 1;
}

export function hasUserProvidedAIKey(headers: Headers): boolean {
  return Boolean(headers.get('x-api-key')?.trim());
}
