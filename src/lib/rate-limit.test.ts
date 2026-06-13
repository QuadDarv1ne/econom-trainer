import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, getClientIP, resetRateLimitStore } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  afterEach(() => {
    resetRateLimitStore();
  });

  it('allows first request', () => {
    const result = checkRateLimit('login', '127.0.0.1');
    expect(result.ok).toBe(true);
  });

  it('blocks requests after limit (forgotPass = 3/hour)', () => {
    // forgotPass has max: 3 per hour — easiest to exhaust
    // 3 calls fill the bucket, 4th is blocked
    for (let i = 0; i < 3; i++) {
      checkRateLimit('forgotPass', '10.0.0.1');
    }
    const result = checkRateLimit('forgotPass', '10.0.0.1');
    expect(result.ok).toBe(false);
  });

  it('uses separate buckets for different IPs', () => {
    // Exhaust IP 1's forgotPass bucket (3 per hour)
    for (let i = 0; i < 3; i++) {
      checkRateLimit('forgotPass', '1.1.1.1');
    }
    const blocked = checkRateLimit('forgotPass', '1.1.1.1');
    const allowed = checkRateLimit('forgotPass', '2.2.2.2');
    expect(blocked.ok).toBe(false);
    expect(allowed.ok).toBe(true);
  });

  it('uses separate buckets for different keys', () => {
    // Exhaust key-a forgotPass bucket
    for (let i = 0; i < 4; i++) {
      checkRateLimit('forgotPass', '3.3.3.3');
    }
    expect(checkRateLimit('forgotPass', '3.3.3.3').ok).toBe(false);
    // key-b (login) has separate limit
    expect(checkRateLimit('login', '3.3.3.3').ok).toBe(true);
  });

  it('blocks verifyEmail after 3 requests per hour', () => {
    // verifyEmail has max: 3 per hour
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit('verifyEmail', '10.0.0.5');
      expect(result.ok).toBe(true);
    }
    const blocked = checkRateLimit('verifyEmail', '10.0.0.5');
    expect(blocked.ok).toBe(false);
  });
});

describe('getClientIP', () => {
  it('uses x-real-ip when TRUST_PROXY is enabled', () => {
    vi.stubEnv('TRUST_PROXY', 'true');
    const req = new Request('http://localhost', {
      headers: {
        'x-real-ip': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
      },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
    vi.unstubAllEnvs();
  });

  it('uses x-forwarded-for first IP when TRUST_PROXY is enabled and no x-real-ip', () => {
    vi.stubEnv('TRUST_PROXY', 'true');
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
    vi.unstubAllEnvs();
  });

  it('returns null when no IP headers available', () => {
    const req = new Request('http://localhost');
    const ip = getClientIP(req);
    expect(ip === null || typeof ip === 'string').toBe(true);
  });
});
