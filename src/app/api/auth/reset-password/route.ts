import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validatePasswordStrength } from '@/lib/validate-password';
import { logError } from '@/lib/log-error';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('resetPass', ip);
    if (!limit.ok) {
      return rateLimitResponse('resetPass', ip, req);
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
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
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const newSessionHash = randomBytes(32).toString('hex');

    // Atomically mark token as used AND update password in transaction
    // The updateMany with used=false prevents race condition: only first request succeeds
    const [updatedToken, userUpdate] = await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { id: resetToken.id, used: false },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash, sessionHash: newSessionHash },
      }),
    ]);

    // If updateMany affected 0 rows, another request already used this token
    if (updatedToken.count === 0) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Password successfully changed' });
  } catch (error) {
    logError('reset-password', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
