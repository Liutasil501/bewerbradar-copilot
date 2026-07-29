'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Wand2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trackEvent, type PaywallTrigger } from '@/lib/analytics';

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const t = useTranslations('billing');
  const tAi = useTranslations('ai');
  const locale = useLocale();
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    if (open) {
      const trigger = analyticsTrigger ?? (requiredTier === 'premium' ? 'premium_feature' : 'unknown');
      trackEvent('paywall_viewed', { locale, trigger });
    }
  }, [open, requiredTier, analyticsTrigger, locale]);

  const handleCheckout = async (tier: 'pro' | 'premium') => {
    setIsLoading(tier);
    trackEvent('checkout_started', {
      locale,
      plan: tier,
      billing_period: billingCycle,
    });
    try {
      const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
        },
        body: JSON.stringify({ tier, plan: billingCycle }),
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

  const proPrice = billingCycle === 'yearly' ? '8.33€' : '9.99€';
  const premiumPrice = billingCycle === 'yearly' ? '16.66€' : '19.99€';
  
  const proCrossedOut = billingCycle === 'yearly' ? '119.88€' : '';
  const premiumCrossedOut = billingCycle === 'yearly' ? '239.88€' : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <div className="p-8 pb-4 text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {requiredTier === 'premium' ? t('titlePremium') : t('titlePro')}
            </DialogTitle>
            <DialogDescription className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {descriptionOverride || (requiredTier === 'premium' ? t('descPremium') : t('descPro'))}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-center">
            <div className="relative flex rounded-full bg-zinc-200 dark:bg-zinc-800 p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "relative w-32 rounded-full py-2 text-sm font-medium transition-colors",
                  billingCycle === 'monthly' ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {t('monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "relative w-32 rounded-full py-2 text-sm font-medium transition-colors",
                  billingCycle === 'yearly' ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {t('yearly')}
              </button>
              {/* Discount badge */}
              <div className="absolute -right-6 -top-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                {t('save20')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* PRO TIER */}
          <div className="flex flex-col p-8 border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{t('proTitle')}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t('proDesc')}</p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">{proPrice}</span>
              {billingCycle === 'yearly' && <span className="text-sm text-zinc-500 line-through">{proCrossedOut}</span>}
              <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-400">/mo</span>
            </div>
            
            <ul className="mb-8 flex-1 space-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-brand" /> {t('proFeat1')}</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-brand" /> {t('proFeat2')}</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-brand" /> {t('proFeat3')}</li>
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-brand" /> {t('proFeat4')}</li>
            </ul>
            
            <Button 
              className="w-full" 
              variant={requiredTier === 'pro' ? 'default' : 'outline'}
              onClick={() => handleCheckout('pro')}
              disabled={isLoading !== null}
            >
              {isLoading === 'pro' ? t('loading') : t('proTitle')}
            </Button>
          </div>

          {/* PREMIUM TIER */}
          <div className="relative flex flex-col p-8 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {t('popular')}
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-brand dark:text-brand-light">{t('premiumTitle')}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t('premiumDesc')}</p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">{premiumPrice}</span>
              {billingCycle === 'yearly' && <span className="text-sm text-zinc-500 line-through">{premiumCrossedOut}</span>}
              <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-400">/mo</span>
            </div>
            
            <ul className="mb-8 flex-1 space-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-brand" /> {t('premiumFeat1')}</li>
              <li className="flex gap-x-3 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-6 w-5 flex-none text-brand" /> {t('premiumFeat2')}</li>
              <li className="flex gap-x-3 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-6 w-5 flex-none text-brand" /> {t('premiumFeat3')}</li>
              <li className="flex gap-x-3 font-medium text-zinc-900 dark:text-zinc-200"><Wand2 className="h-6 w-5 flex-none text-brand" /> {t('premiumFeat4')}</li>
            </ul>
            
            <Button 
              className="w-full bg-brand hover:bg-brand/90 text-white" 
              onClick={() => handleCheckout('premium')}
              disabled={isLoading !== null}
            >
              {isLoading === 'premium' ? t('loading') : t('premiumTitle')}
            </Button>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onOpenChange(false);
                  openModal('settings');
                }}
                className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                {tAi('apiKeyMissingHint')}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
