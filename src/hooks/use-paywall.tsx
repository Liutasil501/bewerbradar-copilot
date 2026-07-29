'use client';

import { useState, useCallback } from 'react';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { useSettingsStore } from '@/stores/settings-store';

export interface PaywallOptions {
  allowByok?: boolean;
}

export function usePaywall() {
  const { plan, aiImportsCount, isLoading, hydrate } = useSubscriptionStore();
  const aiApiKey = useSettingsStore((s) => s.aiApiKey);
  const [showPaywall, setShowPaywall] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'premium'>('pro');
  const [paywallDescription, setPaywallDescription] = useState<string | undefined>(undefined);

  const checkPaywall = useCallback((
    tier: 'pro' | 'premium',
    onSuccess: () => void,
    options?: PaywallOptions & { description?: string }
  ) => {
    // Determine if the user meets the tier requirements
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
      setShowPaywall(true);
    }
  }, [plan, aiApiKey]);

  return {
    showPaywall,
    setShowPaywall,
    requiredTier,
    paywallDescription,
    checkPaywall,
    isLoading,
    currentPlan: plan,
    aiImportsCount,
    refreshSubscription: hydrate,
  };
}
