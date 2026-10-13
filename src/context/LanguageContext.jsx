'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';
import paTranslations from '@/locales/pa.json';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_COOKIE_KEY,
  getLanguageInfo,
} from '@/locales/languages';

const translationsMap = {
  en: enTranslations,
  hi: hiTranslations,
  pa: paTranslations,
};

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, fallbackOrParams, params) => key,
  languages: SUPPORTED_LANGUAGES,
  currentLanguage: SUPPORTED_LANGUAGES[0],
});

/**
 * Resolve a nested key like 'common.login' or 'farmer.dashboard.title'
 */
function resolveKey(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace {{variable}} placeholders with values
 */
function interpolate(template, params) {
  if (!template || !params || typeof params !== 'object') return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, paramName) => {
    return paramName in params ? String(params[paramName]) : match;
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from storage or cookie on client mount
  useEffect(() => {
    let initialLang = DEFAULT_LANGUAGE;
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && translationsMap[stored]) {
        initialLang = stored;
      } else {
        // Fallback to cookie check
        const match = document.cookie.match(
          new RegExp(`(?:^|; )${LANGUAGE_COOKIE_KEY}=([^;]*)`)
        );
        if (match && translationsMap[match[1]]) {
          initialLang = match[1];
        }
      }
    } catch {
      // LocalStorage or cookie unavailable
    }

    setLanguageState(initialLang);
    setIsInitialized(true);

    const langInfo = getLanguageInfo(initialLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initialLang;
      document.documentElement.dir = langInfo.dir || 'ltr';
    }
  }, []);

  const setLanguage = useCallback((code) => {
    if (!translationsMap[code]) return;

    setLanguageState(code);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      // Persist cookie for 1 year
      document.cookie = `${LANGUAGE_COOKIE_KEY}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage unavailable
    }

    const langInfo = getLanguageInfo(code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
      document.documentElement.dir = langInfo.dir || 'ltr';
    }
  }, []);

  /**
   * Main translation function
   * Usage:
   * t('common.login')
   * t('farmer.ordersAwaitingPayment', { count: 5 })
   * t('key.not.found', 'Default Fallback String')
   * t('key.not.found', 'Default Fallback {{name}}', { name: 'Kavya' })
   */
  const t = useCallback(
    (key, fallbackOrParams, maybeParams) => {
      let fallback = null;
      let params = null;

      if (typeof fallbackOrParams === 'string') {
        fallback = fallbackOrParams;
        if (maybeParams && typeof maybeParams === 'object') {
          params = maybeParams;
        }
      } else if (fallbackOrParams && typeof fallbackOrParams === 'object') {
        params = fallbackOrParams;
      }

      const activeDict = translationsMap[language] || translationsMap[DEFAULT_LANGUAGE];
      const enDict = translationsMap[DEFAULT_LANGUAGE];

      let rawString = resolveKey(activeDict, key);

      // Fallback to English dictionary if not found in active language
      if (rawString === undefined && activeDict !== enDict) {
        rawString = resolveKey(enDict, key);
      }

      // If still not found, fallback to passed fallback string or key itself
      if (rawString === undefined) {
        rawString = fallback !== null ? fallback : key;
      }

      // Interpolate parameters like {{count}} or {{name}}
      return params ? interpolate(rawString, params) : rawString;
    },
    [language]
  );

  const currentLanguage = getLanguageInfo(language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
        isInitialized,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenient alias for standard i18n hook
export const useTranslation = useLanguage;
