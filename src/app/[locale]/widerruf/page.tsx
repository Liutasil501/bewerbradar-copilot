import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { getLegalDocument } from '@/lib/legal/documents';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const document = getLegalDocument(locale, 'widerruf');
  return buildPageMetadata({
    title: document.title,
    description: document.description,
    locale,
    path: '/widerruf',
  });
}

export default async function WithdrawalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalDocumentPage documentId="widerruf" locale={locale} />;
}
