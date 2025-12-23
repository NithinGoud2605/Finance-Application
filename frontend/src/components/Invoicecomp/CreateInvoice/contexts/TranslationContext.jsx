import React, { createContext, useContext, useState, useCallback } from 'react';

const TranslationContext = createContext();

const dictionaries = {
  en: {
    invoiceLabel: 'Invoice',
    fromLabel: 'From',
    toLabel: 'To',
    itemsLabel: 'Items',
    // ...
  },
  es: {
    invoiceLabel: 'Factura',
    fromLabel: 'De',
    toLabel: 'A',
    itemsLabel: 'Artículos',
    // ...
  },
  // add more languages...
};

export const TranslationProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');

  // Simple translator function
  const t = useCallback(
    (key) => {
      return dictionaries[currentLang][key] || key;
    },
    [currentLang]
  );

  const switchLanguage = useCallback((langCode) => {
    if (dictionaries[langCode]) {
      setCurrentLang(langCode);
    }
  }, []);

  return (
    <TranslationContext.Provider value={{ t, currentLang, switchLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => useContext(TranslationContext);
