import { NextResponse } from 'next/server';
import { auth } from '@/auth-edge';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

// HTTP methods that mutate state and require CSRF validation
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default auth(async (req) => {
  const url = req.nextUrl.clone();
  const session = req.auth;

  // Handle CORS preflight (browser sends OPTIONS before cross-origin requests)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
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
    // Prevent caching of authenticated API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    // Content-Security-Policy for API responses (nonce for inline scripts if needed)
    response.headers.set('Content-Security-Policy', "default-src 'none'; img-src https:; frame-ancestors 'none'; base-uri 'none'");
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
