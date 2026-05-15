import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';

// GET - Get user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        twoFactorEnabled: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const parsed = await safeJson<{ name?: string; phone?: string | null; image?: string | null }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { name, phone, image } = parsed;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json({ error: 'Имя должно быть строкой до 100 символов' }, { status: 400 });
      }
    }

    // Validate phone
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return NextResponse.json({ error: 'Номер телефона должен быть строкой до 20 символов' }, { status: 400 });
      }
      if (phone !== '' && !/^\+?[0-9\s()-]+$/.test(phone)) {
        return NextResponse.json({ error: 'Неверный формат номера телефона' }, { status: 400 });
      }
    }

    // Validate image (data URL)
    if (image !== undefined && image !== null) {
      if (typeof image !== 'string' || image.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Изображение не должно превышать 5 МБ' }, { status: 400 });
      }
      // Validate data URL MIME type is an image
      if (image.startsWith('data:')) {
        const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
        if (!match || !match[1].startsWith('image/')) {
          return NextResponse.json({ error: 'Неподдерживаемый формат изображения' }, { status: 400 });
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone === '' ? null : phone }),
        ...(image !== undefined && { image: image === '' ? null : image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
