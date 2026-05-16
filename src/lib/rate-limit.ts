import { NextResponse } from 'next/server';

/**
 * Simple IP-based rate limiter using in-memory storage.
 * Uses sliding window log algorithm for accurate rate limiting.
 *
 * For multi-instance deployments, replace with Redis-based rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store: key (IP + route) -> timestamps of requests
const store = new Map<string, RateLimitEntry>();

// Cleanup interval: prune expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const configValues = Array.from(configs.values());
    const maxWindow = configValues.length > 0
      ? Math.max(...configValues.map((c) => c.windowMs))
      : CLEANUP_INTERVAL * 2;
    for (const [key, entry] of store.entries()) {
      const oldestRelevant = now - maxWindow;
      entry.timestamps = entry.timestamps.filter((t) => t > oldestRelevant);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  cleanupTimer.unref();
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
}

const configs = new Map<string, RateLimitConfig>();

// Predefined rate limits for auth endpoints
export const RATE_LIMITS = {
  login:       { windowMs: 15 * 60 * 1000, max: 20 },   // 20 attempts per 15 min
  register:    { windowMs: 60 * 60 * 1000, max: 5 },    // 5 registrations per hour
  forgotPass:  { windowMs: 60 * 60 * 1000, max: 3 },    // 3 reset requests per hour
  resetPass:   { windowMs: 60 * 1000, max: 10 },        // 10 attempts per minute
  twoFactor:   { windowMs: 15 * 60 * 1000, max: 10 },   // 10 attempts per 15 min
} as const;

export function configureRateLimit(key: string, config: RateLimitConfig) {
  configs.set(key, config);
  ensureCleanup();
}

export function checkRateLimit(key: string, ip: string | null): { ok: boolean; remaining: number; resetAt: number } {
  const config = configs.get(key);
  if (!config) {
    return { ok: true, remaining: Infinity, resetAt: 0 };
  }

  const identifier = `${ip ?? 'unknown'}:${key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Record this request first
  entry.timestamps.push(now);

  const count = entry.timestamps.length;
  const remaining = Math.max(0, config.max - count);
  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + config.windowMs
    : now + config.windowMs;

  if (count > config.max) {
    // Remove the request we just added since it exceeds the limit
    entry.timestamps.pop();
    return { ok: false, remaining: 0, resetAt };
  }

  return { ok: true, remaining, resetAt };
}

/**
 * Extract client IP from request headers.
 * Only trusts X-Forwarded-For when behind a verified reverse proxy
 * (nginx, Vercel, Cloudflare, etc.) with TRUST_PROXY=true.
 * Otherwise falls back to X-Real-IP or null.
 */
export function getClientIP(req: Request): string | null {
  const trustProxy = process.env.TRUST_PROXY === 'true';

  if (trustProxy) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;

  return null;
}

/**
 * Helper to create a rate-limited response.
 */
export function rateLimitResponse(key: string, _ip: string | null) {
  const config = configs.get(key);
  if (!config) throw new Error(`Unknown rate limit config key: ${key}`);

  // Calculate actual time until the oldest request in the window expires
  const identifier = `${_ip ?? 'unknown'}:${key}`;
  const entry = store.get(identifier);
  const retryAfter = entry && entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + config.windowMs - Date.now()) / 1000)
    : Math.ceil(config.windowMs / 1000);

  return NextResponse.json(
    { error: 'Слишком много запросов. Попробуйте позже.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, retryAfter)),
        'X-RateLimit-Limit': String(config.max),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

// Auto-configure all predefined rate limits
for (const [key, config] of Object.entries(RATE_LIMITS)) {
  configureRateLimit(key, config);
}
