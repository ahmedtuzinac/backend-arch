import { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { useWSListener } from './useWebSocket';

interface I18nContext {
  t: (key: string) => string;
  lang: string;
  setLang: (code: string) => void;
  languages: { code: string; name: string; is_default: boolean }[];
}

const I18nCtx = createContext<I18nContext>({
  t: (key) => key,
  lang: 'en',
  setLang: () => {},
  languages: [],
});

export function useI18n() {
  return useContext(I18nCtx);
}

export { I18nCtx };

export function useLoadI18n() {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [languages, setLanguages] = useState<{ code: string; name: string; is_default: boolean }[]>([]);

  const loadLanguages = async () => {
    try {
      const res = await fetch('/auth/i18n/languages', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLanguages(data.languages);
      }
    } catch { /* ignore */ }
  };

  const loadTranslations = async (code: string) => {
    try {
      const res = await fetch(`/auth/i18n/translations/${code}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTranslations(data.translations);
      }
    } catch { /* ignore */ }
  };

  const setLang = (code: string) => {
    setLangState(code);
    localStorage.setItem('lang', code);
    loadTranslations(code);
  };

  useEffect(() => {
    loadLanguages();
    // Load user's saved language preference
    const init = async () => {
      try {
        const res = await fetch('/auth/users/me', {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (res.ok) {
          const user = await res.json();
          if (user.language && user.language !== lang) {
            setLangState(user.language);
            localStorage.setItem('lang', user.language);
            loadTranslations(user.language);
            return;
          }
        }
      } catch { /* ignore */ }
      loadTranslations(lang);
    };
    init();
  }, []);

  // Real-time: reload when translations change
  useWSListener('translations_updated', (data) => {
    if (data.language === lang) {
      loadTranslations(lang);
    }
  });

  const t = (key: string): string => translations[key] || key;

  return { t, lang, setLang, languages };
}
