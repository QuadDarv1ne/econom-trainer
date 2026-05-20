/** Shared password validation rules.
 *  Regex patterns match the client-side checker in src/lib/password-strength.ts.
 */

/** These regex patterns MUST match the ones in src/lib/password-strength.ts */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/;
const UPPER_REGEX = /[A-ZА-ЯЁ]/;
const LOWER_REGEX = /[a-zа-яё]/;
const NUMBER_REGEX = /[0-9]/;

const PASSWORD_ERRORS_RU = {
  minLength: 'Пароль должен содержать минимум 8 символов',
  maxLength: 'Пароль не должен превышать 128 символов',
  upper: 'Пароль должен содержать хотя бы одну заглавную букву',
  lower: 'Пароль должен содержать хотя бы одну строчную букву',
  number: 'Пароль должен содержать хотя бы одну цифру',
  special: 'Пароль должен содержать хотя бы один специальный символ',
} as const;

const PASSWORD_ERRORS_EN = {
  minLength: 'Password must be at least 8 characters long',
  maxLength: 'Password must not exceed 128 characters',
  upper: 'Password must contain at least one uppercase letter',
  lower: 'Password must contain at least one lowercase letter',
  number: 'Password must contain at least one number',
  special: 'Password must contain at least one special character',
} as const;

type PasswordErrors = Record<keyof typeof PASSWORD_ERRORS_EN, string>;

function getPasswordErrors(locale?: 'ru' | 'en'): PasswordErrors {
  return locale === 'ru' ? { ...PASSWORD_ERRORS_RU } : { ...PASSWORD_ERRORS_EN };
}

export function validatePasswordStrength(
  password: string,
  locale?: 'ru' | 'en'
): { valid: true } | { valid: false; error: string } {
  const errors = getPasswordErrors(locale);

  if (password.length < 8) {
    return { valid: false, error: errors.minLength };
  }

  if (password.length > 128) {
    return { valid: false, error: errors.maxLength };
  }

  if (!UPPER_REGEX.test(password)) {
    return { valid: false, error: errors.upper };
  }

  if (!LOWER_REGEX.test(password)) {
    return { valid: false, error: errors.lower };
  }

  if (!NUMBER_REGEX.test(password)) {
    return { valid: false, error: errors.number };
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, error: errors.special };
  }

  return { valid: true };
}
