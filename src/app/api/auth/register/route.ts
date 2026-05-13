import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';
import { getEmailVerificationEmailHtml } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('register', ip);
    if (!limit.ok) {
      return rateLimitResponse('register', ip);
    }

    const { name, email, password, phone } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
      },
    });

    // Create empty progress
    await prisma.userProgress.create({
      data: {
        userId: user.id,
        totalXP: 0,
        level: 1,
      },
    });

    // Generate email verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token,
        expires,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email!)}`;
    const verificationHtml = getEmailVerificationEmailHtml(user.name || 'Пользователь', verificationUrl);

    const { sendEmail } = await import('@/lib/email');
    await sendEmail({
      to: user.email!,
      subject: 'Подтвердите email — Экономический тренажёр',
      html: verificationHtml,
    });

    return NextResponse.json(
      {
        message: 'Регистрация успешна',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
