import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.interview' });

  return buildPageMetadata({
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    locale,
    path: '/interview',
  });
}

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <SettingsDialog />
    </div>
  );
}
