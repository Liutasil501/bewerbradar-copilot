import { defaultLocale, locales, type Locale } from '@/i18n/config';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'https://copilot.bewerbradar.de'
).replace(/\/+$/, '');

export const SITE_NAME = 'BewerbRadar Copilot';

export const PUBLIC_ROUTES = [
  '',
  '/templates',
  '/impressum',
  '/agb',
  '/datenschutz',
  '/widerruf',
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function getAbsoluteUrl(pathname = ''): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (cleanPath === '/') return SITE_URL;
  return `${SITE_URL}${cleanPath}`;
}

export function getLocalizedUrl(locale: Locale, pathname = ''): string {
  const cleanPath = pathname.startsWith('/') ? pathname : pathname ? `/${pathname}` : '';
  return `${SITE_URL}/${locale}${cleanPath}`;
}

export function getLanguageAlternates(pathname = ''): {
  canonical: string;
  languages: Record<string, string>;
} {
  const cleanPath = pathname.startsWith('/') ? pathname : pathname ? `/${pathname}` : '';
  const languages: Record<string, string> = {};

  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}${cleanPath}`;
  }
  // x-default points to default locale (de)
  languages['x-default'] = `${SITE_URL}/${defaultLocale}${cleanPath}`;

  return {
    canonical: languages[defaultLocale],
    languages,
  };
}
