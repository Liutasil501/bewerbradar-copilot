import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Root asset and metadata routes that must never be redirected to locale prefixes
const ROOT_METADATA_PATHS = new Set([
  '/opengraph-image',
  '/twitter-image',
  '/icon',
  '/apple-icon',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

// Public paths that don't require authentication (relative to locale prefix)
const PUBLIC_PATHS = [
  '/', // Landing page
  '/login', // Login page
  '/share', // Public share links
  '/templates', // Public templates showcase
  '/impressum',
  '/datenschutz',
  '/agb',
  '/widerruf',
];

function isPublicPath(pathname: string): boolean {
  // Strip an exact supported locale prefix: /en/dashboard -> /dashboard, /de/ -> /
  const withoutLocale = pathname.replace(/^\/(en|de)(?=\/|$)/, '') || '/';
  return PUBLIC_PATHS.some((publicPath) => {
    if (publicPath === '/') return withoutLocale === '/';
    if (publicPath === '/share') {
      return withoutLocale === publicPath || withoutLocale.startsWith(`${publicPath}/`);
    }

    return withoutLocale === publicPath;
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n and auth completely for root metadata/asset routes
  if (
    ROOT_METADATA_PATHS.has(pathname) ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/twitter-image')
  ) {
    return NextResponse.next();
  }

  // Always run i18n middleware for app pages
  const response = intlMiddleware(request);

  // Only check auth when OAuth is enabled
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  if (!authEnabled) return response;

  // Skip auth check for public paths and API routes
  if (pathname.startsWith('/api/')) return response;
  if (isPublicPath(pathname)) return response;

  // Check for NextAuth session token
  const token =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  if (!token) {
    // Determine locale from the path or default
    const localeMatch = pathname.match(/^\/(en|de)/);
    const locale = localeMatch ? localeMatch[1] : 'de';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|opengraph-image|twitter-image|icon|apple-icon|favicon\\.ico|.*\\..*).*)'],
};
