import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Professionelle Lebensläufe & Anschreiben mit KI`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Erstellen Sie überzeugende, ATS-optimierte Lebensläufe und passende Anschreiben in Minuten. Mit 40+ Vorlagen, KI-Optimierung und individuellem Bewerbungstraining.',
  keywords: [
    'Lebenslauf erstellen',
    'KI Lebenslauf Generator',
    'Anschreiben schreiben',
    'ATS Lebenslauf Vorlagen',
    'Bewerbungsschreiben KI',
    'Vorstellungsgespräch üben',
    'Lebenslauf Vorlagen',
    'AI resume builder',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Professionelle Lebensläufe & Anschreiben mit KI`,
    description:
      'Erstellen Sie überzeugende, ATS-optimierte Lebensläufe und passende Anschreiben in Minuten. Mit 40+ Vorlagen, KI-Optimierung und individuellem Bewerbungstraining.',
    locale: 'de_DE',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Professionelle Lebensläufe & Anschreiben mit KI`,
    description:
      'Erstellen Sie überzeugende, ATS-optimierte Lebensläufe und passende Anschreiben in Minuten. Mit 40+ Vorlagen, KI-Optimierung und individuellem Bewerbungstraining.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
