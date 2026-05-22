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
 * Returns true if the origin is valid, false otherwise.
 */
export function validateOrigin(req: Request): boolean {
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length === 0) {
    // If no origins are configured, only skip validation in development.
    // In production, fail-closed to prevent CSRF bypass from misconfiguration.
    if (process.env.NODE_ENV === 'production') {
      console.error('[CSRF] No allowed origins configured in production — rejecting request');
      return false;
    }
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

    return allowedOrigins.some((allowed) => {
      const allowedOrigin = allowed.replace(/\/$/, '');
      return requestOrigin === allowedOrigin;
    });
  } catch {
    // Invalid URL — reject
    return false;
  }
}

/**
 * Strict origin validation — rejects requests with no Origin/Referer header.
 * Use for public POST endpoints where legitimate requests always originate from
 * the app's own JavaScript (which always sends the Origin header).
 */
export function validateOriginStrict(req: Request): boolean {
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
    // Reject requests with no origin header — legitimate browser fetch/XHR
    // requests from the app will always include an Origin header.
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestOrigin = originUrl.origin.replace(/\/$/, '');

    return allowedOrigins.some((allowed) => {
      const allowedOrigin = allowed.replace(/\/$/, '');
      return requestOrigin === allowedOrigin;
    });
  } catch {
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
