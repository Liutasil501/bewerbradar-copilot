'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePaywall } from '@/hooks/use-paywall';
import { useUIStore } from '@/stores/ui-store';
import { useResumeStore } from '@/stores/resume-store';
import { trackEvent } from '@/lib/analytics';
import { sanitizePaywallTrigger, type ReturnIntent } from '@/lib/billing/schema';
import { setPendingCheckoutIntent, consumePendingCheckoutIntent, clearPendingCheckoutIntent } from '@/lib/billing/pending-intent';
import { useRouter } from '@/i18n/routing';

export interface UseCheckoutReturnOptions {
  onDuplicateSuccess?: () => void | Promise<void>;
}

export function useCheckoutReturn(options?: UseCheckoutReturnOptions) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const tBilling = useTranslations('billing');
  const { refreshSubscription } = usePaywall();
  const { openModal, setPreferredExportFormat } = useUIStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const processedRef = useRef(false);

  const performVerification = useCallback(
    async (sessionId: string) => {
      setIsVerifying(true);
      try {
        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (data.verified) {
          // Await forced hydration of subscription state
          await refreshSubscription(true);

          // Clear query params from URL ONLY upon successful verification
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          url.searchParams.delete('canceled');
          url.searchParams.delete('returnIntent');
          url.searchParams.delete('trigger');
          url.searchParams.delete('tier');
          url.searchParams.delete('billing_period');
          url.searchParams.delete('plan');
          window.history.replaceState({}, '', url.pathname + url.search);

          toast.success(tBilling('checkoutSuccess'));

          // Track checkout_completed event once per session
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

          const returnIntent = data.returnIntent as ReturnIntent | undefined;
          if (returnIntent?.type) {
            setPendingCheckoutIntent(returnIntent, sanitizePaywallTrigger(data.trigger));

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
                const resIntent = consumePendingCheckoutIntent('template');
                if (resIntent.matched) {
                  trackEvent('paid_action_completed', { locale, action: 'paid_template' });
                }
              } else if (returnIntent.templateId) {
                router.push(`/templates?templateId=${encodeURIComponent(returnIntent.templateId)}`);
              } else {
                openModal('create-resume');
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
            } else if (actionType === 'dashboard_create') {
              openModal('create-resume');
            } else if (actionType === 'dashboard_duplicate' && returnIntent.resumeId) {
              try {
                const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
                const dupRes = await fetch(`/api/resume/${returnIntent.resumeId}/duplicate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
                  },
                });
                if (dupRes.ok) {
                  const resIntent = consumePendingCheckoutIntent('dashboard_duplicate');
                  if (resIntent.matched) {
                    const action = resIntent.trigger === 'trial_used' ? 'trial_used' : 'resume_limit';
                    trackEvent('paid_action_completed', { locale, action });
                  }
                  if (options?.onDuplicateSuccess) {
                    await options.onDuplicateSuccess();
                  }
                } else {
                  const errData = await dupRes.json().catch(() => ({}));
                  toast.error(errData.error || 'Failed to duplicate resume');
                }
              } catch (e) {
                console.error('Failed to execute post-checkout duplicate:', e);
              }
            }
          }
        } else {
          // F-403: Do NOT delete URL searchParams on verification failure! Offer visible retry.
          toast.error(data.error || 'Zahlungsverifikation fehlgeschlagen', {
            action: {
              label: 'Erneut versuchen',
              onClick: () => performVerification(sessionId),
            },
          });
        }
      } catch (err) {
        console.error('Error verifying Stripe checkout:', err);
        // F-403: Do NOT delete URL searchParams on network error! Offer visible retry.
        toast.error('Netzwerkfehler bei der Verifikation', {
          action: {
            label: 'Erneut versuchen',
            onClick: () => performVerification(sessionId),
          },
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [locale, refreshSubscription, openModal, setPreferredExportFormat, router, tBilling, options]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || processedRef.current) return;

    const sessionId = searchParams.get('session_id');
    const isCanceled = searchParams.get('canceled') === 'true';

    if (sessionId) {
      processedRef.current = true;
      void performVerification(sessionId);
    } else if (isCanceled) {
      processedRef.current = true;

      const rawTier = searchParams.get('tier');
      const rawBillingPeriod = searchParams.get('billing_period') || searchParams.get('plan_period');
      const rawTrigger = searchParams.get('trigger');

      const canceledPlan = rawTier === 'premium' ? 'premium' : 'pro';
      const canceledBillingPeriod = rawBillingPeriod === 'yearly' ? 'yearly' : 'monthly';
      const canceledTrigger = sanitizePaywallTrigger(rawTrigger);

      // Clear search params from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('canceled');
      url.searchParams.delete('returnIntent');
      url.searchParams.delete('trigger');
      url.searchParams.delete('tier');
      url.searchParams.delete('billing_period');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.pathname + url.search);

      clearPendingCheckoutIntent();
      toast.info(tBilling('checkoutCanceled'));

      trackEvent('checkout_canceled', {
        locale,
        plan: canceledPlan,
        billing_period: canceledBillingPeriod,
        trigger: canceledTrigger,
      });
    }
  }, [searchParams, locale, performVerification, tBilling]);

  return { isVerifying };
}
