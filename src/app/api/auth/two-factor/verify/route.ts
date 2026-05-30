import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { randomBytes } from 'crypto';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { logError } from '@/lib/log-error';
import { BCRYPT_SALT_ROUNDS_BACKUP } from '@/lib/constants';
import { invalidateSessionCache } from '@/lib/session-cache';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactorVerify', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('twoFactorVerify', ip, req));
    }

    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ code: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { code } = parsed;

    if (!code) {
      return withSecurityHeaders(NextResponse.json({ error: 'Code is required' }, { status: 400 }));
    }

    // TOTP codes are exactly 6 digits
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid code format' }, { status: 400 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { twoFactorConf: true },
    });

    if (!user || !user.twoFactorConf) {
      return withSecurityHeaders(NextResponse.json({ error: '2FA not set up' }, { status: 400 }));
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorConf.secret,
    });

    if (!isValid) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid code' }, { status: 400 }));
    }

    // Generate cryptographically secure backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, BCRYPT_SALT_ROUNDS_BACKUP))
    );

    // Enable 2FA
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      }),
      prisma.twoFactorConfirmation.update({
        where: { userId: user.id },
        data: { backupCodes: JSON.stringify(hashedBackupCodes) },
      }),
    ]);

    invalidateSessionCache(user.id);

    return withSecurityHeaders(NextResponse.json({
      message: '2FA enabled successfully',
      backupCodes,
    }));
  } catch (error) {
    logError('two-factor-verify', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
