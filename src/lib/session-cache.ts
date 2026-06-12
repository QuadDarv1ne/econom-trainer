/**
 * Shared session validation cache.
 * Used by both auth.ts and auth-edge.ts to avoid N+1 DB queries.
 * Stored on globalThis so both modules share a single cache instance.
 */

const globalForAuth = globalThis as unknown as {
  __sessionCache?: Map<string, { hash: string; expiresAt: number }>;
  __cleanupScheduled?: boolean;
  __pendingValidations?: Map<string, Promise<unknown>>;
};

export const SESSION_CACHE_TTL = 30 * 1000;

const VALIDATION_TIMEOUT_MS = 5000;

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
 * Includes a timeout to prevent memory leaks from stalled promises.
 */
export function getPendingValidation<T>(
  userId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (!globalForAuth.__pendingValidations) {
    globalForAuth.__pendingValidations = new Map();
  }
  const pending = globalForAuth.__pendingValidations.get(userId) as Promise<T> | undefined;
  if (pending) return pending;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Session validation timed out')), VALIDATION_TIMEOUT_MS)
  );

  const promise = Promise.race([fetchFn(), timeoutPromise]).finally(() => {
    globalForAuth.__pendingValidations?.delete(userId);
  });
  globalForAuth.__pendingValidations.set(userId, promise);
  return promise;
}

export function clearPendingValidation(userId: string): void {
  globalForAuth.__pendingValidations?.delete(userId);
}
