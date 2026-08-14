import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LandingPage } from '@/components/landing/landing-page';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  return buildPageMetadata({
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    locale,
    path: '',
  });
}

export default function HomePage() {
  return <LandingPage />;
}
