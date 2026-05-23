import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, PASSWORD_REGEX } from '@/lib/validate-password';

describe('validatePasswordStrength', () => {
  it('rejects empty password', () => {
    const result = validatePasswordStrength('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('8');
  });

  it('rejects password shorter than 8 chars', () => {
    const result = validatePasswordStrength('Abc1!');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('8');
  });

  it('rejects password without uppercase', () => {
    const result = validatePasswordStrength('abcdefg1!');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('uppercase');
  });

  it('rejects password without lowercase', () => {
    const result = validatePasswordStrength('ABCDEFG1!');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('lowercase');
  });

  it('rejects password without number', () => {
    const result = validatePasswordStrength('Abcdefgh!');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('number');
  });

  it('rejects password without special char', () => {
    const result = validatePasswordStrength('Abcdefgh1');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('special');
  });

  it('accepts valid password with all requirements', () => {
    const result = validatePasswordStrength('Abcdefg1!');
    expect(result.valid).toBe(true);
  });

  it('rejects password exceeding 128 chars', () => {
    const longPassword = 'A' + 'b'.repeat(127) + '1!';
    expect(longPassword.length).toBeGreaterThan(128);
    const result = validatePasswordStrength(longPassword);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('128');
  });

  it('accepts password exactly 8 chars', () => {
    expect(validatePasswordStrength('Abcdefg1!').valid).toBe(true);
  });

  it('accepts password exactly 128 chars', () => {
    const password = 'A' + 'b'.repeat(125) + '1!';
    expect(password.length).toBe(128);
    expect(validatePasswordStrength(password).valid).toBe(true);
  });

  it('rejects whitespace-only password', () => {
    const result = validatePasswordStrength('        ');
    expect(result.valid).toBe(false);
  });

  it('detects Cyrillic uppercase', () => {
    const result = validatePasswordStrength('Абcdefg1!');
    expect(result.valid).toBe(true);
  });

  it('detects Cyrillic lowercase', () => {
    const result = validatePasswordStrength('Abcdefg1!'.replace('b', 'б'));
    expect(result.valid).toBe(true);
  });

  describe('locale-specific error messages', () => {
    it('returns Russian error messages', () => {
      const result = validatePasswordStrength('abc', 'ru');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toBe('Пароль должен содержать минимум 8 символов');
    });

    it('returns English error messages (default)', () => {
      const result = validatePasswordStrength('abc');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('returns Chinese error messages', () => {
      const result = validatePasswordStrength('abc', 'zh');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toBe('密码至少需要8个字符');
    });

    it('returns Russian error for missing uppercase', () => {
      const result = validatePasswordStrength('abcdefg1!', 'ru');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain('заглавную');
    });

    it('returns Chinese error for missing special char', () => {
      const result = validatePasswordStrength('Abcdefg1', 'zh');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain('特殊字符');
    });
  });
});

describe('PASSWORD_REGEX', () => {
  it('matches special characters', () => {
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('!')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('@')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('#')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('$')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('%')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('^')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('&')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('*')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('(')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test(')')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('-')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('_')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('+')).toBe(true);
    expect(PASSWORD_REGEX.SPECIAL_CHAR.test('=')).toBe(true);
  });

  it('matches uppercase Latin and Cyrillic', () => {
    expect(PASSWORD_REGEX.UPPER.test('A')).toBe(true);
    expect(PASSWORD_REGEX.UPPER.test('Z')).toBe(true);
    expect(PASSWORD_REGEX.UPPER.test('А')).toBe(true); // Cyrillic А
    expect(PASSWORD_REGEX.UPPER.test('Я')).toBe(true);
    expect(PASSWORD_REGEX.UPPER.test('Ё')).toBe(true);
  });

  it('matches lowercase Latin and Cyrillic', () => {
    expect(PASSWORD_REGEX.LOWER.test('a')).toBe(true);
    expect(PASSWORD_REGEX.LOWER.test('z')).toBe(true);
    expect(PASSWORD_REGEX.LOWER.test('а')).toBe(true); // Cyrillic а
    expect(PASSWORD_REGEX.LOWER.test('я')).toBe(true);
    expect(PASSWORD_REGEX.LOWER.test('ё')).toBe(true);
  });

  it('matches digits', () => {
    for (let i = 0; i <= 9; i++) {
      expect(PASSWORD_REGEX.NUMBER.test(String(i))).toBe(true);
    }
  });
});
