'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { ResumePreview } from '@/components/preview/resume-preview';
import type { Resume } from '@/types/resume';

const FEATURED_TEMPLATES = [
  { id: 'modern', labelKey: 'dashboard.templateModern' },
  { id: 'creative', labelKey: 'dashboard.templateCreative' },
  { id: 'two-column', labelKey: 'dashboard.templateTwoColumn' },
  { id: 'elegant', labelKey: 'dashboard.templateElegant' },
] as const;

// Stable date to avoid SSR/client hydration mismatch
const MOCK_DATE = new Date('2025-01-01T00:00:00Z');

function buildMockResume(template: string, tm: (key: string) => string, ts: (key: string) => string): Resume {
  return ({
    id: 'mock',
    userId: 'mock',
    title: 'Sample Resume',
    template,
    themeConfig: {
      primaryColor: '#1a1a1a',
      accentColor: '#3b82f6',
      fontFamily: 'Inter',
      fontSize: 'medium',
      lineSpacing: 1.5,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      sectionSpacing: 16,
    },
    isDefault: false,
    language: 'en',
    sections: [
      {
        id: 's1', resumeId: 'mock', type: 'personal_info', title: ts('personal_info'), sortOrder: 0, visible: true,
        content: {
          fullName: 'Max Mustermann', jobTitle: tm('jobTitle'),
          email: 'max@example.com', phone: '+49 170 1234567',
          location: tm('location'), website: 'https://maxmustermann.dev',
          linkedin: 'linkedin.com/in/maxmustermann', github: 'github.com/maxmustermann',
        },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
      {
        id: 's2', resumeId: 'mock', type: 'summary', title: ts('summary'), sortOrder: 1, visible: true,
        content: { text: tm('summary') },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
      {
        id: 's3', resumeId: 'mock', type: 'work_experience', title: ts('work_experience'), sortOrder: 2, visible: true,
        content: {
          items: [
            { id: 'w1', company: tm('experience.company1'), position: tm('jobTitle'), location: tm('location'), startDate: '2021-03', endDate: null, current: true, description: tm('experience.description1'), highlights: [tm('experience.highlight1_1'), tm('experience.highlight1_2')] },
            { id: 'w2', company: tm('experience.company2'), position: 'Software Engineer', location: 'Remote', startDate: '2018-06', endDate: '2021-02', current: false, description: tm('experience.description2'), highlights: [tm('experience.highlight2_1'), tm('experience.highlight2_2')] },
          ],
        },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
      {
        id: 's4', resumeId: 'mock', type: 'education', title: ts('education'), sortOrder: 3, visible: true,
        content: {
          items: [{ id: 'e1', institution: tm('education.institution'), degree: tm('education.degree'), field: tm('education.field'), location: tm('education.location'), startDate: '2014-09', endDate: '2018-05', gpa: '3.8', highlights: [tm('education.highlight1'), tm('education.highlight2')] }],
        },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
      {
        id: 's5', resumeId: 'mock', type: 'skills', title: ts('skills'), sortOrder: 4, visible: true,
        content: {
          categories: [
            { id: 'sk1', name: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'] },
            { id: 'sk2', name: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis'] },
            { id: 'sk3', name: 'DevOps', skills: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'] },
          ],
        },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
      {
        id: 's6', resumeId: 'mock', type: 'projects', title: ts('projects'), sortOrder: 5, visible: true,
        content: {
          items: [{ id: 'p1', name: 'OpenSource CMS', url: 'https://github.com/maxmustermann/cms', description: tm('projects.description'), technologies: ['Next.js', 'GraphQL', 'PostgreSQL'], highlights: [tm('projects.highlight1'), tm('projects.highlight2')] }],
        },
        createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
      },
    ],
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
  }) as Resume;
}

function TemplateCard({ template, label, tm, ts }: { template: string; label: string; tm: (key: string) => string; ts: (key: string) => string }) {
  const mockResume = buildMockResume(template, tm, ts);

  return (
    <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-zinc-900/50">
      <div className="relative h-[320px] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <div
          className="absolute left-1/2 top-1/2"
          style={{ width: '794px', transform: 'translate(-50%, -50%) scale(0.28)', transformOrigin: 'center center' }}
        >
          <ResumePreview resume={mockResume} />
        </div>
      </div>
      <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
      </div>
    </div>
  );
}

export function TemplateShowcaseSection() {
  const t = useTranslations('landing.templates');
  const tGlobal = useTranslations();
  const tm = useTranslations('mockResume');
  const ts = useTranslations('sections');

  return (
    <section
      id="templates"
      className="bg-zinc-50 px-4 py-24 sm:px-6 sm:py-32 lg:px-8 dark:bg-zinc-900/50"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            {t('title')}
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Mobile horizontal scroll */}
        <div
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory sm:hidden [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEATURED_TEMPLATES.map(({ id, labelKey }) => (
            <div key={id} className="w-[280px] flex-shrink-0 snap-center">
              <TemplateCard template={id} label={tGlobal(labelKey)} tm={tm} ts={ts} />
            </div>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_TEMPLATES.map(({ id, labelKey }) => (
            <TemplateCard key={id} template={id} label={tGlobal(labelKey)} tm={tm} ts={ts} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand dark:text-brand dark:hover:text-brand"
          >
            {t('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
