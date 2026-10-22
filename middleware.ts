import { next } from '@vercel/functions';

const BOT_AGENTS =
  /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slurp|duckduckbot|embedly|quora link preview|outbrain|pinterest|applebot|redditbot|chrome-lighthouse|google-structured-data-testing-tool|telegrambot|whatsapp|prerender/i;

const EXCLUDED_PATHS = [
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export const config = {
  matcher: ['/((?!assets/|api/|robots\\.txt|sitemap\\.xml|favicon).*)'],
};

export default async function middleware(request: Request) {
  if (request.headers.get('x-prerender')) {
    return next();
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_AGENTS.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  if (/\.\w{2,5}$/.test(url.pathname) || EXCLUDED_PATHS.some((p) => url.pathname.startsWith(p))) {
    return next();
  }

  const token = process.env.PRERENDER_TOKEN;
  if (!token) {
    return next();
  }

  const prerenderResponse = await fetch(`https://service.prerender.io/${url.toString()}`, {
    headers: {
      'X-Prerender-Token': token,
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  const headers = new Headers();
  headers.set(
    'Content-Type',
    prerenderResponse.headers.get('Content-Type') ?? 'text/html; charset=utf-8',
  );
  headers.set(
    'Cache-Control',
    prerenderResponse.headers.get('Cache-Control') ?? 'public, max-age=86400',
  );

  return new Response(prerenderResponse.body, {
    status: prerenderResponse.status,
    headers,
  });
}
