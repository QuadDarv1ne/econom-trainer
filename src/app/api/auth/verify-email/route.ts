import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/log-error';
import { BASE_URL } from '@/lib/constants';

// POST - Verify email via token
// CSRF protection is provided by the cryptographically random, single-use token
// sent via email. Origin-based CSRF checks would break legitimate email clicks.
export async function POST(req: Request) {

  let body: { token?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Try form data
    const formData = await req.formData();
    const tokenVal = formData.get('token');
    const emailVal = formData.get('email');
    body = {
      token: typeof tokenVal === 'string' ? tokenVal : undefined,
      email: typeof emailVal === 'string' ? emailVal : undefined,
    };
  }

  const token = body.token;
  const email = (body.email || '').toLowerCase();

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
