'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  discardImportAuthJourney,
  hasAnalyticsConsent,
  rememberImportAuthJourney,
  trackEvent,
  type AuthIntent,
  type AuthMethod,
} from '@/lib/analytics';

type LoginContext = 'direct' | 'import' | 'templates' | 'interview';

function GoogleIcon() {
  return (
    <svg className="h-[19px] w-[19px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

export function LoginButton() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const gateTracked = useRef(false);

  const normalizedCallback = callbackUrl.toLowerCase();
  const isImportIntent =
    normalizedCallback.includes('action=import') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('br_import_intent') === '1');

  const loginContext: LoginContext = isImportIntent
    ? 'import'
    : normalizedCallback.includes('/templates')
      ? 'templates'
      : normalizedCallback.includes('/interview')
        ? 'interview'
        : 'direct';

  const contextCopy = {
    direct: {
      eyebrow: t('directEyebrow'),
      title: t('welcomeBack'),
      description: t('loginDescription'),
    },
    import: {
      eyebrow: t('importIntentEyebrow'),
      title: t('intentTitle'),
      description: t('intentSubtitle'),
    },
    templates: {
      eyebrow: t('templateIntentEyebrow'),
      title: t('templateIntentTitle'),
      description: t('templateIntentSubtitle'),
    },
    interview: {
      eyebrow: t('interviewIntentEyebrow'),
      title: t('interviewIntentTitle'),
      description: t('interviewIntentSubtitle'),
    },
  }[loginContext];

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

  const getAuthIntent = (): AuthIntent => (isImportIntent ? 'import' : 'direct');

  const trackAuthStart = (method: AuthMethod, intent: AuthIntent) => {
    if (intent !== 'import') return;
    trackEvent('auth_started', { locale, method, intent });
    rememberImportAuthJourney(method, intent);
  };

  const handleGoogleLogin = () => {
    const intent = getAuthIntent();
    trackAuthStart('google', intent);
    void signIn('google', { callbackUrl }).catch(() => {
      discardImportAuthJourney();
    });
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const intent = getAuthIntent();
    trackAuthStart('email', intent);

    try {
      const response = await signIn('nodemailer', {
        email,
        callbackUrl,
        redirect: false,
      });

      if (response?.error) {
        discardImportAuthJourney();
        console.error(response.error);
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

  return (
    <div className="grid w-full lg:min-h-[660px] lg:grid-cols-[1.08fr_0.92fr]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#063d35_0%,#087f68_58%,#14a884_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-white/[0.06]" />

        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <Image src="/logo-icon.svg" alt="" width={38} height={38} className="rounded-xl ring-1 ring-white/30" />
          <span className="text-base font-semibold tracking-tight">BewerbRadar Copilot</span>
        </Link>

        <div className="relative z-10 my-10 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
            {t('proofEyebrow')}
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.035em]">
            {t('proofTitle')}
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-emerald-50/85">
            {t('proofDescription')}
          </p>

          <div className="mt-8 space-y-3">
            {[t('proofPoint1'), t('proofPoint2'), t('proofPoint3')].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-medium text-white/95">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-sm">
          <div className="rounded-xl bg-white p-4 text-zinc-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-brand">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{t('proofCardTitle')}</p>
                  <p className="text-[10px] text-zinc-500">{t('proofCardSubtitle')}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                {t('proofCardStatus')}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-zinc-600">
              <div className="rounded-lg bg-zinc-50 px-2 py-3">
                <Upload className="mx-auto mb-1.5 h-4 w-4 text-zinc-500" />
                {t('stepImport')}
              </div>
              <div className="rounded-lg bg-emerald-50 px-2 py-3 text-emerald-800">
                <Wand2 className="mx-auto mb-1.5 h-4 w-4" />
                {t('proofOptimize')}
              </div>
              <div className="rounded-lg bg-zinc-50 px-2 py-3">
                <CheckCircle2 className="mx-auto mb-1.5 h-4 w-4 text-brand" />
                {t('stepReview')}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col bg-white px-6 py-6 dark:bg-zinc-900 sm:px-10 sm:py-9 lg:min-h-0 lg:px-12 lg:py-10">
        <Link href="/" className="mb-8 inline-flex w-fit items-center gap-2.5 lg:hidden">
          <Image src="/logo-icon.svg" alt="" width={34} height={34} priority />
          <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            BewerbRadar Copilot
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center lg:max-w-none">
          {isSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center dark:border-emerald-900/40 dark:bg-emerald-950/25">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-200">
                {t('emailSentTitle')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-emerald-800/80 dark:text-emerald-300/80">
                {t('emailSentDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                {contextCopy.eyebrow}
              </div>

              <h1 className="max-w-md text-[30px] font-bold leading-[1.12] tracking-[-0.035em] text-zinc-950 dark:text-white sm:text-[34px]">
                {contextCopy.title}
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-6 text-zinc-600 dark:text-zinc-400">
                {contextCopy.description}
              </p>

              {isImportIntent && (
                <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                  {[t('stepLogin'), t('stepImport'), t('stepReview')].map((step, index) => (
                    <div
                      key={step}
                      className="flex min-w-0 flex-col items-center gap-1.5 border-r border-zinc-200 px-2 py-3 text-center last:border-r-0 dark:border-zinc-800"
                    >
                      <span
                        className={
                          index === 0
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white'
                            : 'flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }
                      >
                        {index + 1}
                      </span>
                      <span className={index === 0 ? 'truncate text-xs font-semibold text-brand' : 'truncate text-xs font-medium text-zinc-500'}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-7 h-12 w-full cursor-pointer gap-3 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-xl"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <GoogleIcon />
                </span>
                {t('loginWithGoogle')}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>

              <div className="relative my-5">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                  {t('orWithEmail')}
                </span>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-xl border-zinc-200 bg-white pl-11 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading || !email}
                  className="h-12 w-full rounded-xl text-sm font-semibold"
                >
                  {isLoading ? t('emailSending') : t('loginWithEmailLink')}
                </Button>
              </form>

              {isImportIntent && (
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    {t('intentBadgeNoCard')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-brand" />
                    {t('intentBadgeLimits')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mx-auto mt-8 w-full max-w-[560px] text-center text-xs leading-5 text-zinc-400 dark:text-zinc-500 lg:max-w-none">
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
      </section>
    </div>
  );
}
