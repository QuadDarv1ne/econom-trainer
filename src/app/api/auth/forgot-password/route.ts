import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail, getPasswordResetEmailHtml, getLocaleFromRequest } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { logError } from '@/lib/log-error';
import { BASE_URL, RESET_TOKEN_EXPIRY_MS, ENUMERATION_DELAY_MS } from '@/lib/constants';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('forgotPass', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('forgotPass', limit.resetAt, req));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ email: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { email: rawEmail } = parsed;

    if (!rawEmail) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      ));
    }

    if (typeof rawEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.email) {
      await new Promise((resolve) => setTimeout(resolve, ENUMERATION_DELAY_MS));
      return withSecurityHeaders(NextResponse.json({ message: 'If this email is registered, we will send a reset link' }));
    }

    const startTime = Date.now();

    // Generate and store reset token atomically
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS); // 1 hour

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { email },
      }),
      prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expires,
        },
      }),
    ]);

    // Send email
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;
    const locale = getLocaleFromRequest(req);
    const defaultNames = { en: 'User', zh: '用户', ru: 'Студент' };
    const userName = user.name || defaultNames[locale] || defaultNames.ru;
    const html = getPasswordResetEmailHtml(userName, resetUrl, locale);
    const subject = locale === 'en'
      ? 'Password Reset — Economic Trainer'
      : locale === 'zh'
        ? '密码重置 — 经济训练师'
        : 'Сброс пароля — Экономический тренажёр';
    const emailSent = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    // Rollback token if email fails — prevents orphaned tokens
    if (!emailSent) {
      try {
        await prisma.passwordResetToken.deleteMany({
          where: { token },
        });
      } catch (deleteError) {
        logError('forgot-password-token-delete', deleteError);
      }
    }

    // Apply a uniform delay to prevent timing-based email enumeration.
    // Ensures both found and not-found branches take ~ENUMERATION_DELAY_MS.
    const elapsed = Date.now() - startTime;
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, ENUMERATION_DELAY_MS - elapsed)));

    return withSecurityHeaders(NextResponse.json({
      message: 'If this email is registered, we will send a password reset link',
    }));
  } catch (error) {
    logError('forgot-password', error);
    return withSecurityHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
