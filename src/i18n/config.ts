export const locales = ['es', 'en', 'tr', 'ru', 'pt', 'fr', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  tr: 'Türkçe',
  ru: 'Русский',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano'
};

export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  tr: '🇹🇷',
  ru: '🇷🇺',
  pt: '🇧🇷',
  fr: '🇫🇷',
  it: '🇮🇹'
};
