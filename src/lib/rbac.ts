import 'server-only'
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type Role = 'student' | 'teacher' | 'admin';

const ROLE_HIERARCHY = {
  student: 0,
  teacher: 1,
  admin: 2,
} as const satisfies Record<Role, number>;

export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export async function requireRole(requiredRole: Role): Promise<
  | { authorized: true; userId: string; role: string }
  | { authorized: false; error: { status: number; message: string } }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: { status: 401, message: 'Unauthorized' } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return { authorized: false, error: { status: 404, message: 'User not found' } };
  }

  if (!hasRole(user.role, requiredRole)) {
    return { authorized: false, error: { status: 403, message: 'Forbidden' } };
  }

  return { authorized: true, userId: user.id, role: user.role };
}
