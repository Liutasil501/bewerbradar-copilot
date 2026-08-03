import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { prepareQaState } from '@/lib/qa/prepare-state';
import { isQaHarnessEnabled, parseQaState } from '@/lib/qa/states';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; state: string }> }
) {
  if (!isQaHarnessEnabled()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { locale, state: rawState } = await params;
  const state = parseQaState(rawState);

  if (!state || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return new NextResponse('Not found', { status: 404 });
  }

  const qaState = await prepareQaState(state);
  const serializedState = JSON.stringify({
    fingerprint: qaState.fingerprint,
    hasByok: qaState.hasByok,
    redirectTo: `/${locale}/dashboard`,
  }).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Preparing local QA state</title>
  </head>
  <body>
    <p>Preparing local QA state ${state}...</p>
    <script>
      const qaState = ${serializedState};
      for (const key of ['br_api_key', 'br_provider_configs', 'br_import_intent', 'br_pending_checkout_intent']) {
        localStorage.removeItem(key);
      }
      localStorage.setItem('br_fingerprint', qaState.fingerprint);
      if (qaState.hasByok) {
        const apiKey = 'qa-ui-only-key-do-not-send';
        localStorage.setItem('br_api_key', apiKey);
        localStorage.setItem('br_provider_configs', JSON.stringify({
          openai: {
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            apiKey
          }
        }));
      }
      window.location.replace(qaState.redirectTo);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
