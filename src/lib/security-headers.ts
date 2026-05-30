import { NextResponse } from 'next/server';

/**
 * Security headers to apply to all API responses.
 * These provide defense-in-depth even though Next.js config sets headers for page responses.
 * API routes bypass next.config.ts headers, so we apply them explicitly here.
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0', // Modern browsers ignore this; disable to prevent false positives
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Apply security headers to a NextResponse.
 * Always adds Cache-Control: no-store to prevent browser caching of API responses,
 * which may contain sensitive user data even on seemingly static endpoints.
 * Usage: return withSecurityHeaders(NextResponse.json({ data }));
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Always prevent caching of API responses to avoid stale user data
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
