import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { trackEvent } from './index';

type ConsentFixture = boolean | 'absent' | 'outdated';

function installBrowser(consent: ConsentFixture) {
  const calls: unknown[][] = [];
  const browserWindow = {
    dataLayer: [] as unknown[],
    gtag: (...args: unknown[]) => calls.push(args),
  };
  const storage = {
    getItem: () => {
      if (consent === 'absent') return null;
      return JSON.stringify({
        analytics: consent === true,
        version: consent === 'outdated' ? 0 : 1,
        timestamp: Date.now(),
      });
    },
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
      [
        'event',
        'import_cta_clicked',
        { locale: 'de', placement: 'hero', send_to: 'G-6XRD25H13C' },
      ],
    ]);
  });

  it('queues the event with an explicit destination before gtag is installed', () => {
    installBrowser(true);
    Reflect.deleteProperty(window, 'gtag');

    trackEvent('paywall_viewed', { locale: 'de', trigger: 'resume_limit' });

    assert.equal(typeof window.gtag, 'function');
    assert.equal(window.dataLayer?.length, 1);
    const command = window.dataLayer?.[0] as IArguments;
    assert.deepEqual(Array.from(command), [
      'event',
      'paywall_viewed',
      { locale: 'de', trigger: 'resume_limit', send_to: 'G-6XRD25H13C' },
    ]);
  });

  it('emits nothing when analytics consent is denied', () => {
    const calls = installBrowser(false);

    trackEvent('import_cta_clicked', { locale: 'de', placement: 'hero' });

    assert.deepEqual(calls, []);
  });

  it('emits nothing when analytics consent is absent or outdated', () => {
    for (const consent of ['absent', 'outdated'] as const) {
      const calls = installBrowser(consent);

      trackEvent('import_cta_clicked', { locale: 'de', placement: 'hero' });

      assert.deepEqual(calls, []);
    }
  });

  it('strips properties outside the event allowlist', () => {
    const calls = installBrowser(true);

    trackEvent('paywall_viewed', {
      locale: 'de',
      trigger: 'resume_limit',
      email: 'must-not-leave-browser@example.invalid',
    } as Parameters<typeof trackEvent<'paywall_viewed'>>[1]);

    assert.deepEqual(calls, [
      [
        'event',
        'paywall_viewed',
        { locale: 'de', trigger: 'resume_limit', send_to: 'G-6XRD25H13C' },
      ],
    ]);
  });
});
