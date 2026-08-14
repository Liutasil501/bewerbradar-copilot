import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SITE_URL,
  SITE_NAME,
  PUBLIC_ROUTES,
  getAbsoluteUrl,
  getLocalizedUrl,
  getLanguageAlternates,
} from './config';
import { buildPageMetadata, buildPrivateMetadata } from './metadata';

describe('SEO Configuration & Helpers', () => {
  it('defines correct SITE_URL without trailing slash', () => {
    assert.strictEqual(SITE_URL.endsWith('/'), false);
    assert.strictEqual(SITE_URL.startsWith('http'), true);
  });

  it('formats absolute URLs correctly', () => {
    assert.strictEqual(getAbsoluteUrl('/'), SITE_URL);
    assert.strictEqual(getAbsoluteUrl('templates'), `${SITE_URL}/templates`);
  });

  it('formats localized URLs correctly for de and en', () => {
    assert.strictEqual(getLocalizedUrl('de', ''), `${SITE_URL}/de`);
    assert.strictEqual(getLocalizedUrl('de', '/templates'), `${SITE_URL}/de/templates`);
    assert.strictEqual(getLocalizedUrl('en', 'templates'), `${SITE_URL}/en/templates`);
  });

  it('generates canonical and hreflang alternates including x-default', () => {
    const alternates = getLanguageAlternates('/templates');
    assert.strictEqual(alternates.canonical, `${SITE_URL}/de/templates`);
    assert.strictEqual(alternates.languages.de, `${SITE_URL}/de/templates`);
    assert.strictEqual(alternates.languages.en, `${SITE_URL}/en/templates`);
    assert.strictEqual(alternates.languages['x-default'], `${SITE_URL}/de/templates`);
  });

  it('lists only verified public indexable routes', () => {
    assert.deepStrictEqual(PUBLIC_ROUTES, [
      '',
      '/templates',
      '/impressum',
      '/agb',
      '/datenschutz',
      '/widerruf',
    ]);
  });
});

describe('Page Metadata Builder', () => {
  it('builds full public metadata with OpenGraph and Twitter tags for unbranded child title', () => {
    const meta = buildPageMetadata({
      title: '40+ Vorlagen',
      description: 'Test Beschreibung',
      locale: 'de',
      path: '/templates',
      keywords: 'cv, vorlagen',
    });

    assert.strictEqual(meta.title, '40+ Vorlagen');
    assert.strictEqual(meta.description, 'Test Beschreibung');
    assert.deepStrictEqual(meta.keywords, ['cv', 'vorlagen']);
    assert.strictEqual(meta.alternates?.canonical, `${SITE_URL}/de/templates`);
    assert.strictEqual(
      (meta.alternates?.languages as Record<string, string>)?.de,
      `${SITE_URL}/de/templates`
    );
    assert.strictEqual(
      (meta.alternates?.languages as Record<string, string>)?.en,
      `${SITE_URL}/en/templates`
    );
    assert.strictEqual(meta.openGraph?.title, `40+ Vorlagen | ${SITE_NAME}`);
    assert.strictEqual(meta.openGraph?.siteName, SITE_NAME);
    assert.strictEqual(meta.openGraph?.locale, 'de_DE');
    assert.strictEqual(
      (meta.twitter as { card?: string })?.card,
      'summary_large_image'
    );
  });

  it('builds absolute title when full brand title is provided', () => {
    const meta = buildPageMetadata({
      title: `${SITE_NAME} - Professionelle Lebensläufe`,
      description: 'Test Beschreibung',
      locale: 'de',
      path: '',
    });

    assert.deepStrictEqual(meta.title, { absolute: `${SITE_NAME} - Professionelle Lebensläufe` });
    assert.strictEqual(meta.openGraph?.title, `${SITE_NAME} - Professionelle Lebensläufe`);
  });

  it('builds private metadata with strict noindex and nofollow', () => {
    const meta = buildPrivateMetadata('Dashboard');
    assert.deepStrictEqual(meta.title, { absolute: 'Dashboard' });
    const robots = meta.robots as { index?: boolean; follow?: boolean; googleBot?: { index?: boolean; follow?: boolean } };
    assert.strictEqual(robots?.index, false);
    assert.strictEqual(robots?.follow, false);
    assert.strictEqual(robots?.googleBot?.index, false);
    assert.strictEqual(robots?.googleBot?.follow, false);
  });
});
