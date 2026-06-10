import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendEmail, getEmailVerificationEmailHtml, getLocaleFromRequest } from '@/lib/email';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { logError } from '@/lib/log-error';
import { BASE_URL, VERIFICATION_TOKEN_EXPIRY_MS } from '@/lib/constants';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { withSecurityHeaders } from '@/lib/security-headers';

// POST - Send email verification
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const ip = getClientIP(req);
    const limit = checkRateLimit('verifyEmail', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('verifyEmail', limit.resetAt, req));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user?.email) {
      return withSecurityHeaders(NextResponse.json({ error: 'Email not set' }, { status: 400 }));
    }

    if (user.emailVerified) {
      return withSecurityHeaders(NextResponse.json({ error: 'Email already verified' }, { status: 400 }));
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS); // 24 hours

    // Remove any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Create new verification token
    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    // Send verification email
    const verificationUrl = `${BASE_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    const locale = getLocaleFromRequest(req);
    const html = getEmailVerificationEmailHtml(user.name || (locale === 'en' ? 'User' : 'Пользователь'), verificationUrl, locale);

    const emailSent = await sendEmail({
      to: user.email,
      subject: locale === 'en'
        ? 'Verify your email — Economic Trainer'
        : 'Подтвердите email — Экономический тренажёр',
      html,
    });

    if (!emailSent) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      ));
    }

    return withSecurityHeaders(NextResponse.json({ message: 'Verification email sent' }));
  } catch (error) {
    logError('verify-email-send', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
