import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST - Sign out from all other sessions by updating user's sessionHash
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Generate a new session hash to invalidate all other JWTs
    const newSessionHash = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionHash: newSessionHash },
    });

    return NextResponse.json({ message: 'Все другие сессии завершены' });
  } catch (error) {
    console.error('Revoke sessions error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
