import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validatePasswordStrength } from '@/lib/validate-password';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

// POST - Change password
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
    const limit = checkRateLimit('changePass', ip);
    if (!limit.ok) {
      return rateLimitResponse('changePass', ip, req);
    }

    const parsed = await safeJson<{ currentPassword: string; newPassword: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { currentPassword, newPassword } = parsed;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Fill in all fields' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Cannot change password for this account' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect current password' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const newSessionHash = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash, sessionHash: newSessionHash },
    });

    return NextResponse.json({ message: 'Password changed' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
