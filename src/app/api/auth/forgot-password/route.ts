import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('forgotPass', ip);
    if (!limit.ok) {
      return rateLimitResponse('forgotPass', ip);
    }

    const { email } = await req.json();

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
    if (!user) {
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
    const html = getPasswordResetEmailHtml(user.name || 'Студент', resetUrl);
    const emailSent = await sendEmail({
      to: user.email!,
      subject: 'Сброс пароля — Экономический тренажёр',
      html,
    });

    // Always return success to prevent email enumeration, even if email fails
    // The user won't receive the email but no information is leaked
    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
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
