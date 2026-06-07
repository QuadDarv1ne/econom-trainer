/** Client-side password strength checker.
 *  Uses the exact same regex patterns as the server-side `validatePasswordStrength`.
 */

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

import { PASSWORD_REGEX } from './validate-password';

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: PASSWORD_REGEX.UPPER.test(password),
    hasLower: PASSWORD_REGEX.LOWER.test(password),
    hasNumber: PASSWORD_REGEX.NUMBER.test(password),
    hasSpecial: PASSWORD_REGEX.SPECIAL_CHAR.test(password),
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  let score = Math.max(0, Math.min(4, metCount - 1));
  if (password.length >= 12 && metCount >= 4) score = Math.max(score, 3);
  if (password.length >= 16 && metCount >= 5) score = Math.max(score, 4);

  const labels = ['passwordStrength.weak', 'passwordStrength.weak', 'passwordStrength.fair', 'passwordStrength.good', 'passwordStrength.strong'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    requirements,
  };
}
