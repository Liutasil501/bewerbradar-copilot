'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePaywall } from '@/hooks/use-paywall';
import { useUIStore, type ReturnIntent } from '@/stores/ui-store';
import { trackEvent } from '@/lib/analytics';

export function useCheckoutReturn() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tBilling = useTranslations('billing');
  const { refreshSubscription } = usePaywall();
  const { openModal } = useUIStore();
  const processedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || processedRef.current) return;

    const sessionId = searchParams.get('session_id');
    const isCanceled = searchParams.get('canceled') === 'true';
    const rawReturnIntent = searchParams.get('returnIntent');

    let returnIntent: ReturnIntent | null = null;
    if (rawReturnIntent) {
      try {
        returnIntent = JSON.parse(decodeURIComponent(rawReturnIntent));
      } catch {
        // Ignore parse error
      }
    }

    if (sessionId) {
      processedRef.current = true;

      // Clear search params from URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('canceled');
      url.searchParams.delete('returnIntent');
      window.history.replaceState({}, '', url.pathname + url.search);

      // Verify server-side
      void fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.verified) {
            refreshSubscription();
            toast.success(tBilling('checkoutSuccess'));

            // Deduplicated tracking key in sessionStorage to prevent refresh duplicates
            const dedupeKey = `br_checkout_completed_${sessionId}`;
            if (!sessionStorage.getItem(dedupeKey)) {
              sessionStorage.setItem(dedupeKey, '1');
              trackEvent('checkout_completed', {
                locale,
                plan: data.plan || 'pro',
                billing_period: data.billingPeriod || 'monthly',
                trigger: data.trigger || 'unknown',
              });
            }

            // Execute return intent continuation
            if (returnIntent?.type) {
              const actionType = returnIntent.type;
              if (actionType === 'export') {
                openModal('export');
                trackEvent('paid_action_completed', { locale, action: 'export_paid_format' });
              } else if (actionType === 'template') {
                openModal('export-pdf');
                trackEvent('paid_action_completed', { locale, action: 'paid_template' });
              } else if (actionType === 'share') {
                openModal('share');
                trackEvent('paid_action_completed', { locale, action: 'public_share' });
              } else if (actionType === 'ai_feature') {
                if (returnIntent.featureKey === 'cover_letter') openModal('cover-letter');
                else if (returnIntent.featureKey === 'grammar_check') openModal('grammar-check');
                else if (returnIntent.featureKey === 'jd_analysis') openModal('jd-analysis');
                else if (returnIntent.featureKey === 'translate') openModal('translate');
                trackEvent('paid_action_completed', { locale, action: 'premium_ai_feature' });
              } else if (actionType === 'dashboard_import') {
                openModal('import');
                trackEvent('paid_action_completed', { locale, action: 'trial_used' });
              }
            }
          } else {
            console.warn('Stripe checkout verification failed:', data.error || data.status);
          }
        })
        .catch((err) => {
          console.error('Error verifying Stripe checkout:', err);
        });
    } else if (isCanceled) {
      processedRef.current = true;

      // Clear search params from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('canceled');
      url.searchParams.delete('returnIntent');
      window.history.replaceState({}, '', url.pathname + url.search);

      toast.info(tBilling('checkoutCanceled'));

      trackEvent('checkout_canceled', {
        locale,
        plan: 'pro',
        billing_period: 'monthly',
        trigger: 'unknown',
      });
    }
  }, [searchParams, locale, refreshSubscription, openModal, tBilling]);
}
