'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePaywall } from '@/hooks/use-paywall';
import { useUIStore } from '@/stores/ui-store';
import { useResumeStore } from '@/stores/resume-store';
import { trackEvent } from '@/lib/analytics';
import { sanitizePaywallTrigger, type ReturnIntent } from '@/lib/billing/schema';
import { useRouter } from '@/i18n/routing';

export function useCheckoutReturn() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const tBilling = useTranslations('billing');
  const { refreshSubscription } = usePaywall();
  const { openModal, setPreferredExportFormat } = useUIStore();
  const processedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || processedRef.current) return;

    const sessionId = searchParams.get('session_id');
    const isCanceled = searchParams.get('canceled') === 'true';

    if (sessionId) {
      processedRef.current = true;

      // Keep search params in URL while verification is in-flight for F-403
      void fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          // Clear query params from URL after verification response arrives
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          url.searchParams.delete('canceled');
          url.searchParams.delete('returnIntent');
          url.searchParams.delete('trigger');
          url.searchParams.delete('plan');
          window.history.replaceState({}, '', url.pathname + url.search);

          if (data.verified) {
            // Await forced hydration of subscription state (F-403)
            await refreshSubscription(true);

            toast.success(tBilling('checkoutSuccess'));

            // Deduplicated tracking key in sessionStorage
            const dedupeKey = `br_checkout_completed_${sessionId}`;
            if (!sessionStorage.getItem(dedupeKey)) {
              sessionStorage.setItem(dedupeKey, '1');
              trackEvent('checkout_completed', {
                locale,
                plan: data.plan === 'premium' ? 'premium' : 'pro',
                billing_period: data.billingPeriod === 'yearly' ? 'yearly' : 'monthly',
                trigger: sanitizePaywallTrigger(data.trigger),
              });
            }

            // F-404: Set pending action marker; do NOT emit paid_action_completed until real execution succeeds
            const returnIntent = data.returnIntent as ReturnIntent | undefined;
            if (returnIntent?.type) {
              sessionStorage.setItem('br_pending_paid_action', JSON.stringify(returnIntent));

              const actionType = returnIntent.type;
              if (actionType === 'export') {
                if (returnIntent.format) {
                  setPreferredExportFormat(returnIntent.format);
                }
                openModal('export');
              } else if (actionType === 'template') {
                const currentResume = useResumeStore.getState().currentResume;
                if (currentResume && returnIntent.templateId) {
                  useResumeStore.getState().setTemplate(returnIntent.templateId);
                  sessionStorage.removeItem('br_pending_paid_action');
                  trackEvent('paid_action_completed', { locale, action: 'paid_template' });
                } else {
                  openModal('export-pdf');
                }
              } else if (actionType === 'share') {
                openModal('share');
              } else if (actionType === 'ai_feature') {
                const key = returnIntent.featureKey;
                if (key === 'cover_letter') openModal('cover-letter');
                else if (key === 'grammar_check') openModal('grammar-check');
                else if (key === 'jd_analysis') openModal('jd-analysis');
                else if (key === 'translate') openModal('translate');
                else if (key === 'generate_resume') openModal('generate-resume');
                else if (key === 'interview') router.push('/interview/new');
              } else if (actionType === 'dashboard_import') {
                openModal('import');
              }
            }
          } else {
            console.warn('Stripe checkout verification failed:', data.error || data.status);
          }
        })
        .catch((err) => {
          console.error('Error verifying Stripe checkout:', err);
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          url.searchParams.delete('canceled');
          window.history.replaceState({}, '', url.pathname + url.search);
        });
    } else if (isCanceled) {
      processedRef.current = true;

      const rawPlan = searchParams.get('plan');
      const rawTrigger = searchParams.get('trigger');

      const canceledPlan = rawPlan === 'premium' ? 'premium' : 'pro';
      const canceledBillingPeriod = searchParams.get('plan_period') === 'yearly' ? 'yearly' : 'monthly';
      const canceledTrigger = sanitizePaywallTrigger(rawTrigger);

      // Clear search params from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('canceled');
      url.searchParams.delete('returnIntent');
      url.searchParams.delete('trigger');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.pathname + url.search);

      toast.info(tBilling('checkoutCanceled'));

      trackEvent('checkout_canceled', {
        locale,
        plan: canceledPlan,
        billing_period: canceledBillingPeriod,
        trigger: canceledTrigger,
      });
    }
  }, [searchParams, locale, refreshSubscription, openModal, setPreferredExportFormat, router, tBilling]);
}
