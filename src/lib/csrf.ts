/**
 * CSRF protection utility
 * Validates that the request Origin/Referer matches the app's host
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
].filter(Boolean) as string[];

/**
 * Check if the request's Origin header matches an allowed origin.
 * Falls back to Referer if Origin is not set (e.g., some older browsers).
 * Returns true if the origin is valid, false otherwise.
 */
export function validateOrigin(req: Request): boolean {
  if (ALLOWED_ORIGINS.length === 0) {
    // If no origins are configured, skip validation (development mode)
    return true;
  }

  const origin = req.headers.get('origin') || req.headers.get('referer');

  if (!origin) {
    // No origin header — likely a same-origin request or non-browser client
    // Allow it, but this could also be a CSRF attempt with a crafted client
    return true;
  }

  try {
    const originUrl = new URL(origin);
    // Strip trailing slash for comparison
    const requestOrigin = originUrl.origin.replace(/\/$/, '');

    return ALLOWED_ORIGINS.some((allowed) => {
      const allowedOrigin = allowed.replace(/\/$/, '');
      return requestOrigin === allowedOrigin;
    });
  } catch {
    // Invalid URL — reject
    return false;
  }
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
