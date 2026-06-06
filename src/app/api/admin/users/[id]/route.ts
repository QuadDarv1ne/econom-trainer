import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole('admin');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const limit = checkRateLimit('profileUpdate', getClientIP(req));
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('profileUpdate', getClientIP(req), req));
    }

    const { id } = await params;

    const parsed = await safeJson<{ role?: string; name?: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { role, name } = parsed;

    const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!targetUser) {
      return withSecurityHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    if (auth.userId === id && role && role !== targetUser.role) {
      return withSecurityHeaders(NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 }));
    }

    const data: Record<string, unknown> = {};
    if (role !== undefined && ['student', 'teacher', 'admin'].includes(role)) {
      data.role = role;
    }
    if (name !== undefined && typeof name === 'string' && name.length <= 100) {
      data.name = name;
    }

    if (Object.keys(data).length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'No valid fields to update' }, { status: 400 }));
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, twoFactorEnabled: true, emailVerified: true, createdAt: true },
    });

    return withSecurityHeaders(NextResponse.json(updated));
  } catch (error) {
    logError('admin-users-update', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole('admin');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    if (!validateOriginStrict(req)) {
      return csrfErrorResponse();
    }

    const limit = checkRateLimit('deleteAcc', getClientIP(req));
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('deleteAcc', getClientIP(req), req));
    }

    const { id } = await params;

    if (auth.userId === id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 }));
    }

    const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!targetUser) {
      return withSecurityHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    await prisma.user.delete({ where: { id } });

    return withSecurityHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    logError('admin-users-delete', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
