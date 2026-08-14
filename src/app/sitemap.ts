import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';
import { SITE_URL, PUBLIC_ROUTES } from '@/lib/seo/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    const isRoot = route === '';
    const priority = isRoot
      ? 1.0
      : route === '/templates'
        ? 0.9
        : 0.4;
    const changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] =
      isRoot || route === '/templates'
        ? 'weekly'
        : 'monthly';

    for (const locale of locales) {
      const url = `${SITE_URL}/${locale}${route}`;
      const languages: Record<string, string> = {};
      for (const altLocale of locales) {
        languages[altLocale] = `${SITE_URL}/${altLocale}${route}`;
      }
      languages['x-default'] = `${SITE_URL}/${defaultLocale}${route}`;

      entries.push({
        url,
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages,
        },
      });
    }
  }

  return entries;
}
