import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // For now, we'll use localStorage-based locale detection on the client
  // and default locale on the server
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});

export async function getMessages(locale: Locale) {
  try {
    return (await import(`./locales/${locale}.json`)).default;
  } catch {
    return (await import(`./locales/${defaultLocale}.json`)).default;
  }
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
