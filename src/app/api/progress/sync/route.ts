import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getLevelFromXP } from '@/lib/xp-utils';
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
      return withSecurityHeaders(rateLimitResponse('progressRead', session.user.id, req));
    }

    const progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
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
      return withSecurityHeaders(rateLimitResponse('progressSync', ip, req));
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

    // XP merge strategy: prevent client-side XP inflation attacks.
    // Server XP is authoritative. Only accept client XP if it's within
    // a reasonable delta (max 1000 XP above server = plausible single session gain).
    // Otherwise, use server XP as the base to prevent manipulation.
    const MAX_XP_DELTA = 1000;
    let mergedXP = existingProgress?.totalXP ?? 0;

    if (totalXP !== undefined && existingProgress) {
      const serverXP = existingProgress.totalXP;
      // Accept client XP only if it's >= server and within reasonable delta
      if (totalXP >= serverXP && totalXP <= serverXP + MAX_XP_DELTA) {
        mergedXP = totalXP;
      } else if (totalXP > serverXP + MAX_XP_DELTA) {
        // Client XP is suspiciously high — use server XP + max allowed delta
        mergedXP = serverXP + MAX_XP_DELTA;
      }
      // If client XP < server XP, keep server XP (already more authoritative)
    } else if (totalXP !== undefined && !existingProgress) {
      // First sync — accept client XP if reasonable (< 5000 for new user)
      mergedXP = totalXP <= 5000 ? totalXP : 5000;
    }

    const mergedLevel = getLevelFromXP(mergedXP).level;

    // Merge JSON array fields: combine records from both client and server,
    // deduplicating by id or timestamp to prevent data loss across devices
    const mergeArrays = (
      clientData: unknown,
      serverData: string | null | undefined,
      maxItems: number = 500,
    ): string | null | undefined => {
      if (clientData === undefined) return undefined;
      if (!clientData && !serverData) return null;

      let clientArr: unknown[] = [];
      let serverArr: unknown[] = [];

      if (Array.isArray(clientData)) {
        clientArr = clientData;
      } else if (clientData !== null && clientData !== false) {
        // Wrap non-array truthy values in an array
        clientArr = [clientData];
      }
      if (serverData) {
        try {
          const parsed = JSON.parse(serverData);
          if (Array.isArray(parsed)) serverArr = parsed;
        } catch (error) {
          logError('sync-corrupt-server-data', error);
          // If server data is corrupt, use client data only
        }
      }

      if (clientArr.length === 0 && serverArr.length === 0) return null;
      if (clientArr.length === 0) return serverData;
      if (serverArr.length === 0) return JSON.stringify(clientData);

      // Deduplicate by 'id' field if present, otherwise by timestamp
      const merged = new Map<string, unknown>();
      const getKey = (item: unknown): string | null => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          if (typeof obj.id === 'string') return obj.id;
          if (typeof obj.moduleId === 'string' && typeof obj.completedAt === 'string')
            return `${obj.moduleId}:${obj.completedAt}`;
          if (typeof obj.timestamp === 'number') return String(obj.timestamp);
        }
        return null;
      };

      for (const item of serverArr) {
        const key = getKey(item);
        if (key) merged.set(key, item);
        else merged.set(`idx_${merged.size}`, item);
      }
      for (const item of clientArr) {
        const key = getKey(item);
        if (key) merged.set(key, item);
        else merged.set(`idx_${merged.size}`, item);
      }

      const result = Array.from(merged.values());
      // Prune oldest items if exceeding limit (keep newest = first items)
      return JSON.stringify(result.slice(0, maxItems));
    };

    const mergedQuizResults = mergeArrays(quizResults, existingProgress?.quizResults, 50);
    const mergedModuleHistory = mergeArrays(moduleHistory, existingProgress?.moduleHistory, 500);
    const mergedAchievements = mergeArrays(achievements, existingProgress?.achievements, 50);

    const progress = await prisma.userProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXP: mergedXP,
        level: mergedLevel,
        quizResults: mergedQuizResults ?? null,
        moduleHistory: mergedModuleHistory ?? null,
        achievements: mergedAchievements ?? null,
      },
      update: {
        totalXP: mergedXP,
        level: mergedLevel,
        quizResults: mergedQuizResults !== undefined ? mergedQuizResults : undefined,
        moduleHistory: mergedModuleHistory !== undefined ? mergedModuleHistory : undefined,
        achievements: mergedAchievements !== undefined ? mergedAchievements : undefined,
      },
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
      return withSecurityHeaders(rateLimitResponse('progressSync', ip, req));
    }

    const parsed = await safeJson<{
      totalXP?: number;
      newQuizResults?: unknown[];
      newModuleInteractions?: unknown[];
      newAchievements?: string[];
      lastSyncAt?: string;
    }>(req);
    if (isErrorResponse(parsed)) return parsed;

    const { totalXP, newQuizResults, newModuleInteractions, newAchievements, lastSyncAt: _lastSyncAt } = parsed;

    // Validate totalXP
    if (totalXP !== undefined && (typeof totalXP !== 'number' || totalXP < 0 || totalXP > 10_000_000)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid XP value' }, { status: 400 }));
    }

    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    // XP merge: only accept client XP if it's within reasonable delta
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

    // Helper to merge arrays from JSON strings
    const mergeJsonArrays = (
      newData: unknown[] | undefined,
      existingData: string | null | undefined,
      maxItems: number
    ): string | null | undefined => {
      if (!newData && !existingData) return null;
      if (!newData || newData.length === 0) return existingData;

      let existingArr: unknown[] = [];
      if (existingData) {
        try {
          existingArr = JSON.parse(existingData);
          if (!Array.isArray(existingArr)) existingArr = [];
        } catch (error) {
          logError('sync-corrupt-data', error);
          // Corrupt data, use new data only
        }
      }

      // Prepend new items to existing array (newest first)
      const merged = [...newData, ...existingArr].slice(0, maxItems);
      return JSON.stringify(merged);
    };

    const mergedQuizResults = mergeJsonArrays(newQuizResults, existingProgress?.quizResults, 50);
    const mergedModuleHistory = mergeJsonArrays(newModuleInteractions, existingProgress?.moduleHistory, 500);
    const mergedAchievements = mergeJsonArrays(
      newAchievements?.map((a: string) => ({ id: a, unlockedAt: new Date().toISOString() })),
      existingProgress?.achievements,
      50
    );

    const progress = await prisma.userProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXP: mergedXP,
        level: mergedLevel,
        quizResults: mergedQuizResults ?? null,
        moduleHistory: mergedModuleHistory ?? null,
        achievements: mergedAchievements ?? null,
      },
      update: {
        totalXP: mergedXP,
        level: mergedLevel,
        ...(mergedQuizResults !== undefined && { quizResults: mergedQuizResults }),
        ...(mergedModuleHistory !== undefined && { moduleHistory: mergedModuleHistory }),
        ...(mergedAchievements !== undefined && { achievements: mergedAchievements }),
      },
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
