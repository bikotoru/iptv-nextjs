'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale, locales, type Locale } from './config';

// Import all section files for each locale
// Spanish
import esLogin from './locales/es/login.json';
import esConnections from './locales/es/connections.json';
import esPlayer from './locales/es/player.json';
import esBrowser from './locales/es/browser.json';
import esChannels from './locales/es/channels.json';
import esCategories from './locales/es/categories.json';
import esSettings from './locales/es/settings.json';
import esErrors from './locales/es/errors.json';
import esCommon from './locales/es/common.json';

// English
import enLogin from './locales/en/login.json';
import enConnections from './locales/en/connections.json';
import enPlayer from './locales/en/player.json';
import enBrowser from './locales/en/browser.json';
import enChannels from './locales/en/channels.json';
import enCategories from './locales/en/categories.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';
import enCommon from './locales/en/common.json';

// Turkish
import trLogin from './locales/tr/login.json';
import trConnections from './locales/tr/connections.json';
import trPlayer from './locales/tr/player.json';
import trBrowser from './locales/tr/browser.json';
import trChannels from './locales/tr/channels.json';
import trCategories from './locales/tr/categories.json';
import trSettings from './locales/tr/settings.json';
import trErrors from './locales/tr/errors.json';
import trCommon from './locales/tr/common.json';

// Russian
import ruLogin from './locales/ru/login.json';
import ruConnections from './locales/ru/connections.json';
import ruPlayer from './locales/ru/player.json';
import ruBrowser from './locales/ru/browser.json';
import ruChannels from './locales/ru/channels.json';
import ruCategories from './locales/ru/categories.json';
import ruSettings from './locales/ru/settings.json';
import ruErrors from './locales/ru/errors.json';
import ruCommon from './locales/ru/common.json';

// Portuguese
import ptLogin from './locales/pt/login.json';
import ptConnections from './locales/pt/connections.json';
import ptPlayer from './locales/pt/player.json';
import ptBrowser from './locales/pt/browser.json';
import ptChannels from './locales/pt/channels.json';
import ptCategories from './locales/pt/categories.json';
import ptSettings from './locales/pt/settings.json';
import ptErrors from './locales/pt/errors.json';
import ptCommon from './locales/pt/common.json';

// French
import frLogin from './locales/fr/login.json';
import frConnections from './locales/fr/connections.json';
import frPlayer from './locales/fr/player.json';
import frBrowser from './locales/fr/browser.json';
import frChannels from './locales/fr/channels.json';
import frCategories from './locales/fr/categories.json';
import frSettings from './locales/fr/settings.json';
import frErrors from './locales/fr/errors.json';
import frCommon from './locales/fr/common.json';

// Italian
import itLogin from './locales/it/login.json';
import itConnections from './locales/it/connections.json';
import itPlayer from './locales/it/player.json';
import itBrowser from './locales/it/browser.json';
import itChannels from './locales/it/channels.json';
import itCategories from './locales/it/categories.json';
import itSettings from './locales/it/settings.json';
import itErrors from './locales/it/errors.json';
import itCommon from './locales/it/common.json';

// Merge all sections into a single messages object per locale
const messages: Record<Locale, Record<string, unknown>> = {
  es: {
    login: esLogin,
    connections: esConnections,
    player: esPlayer,
    browser: esBrowser,
    channels: esChannels,
    categories: esCategories,
    settings: esSettings,
    errors: esErrors,
    common: esCommon
  },
  en: {
    login: enLogin,
    connections: enConnections,
    player: enPlayer,
    browser: enBrowser,
    channels: enChannels,
    categories: enCategories,
    settings: enSettings,
    errors: enErrors,
    common: enCommon
  },
  tr: {
    login: trLogin,
    connections: trConnections,
    player: trPlayer,
    browser: trBrowser,
    channels: trChannels,
    categories: trCategories,
    settings: trSettings,
    errors: trErrors,
    common: trCommon
  },
  ru: {
    login: ruLogin,
    connections: ruConnections,
    player: ruPlayer,
    browser: ruBrowser,
    channels: ruChannels,
    categories: ruCategories,
    settings: ruSettings,
    errors: ruErrors,
    common: ruCommon
  },
  pt: {
    login: ptLogin,
    connections: ptConnections,
    player: ptPlayer,
    browser: ptBrowser,
    channels: ptChannels,
    categories: ptCategories,
    settings: ptSettings,
    errors: ptErrors,
    common: ptCommon
  },
  fr: {
    login: frLogin,
    connections: frConnections,
    player: frPlayer,
    browser: frBrowser,
    channels: frChannels,
    categories: frCategories,
    settings: frSettings,
    errors: frErrors,
    common: frCommon
  },
  it: {
    login: itLogin,
    connections: itConnections,
    player: itPlayer,
    browser: itBrowser,
    channels: itChannels,
    categories: itCategories,
    settings: itSettings,
    errors: itErrors,
    common: itCommon
  }
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
