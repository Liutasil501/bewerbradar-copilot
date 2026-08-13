import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { getLegalDocument } from '@/lib/legal/documents';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const document = getLegalDocument(locale, 'datenschutz');
  return { title: `${document.title} | BewerbRadar Copilot`, description: document.description };
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalDocumentPage documentId="datenschutz" locale={locale} />;
}
