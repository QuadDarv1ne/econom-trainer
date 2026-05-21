import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';
import { getEmailVerificationEmailHtml, getLocaleFromRequest } from '@/lib/email';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validatePasswordStrength } from '@/lib/validate-password';
import { logError } from '@/lib/log-error';
import { BCRYPT_SALT_ROUNDS, VERIFICATION_TOKEN_EXPIRY_MS, BASE_URL } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('register', ip);
    if (!limit.ok) {
      return rateLimitResponse('register', ip, req);
    }

    const parsed = await safeJson<{ name: string; email: string; password: string; phone?: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { name, email, password, phone } = parsed;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be a string up to 100 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Generate email verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
    const userEmail = email.toLowerCase();

    // Create user, progress, and verification token atomically
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: userEmail,
          passwordHash,
          phone: phone || null,
        },
      });

      await tx.userProgress.create({
        data: { userId: created.id, totalXP: 0, level: 1 },
      });

      await tx.verificationToken.create({
        data: { identifier: userEmail, token, expires },
      });

      return created;
    });

    // Send verification email (outside transaction — if this fails, clean up)
    const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(userEmail)}`;
    const locale = getLocaleFromRequest(req);
    const verificationHtml = getEmailVerificationEmailHtml(user.name || (locale === 'en' ? 'User' : 'Пользователь'), verificationUrl, locale);

    const { sendEmail } = await import('@/lib/email');
    const emailSent = await sendEmail({
      to: userEmail,
      subject: locale === 'en'
        ? 'Verify your email — Economic Trainer'
        : 'Подтвердите email — Экономический тренажёр',
      html: verificationHtml,
    });

    if (!emailSent) {
      // Rollback: atomically delete all created records
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: userEmail } }),
        prisma.userProgress.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    logError('register', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
