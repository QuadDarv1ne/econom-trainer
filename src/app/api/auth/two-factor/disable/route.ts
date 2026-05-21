import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';
import { randomBytes } from 'crypto';
import { logError } from '@/lib/log-error';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!validateOrigin(req)) {
      return csrfErrorResponse();
    }

    const ip = getClientIP(req);
    const limit = checkRateLimit('twoFactorDisable', ip);
    if (!limit.ok) {
      return rateLimitResponse('twoFactorDisable', ip, req);
    }

    const parsed = await safeJson<{ password: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { password } = parsed;
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const newSessionHash = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false, sessionHash: newSessionHash },
    });

    await prisma.twoFactorConfirmation.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ message: '2FA disabled' });
  } catch (error) {
    logError('two-factor-disable', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
