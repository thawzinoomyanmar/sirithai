import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import mmTranslations from '../locales/mm.json';
import thTranslations from '../locales/th.json';

export type Language = 'mm' | 'my' | 'en' | 'th';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<string, any> = {
  en: enTranslations,
  mm: mmTranslations,
  my: mmTranslations,
  th: thTranslations,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('user-lang') || localStorage.getItem('app_language');
    if (saved === 'en' || saved === 'mm' || saved === 'my' || saved === 'th') {
      return saved as Language;
    }
    return 'mm';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('user-lang', lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[language] || translations['mm'];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to Myanmar
        let fallback: any = translations['mm'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key;
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof current === 'string' ? current : key;
  };

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
