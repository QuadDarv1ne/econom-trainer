/**
 * Shared JWT session validation logic.
 * Used by both auth.ts and auth-edge.ts to avoid duplication.
 */
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  getCachedSessionHash,
  setCachedSessionHash,
  invalidateSessionCache,
  scheduleCacheCleanup,
  getPendingValidation,
} from "@/lib/session-cache";
import { logError } from "@/lib/log-error";

/**
 * Validate the sessionHash in a JWT token against the database.
 * Uses a shared cache to avoid N+1 DB queries.
 * Mutates the token in place — returns the same token reference.
 */
export async function validateJwtSession(token: JWT): Promise<JWT> {
  const userId = token.id;
  const sessionHash = token.sessionHash;

  // Only validate if both fields exist and are strings
  if (typeof userId !== "string" || typeof sessionHash !== "string") {
    return token;
  }

  const cachedHash = getCachedSessionHash(userId);
  if (cachedHash !== null && cachedHash === sessionHash) {
    // Cache hit — session is valid, skip DB query
    return token;
  }

  // Ensure cleanup is scheduled (idempotent)
  scheduleCacheCleanup();

  try {
    const dbUser = await getPendingValidation(userId, async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { sessionHash: true },
      });
    });

    if (!dbUser || dbUser.sessionHash !== sessionHash) {
      // Session has been revoked — invalidate
      invalidateSessionCache(userId);
      (token as Record<string, unknown>).id = undefined;
      (token as Record<string, unknown>).sessionHash = undefined;
      (token as Record<string, unknown>).twoFactorEnabled = false;
      return token;
    }

    // Cache the valid session hash
    if (dbUser.sessionHash) {
      setCachedSessionHash(userId, dbUser.sessionHash);
    }
  } catch (error) {
    // Fail closed on DB error for security
    logError("session-validation", error);
    (token as Record<string, unknown>).id = undefined;
    (token as Record<string, unknown>).sessionHash = undefined;
    (token as Record<string, unknown>).twoFactorEnabled = false;
  }

  return token;
}
