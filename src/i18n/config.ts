export const locales = ['zh', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale =
  (process.env.DEFAULT_LOCALE as Locale) || 'de';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  de: 'Deutsch',
};
