import { describe, it } from 'node:test';
import assert from 'node:assert';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { SITE_URL } from '@/lib/seo/config';
import { buildPageMetadata, buildPrivateMetadata } from '@/lib/seo/metadata';

describe('Technical SEO Smoke Test', () => {
  it('generates a clean sitemap.xml with exactly the indexable public routes', async () => {
    const entries = await sitemap();

    // 7 routes * 2 locales (de, en) = 14 entries
    assert.strictEqual(entries.length, 14);

    const urls = entries.map((e) => e.url);

    // Verify all expected public URLs exist
    assert.ok(urls.includes(`${SITE_URL}/de`));
    assert.ok(urls.includes(`${SITE_URL}/en`));
    assert.ok(urls.includes(`${SITE_URL}/de/templates`));
    assert.ok(urls.includes(`${SITE_URL}/en/templates`));
    assert.ok(urls.includes(`${SITE_URL}/de/interview`));
    assert.ok(urls.includes(`${SITE_URL}/en/interview`));
    assert.ok(urls.includes(`${SITE_URL}/de/agb`));
    assert.ok(urls.includes(`${SITE_URL}/en/agb`));
    assert.ok(urls.includes(`${SITE_URL}/de/datenschutz`));
    assert.ok(urls.includes(`${SITE_URL}/en/datenschutz`));
    assert.ok(urls.includes(`${SITE_URL}/de/widerruf`));
    assert.ok(urls.includes(`${SITE_URL}/en/widerruf`));
    assert.ok(urls.includes(`${SITE_URL}/de/impressum`));
    assert.ok(urls.includes(`${SITE_URL}/en/impressum`));

    // Verify NO private routes are in the sitemap
    for (const url of urls) {
      assert.ok(!url.includes('/dashboard'), `Sitemap must not contain /dashboard: ${url}`);
      assert.ok(!url.includes('/editor'), `Sitemap must not contain /editor: ${url}`);
      assert.ok(!url.includes('/login'), `Sitemap must not contain /login: ${url}`);
      assert.ok(!url.includes('/preview'), `Sitemap must not contain /preview: ${url}`);
      assert.ok(!url.includes('/share'), `Sitemap must not contain /share: ${url}`);
      assert.ok(!url.includes('/interview/new'), `Sitemap must not contain /interview/new: ${url}`);
      assert.ok(!url.includes('/linkedin-photo'), `Sitemap must not contain /linkedin-photo: ${url}`);
      assert.ok(!url.includes('/api/'), `Sitemap must not contain /api: ${url}`);
    }

    // Verify alternates structure
    for (const entry of entries) {
      assert.ok(entry.alternates?.languages?.de);
      assert.ok(entry.alternates?.languages?.en);
      assert.strictEqual(
        (entry.alternates?.languages as Record<string, string>)['x-default'],
        entry.alternates?.languages?.de
      );
    }
  });

  it('generates robots.txt with disallows for all private routes and correct sitemap declaration', () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;

    assert.strictEqual(r.sitemap, `${SITE_URL}/sitemap.xml`);
    assert.strictEqual(r.host, SITE_URL);

    const disallows = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    assert.ok(disallows.includes('/de/dashboard'));
    assert.ok(disallows.includes('/en/dashboard'));
    assert.ok(disallows.includes('/de/editor'));
    assert.ok(disallows.includes('/en/editor'));
    assert.ok(disallows.includes('/de/login'));
    assert.ok(disallows.includes('/en/login'));
    assert.ok(disallows.includes('/de/preview'));
    assert.ok(disallows.includes('/en/preview'));
    assert.ok(disallows.includes('/de/share'));
    assert.ok(disallows.includes('/en/share'));
    assert.ok(disallows.includes('/api/'));
  });

  it('builds rich, non-generic metadata for landing and feature pages', () => {
    const deHome = buildPageMetadata({
      title: 'BewerbRadar Copilot – Professionelle Lebensläufe & Anschreiben mit KI',
      description:
        'Erstellen Sie überzeugende, ATS-optimierte Lebensläufe und maßgeschneiderte Anschreiben in Minuten. Mit 40+ Vorlagen, KI-Optimierung und individuellem Bewerbungstraining.',
      locale: 'de',
      path: '',
    });

    assert.ok(!deHome.title?.toString().includes('AI Resume Builder'));
    assert.strictEqual(deHome.alternates?.canonical, `${SITE_URL}/de`);
    assert.strictEqual(
      (deHome.alternates?.languages as Record<string, string>)?.de,
      `${SITE_URL}/de`
    );
    assert.strictEqual(
      (deHome.alternates?.languages as Record<string, string>)?.en,
      `${SITE_URL}/en`
    );
    assert.strictEqual(
      (deHome.alternates?.languages as Record<string, string>)?.['x-default'],
      `${SITE_URL}/de`
    );
    assert.strictEqual(deHome.openGraph?.locale, 'de_DE');

    const enHome = buildPageMetadata({
      title: 'BewerbRadar Copilot – Professional AI Resume & Cover Letter Builder',
      description:
        'Create tailored, ATS-ready resumes and job-matching cover letters in minutes. Featuring 40+ templates, AI refinement, and interactive interview coaching.',
      locale: 'en',
      path: '',
    });

    assert.strictEqual(enHome.alternates?.canonical, `${SITE_URL}/en`);
    assert.strictEqual(enHome.openGraph?.locale, 'en_US');
  });

  it('guarantees noindex on all private metadata builders', () => {
    const privateMeta = buildPrivateMetadata('User Dashboard');
    const robots = privateMeta.robots as {
      index?: boolean;
      follow?: boolean;
      googleBot?: { index?: boolean; follow?: boolean };
    };

    assert.strictEqual(robots?.index, false);
    assert.strictEqual(robots?.follow, false);
    assert.strictEqual(robots?.googleBot?.index, false);
    assert.strictEqual(robots?.googleBot?.follow, false);
  });
});
