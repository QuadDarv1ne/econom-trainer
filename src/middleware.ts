import { NextResponse } from 'next/server';
import { auth } from '@/auth-edge';

export default auth(async (req) => {
  const url = req.nextUrl.clone();
  const session = req.auth;

  // API routes: return 401 JSON instead of redirect
  if (url.pathname.startsWith('/api/')) {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes: redirect to login
  if (!session?.user?.id) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/api/profile/:path*', '/api/progress/:path*'],
};
