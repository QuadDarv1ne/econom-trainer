import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getLevelFromXP } from '@/lib/xp-utils';
import { mergeXP } from '@/lib/xp-merge';
import { logError } from '@/lib/log-error';
import { withSecurityHeaders } from '@/lib/security-headers';

// GET - Get user progress from server
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Rate limit authenticated reads
    // Use session.user.id as identifier to prevent shared bucket across users
    const limit = checkRateLimit('progressRead', session.user.id);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('progressRead', limit.resetAt, req));
    }

    const progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      include: {
        quizAttempts: { orderBy: { date: 'desc' }, take: 100 },
        moduleSessions: { orderBy: { date: 'desc' }, take: 100 },
        achievementsList: { orderBy: { unlockedAt: 'desc' }, take: 100 },
      },
    });

    if (!progress) {
      // Create default progress
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
    logError('progress-get', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// POST - Sync progress from client to server
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
      quizResults?: unknown;
      moduleHistory?: unknown;
      achievements?: unknown;
    }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { totalXP, quizResults, moduleHistory, achievements } = parsed;

    // Validate totalXP: must be non-negative and reasonable (< 10M)
    if (totalXP !== undefined && (typeof totalXP !== 'number' || totalXP < 0 || totalXP > 10_000_000)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid XP value' }, { status: 400 }));
    }

    // Validate JSON payload sizes (max 100KB each)
    const maxJsonSize = 100 * 1024;
    for (const [key, value] of Object.entries({ quizResults, moduleHistory, achievements })) {
      if (value !== undefined && value !== null) {
        const size = new TextEncoder().encode(JSON.stringify(value)).length;
        if (size > maxJsonSize) {
          return withSecurityHeaders(NextResponse.json({ error: `Data limit exceeded for ${key}` }, { status: 400 }));
        }
      }
    }

    // Fetch existing progress for merge strategy
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    // XP merge strategy: prevent client-side XP inflation attacks
    const mergedXP = mergeXP(totalXP, existingProgress?.totalXP);
    const mergedLevel = getLevelFromXP(mergedXP).level;

    const progress = await prisma.$transaction(async (tx) => {
      const prog = await tx.userProgress.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          totalXP: mergedXP,
          level: mergedLevel,
        },
        update: {
          totalXP: mergedXP,
          level: mergedLevel,
        },
      });

      const progressId = prog.id;

      if (quizResults !== undefined && quizResults !== null && Array.isArray(quizResults)) {
        const typedResults = quizResults as Array<{ topic?: string; score?: number; total?: number; date?: string }>;
        const validResults = typedResults
          .slice(0, 50)
          .filter((q): q is { topic?: string; score: number; total: number; date?: string } =>
            typeof q.score === 'number' && isFinite(q.score) && q.score >= 0
            && typeof q.total === 'number' && isFinite(q.total) && q.total > 0);
        if (validResults.length > 0) {
          await tx.quizAttempt.createMany({
            data: validResults.map((q) => ({
              userId: session.user.id,
              userProgressId: progressId,
              topic: q.topic ?? 'general',
              score: q.score,
              total: q.total,
              accuracy: q.total > 0 ? q.score / q.total : 0,
              date: q.date ? new Date(q.date) : new Date(),
            })),
          });
        }
      }

      if (moduleHistory !== undefined && moduleHistory !== null && Array.isArray(moduleHistory)) {
        const typedHistory = moduleHistory as Array<{ moduleId?: string; action?: string; xpEarned?: number; date?: string; score?: number; duration?: number; details?: Record<string, unknown> }>;
        const validHistory = typedHistory.slice(0, 500).filter((m) => m.moduleId && m.moduleId !== 'unknown');
        if (validHistory.length > 0) {
          await tx.moduleSession.createMany({
            data: validHistory.map((m) => ({
              userId: session.user.id,
              userProgressId: progressId,
              moduleId: m.moduleId ?? 'unknown',
              action: m.action ?? 'explore',
              xpEarned: m.xpEarned ?? 0,
              date: m.date ? new Date(m.date) : new Date(),
              score: m.score ?? null,
              duration: m.duration ?? null,
              details: m.details ? JSON.stringify(m.details) : null,
            })),
          });
        }
      }

      if (achievements !== undefined && achievements !== null && Array.isArray(achievements)) {
        const typedAchievements = achievements as Array<{ id?: string; name?: string; unlockedAt?: string; xpReward?: number } | string>;
        const achievementData = typedAchievements.slice(0, 50).map((a) => {
          if (typeof a === 'string') {
            return { name: a, unlockedAt: new Date(), xpReward: 0 };
          }
          return {
            name: (a as Record<string, unknown>).name as string ?? String(a),
            unlockedAt: (a as Record<string, unknown>).unlockedAt ? new Date(String((a as Record<string, unknown>).unlockedAt)) : new Date(),
            xpReward: Number((a as Record<string, unknown>).xpReward ?? 0) || 0,
          };
        }).filter((a) => a.name && a.name.length <= 100);
        if (achievementData.length > 0) {
          await tx.userAchievement.createMany({
            data: achievementData.map((a) => ({
              userId: session.user.id,
              userProgressId: progressId,
              name: a.name,
              unlockedAt: a.unlockedAt,
              xpReward: a.xpReward,
            })),
          });
        }
      }

      return prog;
    });

    return withSecurityHeaders(NextResponse.json(progress));
  } catch (error) {
    logError('progress-sync', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// PATCH - Delta sync: only send changed records since last sync
// More efficient than full sync for frequent small updates
export async function PATCH(req: Request) {
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
      newQuizResults?: unknown[];
      newModuleInteractions?: unknown[];
      newAchievements?: string[];
      lastSyncAt?: string;
    }>(req);
    if (isErrorResponse(parsed)) return parsed;

    const { totalXP, newQuizResults, newModuleInteractions, newAchievements } = parsed;

    // Validate totalXP
    if (totalXP !== undefined && (typeof totalXP !== 'number' || totalXP < 0 || totalXP > 10_000_000)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid XP value' }, { status: 400 }));
    }

    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    // XP merge: prevent client-side XP inflation
    const mergedXP = mergeXP(totalXP, existingProgress?.totalXP);
    const mergedLevel = getLevelFromXP(mergedXP).level;

    const progress = await prisma.$transaction(async (tx) => {
      const prog = await tx.userProgress.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          totalXP: mergedXP,
          level: mergedLevel,
        },
        update: {
          totalXP: mergedXP,
          level: mergedLevel,
        },
      });

      const progressId = prog.id;

      if (newQuizResults !== undefined && newQuizResults !== null && Array.isArray(newQuizResults)) {
        const typedResults = newQuizResults as Array<{ topic?: string; score?: number; total?: number; date?: string }>;
        const validResults = typedResults
          .slice(0, 50)
          .filter((q): q is { topic?: string; score: number; total: number; date?: string } =>
            typeof q.score === 'number' && isFinite(q.score) && q.score >= 0
            && typeof q.total === 'number' && isFinite(q.total) && q.total > 0);
        if (validResults.length > 0) {
          await tx.quizAttempt.createMany({
            data: validResults.map((q) => ({
              userId: session.user.id,
              userProgressId: progressId,
              topic: q.topic ?? 'general',
              score: q.score,
              total: q.total,
              accuracy: q.total > 0 ? q.score / q.total : 0,
              date: q.date ? new Date(q.date) : new Date(),
            })),
          });
        }
      }

      if (newModuleInteractions !== undefined && newModuleInteractions !== null && Array.isArray(newModuleInteractions)) {
        const typedHistory = newModuleInteractions as Array<{ moduleId?: string; action?: string; xpEarned?: number; date?: string; score?: number; duration?: number; details?: Record<string, unknown> }>;
        const validHistory = typedHistory.slice(0, 500).filter((m) => m.moduleId && m.moduleId !== 'unknown');
        if (validHistory.length > 0) {
          await tx.moduleSession.createMany({
            data: validHistory.map((m) => ({
              userId: session.user.id,
              userProgressId: progressId,
              moduleId: m.moduleId ?? 'unknown',
              action: m.action ?? 'explore',
              xpEarned: m.xpEarned ?? 0,
              date: m.date ? new Date(m.date) : new Date(),
              score: m.score ?? null,
              duration: m.duration ?? null,
              details: m.details ? JSON.stringify(m.details) : null,
            })),
          });
        }
      }

      if (newAchievements !== undefined && newAchievements !== null && Array.isArray(newAchievements)) {
        const validAchievements = newAchievements.slice(0, 50).filter((a) => typeof a === 'string' && a.length <= 100);
        if (validAchievements.length > 0) {
          await tx.userAchievement.createMany({
            data: validAchievements.map((a) => ({
              userId: session.user.id,
              userProgressId: progressId,
              name: a,
              unlockedAt: new Date(),
              xpReward: 0,
            })),
          });
        }
      }

      return prog;
    });

    return withSecurityHeaders(NextResponse.json({
      ...progress,
      syncedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logError('progress-delta-sync', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
