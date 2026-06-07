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

/**
 * Reset the rate limit store. Used by tests for isolation.
 */
export function resetRateLimitStore(): void {
  store.clear();
}

// Cleanup interval: prune expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleCleanup() {
  if (cleanupTimeout) return;
  cleanupTimeout = setTimeout(() => {
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
    // Reschedule for next cleanup
    cleanupTimeout = null;
    scheduleCleanup();
  }, CLEANUP_INTERVAL);
  if (cleanupTimeout && typeof cleanupTimeout.unref === 'function') {
    cleanupTimeout.unref();
  }
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
  twoFactorVerify: { windowMs: 15 * 60 * 1000, max: 10 },   // 10 attempts per 15 min
  twoFactorSetup:  { windowMs: 60 * 60 * 1000, max: 5 },    // 5 setup attempts per hour
  twoFactorDisable: { windowMs: 15 * 60 * 1000, max: 5 },  // 5 attempts per 15 min
  changePass:  { windowMs: 15 * 60 * 1000, max: 10 },   // 10 attempts per 15 min
  deleteAcc:   { windowMs: 15 * 60 * 1000, max: 5 },    // 5 attempts per 15 min
  revokeSessions: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 revocations per 15 min
  profileUpdate:  { windowMs: 60 * 1000, max: 20 },     // 20 profile updates per min
  profileRead:    { windowMs: 60 * 1000, max: 30 },     // 30 profile reads per min
  verifyEmail:    { windowMs: 60 * 60 * 1000, max: 3 }, // 3 verification emails per hour
  progressSync:   { windowMs: 60 * 1000, max: 30 },     // 30 syncs per min
  progressRead:   { windowMs: 60 * 1000, max: 30 },     // 30 progress reads per min
} as const;

export function configureRateLimit(key: string, config: RateLimitConfig) {
  configs.set(key, config);
  scheduleCleanup();
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

  const count = entry.timestamps.length;

  // Check FIRST if we've exceeded the limit, before recording this request
  if (count >= config.max) {
    const resetAt = entry.timestamps.length > 0
      ? entry.timestamps[0] + config.windowMs
      : now + config.windowMs;
    return { ok: false, remaining: 0, resetAt };
  }

  // Now record this request (it is allowed)
  entry.timestamps.push(now);

  const remaining = Math.max(0, config.max - entry.timestamps.length);
  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + config.windowMs
    : now + config.windowMs;

  return { ok: true, remaining, resetAt };
}

/**
 * Extract client IP from request headers.
 * Checks proxy headers in priority order: Cloudflare -> Vercel -> generic forwarded-for -> X-Real-IP.
 * Auto-detects when running behind a known hosting provider if TRUST_PROXY is unset.
 * Falls back to null only when no proxy headers are present (direct connection).
 */
export function getClientIP(req: Request): string | null {
  // Determine if we should trust proxy headers
  const trustProxyEnv = process.env.TRUST_PROXY;
  let trustProxy = trustProxyEnv === 'true';

  // Auto-detect known hosting providers when TRUST_PROXY is not explicitly set
  if (trustProxyEnv !== 'false' && !trustProxy) {
    const vercel = process.env.VERCEL || process.env.NOW_REGION;
    const fly = process.env.FLY_APP_NAME;
    const railway = process.env.RAILWAY_ENVIRONMENT;
    const render = process.env.RENDER;
    if (vercel || fly || railway || render) {
      trustProxy = true;
    }
  }

  if (!trustProxy) {
    return null;
  }

  // Priority 1: Cloudflare (most reliable — single IP, no spoofing risk)
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return sanitizeIP(cfIP);

  // Priority 2: Vercel / Fly.io / Render single-IP headers
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return sanitizeIP(realIP);

  // Priority 3: X-Forwarded-For (first IP = original client)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first && first !== 'unknown') return sanitizeIP(first);
  }

  return null;
}

/**
 * Strip whitespace and validate basic IP format.
 * Returns the IP or empty string if clearly invalid.
 */
function sanitizeIP(ip: string): string {
  const trimmed = ip.trim();
  // Reject obviously invalid values
  if (!trimmed || trimmed === 'unknown' || trimmed === 'null') return '';
  return trimmed;
}

/**
 * Helper to create a rate-limited response.
 * Accepts an optional locale ('en' | 'ru' | 'zh') or Request object to determine response language.
 * Falls back to Russian if no locale is provided.
 */
export function rateLimitResponse(key: string, _ip: string | null, locale?: 'en' | 'ru' | 'zh' | Request) {
  const config = configs.get(key);
  if (!config) {
    return NextResponse.json(
      { error: 'Rate limit configuration error' },
      { status: 500 }
    );
  }

  // Calculate actual time until the oldest request in the window expires
  const identifier = `${_ip ?? 'unknown'}:${key}`;
  const entry = store.get(identifier);
  const retryAfter = entry && entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + config.windowMs - Date.now()) / 1000)
    : Math.ceil(config.windowMs / 1000);

  // Resolve locale from Request object or direct locale string
  let resolvedLocale: 'en' | 'ru' | 'zh' = 'ru';
  if (locale && typeof locale === 'object' && locale instanceof Request) {
    const acceptLanguage = locale.headers.get('accept-language') || '';
    const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() || '';
    if (primary.startsWith('en')) resolvedLocale = 'en';
    else if (primary.startsWith('zh')) resolvedLocale = 'zh';
  } else if (locale === 'en' || locale === 'ru' || locale === 'zh') {
    resolvedLocale = locale;
  }

  const errorMessage = resolvedLocale === 'en'
    ? 'Too many requests. Please try again later.'
    : resolvedLocale === 'zh'
      ? '请求过多。请稍后再试。'
      : 'Слишком много запросов. Попробуйте позже.';

  return NextResponse.json(
    { error: errorMessage },
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
