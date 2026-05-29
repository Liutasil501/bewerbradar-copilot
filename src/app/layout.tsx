import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const appName = process.env.APP_NAME || 'BewerbRadar';

export const metadata: Metadata = {
  title: `${appName} - AI Resume Builder`,
  description: 'AI-powered intelligent resume builder with drag-and-drop editor',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
