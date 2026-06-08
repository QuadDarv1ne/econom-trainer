import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getLevelFromXP } from '@/lib/xp-utils';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

// GET - Fetch normalized progress data with proper relational queries
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const limit = checkRateLimit('progressRead', session.user.id);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('progressRead', limit.resetAt, req));
    }

    const progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      include: {
        quizAttempts: {
          orderBy: { date: 'desc' },
          take: 50,
        },
        moduleSessions: {
          orderBy: { date: 'desc' },
          take: 100,
        },
        achievementsList: {
          orderBy: { unlockedAt: 'desc' },
        },
        settingsList: {
          orderBy: { key: 'asc' },
        },
      },
    });

    if (!progress) {
      const newProgress = await prisma.userProgress.create({
        data: {
          userId: session.user.id,
          totalXP: 0,
          level: 1,
        },
      });
      return withSecurityHeaders(NextResponse.json(newProgress));
    }

    return withSecurityHeaders(NextResponse.json(progress));
  } catch (error) {
    logError('progress-get-normalized', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// POST - Sync using normalized tables (more efficient for queries and analytics)
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
    const limit = checkRateLimit('progressSync', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('progressSync', limit.resetAt, req));
    }

    const parsed = await safeJson<{
      totalXP?: number;
      quizAttempts?: Array<{
        topic: string;
        score: number;
        total: number;
        date?: string;
        details?: Record<string, unknown>;
      }>;
      moduleSessions?: Array<{
        moduleId: string;
        action: string;
        xpEarned: number;
        date?: string;
        score?: number;
        duration?: number;
        details?: Record<string, unknown>;
      }>;
      achievements?: Array<{
        name: string;
        xpReward?: number;
        unlockedAt?: string;
        metadata?: Record<string, unknown>;
      }>;
      settings?: Record<string, string>;
    }>(req);
    if (isErrorResponse(parsed)) return parsed;

    const { totalXP, quizAttempts, moduleSessions, achievements, settings } = parsed;

    // Validate totalXP
    if (totalXP !== undefined && (typeof totalXP !== 'number' || totalXP < 0 || totalXP > 10_000_000)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid XP value' }, { status: 400 }));
    }

    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      include: {
        quizAttempts: true,
        moduleSessions: true,
        achievementsList: true,
        settingsList: true,
      },
    });

    // XP merge strategy
    const MAX_XP_DELTA = 1000;
    let mergedXP = existingProgress?.totalXP ?? 0;

    if (totalXP !== undefined && existingProgress) {
      const serverXP = existingProgress.totalXP;
      if (totalXP >= serverXP && totalXP <= serverXP + MAX_XP_DELTA) {
        mergedXP = totalXP;
      } else if (totalXP > serverXP + MAX_XP_DELTA) {
        mergedXP = serverXP + MAX_XP_DELTA;
      }
    } else if (totalXP !== undefined && !existingProgress) {
      mergedXP = totalXP <= 5000 ? totalXP : 5000;
    }

    const mergedLevel = getLevelFromXP(mergedXP).level;

    // Use upsert with nested creates for normalized tables
    const progress = await prisma.userProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXP: mergedXP,
        level: mergedLevel,
        quizAttempts: quizAttempts?.length
          ? {
              create: quizAttempts.slice(0, 50).map((q) => ({
                userId: session.user.id,
                topic: q.topic,
                score: q.score,
                total: q.total,
                accuracy: q.total > 0 ? q.score / q.total : 0,
                date: q.date ? new Date(q.date) : new Date(),
                details: q.details ? JSON.stringify(q.details) : null,
              })),
            }
          : undefined,
        moduleSessions: moduleSessions?.length
          ? {
              create: moduleSessions.slice(0, 500).map((m) => ({
                userId: session.user.id,
                moduleId: m.moduleId,
                action: m.action,
                xpEarned: m.xpEarned,
                date: m.date ? new Date(m.date) : new Date(),
                score: m.score ?? null,
                duration: m.duration ?? null,
                details: m.details ? JSON.stringify(m.details) : null,
              })),
            }
          : undefined,
        achievementsList: achievements?.length
          ? {
              create: achievements.slice(0, 50).map((a) => ({
                userId: session.user.id,
                name: a.name,
                xpReward: a.xpReward ?? 0,
                unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : new Date(),
                metadata: a.metadata ? JSON.stringify(a.metadata) : null,
              })),
            }
          : undefined,
        settingsList: settings
          ? {
              create: Object.entries(settings).map(([key, value]) => ({
                userId: session.user.id,
                key,
                value,
              })),
            }
          : undefined,
      },
      update: {
        totalXP: mergedXP,
        level: mergedLevel,
      },
      include: {
        quizAttempts: { orderBy: { date: 'desc' }, take: 50 },
        moduleSessions: { orderBy: { date: 'desc' }, take: 100 },
        achievementsList: { orderBy: { unlockedAt: 'desc' } },
        settingsList: { orderBy: { key: 'asc' } },
      },
    });

    return withSecurityHeaders(NextResponse.json(progress));
  } catch (error) {
    logError('progress-sync-normalized', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
