'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, CheckCircle2, Sparkles, ShieldCheck, FileText } from 'lucide-react';
import {
  discardImportAuthJourney,
  hasAnalyticsConsent,
  rememberImportAuthJourney,
  trackEvent,
  type AuthIntent,
  type AuthMethod,
} from '@/lib/analytics';

export function LoginButton() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const gateTracked = useRef(false);

  const isImportIntent =
    callbackUrl.includes('action=import') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('br_import_intent') === '1');

  useEffect(() => {
    const trackGateView = () => {
      if (!isImportIntent || gateTracked.current || !hasAnalyticsConsent()) return;

      gateTracked.current = true;
      trackEvent('import_auth_gate_viewed', { locale });
    };

    trackGateView();
    window.addEventListener('br_consent_updated', trackGateView);

    return () => window.removeEventListener('br_consent_updated', trackGateView);
  }, [isImportIntent, locale]);

  const getAuthIntent = (): AuthIntent => {
    return isImportIntent ? 'import' : 'direct';
  };

  const trackAuthStart = (method: AuthMethod, intent: AuthIntent) => {
    if (intent !== 'import') return;
    trackEvent('auth_started', { locale, method, intent });
    rememberImportAuthJourney(method, intent);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    const intent = getAuthIntent();
    trackAuthStart('email', intent);

    try {
      const res = await signIn('nodemailer', {
        email,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        discardImportAuthJourney();
        console.error(res.error);
        setIsSuccess(false);
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      discardImportAuthJourney();
      console.error(error);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/30 dark:bg-green-900/20 w-full">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <div className="space-y-1">
          <h3 className="font-medium text-green-800 dark:text-green-400">
            {t('emailSentTitle')}
          </h3>
          <p className="text-sm text-green-600 dark:text-green-500">
            {t('emailSentDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Logo */}
      <div className="mb-5">
        <Image
          src="/logo-icon.svg"
          alt="BewerbRadar Copilot"
          width={48}
          height={48}
          className="drop-shadow-sm"
        />
      </div>

      {isImportIntent ? (
        <>
          {/* Risk-reducer Badges */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
            <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand dark:bg-brand/10 dark:text-brand text-[11px] py-0.5">
              <Sparkles className="mr-1 h-3 w-3" />
              {t('intentBadgeTrial')}
            </Badge>
            <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 text-[11px] py-0.5">
              <ShieldCheck className="mr-1 h-3 w-3 text-emerald-500" />
              {t('intentBadgeNoCard')}
            </Badge>
            <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 text-[11px] py-0.5">
              <FileText className="mr-1 h-3 w-3 text-blue-500" />
              {t('intentBadgeLimits')}
            </Badge>
          </div>

          {/* Import-intent Heading & Subtitle */}
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-center">
            {t('intentTitle')}
          </h1>
          <p className="mt-1.5 text-xs text-center text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            {t('intentSubtitle')}
          </p>

          {/* 3-Step Progress Indicator */}
          <div className="my-5 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800 w-full">
            <span className="flex items-center gap-1.5 font-semibold text-brand dark:text-brand-hover">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-white">1</span>
              {t('step1')}
            </span>
            <span>&rarr;</span>
            <span>{t('step2')}</span>
            <span>&rarr;</span>
            <span>{t('step3')}</span>
          </div>

          <Separator className="mb-5" />

          {/* DOMINANT Primary Action: Google Login */}
          <div className="flex w-full flex-col space-y-4">
            <Button
              type="button"
              onClick={() => {
                const intent = getAuthIntent();
                trackAuthStart('google', intent);
                void signIn('google', { callbackUrl }).catch(() => {
                  discardImportAuthJourney();
                });
              }}
              className="h-11 w-full cursor-pointer gap-3 rounded-xl bg-brand text-white font-semibold shadow-md shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lg dark:bg-brand dark:hover:bg-brand-hover"
            >
              <svg className="h-[18px] w-[18px] bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M2.18 14.47A7.47 7.47 0 0 1 1.75 12c0-.86.15-1.69.43-2.47V6.69H2.18A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.31l2.93-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.69l3.57 2.77c.87-2.6 3.3-4.53 6.25-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('loginWithGoogle')}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
                  {t('orWithEmail')}
                </span>
              </div>
            </div>

            {/* Secondary Action: Email Magic Link */}
            <form onSubmit={handleMagicLink} className="flex flex-col space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || !email}
                className="h-10 w-full font-medium"
              >
                {isLoading ? t('emailSending') : t('loginWithEmailLink')}
              </Button>
            </form>
          </div>
        </>
      ) : (
        <>
          {/* Direct Login Heading */}
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('welcomeBack')}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {t('loginDescription')}
          </p>

          <Separator className="my-6" />

          {/* Direct Login Actions */}
          <div className="flex w-full flex-col space-y-4">
            <form onSubmit={handleMagicLink} className="flex flex-col space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="h-10 w-full"
              >
                {isLoading ? t('emailSending') : t('loginWithEmail')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {t('or')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                const intent = getAuthIntent();
                trackAuthStart('google', intent);
                void signIn('google', { callbackUrl }).catch(() => {
                  discardImportAuthJourney();
                });
              }}
              variant="outline"
              className="h-11 w-full cursor-pointer gap-3 rounded-xl border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M2.18 14.47A7.47 7.47 0 0 1 1.75 12c0-.86.15-1.69.43-2.47V6.69H2.18A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.31l2.93-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.69l3.57 2.77c.87-2.6 3.3-4.53 6.25-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('loginWithGoogle')}
            </Button>
          </div>
        </>
      )}

      {/* Terms */}
      <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        {t('agreePrefix')}{' '}
        <a
          href="https://bewerbradar.de/agb"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {t('terms')}
        </a>{' '}
        {t('agreeConjunction')}{' '}
        <a
          href="https://bewerbradar.de/datenschutz"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {t('privacy')}
        </a>
        {t('agreeSuffix')}
      </p>
    </div>
  );
}
