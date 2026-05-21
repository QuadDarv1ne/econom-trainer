import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validatePasswordStrength } from '@/lib/validate-password';
import { logError } from '@/lib/log-error';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('resetPass', ip);
    if (!limit.ok) {
      return rateLimitResponse('resetPass', ip, req);
    }

    const parsed = await safeJson<{ token: string; password: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { token, password } = parsed;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date() || resetToken.used) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash new password and generate new session hash to invalidate all existing sessions
    const passwordHash = await bcrypt.hash(password, 12);
    const newSessionHash = randomBytes(32).toString('hex');

    // Atomically update password, revoke sessions, and invalidate token
    // This prevents token reuse if the second operation were to fail
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash, sessionHash: newSessionHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: 'Password successfully changed' });
  } catch (error) {
    logError('reset-password', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
