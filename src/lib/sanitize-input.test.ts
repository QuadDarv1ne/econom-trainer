import { describe, it, expect } from 'vitest';
import { sanitizePlainText, sanitizeImageUrl } from './sanitize-input';

describe('sanitizePlainText', () => {
  it('strips HTML tags', () => {
    expect(sanitizePlainText('<script>alert("xss")</script>')).toBe('');
    expect(sanitizePlainText('<b>bold</b>')).toBe('bold');
    expect(sanitizePlainText('<a href="http://evil.com">click</a>')).toBe('click');
  });

  it('trims whitespace', () => {
    expect(sanitizePlainText('  hello  ')).toBe('hello');
  });

  it('preserves safe plain text', () => {
    expect(sanitizePlainText('Hello, World!')).toBe('Hello, World!');
    expect(sanitizePlainText('John Doe 2nd')).toBe('John Doe 2nd');
    expect(sanitizePlainText('')).toBe('');
  });

  it('handles mixed content', () => {
    expect(sanitizePlainText('<p>Hello</p><p>World</p>')).toBe('HelloWorld');
  });

  it('strips script tags with content', () => {
    expect(sanitizePlainText('<script>doEvil()</script>')).toBe('');
  });

  it('strips event handlers', () => {
    expect(sanitizePlainText('<img onerror="evil()">')).toBe('');
  });
});

describe('sanitizeImageUrl', () => {
  it('allows empty string', () => {
    expect(sanitizeImageUrl('')).toBe('');
  });

  it('allows relative URLs', () => {
    expect(sanitizeImageUrl('/images/avatar.png')).toBe('/images/avatar.png');
    expect(sanitizeImageUrl('./photo.jpg')).toBe('./photo.jpg');
    expect(sanitizeImageUrl('../uploads/img.png')).toBe('../uploads/img.png');
  });

  it('allows valid https URLs', () => {
    expect(sanitizeImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(sanitizeImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeImageUrl('javascript:alert("xss")')).toBe('');
    expect(sanitizeImageUrl('JAVASCRIPT:alert(1)')).toBe('');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeImageUrl('vbscript:msgbox("xss")')).toBe('');
  });

  it('blocks data:text/html protocol', () => {
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('allows valid data:image URLs', () => {
    expect(sanitizeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(sanitizeImageUrl('data:image/jpeg;base64,/9j/4AAQ==')).toBe('data:image/jpeg;base64,/9j/4AAQ==');
  });

  it('rejects invalid data: URLs', () => {
    expect(sanitizeImageUrl('data:image/gif;base64')).toBe('');
    expect(sanitizeImageUrl('data:text/plain;base64,abc')).toBe('');
  });

  it('rejects malformed URLs', () => {
    expect(sanitizeImageUrl('not-a-url')).toBe('');
    expect(sanitizeImageUrl('ftp://example.com/file')).toBe('');
  });

  it('trims whitespace from input', () => {
    expect(sanitizeImageUrl('  https://example.com/img.jpg  ')).toBe('https://example.com/img.jpg');
  });
});
