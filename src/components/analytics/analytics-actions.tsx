'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { trackEvent, type ImportCtaPlacement } from '@/lib/analytics';

interface TrackedImportLinkProps {
  children: ReactNode;
  placement: ImportCtaPlacement;
}

export function TrackedImportLink({ children, placement }: TrackedImportLinkProps) {
  const locale = useLocale();

  return (
    <Link
      href="/dashboard?action=import"
      onClick={() => trackEvent('import_cta_clicked', { locale, placement })}
    >
      {children}
    </Link>
  );
}

interface ConsentSettingsButtonProps {
  children: ReactNode;
  className?: string;
}

export function ConsentSettingsButton({ children, className }: ConsentSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('br_open_consent_modal'))}
      className={className}
    >
      {children}
    </button>
  );
}
