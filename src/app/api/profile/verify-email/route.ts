import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendEmail, getEmailVerificationEmailHtml, getLocaleFromRequest } from '@/lib/email';

// POST - Send email verification
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Email не указан' }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email уже подтверждён' }, { status: 400 });
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Upsert verification token
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: user.email, token } },
      create: { identifier: user.email, token, expires },
      update: { token, expires },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    const locale = getLocaleFromRequest(req);
    const html = getEmailVerificationEmailHtml(user.name || (locale === 'en' ? 'User' : 'Пользователь'), verificationUrl, locale);

    const { sendEmail: send } = await import('@/lib/email');
    const emailSent = await send({
      to: user.email,
      subject: locale === 'en'
        ? 'Verify your email — Economic Trainer'
        : 'Подтвердите email — Экономический тренажёр',
      html,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Не удалось отправить письмо подтверждения. Попробуйте позже.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Письмо отправлено' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
