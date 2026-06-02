'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { User, LogOut, Settings, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrandSwitcher } from '@/components/layout/brand-switcher';
import { useRuntimeConfig } from '@/components/providers/runtime-config-provider';
import { useUIStore } from '@/stores/ui-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { usePaywall } from '@/hooks/use-paywall';
import { PricingModal } from '@/components/billing/pricing-modal';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const t = useTranslations('auth');
  const tSettings = useTranslations('settings');
  const { authEnabled } = useRuntimeConfig();

  const hydrate = useSubscriptionStore((s) => s.hydrate);
  const { currentPlan, showPaywall, setShowPaywall, requiredTier, checkPaywall } = usePaywall();
  const [managingPortal, setManagingPortal] = useState(false);

  const userId = user?.id;

  // Re-hydrate subscription plan on login / user session change
  useEffect(() => {
    if (userId) {
      hydrate(true);
    }
  }, [userId, hydrate]);

  const handleManageSubscription = async (e: React.MouseEvent) => {
    e.preventDefault();
    setManagingPortal(true);
    try {
      const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(tSettings('subscription.manageError'));
      }
    } catch {
      toast.error(tSettings('subscription.manageError'));
    } finally {
      setManagingPortal(false);
    }
  };

  const getPlanBadge = () => {
    if (currentPlan === 'premium') {
      return (
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          Premium
        </span>
      );
    }
    if (currentPlan === 'pro') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Pro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        {tSettings('subscription.planFree')}
      </span>
    );
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400">
          <Avatar className="h-8 w-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
            <AvatarFallback className="bg-zinc-200 text-zinc-600 text-xs">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium text-zinc-900">{user.name || 'User'}</p>
            {user.email && (
              <p className="text-xs text-zinc-500">{user.email}</p>
            )}
          </div>
          
          <div className="px-2 py-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">{tSettings('subscription.title')}:</span>
            {getPlanBadge()}
          </div>
          
          <DropdownMenuSeparator />

          {currentPlan === 'free' ? (
            <DropdownMenuItem
              onClick={() => checkPaywall('premium', () => {})}
              className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/20"
            >
              <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
              {tSettings('subscription.upgrade')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleManageSubscription}
              disabled={managingPortal}
              className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300"
            >
              {managingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-500" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4 text-zinc-500" />
              )}
              {managingPortal ? tSettings('subscription.managing') : tSettings('subscription.manage')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => {
              const setSettingsTab = useUIStore.getState().setSettingsTab;
              const openModal = useUIStore.getState().openModal;
              setSettingsTab('subscription');
              openModal('settings');
            }} 
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            {tSettings('title') || 'Settings'}
          </DropdownMenuItem>
          <BrandSwitcher />
          {authEnabled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PricingModal open={showPaywall} onOpenChange={setShowPaywall} requiredTier={requiredTier} />
    </>
  );
}

