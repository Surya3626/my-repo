import React, { createContext, useContext, useState, useEffect } from 'react';
import { locales, TranslationSchema } from '../locales/dictionary';

type LanguageType = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: keyof TranslationSchema) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('tpf_lang');
    return (saved as LanguageType) || 'en';
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem('tpf_lang', lang);
  };

  const t = (key: keyof TranslationSchema): string => {
    const dict = locales[language] || locales['en'];
    return dict[key] || locales['en'][key] || String(key);
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
