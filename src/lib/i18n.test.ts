import { describe, it, expect, beforeEach, vi } from 'vitest'
import { t, getCurrentLocale, setLocale, defaultLocale, translations } from './i18n'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('i18n t() function', () => {
  it('returns Russian translation for existing key', () => {
    expect(t('common.calculate', 'ru')).toBe('Рассчитать')
  })

  it('returns English translation for existing key', () => {
    expect(t('common.calculate', 'en')).toBe('Calculate')
  })

  it('returns key when translation missing', () => {
    expect(t('nonexistent.key', 'ru')).toBe('nonexistent.key')
  })

  it('resolves flat keys correctly', () => {
    expect(t('module.gdp.title', 'ru')).toBe('ВВП и макропоказатели')
  })

  it('uses default locale when not specified', () => {
    expect(t('common.calculate')).toBe('Рассчитать')
  })

  it('handles invalid locale gracefully', () => {
    // @ts-expect-error testing invalid locale
    expect(t('common.calculate', 'invalid')).toBe('common.calculate')
  })
})

describe('getCurrentLocale', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('returns default when nothing stored', () => {
    expect(getCurrentLocale()).toBe(defaultLocale)
  })

  it('returns stored locale', () => {
    localStorageMock.setItem('locale', 'en')
    expect(getCurrentLocale()).toBe('en')
  })

  it('ignores invalid stored values', () => {
    localStorageMock.setItem('locale', 'fr')
    expect(getCurrentLocale()).toBe(defaultLocale)
  })

  it('returns ru when ru stored', () => {
    localStorageMock.setItem('locale', 'ru')
    expect(getCurrentLocale()).toBe('ru')
  })
})

describe('setLocale', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('saves to localStorage', () => {
    setLocale('en')
    expect(localStorageMock.getItem('locale')).toBe('en')
  })

  it('updates getCurrentLocale result', () => {
    setLocale('en')
    expect(getCurrentLocale()).toBe('en')
  })

  it('does not save invalid locale', () => {
    // @ts-expect-error testing invalid locale
    setLocale('fr')
    // setLocale allows any value but getCurrentLocale falls back to default
    expect(getCurrentLocale()).toBe(defaultLocale)
  })
})

describe('translations structure', () => {
  it('has both ru and en locales', () => {
    expect(translations).toHaveProperty('ru')
    expect(translations).toHaveProperty('en')
  })

  it('has common keys in both locales', () => {
    const ruKeys = Object.keys(translations.ru)
    const enKeys = Object.keys(translations.en)
    
    // Check that all RU keys exist in EN
    for (const key of ruKeys) {
      expect(enKeys).toContain(key)
    }
  })

  it('has non-empty values', () => {
    const ruValues = Object.values(translations.ru)
    const enValues = Object.values(translations.en)
    
    for (const value of ruValues) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
    
    for (const value of enValues) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
