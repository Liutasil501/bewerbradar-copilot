'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  CONSENT_VERSION,
  COOKIE_CONSENT_KEY,
  saveConsent,
  type CookieConsentState,
} from '@/lib/analytics/consent';

const HYDRATING_SNAPSHOT = '__hydrating__';

function subscribeToConsent(callback: () => void) {
  window.addEventListener('br_consent_updated', callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener('br_consent_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

function getConsentSnapshot() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) ?? '';
  } catch {
    return '';
  }
}

function getServerConsentSnapshot() {
  return HYDRATING_SNAPSHOT;
}

function parseConsentSnapshot(snapshot: string): CookieConsentState | null {
  if (!snapshot || snapshot === HYDRATING_SNAPSHOT) return null;

  try {
    const parsed = JSON.parse(snapshot);
    if (
      parsed &&
      typeof parsed.analytics === 'boolean' &&
      parsed.version === CONSENT_VERSION &&
      typeof parsed.timestamp === 'number'
    ) {
      return parsed as CookieConsentState;
    }
  } catch {
    // Invalid or outdated choices fall back to a fresh user decision.
  }

  return null;
}

export function CookieConsentBanner() {
  const t = useTranslations('consent');
  const consentSnapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const consentState = parseConsentSnapshot(consentSnapshot);
  const showBanner = consentSnapshot !== HYDRATING_SNAPSHOT && consentState === null;
  const [showReopenModal, setShowReopenModal] = useState(false);

  useEffect(() => {
    const handleReopen = () => setShowReopenModal(true);
    window.addEventListener('br_open_consent_modal', handleReopen);
    return () => window.removeEventListener('br_open_consent_modal', handleReopen);
  }, []);

  const handleChoice = (analyticsGranted: boolean) => {
    saveConsent(analyticsGranted);
    setShowReopenModal(false);
  };

  return (
    <>
      {/* First-time Bottom Banner */}
      {showBanner && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('title')}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {t('description')}
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleChoice(false)}
                className="w-full sm:w-auto text-xs h-9 px-4 font-medium border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                {t('necessaryOnly')}
              </Button>
              <Button
                type="button"
                onClick={() => handleChoice(true)}
                className="w-full sm:w-auto text-xs h-9 px-4 font-semibold bg-brand text-white hover:bg-brand-hover shadow-sm cursor-pointer"
              >
                {t('allowAnalytics')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen / Settings Modal */}
      <Dialog open={showReopenModal} onOpenChange={setShowReopenModal}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="h-5 w-5 text-brand" />
              {t('reopenTitle')}
            </DialogTitle>
            <DialogDescription className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t('description')}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {consentState?.analytics ? t('statusAllowed') : t('statusDenied')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant={consentState?.analytics ? "outline" : "default"}
              onClick={() => handleChoice(false)}
              className="w-full sm:w-auto text-xs cursor-pointer"
            >
              {t('necessaryOnly')}
            </Button>
            <Button
              type="button"
              variant={consentState?.analytics ? "default" : "outline"}
              onClick={() => handleChoice(true)}
              className="w-full sm:w-auto text-xs bg-brand text-white hover:bg-brand-hover cursor-pointer"
            >
              {t('allowAnalytics')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
