/**
 * KishanFlow Supported Languages Registry
 * 
 * Supports initial rollout: English (en), Hindi (hi), Punjabi (pa)
 * Designed for effortless expansion into additional Indian languages:
 * Marathi (mr), Bengali (bn), Gujarati (gu), Tamil (ta), Telugu (te),
 * Kannada (kn), Malayalam (ml), Odia (or), Assamese (as).
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    dir: 'ltr',
    fontFamily: "'Noto Sans Gurmukhi', 'Plus Jakarta Sans', sans-serif",
  },
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_STORAGE_KEY = 'kishanflow_language';
export const LANGUAGE_COOKIE_KEY = 'kishanflow_language';

export function getLanguageInfo(code) {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_LANGUAGES[0]
  );
}
