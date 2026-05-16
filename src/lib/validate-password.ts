/** Shared password validation rules.
 *  Regex patterns match the client-side checker in src/lib/password-strength.ts.
 */

/** These regex patterns MUST match the ones in src/lib/password-strength.ts */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/;
const UPPER_REGEX = /[A-ZА-ЯЁ]/;
const LOWER_REGEX = /[a-zа-яё]/;
const NUMBER_REGEX = /[0-9]/;

export function validatePasswordStrength(
  password: string
): { valid: true } | { valid: false; error: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен содержать минимум 8 символов' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Пароль не должен превышать 128 символов' };
  }

  if (!UPPER_REGEX.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' };
  }

  if (!LOWER_REGEX.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну строчную букву' };
  }

  if (!NUMBER_REGEX.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' };
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы один специальный символ' };
  }

  return { valid: true };
}
