import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactor', ip);
    if (!limit.ok) {
      return rateLimitResponse('twoFactor', ip);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false },
    });

    await prisma.twoFactorConfirmation.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ message: '2FA отключена' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
