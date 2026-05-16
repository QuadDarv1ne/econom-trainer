/** Shared password strength validation rules.
 *  All password-setting endpoints must use this to enforce consistent requirements.
 */
export function validatePasswordStrength(
  password: string
): { valid: true } | { valid: false; error: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен содержать минимум 8 символов' };
  }

  if (!/[A-ZА-ЯЁ]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' };
  }

  if (!/[a-zа-яё]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну строчную букву' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы один специальный символ' };
  }

  return { valid: true };
}
