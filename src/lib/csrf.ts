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
      console.error('[CSRF] No allowed origins configured in production — rejecting request');
      return false;
    }
    return true;
  }

  const origin = req.headers.get('origin') || req.headers.get('referer');

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
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
