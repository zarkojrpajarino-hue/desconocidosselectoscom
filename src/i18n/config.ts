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
import { discoveryTranslations } from './locales/discoveryTranslations';

// Merge enterprise tools and discovery translations with base translations
const mergeTranslations = (
  base: Record<string, unknown>, 
  enterprise: Record<string, unknown>,
  discovery: Record<string, unknown>
) => ({
  ...base,
  enterpriseTools: enterprise,
  ...discovery,
});

export const resources = {
  en: { translation: mergeTranslations(en, enterpriseToolsTranslations.en, discoveryTranslations.en) },
  es: { translation: mergeTranslations(es, enterpriseToolsTranslations.es, discoveryTranslations.es) },
  fr: { translation: mergeTranslations(fr, enterpriseToolsTranslations.fr, discoveryTranslations.fr) },
  de: { translation: mergeTranslations(de, enterpriseToolsTranslations.de, discoveryTranslations.de) },
  pt: { translation: mergeTranslations(pt, enterpriseToolsTranslations.pt, discoveryTranslations.pt) },
  it: { translation: mergeTranslations(it, enterpriseToolsTranslations.it, discoveryTranslations.it) },
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
