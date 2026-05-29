import { users, resumes, resumeSections } from './schema';

/**
 * Seed a demo-fingerprint user with a sample resume.
 * Called automatically when the database is empty.
 */
export async function seedDemoUser(db: any) {
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: 'Max Mustermann',
    authType: 'fingerprint',
    fingerprint: 'demo-fingerprint',
  });

  const resumeId = crypto.randomUUID();
  await db.insert(resumes).values({
    id: resumeId,
    userId,
    title: 'Beispiel Lebenslauf - Max Mustermann',
    template: 'modern',
    language: 'de',
  });

  const sections = [
    {
      type: 'personal_info',
      title: 'Persönliche Daten',
      sortOrder: 0,
      content: {
        fullName: 'Max Mustermann',
        jobTitle: 'Senior Frontend Entwickler',
        email: 'max.mustermann@example.com',
        phone: '+49 170 1234567',
        location: 'Berlin, Deutschland',
        website: 'https://maxmustermann.dev',
      },
    },
    {
      type: 'summary',
      title: 'Profil',
      sortOrder: 1,
      content: {
        text: 'Erfahrener Senior Frontend Entwickler mit über 6 Jahren Erfahrung, spezialisiert auf das React-Ökosystem und moderne Web-Technologien. Erfolgreiche Leitung der Frontend-Architektur für mehrere große SaaS-Produkte, wobei die Ladezeiten um 60% reduziert werden konnten. Leidenschaftlich darin, komplexe Anforderungen in elegante, skalierbare Lösungen zu verwandeln.',
      },
    },
    {
      type: 'work_experience',
      title: 'Berufserfahrung',
      sortOrder: 2,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            company: 'TechCorp GmbH',
            position: 'Senior Frontend Entwickler',
            location: 'Berlin',
            startDate: '2022-03',
            endDate: null,
            current: true,
            description: 'Verantwortlich für die Architektur und Entwicklung der Kollaborations-Features.',
            highlights: [
              'Entwicklung einer Echtzeit-Kollaborations-Engine auf Basis von CRDT, die tausende Nutzer gleichzeitig unterstützt',
              'Einführung eines Performance-Monitorings, Verbesserung der LCP Metrik von 3.2s auf 1.1s',
              'Design einer Micro-Frontend Architektur für die UI-Komponentenbibliothek',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'WebSolutions AG',
            position: 'Frontend Entwickler',
            location: 'München',
            startDate: '2019-07',
            endDate: '2022-02',
            current: false,
            description: 'Entwicklung und Wartung der E-Commerce Plattform.',
            highlights: [
              'Aufbau eines Plugin-Systems, das über 200 Drittanbieter-Integrationen unterstützt',
              'Optimierung der Build-Pipeline, was die Build-Zeit um das Dreifache verkürzte',
              'Erhöhung der Testabdeckung von 30% auf 85%',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'StartupX',
            position: 'Junior Frontend Entwickler',
            location: 'Hamburg',
            startDate: '2018-06',
            endDate: '2019-06',
            current: false,
            description: 'Frontend-Entwicklung für das B2B-Portal.',
            highlights: [
              'Eigenständiges Refactoring des Bestell-Moduls mit React Hooks',
              'Entwicklung wiederverwendbarer Tabellen- und Formular-Komponenten',
            ],
          },
        ],
      },
    },
    {
      type: 'education',
      title: 'Ausbildung',
      sortOrder: 3,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            institution: 'Technische Universität München',
            degree: 'Master of Science',
            field: 'Informatik',
            location: 'München',
            startDate: '2016-09',
            endDate: '2019-06',
            gpa: '1.2',
            highlights: ['Schwerpunkt: Web Performance & Visualisierung', 'Ausgezeichnete Masterarbeit'],
          },
          {
            id: crypto.randomUUID(),
            institution: 'Humboldt-Universität',
            degree: 'Bachelor of Science',
            field: 'Medieninformatik',
            location: 'Berlin',
            startDate: '2012-09',
            endDate: '2016-06',
            gpa: '1.5',
            highlights: [],
          },
        ],
      },
    },
    {
      type: 'skills',
      title: 'Fähigkeiten',
      sortOrder: 4,
      content: {
        categories: [
          { id: crypto.randomUUID(), name: 'Frontend', skills: ['React', 'Next.js', 'Vue 3', 'TypeScript'] },
          { id: crypto.randomUUID(), name: 'Tools', skills: ['Webpack', 'Vite', 'Turborepo', 'CI/CD'] },
          { id: crypto.randomUUID(), name: 'Sonstiges', skills: ['Node.js', 'Docker', 'PostgreSQL', 'Figma'] },
        ],
      },
    },
    {
      type: 'projects',
      title: '项目经历',
      sortOrder: 5,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            name: 'BewerbRadar Copilot 简历助手',
            url: 'https://copilot.bewerbradar.de',
            startDate: '2024-10',
            endDate: '2025-02',
            description: '基于 AI 的智能简历生成与优化工具，支持多模板、实时预览和 AI 对话式编辑。',
            technologies: ['Next.js', 'React 19', 'Tailwind CSS', 'Vercel AI SDK'],
            highlights: [
              '使用 AI SDK 实现流式对话与简历内容自动填充',
              '设计三套专业简历模板，支持实时预览与 PDF 导出',
            ],
          },
        ],
      },
    },
  ];

  for (const section of sections) {
    await db.insert(resumeSections).values({
      id: crypto.randomUUID(),
      resumeId,
      ...section,
    } as any);
  }

  console.log('[DB] Auto-seed complete: demo user created');
}
