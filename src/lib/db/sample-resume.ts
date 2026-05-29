import { db } from './index';
import { resumes, resumeSections } from './schema';

/**
 * Create a sample resume for a new user so the dashboard isn't empty.
 * Uses inline data — does not depend on seed or demo-fingerprint user.
 */
export async function createSampleResume(userId: string) {
  const resumeId = crypto.randomUUID();

  await db.insert(resumes).values({
    id: resumeId,
    userId,
    title: 'Muster-Lebenslauf - Sample Resume',
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
        text: 'Erfahrener Senior Frontend Entwickler mit über 6 Jahren Praxis im React-Ökosystem und modernen Web-Technologien. Erfolgreiche Leitung der Architektur und Frontend-Entwicklung für mehrere SaaS-Produkte, wobei die Ladezeiten um 60% reduziert werden konnten. Leidenschaftlich darin, komplexe Geschäftsanforderungen in saubere, wartbare und performante Benutzeroberflächen zu übersetzen.',
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
            company: 'Tech Solutions GmbH',
            position: 'Senior Frontend Entwickler',
            location: 'Berlin',
            startDate: '2022-03',
            endDate: null,
            current: true,
            description: 'Verantwortlich für die Architektur und Entwicklung der zentralen Kollaborations-Plattform.',
            highlights: [
              'Entwicklung einer Echtzeit-Kollaborations-Engine (CRDT-basiert) für 10.000+ gleichzeitige Nutzer',
              'Etablierung von Frontend-Performance-Monitoring, Reduzierung des LCP von 3.2s auf 1.1s',
              'Entwicklung einer internen Komponentenbibliothek (Micro-Frontend Architektur), was die Wiederverwendbarkeit um 40% steigerte',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'Innovate Digital',
            position: 'Frontend Entwickler',
            location: 'Hamburg',
            startDate: '2019-07',
            endDate: '2022-02',
            current: false,
            description: 'Entwicklung und Wartung einer E-Commerce Plattform und zugehöriger interner Entwicklertools.',
            highlights: [
              'Aufbau eines Plugin-Systems für das interne CMS, Unterstützung von 200+ Drittanbieter-Plugins',
              'Optimierung der Build-Pipeline (Webpack/Vite), Reduzierung der Build-Zeiten um das Dreifache',
              'Steigerung der Testabdeckung von 30% auf 85% (Jest/Cypress), Senkung der Fehlerrate um 50%',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'WebDev Agency',
            position: 'Junior Web Developer',
            location: 'München',
            startDate: '2018-06',
            endDate: '2019-06',
            current: false,
            description: 'Frontend-Entwicklung für Kundenprojekte im B2B-Bereich.',
            highlights: [
              'Eigenständiges Refactoring des Order-Management-Moduls mit React Hooks',
              'Erstellung wiederverwendbarer UI-Komponenten für zukünftige Kundenprojekte',
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
            institution: 'Technische Universität Berlin',
            degree: 'Master of Science',
            field: 'Informatik',
            location: 'Berlin',
            startDate: '2016-09',
            endDate: '2019-06',
            gpa: '1.2',
            highlights: ['Schwerpunkt: Web-Performance und Datenvisualisierung', 'Auszeichnung für herausragende Masterarbeit'],
          },
          {
            id: crypto.randomUUID(),
            institution: 'Ludwig-Maximilians-Universität',
            degree: 'Bachelor of Science',
            field: 'Informatik',
            location: 'München',
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
          { id: crypto.randomUUID(), name: 'Backend & DB', skills: ['Node.js', 'Docker', 'PostgreSQL', 'Figma'] },
        ],
      },
    },
    {
      type: 'projects',
      title: 'Projekte',
      sortOrder: 5,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            name: 'BewerbRadar Copilot',
            url: 'https://copilot.bewerbradar.de',
            startDate: '2024-10',
            endDate: '2025-02',
            description: 'Ein KI-gestützter Lebenslauf-Generator und Optimierungs-Tool mit Live-Vorschau und AI Chat.',
            technologies: ['Next.js', 'React 19', 'Tailwind CSS', 'Vercel AI SDK'],
            highlights: [
              'Implementierung von Streaming AI Responses für interaktive Lebenslauf-Bearbeitung',
              'Entwicklung professioneller Templates mit Echtzeit-PDF-Vorschau',
            ],
          },
        ],
      },
    },
    {
      type: 'qr_codes',
      title: 'QR-Codes',
      sortOrder: 6,
      content: {
        items: [],
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
}
