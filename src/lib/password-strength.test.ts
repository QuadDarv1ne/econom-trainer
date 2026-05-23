import { describe, it, expect } from 'vitest';
import { checkPasswordStrength } from '@/lib/password-strength';

describe('checkPasswordStrength', () => {
  it('returns score 0 for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('passwordStrength.weak');
    expect(result.requirements.minLength).toBe(false);
  });

  it('returns score 0 for short password with no requirements', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBe(0);
    expect(result.requirements.minLength).toBe(false);
  });

  it('returns score 1 for password meeting only length requirement', () => {
    const result = checkPasswordStrength('abcdefgh');
    expect(result.score).toBe(1);
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUpper).toBe(false);
    expect(result.requirements.hasNumber).toBe(false);
    expect(result.requirements.hasSpecial).toBe(false);
  });

  it('returns score 2 for password with length + 1 requirement', () => {
    const result = checkPasswordStrength('Abcdefgh');
    expect(result.score).toBe(2);
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUpper).toBe(true);
    expect(result.requirements.hasLower).toBe(true);
  });

  it('returns score 3 for strong password with 4 requirements met', () => {
    // A1!XXXXX: minLength(8+), hasUpper, hasNumber, hasSpecial = 4 met, score = 3
    const result = checkPasswordStrength('A1!XXXXX');
    expect(result.score).toBe(3);
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUpper).toBe(true);
    expect(result.requirements.hasLower).toBe(false);
    expect(result.requirements.hasNumber).toBe(true);
    expect(result.requirements.hasSpecial).toBe(true);
  });

  it('returns score 4 for 12+ char password with all requirements', () => {
    const result = checkPasswordStrength('Abcdefgh1!@#');
    expect(result.score).toBe(4);
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUpper).toBe(true);
    expect(result.requirements.hasLower).toBe(true);
    expect(result.requirements.hasNumber).toBe(true);
    expect(result.requirements.hasSpecial).toBe(true);
  });

  it('returns score 4 for very strong password (16+ chars, all requirements)', () => {
    const result = checkPasswordStrength('Abcdefgh1!@#$%^&');
    expect(result.score).toBe(4);
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUpper).toBe(true);
    expect(result.requirements.hasLower).toBe(true);
    expect(result.requirements.hasNumber).toBe(true);
    expect(result.requirements.hasSpecial).toBe(true);
  });

  it('detects special characters correctly', () => {
    const result = checkPasswordStrength('abcd!@#$');
    expect(result.requirements.hasSpecial).toBe(true);
    expect(result.requirements.hasUpper).toBe(false);
  });

  it('returns correct color for each score', () => {
    expect(checkPasswordStrength('').color).toBe('bg-red-500'); // score 0
    expect(checkPasswordStrength('abcdefgh').color).toBe('bg-red-500'); // score 1
    expect(checkPasswordStrength('Abcdefgh').color).toBe('bg-orange-500'); // score 2
    expect(checkPasswordStrength('A1!XXXXX').color).toBe('bg-yellow-500'); // score 3
    expect(checkPasswordStrength('Abcdefgh1!@#$%^&').color).toBe('bg-green-500'); // score 4
  });
});
