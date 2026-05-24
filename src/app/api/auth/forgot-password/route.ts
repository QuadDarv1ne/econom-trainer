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
      return rateLimitResponse('forgotPass', ip, req);
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ email: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { email } = parsed;

    if (!email) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      ));
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.email) {
      // Constant-time delay to prevent timing-based email enumeration.
      // Wait the same duration as a real email send operation (~1-2s)
      // so attackers cannot distinguish registered vs unregistered emails.
      await new Promise((resolve) => setTimeout(resolve, ENUMERATION_DELAY_MS));
      return withSecurityHeaders(NextResponse.json({ message: 'If this email is registered, we will send a reset link' }));
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS); // 1 hour

    // Delete existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Clean up expired tokens globally (background maintenance)
    await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expires: { lt: new Date() } },
          { used: true },
        ],
      },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Send email
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;
    const locale = getLocaleFromRequest(req);
    const userName = user.name || (locale === 'en' ? 'User' : locale === 'zh' ? '用户' : 'Студент');
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
      await prisma.passwordResetToken.deleteMany({
        where: { token },
      });
    }

    // Always return success to prevent email enumeration
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
