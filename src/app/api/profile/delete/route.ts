import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';
import { invalidateSessionCache } from '@/lib/session-cache';

// DELETE - Delete user account
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const ip = getClientIP(req);
    const limit = checkRateLimit('deleteAcc', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('deleteAcc', ip, req));
    }

    const parsed = await safeJson<{ password?: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { password } = parsed;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    // OAuth-only users skip password check (already authenticated via provider)
    if (user?.passwordHash) {
      if (!password) {
        return withSecurityHeaders(NextResponse.json(
          { error: 'Password required to confirm deletion' },
          { status: 400 }
        ));
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return withSecurityHeaders(NextResponse.json(
          { error: 'Incorrect password' },
          { status: 400 }
        ));
      }
    }

    // Delete user (cascade handles related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });
    invalidateSessionCache(session.user.id);

    return withSecurityHeaders(NextResponse.json({ message: 'Account deleted' }));
  } catch (error) {
    logError('delete-account', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
