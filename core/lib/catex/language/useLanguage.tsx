import { useState, useEffect, useCallback } from "react";
import { LanguageSettings } from "./LanguageSettings";

export function useLanguage() {
  const [lang, setLang] = useState(LanguageSettings.getLanguage());

  useEffect(() => {
    return LanguageSettings.onChange((newLang) => setLang(newLang));
  }, []);

  const t = useCallback(
    (id: string, values?: Record<string, string>) => LanguageSettings.t(id, values),
    [lang]
  );

  const switchLanguage = useCallback((code: string) => {
    LanguageSettings.setLanguage(code);
  }, []);

  return {
    lang,
    t,
    switchLanguage,
    isRTL: LanguageSettings.isRTL(),
    languages: LanguageSettings.getAvailableLanguages(),
  };
}