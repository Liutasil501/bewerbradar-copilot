import Image from 'next/image';
import { ConsentSettingsButton } from '@/components/analytics/analytics-actions';
import { Link } from '@/i18n/routing';
import { getLegalDocument, type LegalDocumentId } from '@/lib/legal/documents';

interface LegalDocumentPageProps {
  documentId: LegalDocumentId;
  locale: string;
}

const documentLinks: Array<{ id: LegalDocumentId; de: string; en: string }> = [
  { id: 'impressum', de: 'Impressum', en: 'Legal Notice' },
  { id: 'datenschutz', de: 'Datenschutz', en: 'Privacy' },
  { id: 'agb', de: 'Nutzungsbedingungen', en: 'Terms' },
  { id: 'widerruf', de: 'Widerruf', en: 'Withdrawal' },
];

export function LegalDocumentPage({ documentId, locale }: LegalDocumentPageProps) {
  const document = getLegalDocument(locale, documentId);
  const isEn = locale === 'en';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo-icon.svg" alt="" width={36} height={36} priority />
            <span className="text-sm font-semibold tracking-tight sm:text-base">BewerbRadar Copilot</span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            {isEn ? 'Back to product' : 'Zurück zum Produkt'}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-10 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            {isEn ? 'Legal information' : 'Rechtliche Informationen'}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{document.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            {document.description}
          </p>
          <p className="mt-4 text-xs text-zinc-400">
            {isEn ? 'Last updated' : 'Stand'}: {document.updated}
          </p>
        </div>

        <article className="space-y-10">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 whitespace-pre-line text-[15px] leading-7 text-zinc-700 dark:text-zinc-300"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2 pl-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc pl-1">{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="mt-14 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          {isEn
            ? 'Questions about these terms or your data? Contact info@bewerbradar.de.'
            : 'Fragen zu diesen Bedingungen oder Ihren Daten? Schreiben Sie an info@bewerbradar.de.'}
        </aside>

        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
          {documentLinks.map((item) => (
            <Link
              key={item.id}
              href={`/${item.id}`}
              aria-current={item.id === documentId ? 'page' : undefined}
              className={
                item.id === documentId
                  ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-500 underline-offset-4 hover:text-zinc-950 hover:underline dark:hover:text-white'
              }
            >
              {isEn ? item.en : item.de}
            </Link>
          ))}
          <ConsentSettingsButton className="text-zinc-500 underline-offset-4 hover:text-zinc-950 hover:underline dark:hover:text-white">
            {isEn ? 'Cookie Settings' : 'Cookie-Einstellungen'}
          </ConsentSettingsButton>
        </nav>
      </main>
    </div>
  );
}
