import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { AVATAR_MAX_BYTES } from '@/lib/constants';

// Shared select clause for user profile queries — avoid duplication between GET and PATCH
const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  twoFactorEnabled: true,
  emailVerified: true,
  createdAt: true,
} as const;

// GET - Get user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit authenticated reads to prevent enumeration
    const limit = checkRateLimit('profileRead', null);
    if (!limit.ok) {
      return rateLimitResponse('profileRead', null);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_PROFILE_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logError('profile-get', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!validateOrigin(req)) {
      return csrfErrorResponse();
    }

    const ip = getClientIP(req);
    const limit = checkRateLimit('profileUpdate', ip);
    if (!limit.ok) {
      return rateLimitResponse('profileUpdate', ip, req);
    }

    const parsed = await safeJson<{ name?: string; phone?: string | null; image?: string | null }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { name, phone, image } = parsed;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json({ error: 'Name must be a string up to 100 characters' }, { status: 400 });
      }
    }

    // Validate phone
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return NextResponse.json({ error: 'Phone number must be a string up to 20 characters' }, { status: 400 });
      }
      if (phone !== '' && !/^\+?[0-9\s()-]+$/.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    // Validate image (data URL)
    if (image !== undefined && image !== null) {
      if (typeof image !== 'string' || image.length > AVATAR_MAX_BYTES) {
        return NextResponse.json({ error: 'Image must not exceed 5 MB' }, { status: 400 });
      }
      // Validate data URL MIME type is an image
      if (image.startsWith('data:')) {
        const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
        if (!match || !match[1].startsWith('image/')) {
          return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
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
      select: USER_PROFILE_SELECT,
    });

    return NextResponse.json(user);
  } catch (error) {
    logError('profile-update', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
