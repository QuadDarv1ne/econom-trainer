import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

// Generate TOTP secret and QR code
export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactor', ip);
    if (!limit.ok) {
      return rateLimitResponse('twoFactor', ip, req);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(user.email || session.user.email || 'user', 'Экономический тренажёр', secret);
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

    return NextResponse.json({ secret, qrCode });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
