import { describe, it, expect } from 'vitest';
import { getLocaleFromRequest } from '@/lib/email';

describe('getLocaleFromRequest', () => {
  function makeRequest(acceptLanguage: string): Request {
    return new Request('http://example.com', {
      headers: { 'accept-language': acceptLanguage },
    });
  }

  it('returns zh for Chinese locales', () => {
    expect(getLocaleFromRequest(makeRequest('zh-CN'))).toBe('zh');
    expect(getLocaleFromRequest(makeRequest('zh-TW'))).toBe('zh');
    expect(getLocaleFromRequest(makeRequest('zh'))).toBe('zh');
  });

  it('returns zh when zh has higher quality factor', () => {
    expect(getLocaleFromRequest(makeRequest('ru-RU;q=0.8, zh-CN;q=0.9'))).toBe('zh');
    expect(getLocaleFromRequest(makeRequest('en-US;q=0.7, zh-CN;q=0.9'))).toBe('zh');
  });

  it('returns en for English locales', () => {
    expect(getLocaleFromRequest(makeRequest('en-US'))).toBe('en');
    expect(getLocaleFromRequest(makeRequest('en-GB'))).toBe('en');
    expect(getLocaleFromRequest(makeRequest('en'))).toBe('en');
  });

  it('returns ru for Russian locales', () => {
    expect(getLocaleFromRequest(makeRequest('ru-RU'))).toBe('ru');
    expect(getLocaleFromRequest(makeRequest('ru'))).toBe('ru');
  });

  it('falls back to ru for unknown locales', () => {
    expect(getLocaleFromRequest(makeRequest('fr-FR'))).toBe('ru');
    expect(getLocaleFromRequest(makeRequest('de-DE'))).toBe('ru');
    expect(getLocaleFromRequest(makeRequest(''))).toBe('ru');
    expect(getLocaleFromRequest(makeRequest('ja'))).toBe('ru');
  });

  it('handles quality factors correctly', () => {
    // zh has higher quality than en, so should be returned
    expect(getLocaleFromRequest(makeRequest('en-US;q=0.8, zh-CN;q=0.9'))).toBe('zh');
  });
});
