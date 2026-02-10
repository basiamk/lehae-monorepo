import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLanguage, setLanguage, t, getAvailableLanguages, getCurrentLanguage } from '../lib/language';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Initialize with a default language if getCurrentLanguage returns undefined
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const lang = getCurrentLanguage();
    return lang || { code: 'en', name: 'English', flag: '🇬🇧' };
  });
  const [availableLanguages] = useState(getAvailableLanguages());

  useEffect(() => {
    const savedLanguage = getLanguage();
    if (savedLanguage !== currentLanguage.code) {
      const newLang = getCurrentLanguage();
      if (newLang) {
        setCurrentLanguage(newLang);
      }
    }
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    const newLang = getCurrentLanguage();
    if (newLang) {
      setCurrentLanguage(newLang);
    }
  };

  const translate = (key) => {
    try {
      return t(key);
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  const value = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    t: translate
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};