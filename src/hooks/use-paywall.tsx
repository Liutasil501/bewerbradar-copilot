'use client';

import { useState, useCallback } from 'react';
import { useSubscriptionStore, SubscriptionPlan } from '@/stores/subscription-store';

export function usePaywall() {
  const { plan, isLoading } = useSubscriptionStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'premium'>('pro');

  const checkPaywall = useCallback((
    tier: 'pro' | 'premium',
    onSuccess: () => void
  ) => {
    // Determine if the user meets the tier requirements
    const hasPro = plan === 'pro' || plan === 'premium';
    const hasPremium = plan === 'premium';

    const isAuthorized = tier === 'premium' ? hasPremium : hasPro;

    if (isAuthorized) {
      onSuccess();
    } else {
      setRequiredTier(tier);
      setShowPaywall(true);
    }
  }, [plan]);

  return {
    showPaywall,
    setShowPaywall,
    requiredTier,
    checkPaywall,
    isLoading,
    currentPlan: plan,
  };
}
