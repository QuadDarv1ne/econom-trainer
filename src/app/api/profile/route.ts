import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { validateOriginStrict, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { logError } from '@/lib/log-error';
import { sanitizeInput } from '@/lib/sanitize-input';
import { AVATAR_MAX_BYTES } from '@/lib/constants';
import { withSecurityHeaders } from '@/lib/security-headers';

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
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Rate limit authenticated reads to prevent enumeration
    // Use session.user.id as identifier to prevent shared bucket across users
    const limit = checkRateLimit('profileRead', session.user.id);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('profileRead', session.user.id, req));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_PROFILE_SELECT,
    });

    if (!user) {
      return withSecurityHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    return withSecurityHeaders(NextResponse.json(user));
  } catch (error) {
    logError('profile-get', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// PATCH - Update user profile
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
    const limit = checkRateLimit('profileUpdate', ip);
    if (!limit.ok) {
      return withSecurityHeaders(rateLimitResponse('profileUpdate', ip, req));
    }

    const parsed = await safeJson<{ name?: string; phone?: string | null; image?: string | null }>(req);
    if (isErrorResponse(parsed)) return parsed;
    const { name, phone, image } = parsed;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return withSecurityHeaders(NextResponse.json({ error: 'Name must be a string up to 100 characters' }, { status: 400 }));
      }
    }

    // Validate phone
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return withSecurityHeaders(NextResponse.json({ error: 'Phone number must be a string up to 20 characters' }, { status: 400 }));
      }
      if (phone !== '' && !/^\+?[0-9\s()-]+$/.test(phone)) {
        return withSecurityHeaders(NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 }));
      }
    }

    // Validate image (data URL)
    if (image !== undefined && image !== null) {
      if (typeof image !== 'string' || image.length > AVATAR_MAX_BYTES) {
        return withSecurityHeaders(NextResponse.json({ error: 'Image must not exceed 5 MB' }, { status: 400 }));
      }
      // Validate data URL MIME type is an image
      if (image.startsWith('data:')) {
        const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
        if (!match || !match[1].startsWith('image/')) {
          return withSecurityHeaders(NextResponse.json({ error: 'Unsupported image format' }, { status: 400 }));
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: sanitizeInput(name) }),
        ...(phone !== undefined && { phone: phone === '' ? null : sanitizeInput(phone ?? '') }),
        ...(image !== undefined && { image: image === '' ? null : image }),
      },
      select: USER_PROFILE_SELECT,
    });

    return withSecurityHeaders(NextResponse.json(user));
  } catch (error) {
    logError('profile-update', error);
    return withSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
