import type { Metadata } from 'next';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPrivateMetadata('Anmelden | BewerbRadar Copilot');

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f5] px-3 py-4 dark:bg-zinc-950 sm:px-6 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(15,118,110,0.1),transparent_34%)] dark:opacity-40" />
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0f766e 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_28px_90px_-35px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}
