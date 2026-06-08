import { NextResponse } from 'next/server';

/** Maximum allowed request body size (1 MB) to prevent memory exhaustion attacks. */
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Safely parses JSON from a Request body.
 * Returns a typed NextResponse with error message on failure.
 */
export async function safeJson<T = unknown>(
  req: Request
): Promise<T | NextResponse<{ error: string }>> {
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    return await req.json() as T;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
}

/**
 * Type guard to check if the result is a NextResponse error.
 */
export function isErrorResponse(
  result: unknown
): result is NextResponse<{ error: string }> {
  return result instanceof Response && result.status >= 400;
}
