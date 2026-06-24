import { NextResponse } from 'next/server';
import { auth } from '@/auth-edge';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  if (!origin) return '';

  const allowed = process.env.NEXT_PUBLIC_URL
    || process.env.NEXTAUTH_URL
    || 'http://localhost:3000';
  if (origin === allowed || origin.endsWith('.vercel.app')) return origin;
  return allowed;
}

export default auth(async (req) => {
  const url = req.nextUrl.clone();
  const session = req.auth;

  if (req.method === 'OPTIONS') {
    const allowedOrigin = getAllowedOrigin(req);
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    });
  }

  // API routes
  if (url.pathname.startsWith('/api/')) {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CSRF validation for state-changing authenticated requests
    if (STATE_CHANGING_METHODS.has(req.method)) {
      if (!validateOrigin(req, { strict: true })) {
        return csrfErrorResponse();
      }
    }

    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  // Page routes: redirect to login
  if (!session?.user?.id) {
    const loginUrl = new URL('/auth/login', req.url);
    const callbackUrl = url.pathname.startsWith('/') && !url.pathname.startsWith('//')
      ? url.pathname
      : '/profile';
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/profile/:path*',
    '/api/profile/:path*',
    '/api/progress/:path*',
  ],
};
