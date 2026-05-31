import { logError } from './log-error';

/**
 * CSRF protection utility
 * Validates that the request Origin/Referer matches the app's host
 */

function getAllowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ].filter(Boolean) as string[];
}

/**
 * Check if the request's Origin header matches an allowed origin.
 * Falls back to Referer if Origin is not set (e.g., some older browsers).
 *
 * @param req - The incoming Request object
 * @param options - Optional configuration
 * @param options.strict - When true, rejects requests with no Origin/Referer header.
 *   Use strict mode for public POST endpoints where legitimate requests always
 *   originate from the app's own JavaScript (which always sends Origin).
 *   Default: false (allows missing origin for same-origin requests).
 */
export function validateOrigin(req: Request, options?: { strict?: boolean }): boolean {
  const strict = options?.strict ?? false;
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      logError('csrf-config', new Error('No allowed origins configured in production'));
      return false;
    }
    return true;
  }

  const originHeader = req.headers.get('origin');
  if (strict && !originHeader) return false;
  const origin = originHeader || req.headers.get('referer');

  if (!origin) {
    if (strict) return false;
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestOrigin = originUrl.origin.replace(/\/$/, '');
    return allowedOrigins.some((allowed) => requestOrigin === allowed.replace(/\/$/, ''));
  } catch {
    return false;
  }
}

/**
 * Strict origin validation — rejects requests with no Origin/Referer header.
 * @deprecated Use validateOrigin(req, { strict: true }) instead.
 */
export function validateOriginStrict(req: Request): boolean {
  return validateOrigin(req, { strict: true });
}

/**
 * Return a 403 response for invalid CSRF origins
 */
export function csrfErrorResponse() {
  const response = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
  // Add security headers — same set as withSecurityHeaders for consistency
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}
