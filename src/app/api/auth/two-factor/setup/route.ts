import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

// Generate TOTP secret and QR code
export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactorSetup', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('twoFactorSetup', ip, limit.resetAt, req));
    }

    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return withSecurityHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    if (user.twoFactorEnabled) {
      return withSecurityHeaders(NextResponse.json({ error: '2FA is already enabled' }, { status: 400 }));
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const issuer = 'Econom Trainer';
    // Sanitize email for TOTP URI: strip special characters, limit length
    const safeEmail = (user.email || session.user.email || 'user')
      .replace(/[^\w@.-]/g, '')
      .slice(0, 64);
    const uri = authenticator.keyuri(safeEmail, issuer, secret);
    const qrCode = await qrcode.toDataURL(uri);

    // Store secret temporarily (will be confirmed on verification)
    await prisma.twoFactorConfirmation.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        secret,
        backupCodes: JSON.stringify([]),
      },
      update: { secret },
    });

    return withSecurityHeaders(NextResponse.json({ secret, qrCode }));
  } catch (error) {
    logError('two-factor-setup', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
