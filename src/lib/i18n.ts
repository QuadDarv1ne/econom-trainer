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

// Pre-compute union of all known keys for dev-mode validation
const allKnownKeys: Set<string> = new Set();
for (const locale of locales) {
  const dict = translations[locale] as Record<string, string>;
  for (const key of Object.keys(dict)) {
    allKnownKeys.add(key);
  }
}

// Cache for translation lookups to avoid repeated object property access
const translationCache = new Map<string, string>();

function warnMissingKey(key: string): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Throttle: warn at most once per key per session
    if (!translationCache.has(`__warned__${key}`)) {
      translationCache.set(`__warned__${key}`, '1');
      if (!allKnownKeys.has(key)) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation key in all locales: "${key}"`);
      }
    }
  }
}

/**
 * Detect initial locale based on browser language preference.
 * Falls back to 'ru' if browser language is not supported.
 */
function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  const browserLang = navigator.language ? navigator.language.split('-')[0] : null;
  if (browserLang === 'en' || browserLang === 'zh') return browserLang as Locale;
  return 'ru';
}

export function t(key: string, locale?: Locale): string {
  if (locale && !locales.includes(locale)) return key;
  const l = locale ?? getCurrentLocale();

  // Try cache first
  const cacheKey = `${l}:${key}`;
  const cached = translationCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const value = translations[l]?.[key] ?? translations[defaultLocale]?.[key] ?? key;

  // In dev mode, warn if key is missing from the requested locale (but exists in default)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!(translations[l] as Record<string, string>)?.[key] && (translations[defaultLocale] as Record<string, string>)?.[key]) {
      if (!translationCache.has(`__warned_locale__${l}:${key}`)) {
        translationCache.set(`__warned_locale__${l}:${key}`, '1');
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Key "${key}" missing in locale "${l}", falling back to "${defaultLocale}"`);
      }
    } else if (value === key && key !== '') {
      warnMissingKey(key);
    }
  }

  // Only cache non-empty results
  if (value !== key || key === '') {
    translationCache.set(cacheKey, value);
  }

  return value;
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
  return detectInitialLocale();
}

// Set locale and save to localStorage
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  if (!locales.includes(locale)) return;
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
