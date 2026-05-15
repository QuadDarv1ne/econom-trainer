import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

// GET - Get user progress from server
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
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
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - Sync progress from client to server
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
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

    const progress = await prisma.userProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXP: totalXP || 0,
        level: level || 1,
        quizResults: quizResults ? JSON.stringify(quizResults) : null,
        moduleHistory: moduleHistory ? JSON.stringify(moduleHistory) : null,
        achievements: achievements ? JSON.stringify(achievements) : null,
      },
      update: {
        totalXP: totalXP ?? undefined,
        level: level ?? undefined,
        quizResults: quizResults ? JSON.stringify(quizResults) : undefined,
        moduleHistory: moduleHistory ? JSON.stringify(moduleHistory) : undefined,
        achievements: achievements ? JSON.stringify(achievements) : undefined,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress sync error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
