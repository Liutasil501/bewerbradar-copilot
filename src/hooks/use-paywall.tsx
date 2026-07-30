'use client';

import { useState, useCallback } from 'react';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore, type PaywallContext } from '@/stores/ui-store';
import type { PaywallTrigger } from '@/lib/analytics';

export interface PaywallOptions extends Partial<PaywallContext> {
  allowByok?: boolean;
  description?: string;
  trigger?: PaywallTrigger;
}

export function usePaywall() {
  const { plan, aiImportsCount, isLoading, hydrate } = useSubscriptionStore();
  const aiApiKey = useSettingsStore((s) => s.aiApiKey);
  const { paywallContext, setPaywallContext } = useUIStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'premium'>('pro');
  const [paywallDescription, setPaywallDescription] = useState<string | undefined>(undefined);

  const checkPaywall = useCallback((
    tier: 'pro' | 'premium',
    onSuccess: () => void,
    options?: PaywallOptions
  ) => {
    const hasPro = plan === 'pro' || plan === 'premium';
    const hasPremium = plan === 'premium';

    let isAuthorized = tier === 'premium' ? hasPremium : hasPro;

    // BYOK Override for AI features
    if (!isAuthorized && options?.allowByok && aiApiKey) {
      isAuthorized = true;
    }

    if (isAuthorized) {
      onSuccess();
    } else {
      setRequiredTier(tier);
      setPaywallDescription(options?.description);
      const context: PaywallContext = {
        trigger: options?.trigger ?? (tier === 'premium' ? 'premium_ai_feature' : 'unknown'),
        format: options?.format,
        templateId: options?.templateId,
        featureKey: options?.featureKey,
        allowBYOK: options?.allowByok,
        returnIntent: options?.returnIntent,
        description: options?.description,
      };
      setPaywallContext(context);
      setShowPaywall(true);
    }
  }, [plan, aiApiKey, setPaywallContext]);

  return {
    showPaywall,
    setShowPaywall,
    requiredTier,
    paywallDescription,
    paywallContext,
    setPaywallContext,
    checkPaywall,
    isLoading,
    currentPlan: plan,
    aiImportsCount,
    refreshSubscription: hydrate,
  };
}
