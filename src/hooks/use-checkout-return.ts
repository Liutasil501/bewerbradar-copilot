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
import { setPendingCheckoutIntent, clearPendingCheckoutIntent } from '@/lib/billing/pending-intent';
import { consumePaidActionCompletion } from '@/lib/billing/completion';
import { resolveTemplateContinuation } from '@/lib/billing/return-resolver';
import { useRouter } from '@/i18n/routing';

const CHECKOUT_QUERY_PARAMS = [
  'session_id',
  'canceled',
  'returnIntent',
  'trigger',
  'tier',
  'billing_period',
  'plan',
] as const;

function clearCheckoutQueryParams(): void {
  const url = new URL(window.location.href);
  for (const param of CHECKOUT_QUERY_PARAMS) {
    url.searchParams.delete(param);
  }
  window.history.replaceState({}, '', url.pathname + url.search);
}

async function waitForResumeHydration(
  resumeId: string,
  timeoutMs = 15_000
): Promise<boolean> {
  if (useResumeStore.getState().currentResume?.id === resumeId) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);
    const unsubscribe = useResumeStore.subscribe((state) => {
      if (state.currentResume?.id !== resumeId) return;
      clearTimeout(timeout);
      unsubscribe();
      resolve(true);
    });
  });
}

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
              const continuation = resolveTemplateContinuation(returnIntent);
              if (!continuation) {
                throw new Error('CHECKOUT_CONTINUATION_INVALID_TEMPLATE');
              }

              if (continuation.origin === 'editor' && continuation.resumeId) {
                const isReady = await waitForResumeHydration(continuation.resumeId);
                if (!isReady) {
                  throw new Error('CHECKOUT_CONTINUATION_RESUME_NOT_READY');
                }

                const resumeStore = useResumeStore.getState();
                resumeStore.setTemplate(continuation.templateId);
                await useResumeStore.getState().save();

                const completion = consumePaidActionCompletion(
                  'template',
                  undefined,
                  'editor'
                );
                if (completion) {
                  trackEvent('paid_action_completed', { locale, action: completion });
                }
              } else if (continuation.origin === 'dashboard_create') {
                openModal('create-resume');
              } else if (continuation.origin === 'dashboard_import') {
                openModal('import');
              } else if (continuation.origin === 'gallery') {
                router.push(
                  `/templates?templateId=${encodeURIComponent(continuation.templateId)}`
                );
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
            } else if (actionType === 'dashboard_duplicate') {
              if (!returnIntent.resumeId) {
                throw new Error('CHECKOUT_CONTINUATION_DUPLICATE_ID_MISSING');
              }

              const fingerprint = localStorage.getItem('br_fingerprint');
              const dupRes = await fetch(`/api/resume/${returnIntent.resumeId}/duplicate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
                },
              });
              if (!dupRes.ok) {
                throw new Error('CHECKOUT_CONTINUATION_DUPLICATE_FAILED');
              }

              const completion = consumePaidActionCompletion('dashboard_duplicate');
              if (completion) {
                trackEvent('paid_action_completed', { locale, action: completion });
              }
              if (options?.onDuplicateSuccess) {
                await options.onDuplicateSuccess();
              }
            }
          }

          clearCheckoutQueryParams();
        } else {
          // F-403: Do NOT delete URL searchParams on verification failure! Offer visible retry.
          toast.error(data.error || tBilling('checkoutVerificationFailed'), {
            action: {
              label: tBilling('retry'),
              onClick: () => performVerification(sessionId),
            },
          });
        }
      } catch (err) {
        console.error('Error verifying Stripe checkout:', err);
        const isContinuationError =
          err instanceof Error && err.message.startsWith('CHECKOUT_CONTINUATION_');
        toast.error(
          isContinuationError
            ? tBilling('checkoutContinuationFailed')
            : tBilling('checkoutVerificationFailed'),
          {
            action: {
              label: tBilling('retry'),
              onClick: () => performVerification(sessionId),
            },
          }
        );
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

      clearCheckoutQueryParams();

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
