import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

// List of all message namespaces (sections)
const messageNamespaces = [
  'login',
  'connections',
  'player',
  'browser',
  'channels',
  'categories',
  'settings',
  'errors',
  'common'
] as const;

// Load all messages for a given locale by merging all section files
async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const messages: Record<string, unknown> = {};

  for (const namespace of messageNamespaces) {
    try {
      const sectionMessages = (await import(`./locales/${locale}/${namespace}.json`)).default;
      messages[namespace] = sectionMessages;
    } catch {
      // If a section file doesn't exist, try to load from fallback locale
      try {
        const fallbackMessages = (await import(`./locales/${defaultLocale}/${namespace}.json`)).default;
        messages[namespace] = fallbackMessages;
      } catch {
        // If even the fallback doesn't exist, skip this section
        console.warn(`Missing translation section: ${namespace} for locale: ${locale}`);
      }
    }
  }

  return messages;
}

export default getRequestConfig(async () => {
  // For now, we'll use localStorage-based locale detection on the client
  // and default locale on the server
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale)
  };
});

export async function getMessages(locale: Locale) {
  try {
    return await loadMessages(locale);
  } catch {
    return await loadMessages(defaultLocale);
  }
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
