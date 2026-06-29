import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Supported locales
  locales: ['en', 'es', 'fr'],

  // Default locale if no matching prefix is detected
  defaultLocale: 'en',
});

export const config = {
  // Match all paths except internal api, static assets (_next), and favicons
  matcher: ['/', '/(en|es|fr)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};

