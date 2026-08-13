import { deDocuments } from './documents.de';
import { enDocuments } from './documents.en';
import type { LegalDocument, LegalDocumentId } from './types';

export type { LegalDocumentId } from './types';

export function getLegalDocument(locale: string, id: LegalDocumentId): LegalDocument {
  return (locale === 'en' ? enDocuments : deDocuments)[id];
}
