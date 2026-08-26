import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** English display names used only for alphabetical ordering in the picker. */
const LANGUAGE_SORT_NAME: Record<string, string> = {
  en: "English",
  am: "Amharic",
  ar: "Arabic",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  bn: "Bengali",
  zh: "Chinese",
  nl: "Dutch",
  fil: "Filipino",
  fr: "French",
  de: "German",
  el: "Greek",
  gu: "Gujarati",
  he: "Hebrew",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  kn: "Kannada",
  sw: "Kiswahili",
  ko: "Korean",
  ml: "Malayalam",
  mr: "Marathi",
  fa: "Persian",
  pl: "Polish",
  pt: "Portuguese",
  pa: "Punjabi",
  ru: "Russian",
  es: "Spanish",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  vi: "Vietnamese",
};

const LANGUAGES_RAW = [
  { code: "en", label: "English" },
  { code: "ml", label: "മലയാളം" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "bn", label: "বাংলা" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "اردو" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "el", label: "Ελληνικά" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "sw", label: "Kiswahili" },
  { code: "am", label: "አማርኛ" },
  { code: "fil", label: "Filipino" },
  { code: "fa", label: "فارسی" },
  { code: "he", label: "עברית" },
] as const;

/** English first, then every other language sorted A→Z by English name. */
export const LANGUAGES = [
  LANGUAGES_RAW.find((l) => l.code === "en")!,
  ...[...LANGUAGES_RAW]
    .filter((l) => l.code !== "en")
    .sort((a, b) =>
      (LANGUAGE_SORT_NAME[a.code] ?? a.label).localeCompare(
        LANGUAGE_SORT_NAME[b.code] ?? b.label,
        "en",
        { sensitivity: "base" },
      ),
    ),
] as unknown as typeof LANGUAGES_RAW;

export type LanguageCode = (typeof LANGUAGES_RAW)[number]["code"];

const base: Record<string, string> = {
  Home: "Home",
  Scan: "Scan",
  History: "History",
  Card: "Card",
  Profile: "Profile",
  Language: "Language",
  SelectLanguage: "Choose language",
  Login: "Login",
  Logout: "Logout",
  StartScanning: "Start Scanning",
  HowItWorks: "How it works",
  UserGuide: "User guide",
  WhatWeScan: "What we scan",
  Verdicts: "Verdicts",
  Safety: "Safety",
  TryAgain: "Try again",
  GoHome: "Go home",
  PageNotFound: "Page not found",
  PageDidntLoad: "This page didn't load",
  SomethingWentWrong: "Something went wrong on our end. You can try refreshing or head back home.",
  Scroll: "Scroll",
  SetYourProfile: "Set your profile",
  AverageTimeToVerdict: "Average time to a verdict",
  AllergensTracked: "Allergens tracked by default",
  HealthConditions: "Health conditions supported",
  IngredientsGuesswork: "Ingredients left to guesswork",
};

