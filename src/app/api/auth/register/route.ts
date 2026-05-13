import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

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

    // Send welcome email
    const escapeHtml = (str: string) =>
      str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]!));
    const welcomeHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Экономический тренажёр</h2>
        <p>Здравствуйте, ${escapeHtml(name)}!</p>
        <p>Добро пожаловать в Экономический тренажёр! Ваш аккаунт успешно создан.</p>
        <p>Начните обучение: изучайте микроэкономику, макроэкономику и финансовую математику через интерактивные модули.</p>
        <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Начать обучение
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          Экономический тренажёр — интерактивная платформа для изучения экономики
        </p>
      </div>
    `;

    // Import dynamically to avoid build issues
    const { sendEmail } = await import('@/lib/email');
    await sendEmail({
      to: user.email!,
      subject: 'Добро пожаловать в Экономический тренажёр!',
      html: welcomeHtml,
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
