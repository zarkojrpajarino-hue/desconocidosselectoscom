import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import { enterpriseToolsTranslations } from './locales/enterpriseTools';

// Merge enterprise tools translations with base translations
const mergeTranslations = (base: Record<string, unknown>, enterprise: Record<string, unknown>) => ({
  ...base,
  enterpriseTools: enterprise,
});

export const resources = {
  en: { translation: mergeTranslations(en, enterpriseToolsTranslations.en) },
  es: { translation: mergeTranslations(es, enterpriseToolsTranslations.es) },
  fr: { translation: mergeTranslations(fr, enterpriseToolsTranslations.fr) },
  de: { translation: mergeTranslations(de, enterpriseToolsTranslations.de) },
  pt: { translation: mergeTranslations(pt, enterpriseToolsTranslations.pt) },
  it: { translation: mergeTranslations(it, enterpriseToolsTranslations.it) },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
