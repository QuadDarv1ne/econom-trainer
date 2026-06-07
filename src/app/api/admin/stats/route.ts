import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function GET(req: Request) {
  try {
    const auth = await requireRole('admin');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    const limit = checkRateLimit('adminStats', auth.userId);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('profileRead', auth.userId, limit.resetAt, req));
    }

    const [
      totalUsers,
      studentsCount,
      teachersCount,
      adminsCount,
      progressStats,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.userProgress.aggregate({
        _sum: { totalXP: true },
        _avg: { totalXP: true, level: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return withSecurityHeaders(NextResponse.json({
      users: {
        total: totalUsers,
        students: studentsCount,
        teachers: teachersCount,
        admins: adminsCount,
      },
      progress: {
        totalXP: progressStats._sum.totalXP ?? 0,
        avgXP: Math.round(progressStats._avg.totalXP ?? 0),
        avgLevel: Math.round(progressStats._avg.level ?? 0),
      },
      recentUsers,
    }));
  } catch (error) {
    logError('admin-stats', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
