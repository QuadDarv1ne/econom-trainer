import { NextResponse } from 'next/server';

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
  return result instanceof NextResponse && result.status >= 400;
}
