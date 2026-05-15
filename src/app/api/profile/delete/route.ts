import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

// DELETE - Delete user account
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const parsed = await safeJson<{ password: string }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { password } = parsed;

    if (!password) {
      return NextResponse.json(
        { error: 'Введите пароль для подтверждения' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Невозможно удалить аккаунт' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 400 }
      );
    }

    // Delete user (cascade handles related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ message: 'Аккаунт удалён' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
