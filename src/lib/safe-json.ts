import { NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/lib/security-headers';

/** Maximum allowed request body size (1 MB) to prevent memory exhaustion attacks. */
const MAX_BODY_SIZE = 1024 * 1024;

async function readBodyWithLimit(req: Request, maxSize: number): Promise<string> {
  if (!req.body) return ''

  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let totalSize = 0
  let cancelled = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        totalSize += value.length
        if (totalSize > maxSize) {
          reader.cancel()
          cancelled = true
          throw new BodyTooLargeError()
        }
        chunks.push(value)
      }
    }
  } catch (error) {
    if (!cancelled) reader.cancel()
    if (error instanceof BodyTooLargeError) throw error
    throw error
  }

  const decoder = new TextDecoder()
  return decoder.decode(concatenate(chunks))
}

function concatenate(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

class BodyTooLargeError extends Error {
  constructor() {
    super('Request body too large')
    this.name = 'BodyTooLargeError'
  }
}

/**
 * Safely parses JSON from a Request body with size enforcement.
 * Uses streaming reads to cap memory usage even when Content-Length
 * header is absent or forged (e.g. chunked transfer encoding).
 * Returns a typed NextResponse with error message on failure.
 */
export async function safeJson<T = unknown>(
  req: Request
): Promise<T | NextResponse<{ error: string }>> {
  try {
    const contentType = req.headers.get('content-type');
    const mimeType = contentType?.split(';')[0]?.trim()
    if (mimeType !== 'application/json') {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      ));
    }

    const text = await readBodyWithLimit(req, MAX_BODY_SIZE)
    if (!text) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      ))
    }

    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return withSecurityHeaders(NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      ))
    }
    return withSecurityHeaders(NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    ));
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
