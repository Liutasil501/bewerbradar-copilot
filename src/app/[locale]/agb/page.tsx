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
  const document = getLegalDocument(locale, 'agb');
  return buildPageMetadata({
    title: document.title,
    description: document.description,
    locale,
    path: '/agb',
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalDocumentPage documentId="agb" locale={locale} />;
}
