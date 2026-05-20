import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Verify email via token
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = (searchParams.get('email') || '').toLowerCase();

  if (!token || !email) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/verify-email?status=invalid`;
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!verificationToken) {
      const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/verify-email?status=invalid`;
      return NextResponse.redirect(redirectUrl);
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
      const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/verify-email?status=expired`;
      return NextResponse.redirect(redirectUrl);
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

    const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/verify-email?status=success`;
    return NextResponse.redirect(redirectUrl);
  } catch {
    const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/verify-email?status=error`;
    return NextResponse.redirect(redirectUrl);
  }
}
