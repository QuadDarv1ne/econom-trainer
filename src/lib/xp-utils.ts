/**
 * Shared XP/level calculation utilities.
 * Used by both client store and server API routes.
 */

const XP_PER_LEVEL = 500;
const LEVEL_MULTIPLIER = 1.2;

export interface LevelInfo {
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
}

/**
 * Calculate level and XP info from total XP.
 * Uses a progressive scaling algorithm where each level requires more XP.
 */
export function getLevelFromXP(totalXP: number): LevelInfo {
  let level = 1;
  let xpNeeded = XP_PER_LEVEL;
  let remaining = totalXP;

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = Math.round(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }

  return {
    level,
    xpInCurrentLevel: remaining,
    xpToNextLevel: xpNeeded,
  };
}
