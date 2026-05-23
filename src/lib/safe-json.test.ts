import { describe, it, expect } from 'vitest';
import { safeJson, isErrorResponse } from '@/lib/safe-json';
import { NextResponse } from 'next/server';

describe('safeJson', () => {
  it('parses valid JSON with correct Content-Type', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test', value: 42 }),
    });
    const result = await safeJson<{ name: string; value: number }>(req);
    expect(isErrorResponse(result)).toBe(false);
    if (!isErrorResponse(result)) {
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    }
  });

  it('returns error for missing Content-Type', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });
    const result = await safeJson(req);
    expect(isErrorResponse(result)).toBe(true);
    if (isErrorResponse(result)) {
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.error).toBe('Content-Type must be application/json');
    }
  });

  it('returns error for non-JSON Content-Type', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'hello world',
    });
    const result = await safeJson(req);
    expect(isErrorResponse(result)).toBe(true);
    if (isErrorResponse(result)) {
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.error).toBe('Content-Type must be application/json');
    }
  });

  it('returns error for invalid JSON body', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json}',
    });
    const result = await safeJson(req);
    expect(isErrorResponse(result)).toBe(true);
    if (isErrorResponse(result)) {
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.error).toBe('Invalid JSON in request body');
    }
  });

  it('handles empty body with correct Content-Type', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await safeJson(req);
    // req.json() on empty body throws, so it returns error
    expect(isErrorResponse(result)).toBe(true);
  });
});

describe('isErrorResponse', () => {
  it('returns true for NextResponse with status >= 400', () => {
    const response = NextResponse.json({ error: 'test' }, { status: 400 });
    expect(isErrorResponse(response)).toBe(true);

    const response500 = NextResponse.json({ error: 'test' }, { status: 500 });
    expect(isErrorResponse(response500)).toBe(true);
  });

  it('returns false for NextResponse with status < 400', () => {
    const response200 = NextResponse.json({ data: 'ok' }, { status: 200 });
    expect(isErrorResponse(response200)).toBe(false);

    const response201 = NextResponse.json({ data: 'created' }, { status: 201 });
    expect(isErrorResponse(response201)).toBe(false);
  });

  it('returns false for non-NextResponse values', () => {
    expect(isErrorResponse(null)).toBe(false);
    expect(isErrorResponse(undefined)).toBe(false);
    expect(isErrorResponse({ error: 'test' })).toBe(false);
    expect(isErrorResponse('error')).toBe(false);
    expect(isErrorResponse(42)).toBe(false);
  });
});
