'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Wand2, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import type { PaywallTrigger } from '@/lib/billing/schema';
import { setPendingCheckoutIntent } from '@/lib/billing/pending-intent';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier: 'pro' | 'premium';
  descriptionOverride?: string;
  analyticsTrigger?: PaywallTrigger;
}

export function PricingModal({
  open,
  onOpenChange,
  requiredTier,
  descriptionOverride,
  analyticsTrigger,
}: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const t = useTranslations('billing');
  const locale = useLocale();
  const openModal = useUIStore((s) => s.openModal);
  const paywallContext = useUIStore((s) => s.paywallContext);

  const effectiveTrigger: PaywallTrigger =
    paywallContext?.trigger ?? analyticsTrigger ?? (requiredTier === 'premium' ? 'premium_ai_feature' : 'unknown');

  const isPremiumDominant = effectiveTrigger === 'premium_ai_feature' || effectiveTrigger === 'premium_feature' || requiredTier === 'premium';

  useEffect(() => {
    if (open) {
      trackEvent('paywall_viewed', { locale, trigger: effectiveTrigger });
    }
  }, [open, effectiveTrigger, locale]);

  const handleCheckout = async (tier: 'pro' | 'premium') => {
    setIsLoading(tier);
    trackEvent('checkout_started', {
      locale,
      plan: tier,
      billing_period: billingCycle,
      trigger: effectiveTrigger,
    });
    try {
      const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const returnIntent = paywallContext?.returnIntent;
      if (returnIntent) {
        setPendingCheckoutIntent(returnIntent, effectiveTrigger);
      }
      const res = await fetch('/api/stripe/checkout', {
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
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Checkout failed');
      }
    } catch {
      toast.error('An error occurred during checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const proMonthly = '9.99€';
  const proYearlyTotal = '99.96€';
  const proYearlyMonthlyEquiv = '8.33€';

  const premiumMonthly = '19.99€';
  const premiumYearlyTotal = '199.92€';
  const premiumYearlyMonthlyEquiv = '16.66€';

  const getModalHeader = () => {
    if (descriptionOverride) {
      return {
        title: requiredTier === 'premium' ? t('titlePremium') : t('titlePro'),
        description: descriptionOverride,
      };
    }

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
    if (isPremiumDominant) {
      return t('ctaProNoAi');
    }
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

  const getPremiumCtaText = () => {
    if (isPremiumDominant) {
      return t('ctaAiPremium');
    }
    return t('ctaGenericPremium');
  };

  const headerInfo = getModalHeader();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <div className="p-8 pb-4 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              {headerInfo.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {headerInfo.description}
            </DialogDescription>
          </DialogHeader>

          {/* Billing Cycle Switcher */}
          <div className="mt-6 flex justify-center">
            <div className="relative flex rounded-full bg-zinc-200 dark:bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "relative w-32 rounded-full py-2 text-xs font-semibold transition-colors cursor-pointer",
                  billingCycle === 'monthly' ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {t('monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "relative w-32 rounded-full py-2 text-xs font-semibold transition-colors cursor-pointer",
                  billingCycle === 'yearly' ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {t('yearly')}
              </button>
              {/* Truthful Discount badge */}
              <div className="absolute -right-6 -top-3.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                {t('save2Months')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* PRO TIER */}
          <div className={cn(
            "flex flex-col p-8 border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-800 transition-all",
            !isPremiumDominant ? "bg-white dark:bg-zinc-900 ring-2 ring-brand/30 dark:ring-brand/40" : "bg-zinc-50/50 dark:bg-zinc-900/30"
          )}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t('proTitle')}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('proDesc')}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {t('positioningPro')}
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  {billingCycle === 'yearly' ? proYearlyMonthlyEquiv : proMonthly}
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('perMonth')}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {billingCycle === 'yearly'
                  ? t('yearlyChargedNote', { amount: proYearlyTotal })
                  : t('monthly')}
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-x-2.5"><Check className="h-4 w-4 flex-none text-brand" /> {t('proFeat1')}</li>
              <li className="flex gap-x-2.5"><Check className="h-4 w-4 flex-none text-brand" /> {t('proFeat2')}</li>
              <li className="flex gap-x-2.5"><Check className="h-4 w-4 flex-none text-brand" /> {t('proFeat3')}</li>
              <li className="flex gap-x-2.5"><Check className="h-4 w-4 flex-none text-brand" /> {t('proFeat4')}</li>
            </ul>

            {/* F-402 Truthful Disclaimer when Pro is viewed during a Premium AI paywall */}
            {isPremiumDominant && (
              <div className="mb-4 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {t('proNoAiNotice')}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="button"
                className={cn(
                  "w-full h-11 text-xs font-semibold cursor-pointer gap-2 transition-all",
                  !isPremiumDominant
                    ? "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover"
                    : "border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                )}
                onClick={() => handleCheckout('pro')}
                disabled={isLoading !== null}
              >
                {isLoading === 'pro' ? t('loading') : getProCtaText()}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                {effectiveTrigger === 'export_paid_format'
                  ? t('continuityNoteExport')
                  : t('continuityNoteGeneral')}
              </p>
            </div>
          </div>

          {/* PREMIUM TIER */}
          <div className={cn(
            "relative flex flex-col p-8 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800 transition-all",
            isPremiumDominant ? "bg-white dark:bg-zinc-900 ring-2 ring-brand/30 dark:ring-brand/40" : "bg-zinc-50/50 dark:bg-zinc-900/30"
          )}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-brand dark:text-brand-light">{t('premiumTitle')}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('premiumDesc')}</p>
              </div>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand dark:bg-brand/20 dark:text-brand-light border border-brand/20">
                <Sparkles className="inline mr-1 h-3 w-3" />
                {t('positioningPremium')}
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  {billingCycle === 'yearly' ? premiumYearlyMonthlyEquiv : premiumMonthly}
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('perMonth')}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {billingCycle === 'yearly'
                  ? t('yearlyChargedNote', { amount: premiumYearlyTotal })
                  : t('monthly')}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-x-2.5"><Check className="h-4 w-4 flex-none text-brand" /> {t('premiumFeat1')}</li>
              <li className="flex gap-x-2.5 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-4 w-4 flex-none text-brand" /> {t('premiumFeat2')}</li>
              <li className="flex gap-x-2.5 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-4 w-4 flex-none text-brand" /> {t('premiumFeat3')}</li>
              <li className="flex gap-x-2.5 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-4 w-4 flex-none text-brand" /> {t('premiumFeat4')}</li>
            </ul>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full h-11 text-xs font-semibold cursor-pointer gap-2 bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20"
                onClick={() => handleCheckout('premium')}
                disabled={isLoading !== null}
              >
                {isLoading === 'premium' ? t('loading') : getPremiumCtaText()}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                {t('continuityNoteGeneral')}
              </p>
            </div>

            {/* BYOK Secondary Path - ONLY shown when allowBYOK is true */}
            {paywallContext?.allowBYOK && (
              <div className="mt-4 text-center pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    openModal('settings');
                  }}
                  className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {t('byokAlternativeHint')}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
