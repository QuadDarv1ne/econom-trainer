import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

// DELETE - Reset all user progress on server
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
    const limit = checkRateLimit('progressSync', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('progressSync', ip, req));
    }

    await prisma.userProgress.delete({
      where: { userId: session.user.id },
    });

    return withSecurityHeaders(NextResponse.json({ success: true, resetAt: new Date().toISOString() }));
  } catch (error) {
    // UserProgress may not exist — that's fine, treat as success
    if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 'P2025') {
      return withSecurityHeaders(NextResponse.json({ success: true, resetAt: new Date().toISOString() }));
    }
    logError('progress-reset', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
