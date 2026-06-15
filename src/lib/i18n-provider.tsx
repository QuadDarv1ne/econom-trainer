'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Locale, getCurrentLocale, setLocale, t as translate } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      return getCurrentLocale();
    } catch {
      return 'ru';
    }
  });

  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale;
  }, [locale]);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string) => translate(key, localeRef.current), []);

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    return {
      locale: 'ru' as Locale,
      setLocale: () => {},
      t: (key: string) => translate(key, 'ru'),
    };
  }
  return context;
}