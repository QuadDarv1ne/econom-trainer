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

/** These regex patterns MUST match the ones in src/lib/validate-password.ts */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/;
const UPPER_REGEX = /[A-ZА-ЯЁ]/;
const LOWER_REGEX = /[a-zа-яё]/;
const NUMBER_REGEX = /[0-9]/;

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: UPPER_REGEX.test(password),
    hasLower: LOWER_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSpecial: SPECIAL_CHAR_REGEX.test(password),
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  let score = Math.max(0, Math.min(4, metCount - 1));
  if (password.length >= 12 && metCount >= 4) score = Math.max(score, 3);
  if (password.length >= 16 && metCount >= 5) score = 4;

  const labels = ['passwordStrength.weak', 'passwordStrength.weak', 'passwordStrength.fair', 'passwordStrength.good', 'passwordStrength.strong'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    requirements,
  };
}
