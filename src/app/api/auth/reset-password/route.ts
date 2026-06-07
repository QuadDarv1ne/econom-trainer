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
import { withSecurityHeaders } from '@/lib/security-headers';
import { invalidateSessionCache } from '@/lib/session-cache';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('resetPass', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('resetPass', ip, limit.resetAt, req));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ token: string; password: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { token, password } = parsed;

    if (!token || !password) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      ));
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return withSecurityHeaders(NextResponse.json({ error: strength.error }, { status: 400 }));
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date() || resetToken.used) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      ));
    }

    // Hash new password and generate new session hash to invalidate all existing sessions
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const newSessionHash = randomBytes(32).toString('hex');

    // Atomically mark token as used AND update password in transaction
    // The updateMany with used=false prevents race condition: only first request succeeds
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, used: false },
        data: { used: true },
      });

      if (updated.count === 0) {
        return { error: "Token has already been used" };
      }

      const updatedUser = await tx.user.update({
        where: { email: resetToken.email },
        data: { passwordHash, sessionHash: newSessionHash },
      });

      return { success: true, userId: updatedUser.id };
    });

    if ("error" in result) {
      return withSecurityHeaders(NextResponse.json({ error: result.error }, { status: 400 }));
    }

    invalidateSessionCache(result.userId);

    return withSecurityHeaders(NextResponse.json({ message: 'Password successfully changed' }));
  } catch (error) {
    logError('reset-password', error);
    return withSecurityHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
