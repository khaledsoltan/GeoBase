import en from "./../../config/dict/en.json";
import ar from "./../../config/dict/ar.json";

type Dictionary = Record<string, string>;
type DictionaryKey = keyof typeof en;
type LanguageChangeCallback = (lang: string) => void;

const dictionaries: Record<string, Dictionary> = { en, ar };

export class LanguageSettings {
    
  private static language = "ar";
  private static dictionary: Dictionary = ar;
  private static listeners: LanguageChangeCallback[] = [];

  static setLanguage(lang: string): void {
    this.language = lang;
    this.dictionary = dictionaries[lang] || dictionaries["en"];
    this.listeners.forEach((cb) => cb(lang));
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }

  static getLanguage(): string {
    return this.language;
  }

  static isRTL(): boolean {
    return this.language === "ar";
  }

  static t(id: string, values?: Record<string, string>): string {
    const text = this.dictionary[id] || dictionaries["en"][id] || id;
    return values ? this.replaceValues(text, values) : text;
  }

  private static replaceValues(text: string, values: Record<string, string>): string {
    return text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  }

  static onChange(callback: LanguageChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  static getAvailableLanguages(): { code: string; label: string }[] {
    return [
      { code: "en", label: "English" },
      { code: "ar", label: "العربية" },
    ];
  }
}

LanguageSettings.setLanguage("ar");
