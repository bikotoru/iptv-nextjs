'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale, locales, type Locale } from './config';

import esMessages from './locales/es.json';
import enMessages from './locales/en.json';
import trMessages from './locales/tr.json';
import ruMessages from './locales/ru.json';
import ptMessages from './locales/pt.json';
import frMessages from './locales/fr.json';
import itMessages from './locales/it.json';

const messages: Record<Locale, typeof esMessages> = {
  es: esMessages,
  en: enMessages,
  tr: trMessages,
  ru: ruMessages,
  pt: ptMessages,
  fr: frMessages,
  it: itMessages
};

const LOCALE_STORAGE_KEY = 'react-iptv-locale';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }

  // Try to detect browser language
  const browserLang = navigator.language.split('-')[0];
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  return defaultLocale;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedLocale = getStoredLocale();
    setLocaleState(storedLocale);
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  // Show nothing until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}
