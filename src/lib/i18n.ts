import { ru } from './locales/ru';
import { en } from './locales/en';
import { zh } from './locales/zh';

export type Locale = 'ru' | 'en' | 'zh';

export const locales: Locale[] = ['ru', 'en', 'zh'];

export const defaultLocale: Locale = 'ru';

/** Convert app Locale to BCP 47 locale string for Intl APIs */
export function toLocale(locale: Locale): string {
  if (locale === 'ru') return 'ru-RU'
  if (locale === 'zh') return 'zh-CN'
  return 'en-US'
}

/** Format a number using the app's locale */
export function formatNumberLocale(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(toLocale(locale), options)
}

// UI translations
export const translations = {
  ru,
  en,
  zh,
} as const;

/** Get a translation by key for the current or specified locale */
export function t(key: string, locale?: Locale): string {
  if (locale && !locales.includes(locale)) return key;
  const l = locale ?? getCurrentLocale();
  return translations[l]?.[key] ?? translations[defaultLocale]?.[key] ?? key;
}

/** Get current locale from localStorage or default to 'ru' */
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const stored = localStorage.getItem('locale') as Locale;
    if (stored && locales.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable in private browsing
  }
  return defaultLocale;
}

// Set locale and save to localStorage
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('locale', locale);
  } catch {
    // localStorage may be unavailable in private browsing
  }
  document.documentElement.lang = locale;
}

// Format a number according to the current locale
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(toLocale(locale), options).format(value);
}

// Format a date according to the current locale
export function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(toLocale(locale), options).format(d);
}
