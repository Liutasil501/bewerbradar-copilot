import type { Metadata } from 'next';
import { defaultLocale, type Locale } from '@/i18n/config';
import {
  SITE_NAME,
  SITE_URL,
  getAbsoluteUrl,
  getLocalizedUrl,
  getLanguageAlternates,
} from './config';

export interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: string | string[];
  locale?: string;
  path?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords,
    locale = defaultLocale,
    path = '',
    noIndex = false,
    ogImage = '/opengraph-image',
    ogType = 'website',
  } = options;

  const validLocale = (locale === 'en' ? 'en' : 'de') as Locale;
  const canonicalUrl = getLocalizedUrl(validLocale, path);
  const alternates = getLanguageAlternates(path);
  const fullOgImageUrl = ogImage.startsWith('http') ? ogImage : getAbsoluteUrl(ogImage);

  if (noIndex) {
    return {
      title,
      description,
      metadataBase: new URL(SITE_URL),
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
    };
  }

  const keywordsArray = Array.isArray(keywords)
    ? keywords
    : typeof keywords === 'string'
      ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined;

  return {
    title,
    description,
    keywords: keywordsArray,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: validLocale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: validLocale === 'de' ? ['en_US'] : ['de_DE'],
      type: ogType,
      images: [
        {
          url: fullOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildPrivateMetadata(title = 'BewerbRadar Copilot'): Metadata {
  return {
    title,
    metadataBase: new URL(SITE_URL),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}
