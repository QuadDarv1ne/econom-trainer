import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

// POST - Verify email via token (protected against CSRF and prefetch attacks)
export async function POST(req: Request) {
  if (!validateOrigin(req)) {
    return csrfErrorResponse();
  }

  let body: { token?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Try form data
    const formData = await req.formData();
    body = {
      token: formData.get('token') as string,
      email: formData.get('email') as string,
    };
  }

  const token = body.token;
  const email = (body.email || '').toLowerCase();

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

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
  } catch {
    return NextResponse.redirect(baseUrl + '/auth/verify-email?status=error');
  }
}
