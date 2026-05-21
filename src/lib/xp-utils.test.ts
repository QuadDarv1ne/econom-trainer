import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLevelFromXP } from './xp-utils';

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    const result = getLevelFromXP(0);
    expect(result.level).toBe(1);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNextLevel).toBe(500);
  });

  it('returns level 1 for less than 500 XP', () => {
    const result = getLevelFromXP(499);
    expect(result.level).toBe(1);
    expect(result.xpInCurrentLevel).toBe(499);
    expect(result.xpToNextLevel).toBe(500);
  });

  it('returns level 2 for 500 XP', () => {
    const result = getLevelFromXP(500);
    expect(result.level).toBe(2);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNextLevel).toBe(600); // 500 * 1.2
  });

  it('calculates progressive XP requirements', () => {
    // Level 1: 500, Level 2: 600, Level 3: 720
    const result = getLevelFromXP(500 + 600 + 720);
    expect(result.level).toBe(4);
  });

  it('handles very large XP values', () => {
    const result = getLevelFromXP(1_000_000);
    expect(result.level).toBeGreaterThan(1);
    expect(result.xpInCurrentLevel).toBeGreaterThanOrEqual(0);
  });

  it('returns correct remaining XP at exact level boundary', () => {
    const result = getLevelFromXP(500);
    expect(result.xpInCurrentLevel).toBe(0); // Exactly at boundary, 0 remaining
  });
});
