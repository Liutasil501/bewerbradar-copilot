import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { trackEvent } from './index';

function installBrowser(consent: boolean) {
  const calls: unknown[][] = [];
  const browserWindow = {
    dataLayer: [] as unknown[],
    gtag: (...args: unknown[]) => calls.push(args),
  };
  const storage = {
    getItem: () =>
      JSON.stringify({ analytics: consent, version: 1, timestamp: Date.now() }),
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 1,
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: browserWindow,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  return calls;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('GA4 product-event transport', () => {
  it('sends a bounded event through gtag after consent', () => {
    const calls = installBrowser(true);

    trackEvent('import_cta_clicked', { locale: 'de', placement: 'hero' });

    assert.deepEqual(calls, [
      ['event', 'import_cta_clicked', { locale: 'de', placement: 'hero' }],
    ]);
  });

  it('emits nothing when analytics consent is denied', () => {
    const calls = installBrowser(false);

    trackEvent('import_cta_clicked', { locale: 'de', placement: 'hero' });

    assert.deepEqual(calls, []);
  });
});
