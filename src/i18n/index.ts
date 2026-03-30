import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import rw from './locales/rw.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: 'rw',           // Kinyarwanda as primary language
    fallbackLng: 'en',   // English as fallback
    resources: {
      rw: { translation: rw },
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
