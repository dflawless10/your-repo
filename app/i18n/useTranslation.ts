import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey, LanguageCode } from './translations';

export function useTranslation() {
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('preferredLanguage');
      if (savedLanguage && savedLanguage in translations) {
        setLanguage(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    const translation = translations[language];
    if (translation && key in translation) {
      return translation[key as keyof typeof translation] as string;
    }
    // Fallback to English if translation not found
    return translations.en[key] || key;
  };

  const changeLanguage = async (newLanguage: LanguageCode) => {
    try {
      await AsyncStorage.setItem('preferredLanguage', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return { t, language, changeLanguage };
}
