import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "am", label: "አማርኛ" }, // Amharic
  { code: "ar", label: "العربية" }, // Arabic
  { code: "bn", label: "বাংলা" }, // Bengali
  { code: "zh", label: "中文" }, // Chinese
  { code: "nl", label: "Nederlands" }, // Dutch
  { code: "en", label: "English" },
  { code: "fil", label: "Filipino" },
  { code: "fr", label: "Français" }, // French
  { code: "de", label: "Deutsch" }, // German
  { code: "el", label: "Ελληνικά" }, // Greek
  { code: "gu", label: "ગુજરાતી" }, // Gujarati
  { code: "he", label: "עברית" }, // Hebrew
  { code: "hi", label: "हिन्दी" }, // Hindi
  { code: "id", label: "Bahasa Indonesia" }, // Indonesian
  { code: "it", label: "Italiano" }, // Italian
  { code: "ja", label: "日本語" }, // Japanese
  { code: "kn", label: "ಕನ್ನಡ" }, // Kannada
  { code: "ko", label: "한국어" }, // Korean
  { code: "ms", label: "Bahasa Melayu" }, // Malay
  { code: "ml", label: "മലയാളം" }, // Malayalam
  { code: "mr", label: "मराठी" }, // Marathi
  { code: "fa", label: "فارسی" }, // Persian
  { code: "pl", label: "Polski" }, // Polish
  { code: "pt", label: "Português" }, // Portuguese
  { code: "pa", label: "ਪੰਜਾਬੀ" }, // Punjabi
  { code: "ru", label: "Русский" }, // Russian
  { code: "es", label: "Español" }, // Spanish
  { code: "sw", label: "Kiswahili" }, // Swahili
  { code: "ta", label: "தமிழ்" }, // Tamil
  { code: "te", label: "తెలుగు" }, // Telugu
  { code: "th", label: "ไทย" }, // Thai
  { code: "tr", label: "Türkçe" }, // Turkish
  { code: "uk", label: "Українська" }, // Ukrainian
  { code: "ur", label: "اردو" }, // Urdu
  { code: "vi", label: "Tiếng Việt" }, // Vietnamese
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

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
  // Home-page section / mobile-menu labels (circled in the UI)
  HowItWorks: "How it works",
  UserGuide: "User guide",
  WhatWeScan: "What we scan",
  Verdicts: "Verdicts",
  Safety: "Safety",
};

// Per-language overrides. Languages not listed here fall back to English
// (see the `t` function below) rather than being silently mistranslated.
// Nav section labels are included so the mobile/desktop menu matches the
// rest of the chrome even before AI translation finishes.
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

// Each language starts from English, then gets its own override object
// merged in individually so translations never bleed into each other
// (a previous version chained every language into a single Object.assign,
// which caused English to end up showing French and every other
// language to stay untranslated).
const text = LANGUAGES.reduce(
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
    document.documentElement.lang = v;
    document.documentElement.dir = ["ar", "ur", "fa", "he"].includes(v) ? "rtl" : "ltr";
  };

  useEffect(() => {
    const saved = localStorage.getItem("plateguard-language") as LanguageCode | null;
    if (saved && LANGUAGES.some((x) => x.code === saved)) {
      setLanguageState(saved);
      apply(saved);
    }
  }, []);

  const setLanguage = (v: LanguageCode) => {
    setLanguageState(v);
    localStorage.setItem("plateguard-language", v);
    apply(v);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => text[language][key] ?? text.en[key] ?? key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function languageName(code: LanguageCode) {
  return LANGUAGES.find((x) => x.code === code)?.label ?? "English";
}
