/**
 * Shared session validation cache.
 * Used by both auth.ts and auth-edge.ts to avoid N+1 DB queries.
 * Stored on globalThis so both modules share a single cache instance.
 */

const globalForAuth = globalThis as unknown as {
  __sessionCache?: Map<string, { hash: string; expiresAt: number }>;
  __cleanupScheduled?: boolean;
  __pendingValidations?: Map<string, Promise<string | null>>;
};

export const SESSION_CACHE_TTL = 30 * 1000; // 30 seconds

export function getSessionCache(): Map<string, { hash: string; expiresAt: number }> {
  if (!globalForAuth.__sessionCache) {
    globalForAuth.__sessionCache = new Map();
  }
  return globalForAuth.__sessionCache;
}

export function getCachedSessionHash(userId: string): string | null {
  const cached = getSessionCache().get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hash;
  }
  getSessionCache().delete(userId);
  return null;
}

export function setCachedSessionHash(userId: string, hash: string): void {
  getSessionCache().set(userId, { hash, expiresAt: Date.now() + SESSION_CACHE_TTL });
}

export function invalidateSessionCache(userId: string): void {
  getSessionCache().delete(userId);
}

export function scheduleCacheCleanup(): void {
  if (globalForAuth.__cleanupScheduled) return;
  globalForAuth.__cleanupScheduled = true;
  setTimeout(() => {
    globalForAuth.__cleanupScheduled = false;
    const now = Date.now();
    for (const [key, entry] of getSessionCache().entries()) {
      if (entry.expiresAt <= now) getSessionCache().delete(key);
    }
    scheduleCacheCleanup();
  }, SESSION_CACHE_TTL).unref?.();
}

/**
 * Get or create a deduplicated validation promise for a userId.
 * Prevents multiple concurrent DB queries for the same user.
 */
export function getPendingValidation(
  userId: string,
  fetchFn: () => Promise<string | null>
): Promise<string | null> {
  if (!globalForAuth.__pendingValidations) {
    globalForAuth.__pendingValidations = new Map();
  }
  const pending = globalForAuth.__pendingValidations.get(userId);
  if (pending) return pending;

  const promise = fetchFn().finally(() => {
    globalForAuth.__pendingValidations?.delete(userId);
  });
  globalForAuth.__pendingValidations.set(userId, promise);
  return promise;
}

export function clearPendingValidation(userId: string): void {
  globalForAuth.__pendingValidations?.delete(userId);
}
