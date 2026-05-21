import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateJwtSession } from './validate-jwt-session';
import * as sessionCache from './session-cache';
import { prisma } from './prisma';

// Mock the session cache module
vi.mock('./session-cache', async () => {
  const actual = await vi.importActual('./session-cache');
  return {
    ...(actual as object),
    getCachedSessionHash: vi.fn(),
    setCachedSessionHash: vi.fn(),
    invalidateSessionCache: vi.fn(),
    scheduleCacheCleanup: vi.fn(),
    getPendingValidation: vi.fn((userId: string, fetchFn: () => Promise<unknown>) => fetchFn()),
  };
});

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('validateJwtSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token unchanged if userId is not a string', async () => {
    const token = { id: null, sessionHash: 'abc' };
    const result = await validateJwtSession(token);
    expect(result).toBe(token);
    expect(sessionCache.getCachedSessionHash).not.toHaveBeenCalled();
  });

  it('returns token unchanged if sessionHash is not a string', async () => {
    const token = { id: 'user123', sessionHash: null };
    const result = await validateJwtSession(token);
    expect(result).toBe(token);
    expect(sessionCache.getCachedSessionHash).not.toHaveBeenCalled();
  });

  it('clears token if DB user not found', async () => {
    vi.mocked(sessionCache.getCachedSessionHash).mockReturnValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const token = { id: 'user123', sessionHash: 'hash1', twoFactorEnabled: true };
    const result = await validateJwtSession(token);

    expect(sessionCache.invalidateSessionCache).toHaveBeenCalledWith('user123');
    expect(result.id).toBeUndefined();
    expect(result.sessionHash).toBeUndefined();
    expect(result.twoFactorEnabled).toBe(false);
  });

  it('clears token if sessionHash does not match', async () => {
    vi.mocked(sessionCache.getCachedSessionHash).mockReturnValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ sessionHash: 'differentHash' });

    const token = { id: 'user123', sessionHash: 'hash1', twoFactorEnabled: true };
    const result = await validateJwtSession(token);

    expect(sessionCache.invalidateSessionCache).toHaveBeenCalledWith('user123');
    expect(result.id).toBeUndefined();
    expect(result.sessionHash).toBeUndefined();
  });

  it('caches session hash when validation succeeds', async () => {
    vi.mocked(sessionCache.getCachedSessionHash).mockReturnValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ sessionHash: 'hash1' });

    const token = { id: 'user123', sessionHash: 'hash1' };
    await validateJwtSession(token);

    expect(sessionCache.setCachedSessionHash).toHaveBeenCalledWith('user123', 'hash1');
  });

  it('fails closed on DB error', async () => {
    vi.mocked(sessionCache.getCachedSessionHash).mockReturnValue(null);
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB connection failed'));

    const token = { id: 'user123', sessionHash: 'hash1', twoFactorEnabled: true };
    const result = await validateJwtSession(token);

    expect(result.id).toBeUndefined();
    expect(result.sessionHash).toBeUndefined();
    expect(result.twoFactorEnabled).toBe(false);
  });
});
