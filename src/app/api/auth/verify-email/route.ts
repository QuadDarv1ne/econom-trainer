import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/log-error';
import { BASE_URL } from '@/lib/constants';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { withSecurityHeaders } from '@/lib/security-headers';

// POST - Verify email via token
// CSRF protection is provided by the cryptographically random, single-use token
// sent via email. Origin-based CSRF checks would break legitimate email clicks.
export async function POST(req: Request) {
  const ip = getClientIP(req);
  const limit = checkRateLimit('verifyEmail', ip);
  if (!limit.ok) {
    return withSecurityHeaders(rateLimitResponse('verifyEmail', ip, limit.resetAt, req));
  }

  let email = '';
  let token = '';

  // Try JSON parsing first, fallback to form data
  const parsed = await safeJson<{ token?: string; email?: string }>(req);
  if (isErrorResponse(parsed)) {
    const contentType = req.headers.get('content-type')?.toLowerCase() || '';
    if (contentType.includes('application/json')) {
      // JSON body was already consumed by safeJson; cannot fallback to formData
      return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=invalid'));
    }
    try {
      const formData = await req.formData();
      const tokenVal = formData.get('token');
      const emailVal = formData.get('email');
      token = typeof tokenVal === 'string' ? tokenVal : '';
      email = typeof emailVal === 'string' ? emailVal.toLowerCase() : '';
    } catch {
      return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=invalid'));
    }
  } else {
    token = parsed.token || '';
    email = (parsed.email || '').toLowerCase();
  }

  if (!token || !email) {
    return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=invalid'));
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!verificationToken) {
      return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=invalid'));
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
      return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=expired'));
    }

    // Verify email and delete token in a transaction
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ]);

    return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=success'));
  } catch (error) {
    logError('verify-email', error);
    return withSecurityHeaders(NextResponse.redirect(BASE_URL + '/auth/verify-email?status=error'));
  }
}
