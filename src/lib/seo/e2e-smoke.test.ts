import { describe, it } from 'node:test';
import assert from 'node:assert';
import deMessages from '../../../messages/de.json';
import enMessages from '../../../messages/en.json';
import { SITE_NAME } from './config';
import { buildPageMetadata } from './metadata';

describe('Rendered SEO Metadata & Title Integrity', () => {
  it('formats titles cleanly without duplicate brand name in DE and EN', () => {
    const deSeo = deMessages.seo;
    const enSeo = enMessages.seo;

    // Home titles contain brand exactly once
    const deHomeTitle = deSeo.home.title;
    const enHomeTitle = enSeo.home.title;
    assert.strictEqual(deHomeTitle.split(SITE_NAME).length - 1, 1);
    assert.strictEqual(enHomeTitle.split(SITE_NAME).length - 1, 1);

    // Feature and legal titles do NOT contain the brand (root template appends it)
    const pages = ['templates', 'impressum', 'agb', 'datenschutz', 'widerruf'] as const;
    for (const page of pages) {
      const deTitle = deSeo[page].title;
      const enTitle = enSeo[page].title;
      assert.strictEqual(
        deTitle.includes(SITE_NAME),
        false,
        `DE ${page} title should not include brand: ${deTitle}`
      );
      assert.strictEqual(
        enTitle.includes(SITE_NAME),
        false,
        `EN ${page} title should not include brand: ${enTitle}`
      );

      // Verify buildPageMetadata produces clean unbranded title for template
      const deMeta = buildPageMetadata({
        title: deTitle,
        description: deSeo[page].description,
        locale: 'de',
        path: `/${page}`,
      });
      assert.strictEqual(deMeta.title, deTitle);
      assert.strictEqual(deMeta.openGraph?.title, `${deTitle} | ${SITE_NAME}`);
    }
  });

  it('uses standard ASCII hyphens across all SEO metadata dictionaries', () => {
    const deSeo = deMessages.seo;
    const enSeo = enMessages.seo;

    const checkNoTypographicDashes = (str: string, label: string) => {
      assert.ok(!str.includes('–'), `Found en-dash in ${label}: ${str}`);
      assert.ok(!str.includes('—'), `Found em-dash in ${label}: ${str}`);
    };

    checkNoTypographicDashes(deSeo.defaultTitle, 'DE defaultTitle');
    checkNoTypographicDashes(deSeo.home.title, 'DE home.title');
    checkNoTypographicDashes(enSeo.defaultTitle, 'EN defaultTitle');
    checkNoTypographicDashes(enSeo.home.title, 'EN home.title');
  });
});
