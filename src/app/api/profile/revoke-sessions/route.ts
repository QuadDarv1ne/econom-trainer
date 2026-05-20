import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { validateOrigin, csrfErrorResponse } from '@/lib/csrf';

// POST - Sign out from all other sessions by updating user's sessionHash
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!validateOrigin(req)) {
      return csrfErrorResponse();
    }

    // Generate a new session hash to invalidate all other JWTs
    const newSessionHash = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionHash: newSessionHash },
    });

    return NextResponse.json({ message: 'All other sessions revoked' });
  } catch (error) {
    console.error('Revoke sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
