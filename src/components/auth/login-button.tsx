'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';
import {
  discardImportAuthJourney,
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

  const getAuthIntent = (): AuthIntent => {
    if (callbackUrl.includes('action=import')) return 'import';
    if (typeof window !== 'undefined' && sessionStorage.getItem('br_import_intent') === '1') return 'import';
    return 'direct';
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
          <h3 className="font-medium text-green-800 dark:text-green-400">E-Mail gesendet!</h3>
          <p className="text-sm text-green-600 dark:text-green-500">
            Bitte prüfe dein Postfach (und den Spam-Ordner) nach dem Login-Link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col space-y-4">
      <form onSubmit={handleMagicLink} className="flex flex-col space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            type="email"
            placeholder="E-Mail Adresse"
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
          {isLoading ? 'Sendet...' : 'Mit E-Mail anmelden'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            Oder
          </span>
        </div>
      </div>

      <Button
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
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {t('loginWithGoogle')}
    </Button>
    </div>
  );
}
