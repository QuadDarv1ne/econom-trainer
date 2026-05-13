import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Код обязателен' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { twoFactorConf: true },
    });

    if (!user || !user.twoFactorConf) {
      return NextResponse.json({ error: '2FA не настроена' }, { status: 400 });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorConf.secret,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Hash backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10))
    );

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    await prisma.twoFactorConfirmation.update({
      where: { userId: user.id },
      data: { backupCodes: JSON.stringify(hashedBackupCodes) },
    });

    return NextResponse.json({
      message: '2FA успешно включена',
      backupCodes,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