const overrides: Partial<Record<LanguageCode, Record<string, string>>> = {
  ml: {
    Home: "ഹോം",
    Scan: "സ്കാൻ",
    History: "ചരിത്രം",
    Card: "കാർഡ്",
    Profile: "പ്രൊഫൈൽ",
    Language: "ഭാഷ",
    SelectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    Login: "ലോഗിൻ",
    Logout: "ലോഗ്ഔട്ട്",
    StartScanning: "സ്കാൻ ചെയ്യാൻ തുടങ്ങുക",
    HowItWorks: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു",
    UserGuide: "ഉപയോക്തൃ ഗൈഡ്",
    WhatWeScan: "ഞങ്ങൾ സ്കാൻ ചെയ്യുന്നത്",
    Verdicts: "വിധിന്യായങ്ങൾ",
    Safety: "സുരക്ഷ",
  },
  hi: {
    Home: "होम",
    Scan: "स्कैन",
    History: "इतिहास",
    Card: "कार्ड",
    Profile: "प्रोफ़ाइल",
    Language: "भाषा",
    SelectLanguage: "भाषा चुनें",
    Login: "लॉग इन",
    Logout: "लॉग आउट",
    StartScanning: "स्कैन करना शुरू करें",
    HowItWorks: "यह कैसे काम करता है",
    UserGuide: "उपयोगकर्ता गाइड",
    WhatWeScan: "हम क्या स्कैन करते हैं",
    Verdicts: "निर्णय",
    Safety: "सुरक्षा",
  },
  ta: {
    Home: "முகப்பு",
    Scan: "ஸ்கேன்",
    History: "வரலாறு",
    Card: "அட்டை",
    Profile: "சுயவிவரம்",
    Language: "மொழி",
    SelectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்",
    Login: "உள்நுழை",
    Logout: "வெளியேறு",
    StartScanning: "ஸ்கேன் செய்யத் தொடங்கு",
    HowItWorks: "இது எப்படி வேலை செய்கிறது",
    UserGuide: "பயனர் வழிகாட்டி",
    WhatWeScan: "நாங்கள் எதை ஸ்கேன் செய்கிறோம்",
    Verdicts: "தீர்ப்புகள்",
    Safety: "பாதுகாப்பு",
  },
  ar: {
    Home: "الرئيسية",
    Scan: "مسح",
    History: "السجل",
    Card: "البطاقة",
    Profile: "الملف الشخصي",
    Language: "اللغة",
    SelectLanguage: "اختر اللغة",
    Login: "تسجيل الدخول",
    Logout: "تسجيل الخروج",
    StartScanning: "ابدأ المسح",
    HowItWorks: "كيف يعمل",
    UserGuide: "دليل المستخدم",
    WhatWeScan: "ما الذي نمسحه",
    Verdicts: "الأحكام",
    Safety: "السلامة",
  },
  es: {
    Home: "Inicio",
    Scan: "Escanear",
    History: "Historial",
    Card: "Tarjeta",
    Profile: "Perfil",
    Language: "Idioma",
    SelectLanguage: "Elegir idioma",
    Login: "Iniciar sesión",
    Logout: "Cerrar sesión",
    StartScanning: "Empezar a escanear",
    HowItWorks: "Cómo funciona",
    UserGuide: "Guía del usuario",
    WhatWeScan: "Qué escaneamos",
    Verdicts: "Veredictos",
    Safety: "Seguridad",
  },
  fr: {
    Home: "Accueil",
    Scan: "Scanner",
    History: "Historique",
    Card: "Carte",
    Profile: "Profil",
    Language: "Langue",
    SelectLanguage: "Choisir la langue",
    Login: "Connexion",
    Logout: "Déconnexion",
    StartScanning: "Commencer à scanner",
    HowItWorks: "Comment ça marche",
    UserGuide: "Guide utilisateur",
    WhatWeScan: "Ce que nous scannons",
    Verdicts: "Verdicts",
    Safety: "Sécurité",
  },
};

const text = LANGUAGES_RAW.reduce(
  (acc, l) => {
    acc[l.code] = { ...base, ...(overrides[l.code] ?? {}) };
    return acc;
  },
  {} as Record<LanguageCode, Record<string, string>>,
);

const LanguageContext = createContext<{
  language: LanguageCode;
  setLanguage: (v: LanguageCode) => void;
  t: (key: string) => string;
}>({ language: "en", setLanguage: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  const apply = (v: LanguageCode) => {
    try {
      document.documentElement.lang = v;
      document.documentElement.dir = ["ar", "ur", "fa", "he"].includes(v) ? "rtl" : "ltr";
    } catch {
      // SSR / non-DOM — ignore
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("plateguard-language") as LanguageCode | null;
      if (saved && LANGUAGES_RAW.some((x) => x.code === saved)) {
        setLanguageState(saved);
        apply(saved);
      }
    } catch {
      // private mode / blocked storage
    }
  }, []);

  const setLanguage = (v: LanguageCode) => {
    setLanguageState(v);
    try {
      localStorage.setItem("plateguard-language", v);
    } catch {
      // ignore
    }
    apply(v);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => text[language]?.[key] ?? text.en[key] ?? key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function languageName(code: LanguageCode) {
  return LANGUAGES.find((x) => x.code === code)?.label ?? "English";
}
