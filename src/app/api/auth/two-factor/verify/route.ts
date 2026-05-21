import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { randomBytes } from 'crypto';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactorVerify', ip);
    if (!limit.ok) {
      return rateLimitResponse('twoFactorVerify', ip, req);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!validateOrigin(req)) {
      return csrfErrorResponse();
    }

    const parsed = await safeJson<{ code: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { code } = parsed;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // 2FA codes are 6 digits; reject overly long inputs
    if (typeof code !== 'string' || code.length > 10) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { twoFactorConf: true },
    });

    if (!user || !user.twoFactorConf) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorConf.secret,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Generate cryptographically secure backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10))
    );

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    await prisma.twoFactorConfirmation.update({
      where: { userId: user.id },
      data: { backupCodes: JSON.stringify(hashedBackupCodes) },
    });

    return NextResponse.json({
      message: '2FA enabled successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
