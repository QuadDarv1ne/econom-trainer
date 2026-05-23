import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateOrigin, validateOriginStrict, csrfErrorResponse } from './csrf';

describe('validateOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows matching origin', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'http://localhost:3000' },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it('rejects non-matching origin', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'https://evil.com' },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it('allows request with no origin header', () => {
    const req = new Request('http://localhost');
    expect(validateOrigin(req)).toBe(true);
  });

  it('uses referer as fallback when origin is not set', () => {
    const req = new Request('http://localhost', {
      headers: { referer: 'http://localhost:3000/some/path' },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it('rejects invalid URLs in origin header', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'not-a-valid-url' },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it('fails closed in production when no origins configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_URL', undefined);
    vi.stubEnv('NEXTAUTH_URL', undefined);
    vi.stubEnv('VERCEL_URL', undefined);

    const req = new Request('http://localhost', {
      headers: { origin: 'https://evil.com' },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it('allows all requests when no origins configured in development', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_URL', undefined);
    vi.stubEnv('NEXTAUTH_URL', undefined);
    vi.stubEnv('VERCEL_URL', undefined);
    vi.stubEnv('NODE_ENV', 'development');

    const req = new Request('http://localhost', {
      headers: { origin: 'https://evil.com' },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it('allows trailing slash variation', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'http://localhost:3000/' },
    });
    expect(validateOrigin(req)).toBe(true);
  });
});

describe('csrfErrorResponse', () => {
  it('returns 403 response with JSON body', async () => {
    const response = csrfErrorResponse();
    expect(response.status).toBe(403);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });
});

describe('validateOriginStrict', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows matching origin', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'http://localhost:3000' },
    });
    expect(validateOriginStrict(req)).toBe(true);
  });

  it('rejects non-matching origin', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'https://evil.com' },
    });
    expect(validateOriginStrict(req)).toBe(false);
  });

  it('rejects request with no origin header (key difference from validateOrigin)', () => {
    const req = new Request('http://localhost');
    expect(validateOrigin(req)).toBe(true);
    expect(validateOriginStrict(req)).toBe(false);
  });

  it('rejects when origin is explicitly empty string', () => {
    const req = new Request('http://localhost', {
      headers: { origin: '' },
    });
    expect(validateOriginStrict(req)).toBe(false);
  });

  it('uses referer as fallback when origin is not set', () => {
    const req = new Request('http://localhost', {
      headers: { referer: 'http://localhost:3000/some/path' },
    });
    expect(validateOriginStrict(req)).toBe(true);
  });

  it('rejects invalid URLs in origin header', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'not-a-valid-url' },
    });
    expect(validateOriginStrict(req)).toBe(false);
  });

  it('fails closed in production when no origins configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_URL', undefined);
    vi.stubEnv('NEXTAUTH_URL', undefined);
    vi.stubEnv('VERCEL_URL', undefined);

    const req = new Request('http://localhost', {
      headers: { origin: 'http://localhost:3000' },
    });
    expect(validateOriginStrict(req)).toBe(false);
  });

  it('allows trailing slash variation', () => {
    const req = new Request('http://localhost', {
      headers: { origin: 'http://localhost:3000/' },
    });
    expect(validateOriginStrict(req)).toBe(true);
  });
});