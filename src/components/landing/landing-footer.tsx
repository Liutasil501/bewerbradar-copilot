import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ConsentSettingsButton } from '@/components/analytics/analytics-actions';

export function LandingFooter() {
  const t = useTranslations('landing.footer');
  const year = new Date().getFullYear();

  const columns = [
    {
      titleKey: 'product.title' as const,
      links: [
        { key: 'product.features' as const, href: '#features' },
        { key: 'product.templates' as const, href: '/templates' },
      ],
    },
    {
      titleKey: 'resources.title' as const,
      links: [
        { key: 'resources.resumeTips' as const, href: '#' },
        { key: 'resources.examples' as const, href: '#' },
      ],
    },
    {
      titleKey: 'legal.title' as const,
      links: [
        { key: 'legal.impressum' as const, href: 'https://bewerbradar.de/impressum' },
        { key: 'legal.privacy' as const, href: 'https://bewerbradar.de/datenschutz' },
        { key: 'legal.terms' as const, href: 'https://bewerbradar.de/agb' },
        { key: 'legal.consentSettings' as const, href: '#consent', isConsentAction: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Image src="/logo.svg" alt="BewerbRadar Copilot" width={100} height={30} />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t('tagline')}
              </p>
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.titleKey}>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(col.titleKey)}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.key}>
                      {'isConsentAction' in link && link.isConsentAction ? (
                        <ConsentSettingsButton
                          className="block text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                        >
                          {t(link.key)}
                        </ConsentSettingsButton>
                      ) : link.href.startsWith('#') ? (
                        <a
                          href={link.href}
                          className="block text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                          {t(link.key)}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="block text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                          {t(link.key)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-200 py-6 dark:border-zinc-800">
          <p suppressHydrationWarning className="text-center text-sm text-zinc-400 dark:text-zinc-500">
            {t('copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
