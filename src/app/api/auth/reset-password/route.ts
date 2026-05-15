import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('resetPass', ip);
    if (!limit.ok) {
      return rateLimitResponse('resetPass', ip);
    }

    const parsed = await safeJson<{ token: string; password: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { token, password } = parsed;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Токен и пароль обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date() || resetToken.used) {
      return NextResponse.json(
        { error: 'Недействительный или истёкший токен' },
        { status: 400 }
      );
    }

    // Hash new password and generate new session hash to invalidate all existing sessions
    const passwordHash = await bcrypt.hash(password, 12);
    const newSessionHash = randomBytes(32).toString('hex');

    // Update user password and revoke all existing sessions
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash, sessionHash: newSessionHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return NextResponse.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
