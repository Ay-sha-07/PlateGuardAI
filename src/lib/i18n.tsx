import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code:"en", label:"English" }, { code:"ml", label:"മലയാളം" }, { code:"hi", label:"हिन्दी" }, { code:"ta", label:"தமிழ்" }, { code:"te", label:"తెలుగు" }, { code:"kn", label:"ಕನ್ನಡ" }, { code:"bn", label:"বাংলা" }, { code:"mr", label:"मराठी" }, { code:"gu", label:"ગુજરાતી" }, { code:"pa", label:"ਪੰਜਾਬੀ" }, { code:"ur", label:"اردو" }, { code:"ar", label:"العربية" },
  { code:"es", label:"Español" }, { code:"fr", label:"Français" }, { code:"de", label:"Deutsch" }, { code:"it", label:"Italiano" }, { code:"pt", label:"Português" }, { code:"nl", label:"Nederlands" }, { code:"pl", label:"Polski" }, { code:"uk", label:"Українська" }, { code:"ru", label:"Русский" }, { code:"tr", label:"Türkçe" }, { code:"el", label:"Ελληνικά" },
  { code:"zh", label:"中文" }, { code:"ja", label:"日本語" }, { code:"ko", label:"한국어" }, { code:"id", label:"Bahasa Indonesia" }, { code:"ms", label:"Bahasa Melayu" }, { code:"vi", label:"Tiếng Việt" }, { code:"th", label:"ไทย" }, { code:"sw", label:"Kiswahili" }, { code:"am", label:"አማርኛ" }, { code:"fil", label:"Filipino" }, { code:"fa", label:"فارسی" }, { code:"he", label:"עברית" },
] as const;
export type LanguageCode = typeof LANGUAGES[number]["code"];

const base={Home:"Home",Scan:"Scan",History:"History",Card:"Card",Profile:"Profile",Language:"Language",SelectLanguage:"Choose language",Login:"Login",Logout:"Logout",StartScanning:"Start Scanning"};
// Per-language overrides. Languages not listed here fall back to English
// (see the `t` function below) rather than being silently mistranslated.
const overrides: Partial<Record<LanguageCode, Record<string,string>>> = {
  ml:{Home:"ഹോം",Scan:"സ്കാൻ",History:"ചരിത്രം",Card:"കാർഡ്",Profile:"പ്രൊഫൈൽ",Language:"ഭാഷ",SelectLanguage:"ഭാഷ തിരഞ്ഞെടുക്കുക",Login:"ലോഗിൻ",Logout:"ലോഗ്ഔട്ട്",StartScanning:"സ്കാൻ ചെയ്യാൻ തുടങ്ങുക"},
  hi:{Home:"होम",Scan:"स्कैन",History:"इतिहास",Card:"कार्ड",Profile:"प्रोफ़ाइल",Language:"भाषा",SelectLanguage:"भाषा चुनें",Login:"लॉग इन",Logout:"लॉग आउट",StartScanning:"स्कैन करना शुरू करें"},
  ta:{Home:"முகப்பு",Scan:"ஸ்கேன்",History:"வரலாறு",Card:"அட்டை",Profile:"சுயவிவரம்",Language:"மொழி",SelectLanguage:"மொழியைத் தேர்ந்தெடுக்கவும்",Login:"உள்நுழை",Logout:"வெளியேறு",StartScanning:"ஸ்கேன் செய்யத் தொடங்கு"},
  ar:{Home:"الرئيسية",Scan:"مسح",History:"السجل",Card:"البطاقة",Profile:"الملف الشخصي",Language:"اللغة",SelectLanguage:"اختر اللغة",Login:"تسجيل الدخول",Logout:"تسجيل الخروج",StartScanning:"ابدأ المسح"},
  es:{Home:"Inicio",Scan:"Escanear",History:"Historial",Card:"Tarjeta",Profile:"Perfil",Language:"Idioma",SelectLanguage:"Elegir idioma",Login:"Iniciar sesión",Logout:"Cerrar sesión",StartScanning:"Empezar a escanear"},
  fr:{Home:"Accueil",Scan:"Scanner",History:"Historique",Card:"Carte",Profile:"Profil",Language:"Langue",SelectLanguage:"Choisir la langue",Login:"Connexion",Logout:"Déconnexion",StartScanning:"Commencer à scanner"},
};
// Each language starts from English, then gets its own override object
// merged in individually so translations never bleed into each other
// (a previous version chained every language into a single Object.assign,
// which caused English to end up showing French and every other
// language to stay untranslated).
const text = LANGUAGES.reduce((acc, l) => {
  acc[l.code] = { ...base, ...(overrides[l.code] ?? {}) };
  return acc;
}, {} as Record<LanguageCode, Record<string,string>>);
const LanguageContext=createContext<{language:LanguageCode;setLanguage:(v:LanguageCode)=>void;t:(key:string)=>string}>({language:"en",setLanguage:()=>{},t:k=>k});
export function LanguageProvider({children}:{children:ReactNode}){const [language,setLanguageState]=useState<LanguageCode>("en"); const apply=(v:LanguageCode)=>{document.documentElement.lang=v;document.documentElement.dir=["ar","ur","fa","he"].includes(v)?"rtl":"ltr"}; useEffect(()=>{const saved=localStorage.getItem("plateguard-language") as LanguageCode|null;if(saved&&LANGUAGES.some(x=>x.code===saved)){setLanguageState(saved);apply(saved)}},[]); const setLanguage=(v:LanguageCode)=>{setLanguageState(v);localStorage.setItem("plateguard-language",v);apply(v)}; const value=useMemo(()=>({language,setLanguage,t:(key:string)=>text[language][key]??text.en[key]??key}),[language]);return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>}
export const useLanguage=()=>useContext(LanguageContext); export function languageName(code:LanguageCode){return LANGUAGES.find(x=>x.code===code)?.label??"English";}
