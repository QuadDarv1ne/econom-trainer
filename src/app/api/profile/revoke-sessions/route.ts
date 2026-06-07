import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';
import { invalidateSessionCache } from '@/lib/session-cache';

// POST - Sign out from all other sessions by updating user's sessionHash
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const ip = getClientIP(req);
    const limit = checkRateLimit('revokeSessions', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('revokeSessions', ip, limit.resetAt, req));
    }

    // Generate a new session hash to invalidate all other JWTs
    const newSessionHash = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionHash: newSessionHash },
    });

    invalidateSessionCache(session.user.id);

    return withSecurityHeaders(NextResponse.json({ message: 'All other sessions revoked' }));
  } catch (error) {
    logError('revoke-sessions', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
