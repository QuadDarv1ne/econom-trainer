import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/log-error';
import { BASE_URL } from '@/lib/constants';
import { safeJson } from '@/lib/safe-json';

// POST - Verify email via token
// CSRF protection is provided by the cryptographically random, single-use token
// sent via email. Origin-based CSRF checks would break legitimate email clicks.
export async function POST(req: Request) {

  let email = '';
  let token = '';

  // Try JSON parsing first, fallback to form data
  const parsed = await safeJson<{ token?: string; email?: string }>(req);
  if ('status' in parsed && parsed.status === 400) {
    // JSON parse failed, try form data
    try {
      const formData = await req.formData();
      const tokenVal = formData.get('token');
      const emailVal = formData.get('email');
      token = typeof tokenVal === 'string' ? tokenVal : '';
      email = typeof emailVal === 'string' ? emailVal.toLowerCase() : '';
    } catch {
      return NextResponse.redirect(BASE_URL + '/auth/verify-email?status=invalid');
    }
  } else {
    const data = parsed as { token?: string; email?: string };
    token = data.token || '';
    email = (data.email || '').toLowerCase();
  }

  const baseUrl = BASE_URL;

  if (!token || !email) {
    return NextResponse.redirect(baseUrl + '/auth/verify-email?status=invalid');
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!verificationToken) {
      return NextResponse.redirect(baseUrl + '/auth/verify-email?status=invalid');
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
      return NextResponse.redirect(baseUrl + '/auth/verify-email?status=expired');
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

    return NextResponse.redirect(baseUrl + '/auth/verify-email?status=success');
  } catch (error) {
    logError('verify-email', error);
    return NextResponse.redirect(baseUrl + '/auth/verify-email?status=error');
  }
}
