import type { ReturnIntent } from './schema';

export function resolveCheckoutReturnPath(
  locale: string,
  returnIntent?: ReturnIntent
): string {
  const targetLocale = locale === 'en' ? 'en' : 'de';
  if (
    returnIntent?.type &&
    ['export', 'template', 'share', 'ai_feature'].includes(returnIntent.type) &&
    returnIntent.resumeId
  ) {
    return `/${targetLocale}/editor/${encodeURIComponent(returnIntent.resumeId)}`;
  }

  // All other returns route through /dashboard where useCheckoutReturn() is mounted
  return `/${targetLocale}/dashboard`;
}
