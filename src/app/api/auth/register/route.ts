import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';
import { sendEmail, getEmailVerificationEmailHtml, getLocaleFromRequest } from '@/lib/email';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validatePasswordStrength } from '@/lib/validate-password';
import { logError } from '@/lib/log-error';
import { sanitizePlainText } from '@/lib/sanitize-input';
import { BCRYPT_SALT_ROUNDS, VERIFICATION_TOKEN_EXPIRY_MS, BASE_URL, ENUMERATION_DELAY_MS } from '@/lib/constants';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('register', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('register', limit.resetAt, req));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ name: string; email: string; password: string; phone?: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { name, email, password, phone } = parsed;

    // Validation
    if (!name || !email || !password) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      ));
    }

    if (typeof name !== 'string' || name.length > 100) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Name must be a string up to 100 characters' },
        { status: 400 }
      ));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return withSecurityHeaders(NextResponse.json({ error: strength.error }, { status: 400 }));
    }

    // Validate phone format (optional field)
    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || phone.length > 20) {
        return withSecurityHeaders(NextResponse.json({ error: 'Phone number must be a string up to 20 characters' }, { status: 400 }));
      }
      if (!/^\+?[0-9\s()-]+$/.test(phone)) {
        return withSecurityHeaders(NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 }));
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Use constant-time delay to prevent timing-based email enumeration
      await new Promise((resolve) => setTimeout(resolve, ENUMERATION_DELAY_MS));
      return withSecurityHeaders(NextResponse.json(
        { message: 'Registration successful' },
        { status: 200 }
      ));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Generate email verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
    const userEmail = email.toLowerCase();

    // Create user, progress, and verification token atomically
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.user.create({
        data: {
          name: sanitizePlainText(name),
          email: userEmail,
          passwordHash,
          phone: phone ? sanitizePlainText(phone) : null,
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

    // Send verification email (outside transaction — failure doesn't prevent registration)
    const verificationUrl = `${BASE_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(userEmail)}`;
    const locale = getLocaleFromRequest(req);
    const userName = locale === 'en' ? 'User' : locale === 'zh' ? '用户' : 'Пользователь';
    const verificationHtml = getEmailVerificationEmailHtml(user.name || userName, verificationUrl, locale);

    const subject = locale === 'en'
      ? 'Verify your email — Economic Trainer'
      : locale === 'zh'
        ? '验证您的电子邮件 — EconTrainer'
        : 'Подтвердите email — Экономический тренажёр';

    const emailSent = await sendEmail({
      to: userEmail,
      subject,
      html: verificationHtml,
    });

    if (!emailSent) {
      logError('register-email-send', new Error('Failed to send verification email'));
      return withSecurityHeaders(NextResponse.json(
        {
          message: 'Registration successful, but verification email could not be sent',
          userId: user.id,
          emailVerificationSent: false,
          emailSendError: true,
        },
        { status: 201 }
      ));
    }

    return withSecurityHeaders(NextResponse.json(
      {
        message: 'Registration successful',
        userId: user.id,
        emailVerificationSent: emailSent,
      },
      { status: 200 }
    ));
  } catch (error) {
    logError('register', error);
    return withSecurityHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
