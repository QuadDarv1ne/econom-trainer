import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail, getPasswordResetEmailHtml, getLocaleFromRequest } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('forgotPass', ip);
    if (!limit.ok) {
      return rateLimitResponse('forgotPass', ip);
    }

    const parsed = await safeJson<{ email: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { email } = parsed;

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.email) {
      return NextResponse.json({ message: 'Если email зарегистрирован, мы отправим ссылку для сброса' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

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
    const resetUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    const locale = getLocaleFromRequest(req);
    const html = getPasswordResetEmailHtml(user.name || (locale === 'en' ? 'User' : 'Студент'), resetUrl, locale);
    const subject = locale === 'en'
      ? 'Password Reset — Economic Trainer'
      : 'Сброс пароля — Экономический тренажёр';
    const emailSent = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    // Always return success to prevent email enumeration
    if (!emailSent) {
      console.error('[Forgot Password] Email service unavailable');
    }

    return NextResponse.json({
      message: 'Если email зарегистрирован, мы отправим ссылку для сброса пароля',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
