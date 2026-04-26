/**
 * i18next configuration.
 *
 * Locale JSON files are imported statically so they are bundled by Vite and
 * work on Cloudflare Workers (no filesystem access at runtime).
 *
 * To add a new language:
 * 1. Run `DEEPL_API_KEY=xxx npm run translate` to auto-generate the JSON.
 * 2. Import the new file below and add it to `resources`.
 * 3. Add the language entry to SUPPORTED_LANGUAGES.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../locales/en.json";
import zh from "../../locales/zh.json";
import es from "../../locales/es.json";
import fr from "../../locales/fr.json";
import ar from "../../locales/ar.json";
import pt from "../../locales/pt.json";
import ru from "../../locales/ru.json";
import id from "../../locales/id.json";
import ja from "../../locales/ja.json";

// 🚧 Hindi (hi) and Bengali (bn): work in progress — DeepL unsupported.

export interface SupportedLanguage {
  code: string;
  label: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English",    dir: "ltr" },
  { code: "zh", label: "中文",        dir: "ltr" },
  { code: "es", label: "Español",    dir: "ltr" },
  { code: "fr", label: "Français",   dir: "ltr" },
  { code: "ar", label: "العربية",    dir: "rtl" },
  { code: "pt", label: "Português",  dir: "ltr" },
  { code: "ru", label: "Русский",    dir: "ltr" },
  { code: "id", label: "Indonesia",  dir: "ltr" },
  { code: "ja", label: "日本語",      dir: "ltr" },
];

const STORAGE_KEY = "unmapped_lang";

export function getStoredLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) ?? "en";
}

export function setStoredLanguage(lang: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
      pt: { translation: pt },
      ru: { translation: ru },
      id: { translation: id },
      ja: { translation: ja },
    },
    lng: getStoredLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
}

export default i18n;
