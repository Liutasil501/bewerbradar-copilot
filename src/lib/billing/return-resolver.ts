import type { ReturnIntent, TemplateOrigin } from './schema';

export type TemplateContinuation =
  | { origin: TemplateOrigin; templateId: string; resumeId?: string }
  | null;

export function resolveTemplateContinuation(
  returnIntent?: ReturnIntent
): TemplateContinuation {
  if (returnIntent?.type !== 'template' || !returnIntent.templateId) return null;

  const origin = returnIntent.origin ?? (returnIntent.resumeId ? 'editor' : 'gallery');
  if (origin === 'editor' && !returnIntent.resumeId) return null;

  return {
    origin,
    templateId: returnIntent.templateId,
    ...(returnIntent.resumeId ? { resumeId: returnIntent.resumeId } : {}),
  };
}

export function resolveCheckoutReturnPath(
  locale: string,
  returnIntent?: ReturnIntent
): string {
  const targetLocale = locale === 'en' ? 'en' : 'de';
  const templateContinuation = resolveTemplateContinuation(returnIntent);
  if (templateContinuation?.origin === 'editor' && templateContinuation.resumeId) {
    return `/${targetLocale}/editor/${encodeURIComponent(templateContinuation.resumeId)}`;
  }

  if (
    returnIntent?.type &&
    ['export', 'share', 'ai_feature'].includes(returnIntent.type) &&
    returnIntent.resumeId
  ) {
    return `/${targetLocale}/editor/${encodeURIComponent(returnIntent.resumeId)}`;
  }

  // All other returns route through /dashboard where useCheckoutReturn() is mounted
  return `/${targetLocale}/dashboard`;
}
