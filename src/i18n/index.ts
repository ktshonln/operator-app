import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import rw from './locales/rw.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = '@katisha_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    // Use default language when storage is unavailable
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: savedLanguage ?? 'rw',
    fallbackLng: 'en',
    resources: {
      rw: { translation: rw },
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: {
      escapeValue: false,
    },
  });
};

export const changeAppLanguage = async (code: string) => {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // Language still changes for the current session
  }
};

void initI18n();

export default i18n;
