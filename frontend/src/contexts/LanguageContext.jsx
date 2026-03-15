import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const lng = i18n.language || 'en';
    return {
      code: lng,
      name: lng === 'st' ? 'Sesotho' : 'English',
      flag: lng === 'st' ? '🇱🇸' : '🇬🇧'
    };
  });

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'st', name: 'Sesotho', flag: '🇱🇸' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage({
      code: lng,
      name: lng === 'st' ? 'Sesotho' : 'English',
      flag: lng === 'st' ? '🇱🇸' : '🇬🇧'
    });
  };

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage({
        code: lng,
        name: lng === 'st' ? 'Sesotho' : 'English',
        flag: lng === 'st' ? '🇱🇸' : '🇬🇧'
      });
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const value = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    t: i18n.t.bind(i18n)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};