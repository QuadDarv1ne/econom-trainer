import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

// GET - Get user progress from server
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(newProgress);
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Sync progress from client to server
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await safeJson<{
      totalXP?: number;
      level?: number;
      quizResults?: unknown;
      moduleHistory?: unknown;
      achievements?: unknown;
    }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { totalXP, level, quizResults, moduleHistory, achievements } = parsed;

    // Validate totalXP: must be non-negative and reasonable (< 10M)
    if (totalXP !== undefined && (typeof totalXP !== 'number' || totalXP < 0 || totalXP > 10_000_000)) {
      return NextResponse.json({ error: 'Invalid XP value' }, { status: 400 });
    }

    // Validate level: must be between 1 and 200
    if (level !== undefined && (typeof level !== 'number' || level < 1 || level > 200)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    // Validate JSON payload sizes (max 100KB each)
    const maxJsonSize = 100 * 1024;
    for (const [key, value] of Object.entries({ quizResults, moduleHistory, achievements })) {
      if (value !== undefined && value !== null) {
        const size = new TextEncoder().encode(JSON.stringify(value)).length;
        if (size > maxJsonSize) {
          return NextResponse.json({ error: `Data limit exceeded for ${key}` }, { status: 400 });
        }
      }
    }

    const progress = await prisma.userProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXP: totalXP ?? 0,
        level: level ?? 1,
        quizResults: quizResults !== undefined ? JSON.stringify(quizResults) : null,
        moduleHistory: moduleHistory !== undefined ? JSON.stringify(moduleHistory) : null,
        achievements: achievements !== undefined ? JSON.stringify(achievements) : null,
      },
      update: {
        totalXP: totalXP !== undefined ? totalXP : undefined,
        level: level !== undefined ? level : undefined,
        quizResults: quizResults !== undefined ? JSON.stringify(quizResults) : undefined,
        moduleHistory: moduleHistory !== undefined ? JSON.stringify(moduleHistory) : undefined,
        achievements: achievements !== undefined ? JSON.stringify(achievements) : undefined,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
