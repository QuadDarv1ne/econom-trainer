import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole('teacher');
    if (!auth.authorized) {
      return withSecurityHeaders(NextResponse.json({ error: auth.error.message }, { status: auth.error.status }));
    }

    const limit = checkRateLimit('teacherStudentProgress', auth.userId);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('teacherStudentProgress', limit.resetAt, req));
    }

    const { id } = await params;

    const student = await prisma.user.findUnique({
      where: { id, role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        progress: {
          select: {
            totalXP: true,
            level: true,
            quizAttempts: { orderBy: { date: 'desc' }, take: 50 },
            moduleSessions: { orderBy: { date: 'desc' }, take: 100 },
            achievementsList: { orderBy: { unlockedAt: 'desc' } },
          },
        },
      },
    });

    if (!student) {
      return withSecurityHeaders(NextResponse.json({ error: 'Student not found' }, { status: 404 }));
    }

    const quizStats = student.progress?.quizAttempts
      ? {
          total: student.progress.quizAttempts.length,
          totalScore: student.progress.quizAttempts.reduce((s, q) => s + q.score, 0),
          totalPossible: student.progress.quizAttempts.reduce((s, q) => s + q.total, 0),
          averageAccuracy: student.progress.quizAttempts.length > 0
            ? Math.round(
                (student.progress.quizAttempts.reduce((s, q) => s + (q.total > 0 ? q.score / q.total : 0), 0) /
                  student.progress.quizAttempts.length) *
                  100
              )
            : 0,
          byTopic: Object.entries(
            student.progress.quizAttempts.reduce<Record<string, { score: number; total: number; count: number }>>(
              (acc, q) => {
                if (!acc[q.topic]) acc[q.topic] = { score: 0, total: 0, count: 0 };
                acc[q.topic].score += q.score;
                acc[q.topic].total += q.total;
                acc[q.topic].count += 1;
                return acc;
              },
              {}
            )
          ).map(([topic, stats]) => ({
            topic,
            ...stats,
            accuracy: stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0,
          })),
        }
      : null;

    const moduleStats = student.progress?.moduleSessions
      ? {
          total: student.progress.moduleSessions.length,
          totalXP: student.progress.moduleSessions.reduce((s, m) => s + m.xpEarned, 0),
          byModule: Object.entries(
            student.progress.moduleSessions.reduce<Record<string, { count: number; xpEarned: number }>>((acc, m) => {
              if (!acc[m.moduleId]) acc[m.moduleId] = { count: 0, xpEarned: 0 };
              acc[m.moduleId].count += 1;
              acc[m.moduleId].xpEarned += m.xpEarned;
              return acc;
            }, {})
          ).map(([moduleId, stats]) => ({ moduleId, ...stats })),
        }
      : null;

    return withSecurityHeaders(
      NextResponse.json({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.createdAt,
          progress: student.progress
            ? {
                totalXP: student.progress.totalXP,
                level: student.progress.level,
                quizStats,
                moduleStats,
                achievements: student.progress.achievementsList,
              }
            : null,
        },
      })
    );
  } catch (error) {
    logError('teacher-student-progress', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
