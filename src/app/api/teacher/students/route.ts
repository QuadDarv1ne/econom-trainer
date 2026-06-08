import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

const STUDENT_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  progress: { select: { totalXP: true, level: true } },
  quizAttempts: { orderBy: { date: 'desc' as const }, take: 1, select: { score: true, total: true, date: true } },
} as const;

export async function GET(req: Request) {
  try {
    const auth = await requireRole('teacher');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    const limit = checkRateLimit('teacherStudentProgress', auth.userId);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('teacherStudentProgress', limit.resetAt, req));
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
    const search = (url.searchParams.get('search')?.trim() || '').slice(0, 100);

    const where: Record<string, unknown> = { role: 'student' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: STUDENT_LIST_SELECT,
        skip: (page - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return withSecurityHeaders(NextResponse.json({
      students,
      pagination: {
        page,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    }));
  } catch (error) {
    logError('teacher-students-list', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
