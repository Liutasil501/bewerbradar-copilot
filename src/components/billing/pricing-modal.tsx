'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Check, KeyRound, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';
import type { PaywallTrigger } from '@/lib/billing/schema';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier: 'pro' | 'premium';
  descriptionOverride?: string;
  analyticsTrigger?: PaywallTrigger;
}

type BillingCycle = 'monthly' | 'yearly';
type PaidTier = 'pro' | 'premium';

const PRICES = {
  pro: {
    monthly: 9.99,
    yearlyTotal: 99.96,
    yearlyMonthlyEquivalent: 8.33,
  },
  premium: {
    monthly: 19.99,
    yearlyTotal: 199.92,
    yearlyMonthlyEquivalent: 16.66,
  },
} as const;

export function PricingModal({
  open,
  onOpenChange,
  requiredTier,
  descriptionOverride,
  analyticsTrigger,
}: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState<PaidTier | null>(null);
  const t = useTranslations('billing');
  const locale = useLocale();
  const openModal = useUIStore((state) => state.openModal);
  const paywallContext = useUIStore((state) => state.paywallContext);

  const effectiveTrigger: PaywallTrigger =
    paywallContext?.trigger ??
    analyticsTrigger ??
    (requiredTier === 'premium' ? 'premium_ai_feature' : 'unknown');

  const isPremiumDominant =
    effectiveTrigger === 'premium_ai_feature' ||
    effectiveTrigger === 'premium_feature' ||
    requiredTier === 'premium';

  const dominantTier: PaidTier = isPremiumDominant ? 'premium' : 'pro';
  const secondaryTier: PaidTier = isPremiumDominant ? 'pro' : 'premium';

  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    if (open) {
      trackEvent('paywall_viewed', { locale, trigger: effectiveTrigger });
    }
  }, [open, effectiveTrigger, locale]);

  const handleCheckout = async (tier: PaidTier) => {
    setIsLoading(tier);
    trackEvent('checkout_started', {
      locale,
      plan: tier,
      billing_period: billingCycle,
      trigger: effectiveTrigger,
    });

    try {
      const fingerprint =
        typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const returnIntent = paywallContext?.returnIntent;
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
        },
        body: JSON.stringify({
          tier,
          plan: billingCycle,
          trigger: effectiveTrigger,
          returnIntent,
          locale,
        }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t('checkoutError'));
      }
    } catch {
      toast.error(t('checkoutError'));
    } finally {
      setIsLoading(null);
    }
  };

  const getContextHeader = () => {
    switch (effectiveTrigger) {
      case 'export_paid_format':
        return { title: t('titleExport'), description: t('descExport') };
      case 'resume_limit':
        return { title: t('titleLimit'), description: t('descLimit') };
      case 'trial_used':
        return { title: t('titleTrial'), description: t('descTrial') };
      case 'paid_template':
        return { title: t('titleTemplate'), description: t('descTemplate') };
      case 'public_share':
        return { title: t('titleShare'), description: t('descShare') };
      case 'premium_ai_feature':
      case 'premium_feature':
        return { title: t('titleAi'), description: t('descAi') };
      default:
        return {
          title: requiredTier === 'premium' ? t('titlePremium') : t('titlePro'),
          description: requiredTier === 'premium' ? t('descPremium') : t('descPro'),
        };
    }
  };

  const getProCtaText = () => {
    if (isPremiumDominant) return t('ctaAlternativePro');

    switch (effectiveTrigger) {
      case 'export_paid_format':
        return t('ctaExportPro');
      case 'resume_limit':
        return t('ctaLimitPro');
      case 'trial_used':
        return t('ctaTrialPro');
      case 'paid_template':
        return t('ctaTemplatePro');
      case 'public_share':
        return t('ctaSharePro');
      default:
        return t('ctaGenericPro');
    }
  };

  const getPremiumCtaText = () =>
    isPremiumDominant ? t('ctaAiPremium') : t('ctaAlternativePremium');

  const header = getContextHeader();
  const features: Record<PaidTier, string[]> = {
    pro: [t('proFeat1'), t('proFeat2'), t('proFeat3'), t('proFeat4')],
    premium: [
      t('premiumFeat1'),
      t('premiumFeat2'),
      t('premiumFeat3'),
      t('premiumFeat4'),
      t('premiumFeat5'),
    ],
  };

  const renderPlan = (tier: PaidTier, isDominant: boolean) => {
    const price = PRICES[tier];
    const displayPrice =
      billingCycle === 'yearly' ? price.yearlyMonthlyEquivalent : price.monthly;
    const isPremium = tier === 'premium';
    const cta = isPremium ? getPremiumCtaText() : getProCtaText();

    return (
      <section
        key={tier}
        className={cn(
          'relative flex min-w-0 flex-col rounded-2xl border p-5 transition-colors sm:p-6',
          isDominant
            ? isPremium
              ? 'border-brand/40 bg-gradient-to-b from-emerald-50/90 to-white shadow-[0_18px_50px_-30px_rgba(5,150,105,0.65)] dark:from-emerald-950/35 dark:to-zinc-900'
              : 'border-zinc-300 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.5)] dark:border-zinc-700 dark:bg-zinc-900'
            : 'border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/45'
        )}
      >
        <p
          className={cn(
            'mb-4 text-[11px] font-bold uppercase tracking-[0.14em]',
            isDominant ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500'
          )}
        >
          {isDominant
            ? isPremium
              ? t('recommendedPremium')
              : t('recommendedPro')
            : t('alternativePlan')}
        </p>

        <div>
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-2xl font-bold tracking-tight',
                isPremium && isDominant
                  ? 'text-brand'
                  : 'text-zinc-950 dark:text-white'
              )}
            >
              {isPremium ? t('premiumTitle') : t('proTitle')}
            </h3>
            {isPremium && isDominant && <Sparkles className="h-5 w-5 text-brand" />}
          </div>
          <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {isPremium ? t('premiumDesc') : t('proDesc')}
          </p>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="text-[34px] font-extrabold leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
              {currencyFormatter.format(displayPrice)}
            </span>
            <span className="pb-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t('perMonth')}
            </span>
          </div>
          <p className="mt-2 min-h-5 text-xs text-zinc-500 dark:text-zinc-400">
            {billingCycle === 'yearly'
              ? t('yearlyChargedNote', {
                  amount: currencyFormatter.format(price.yearlyTotal),
                })
              : t('monthlyBillingNote')}
          </p>
        </div>

        <ul className="my-6 flex-1 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          {features[tier].map((feature, index) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  isPremium && index > 0
                    ? 'bg-brand/10 text-brand'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                )}
              >
                {isPremium && index > 0 ? (
                  <Wand2 className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          onClick={() => handleCheckout(tier)}
          disabled={isLoading !== null}
          className={cn(
            'min-h-12 w-full cursor-pointer justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold whitespace-normal',
            isDominant
              ? isPremium
                ? 'bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-hover'
                : 'bg-zinc-950 text-white shadow-lg shadow-zinc-900/15 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
              : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
          )}
        >
          <span className="min-w-0 text-left">
            {isLoading === tier ? t('loading') : cta}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>

        <div className="mt-3 min-h-5">
          {isDominant ? (
            <p className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {effectiveTrigger === 'export_paid_format'
                ? t('continuityNoteExport')
                : t('continuityNoteGeneral')}
            </p>
          ) : (
            <span aria-hidden="true" className="block leading-5">
              &nbsp;
            </span>
          )}
        </div>
      </section>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-2xl border-zinc-200 bg-white p-0 shadow-2xl sm:max-w-[860px] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 px-5 pb-5 pt-7 dark:border-zinc-800 sm:px-8 sm:pb-7 sm:pt-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <DialogHeader className="max-w-[540px] text-left">
              <DialogTitle className="text-[28px] font-bold leading-[1.12] tracking-[-0.035em] text-zinc-950 dark:text-white sm:text-[34px]">
                {header.title}
              </DialogTitle>
              <DialogDescription className="mt-3 text-[15px] leading-6 text-zinc-600 dark:text-zinc-400">
                {descriptionOverride || header.description}
              </DialogDescription>
            </DialogHeader>

            <div
              className="grid w-full shrink-0 grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 sm:w-[282px]"
              aria-label={t('billingCycleLabel')}
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                aria-pressed={billingCycle === 'monthly'}
                className={cn(
                  'min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors',
                  billingCycle === 'monthly'
                    ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                )}
              >
                {t('monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                aria-pressed={billingCycle === 'yearly'}
                className={cn(
                  'min-h-11 rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                  billingCycle === 'yearly'
                    ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                )}
              >
                <span className="block">{t('yearly')}</span>
                <span className="block text-[10px] font-medium text-brand">
                  {t('save2MonthsShort')}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 bg-zinc-50/70 p-4 dark:bg-zinc-950 sm:p-6 md:grid-cols-2">
          {renderPlan(dominantTier, true)}
          {renderPlan(secondaryTier, false)}
        </div>

        {paywallContext?.allowBYOK && (
          <div className="border-t border-zinc-100 bg-white px-5 py-4 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                openModal('settings');
              }}
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <KeyRound className="h-4 w-4" />
              {t('byokAlternativeHint')}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
