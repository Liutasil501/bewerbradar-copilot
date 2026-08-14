import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { SITE_NAME, SITE_URL } from '@/lib/seo/config';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-55XL7PR4';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Professionelle Lebensläufe & Anschreiben mit KI`,
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
    title: `${SITE_NAME} – Professionelle Lebensläufe & Anschreiben mit KI`,
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
    title: `${SITE_NAME} – Professionelle Lebensläufe & Anschreiben mit KI`,
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
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <Script
          id="google-consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
              try {
                var stored = localStorage.getItem('br_cookie_consent');
                if (stored) {
                  var parsed = JSON.parse(stored);
                  if (
                    parsed &&
                    parsed.analytics === true &&
                    parsed.version === 1 &&
                    typeof parsed.timestamp === 'number'
                  ) {
                    gtag('consent', 'update', {
                      analytics_storage: 'granted',
                      ad_storage: 'denied',
                      ad_user_data: 'denied',
                      ad_personalization: 'denied'
                    });
                  }
                }
              } catch(e) {}
            `,
          }}
        />
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var b=localStorage.getItem('bewerbradar-brand');if(b==='boss'){b='mint';localStorage.setItem('bewerbradar-brand','mint');}else if(b==='jade'){b='blue';localStorage.setItem('bewerbradar-brand','blue');}if(b==='blue'||b==='pink'){document.documentElement.setAttribute('data-brand',b);}}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
