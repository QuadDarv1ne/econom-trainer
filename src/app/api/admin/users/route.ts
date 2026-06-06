import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

const USER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  twoFactorEnabled: true,
  emailVerified: true,
  createdAt: true,
  progress: { select: { totalXP: true, level: true } },
} as const;

export async function GET(req: Request) {
  try {
    const auth = await requireRole('admin');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    const limit = checkRateLimit('profileRead', auth.userId);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('profileRead', auth.userId, req));
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
    const search = url.searchParams.get('search')?.trim() || '';
    const roleFilter = url.searchParams.get('role')?.trim() || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (roleFilter && ['student', 'teacher', 'admin'].includes(roleFilter)) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        skip: (page - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return withSecurityHeaders(NextResponse.json({
      users,
      pagination: {
        page,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    }));
  } catch (error) {
    logError('admin-users-list', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
