import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from '../locales/en.json';
import mmTranslations from '../locales/mm.json';

export type Language = 'my' | 'en';
export type TranslationParams = Record<string, string | number>;

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<string, any> = {
  en: enTranslations,
  my: mmTranslations,
};

function normalizeLanguage(value: string | null): Language {
  return value === 'en' ? 'en' : 'my';
}

function resolveTranslation(language: Language, key: string): string {
  const read = (source: any): unknown => key.split('.').reduce(
    (current: any, part) => current && typeof current === 'object' ? current[part] : undefined,
    source,
  );
  const localized = read(translations[language]);
  if (typeof localized === 'string') return localized;
  const englishFallback = read(translations.en);
  return typeof englishFallback === 'string' ? englishFallback : key;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('user-lang') || localStorage.getItem('app_language');
    return normalizeLanguage(saved);
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('user-lang', lang);
    localStorage.setItem('app_language', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'my' ? 'my' : 'en';
    document.documentElement.dir = 'ltr';
  }, [language]);

  const t = useCallback((key: string, params: TranslationParams = {}): string => {
    const value = resolveTranslation(language, key);
    return Object.entries(params).reduce(
      (text, [name, replacement]) => text.replaceAll(`{{${name}}}`, String(replacement)),
      value,
    );
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
