export type LegalDocumentId = 'impressum' | 'datenschutz' | 'agb' | 'widerruf';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}
