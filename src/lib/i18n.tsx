import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { translateTexts } from "./translate.functions";

export const LANGUAGES = [
  { code:"en", label:"English" }, { code:"ml", label:"മലയാളം" }, { code:"hi", label:"हिन्दी" }, { code:"ta", label:"தமிழ்" }, { code:"te", label:"తెలుగు" }, { code:"kn", label:"ಕನ್ನಡ" }, { code:"bn", label:"বাংলা" }, { code:"mr", label:"मराठी" }, { code:"gu", label:"ગુજરાતી" }, { code:"pa", label:"ਪੰਜਾਬੀ" }, { code:"ur", label:"اردو" }, { code:"ar", label:"العربية" },
  { code:"es", label:"Español" }, { code:"fr", label:"Français" }, { code:"de", label:"Deutsch" }, { code:"it", label:"Italiano" }, { code:"pt", label:"Português" }, { code:"nl", label:"Nederlands" }, { code:"pl", label:"Polski" }, { code:"uk", label:"Українська" }, { code:"ru", label:"Русский" }, { code:"tr", label:"Türkçe" }, { code:"el", label:"Ελληνικά" },
  { code:"zh", label:"中文" }, { code:"ja", label:"日本語" }, { code:"ko", label:"한국어" }, { code:"id", label:"Bahasa Indonesia" }, { code:"ms", label:"Bahasa Melayu" }, { code:"vi", label:"Tiếng Việt" }, { code:"th", label:"ไทย" }, { code:"sw", label:"Kiswahili" }, { code:"am", label:"አማርኛ" }, { code:"fil", label:"Filipino" }, { code:"fa", label:"فارسی" }, { code:"he", label:"עברית" },
] as const;
export type LanguageCode = typeof LANGUAGES[number]["code"];
const base={Home:"Home",Scan:"Scan",History:"History",Card:"Card",Profile:"Profile",Language:"Language",SelectLanguage:"Choose language",Login:"Login",Logout:"Logout",StartScanning:"Start Scanning"};
const overrides: Partial<Record<LanguageCode, Record<string,string>>> = { ml:{Home:"ഹോം",Scan:"സ്കാൻ",History:"ചരിത്രം",Card:"കാർഡ്",Profile:"പ്രൊഫൈൽ",Language:"ഭാഷ",SelectLanguage:"ഭാഷ തിരഞ്ഞെടുക്കുക",Login:"ലോഗിൻ",Logout:"ലോഗ്ഔട്ട്",StartScanning:"സ്കാൻ ചെയ്യാൻ തുടങ്ങുക"}, hi:{Home:"होम",Scan:"स्कैन",History:"इतिहास",Card:"कार्ड",Profile:"प्रोफ़ाइल",Language:"भाषा",SelectLanguage:"भाषा चुनें",Login:"लॉग इन",Logout:"लॉग आउट",StartScanning:"स्कैन करना शुरू करें"}, ta:{Home:"முகப்பு",Scan:"ஸ்கேன்",History:"வரலாறு",Card:"அட்டை",Profile:"சுயவிவரம்",Language:"மொழி",SelectLanguage:"மொழியைத் தேர்ந்தெடுக்கவும்",Login:"உள்நுழை",Logout:"வெளியேறு",StartScanning:"ஸ்கேன் செய்யத் தொடங்கு"}, ar:{Home:"الرئيسية",Scan:"مسح",History:"السجل",Card:"البطاقة",Profile:"الملف الشخصي",Language:"اللغة",SelectLanguage:"اختر اللغة",Login:"تسجيل الدخول",Logout:"تسجيل الخروج",StartScanning:"ابدأ المسح"} };
const text = LANGUAGES.reduce((acc,l)=>{acc[l.code]={...base,...(overrides[l.code]??{})};return acc},{} as Record<LanguageCode,Record<string,string>>);
const LanguageContext=createContext<{language:LanguageCode;setLanguage:(v:LanguageCode)=>void;t:(key:string)=>string}>({language:"en",setLanguage:()=>{},t:k=>k});

function shouldTranslate(node: Text){ const s=node.nodeValue?.trim()??""; const p=node.parentElement; return !!s && !!p && !["SCRIPT","STYLE","CODE","PRE"].includes(p.tagName) && !p.closest("[data-no-ai-translate]"); }

// Per-language translation cache (original English text -> translated text).
// Without this, every DOM mutation would re-request a translation for text
// that's already on screen and already translated — expensive, slow, and a
// good way to hit AI provider rate limits during normal use.
type TranslationCache = Map<LanguageCode, Map<string, string>>;

async function translateDocument(language: LanguageCode, originals: WeakMap<Text, string>, cache: TranslationCache) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) if (shouldTranslate(n as Text)) nodes.push(n as Text);

  if (language === "en") {
    nodes.forEach((x) => { const o = originals.get(x); if (o) x.nodeValue = o; });
    return;
  }

  nodes.forEach((x) => { if (!originals.has(x)) originals.set(x, x.nodeValue ?? ""); });

  const langCache = cache.get(language) ?? new Map<string, string>();
  cache.set(language, langCache);

  // Apply anything already translated for this language instantly, with no
  // network call, and only collect genuinely new text to send to the AI.
  const pending = new Map<string, Text[]>();
  for (const node of nodes) {
    const original = originals.get(node)?.trim();
    if (!original) continue;
    const cached = langCache.get(original);
    if (cached !== undefined) {
      if (node.nodeValue) node.nodeValue = node.nodeValue.replace(original, cached);
    } else {
      const group = pending.get(original) ?? [];
      group.push(node);
      pending.set(original, group);
    }
  }

  const originalsList = [...pending.keys()];
  for (let i = 0; i < originalsList.length; i += 80) {
    const chunk = originalsList.slice(i, i + 80);
    try {
      const translated = await translateTexts({ data: { language, texts: chunk } });
      translated.forEach((value, j) => {
        langCache.set(chunk[j], value);
        pending.get(chunk[j])?.forEach((node) => { node.nodeValue = node.nodeValue?.replace(chunk[j], value) ?? value; });
      });
    } catch (e) {
      console.error("AI translation failed", e);
      break;
    }
  }
}

export function LanguageProvider({children}:{children:ReactNode}){
  const [language,setLanguageState]=useState<LanguageCode>("en");
  const originals=useRef(new WeakMap<Text,string>());
  const cache=useRef<TranslationCache>(new Map());
  const apply=(v:LanguageCode)=>{document.documentElement.lang=v;document.documentElement.dir=["ar","ur","fa","he"].includes(v)?"rtl":"ltr"};
  useEffect(()=>{const saved=localStorage.getItem("plateguard-language") as LanguageCode|null;if(saved&&LANGUAGES.some(x=>x.code===saved)){setLanguageState(saved);apply(saved)}},[]);

  // Re-translate whenever new text shows up — navigating to a new route,
  // a scan result rendering, a toast/dialog opening — not just once when the
  // language is first changed. TanStack Router swaps page content in place
  // (no full reload), so without this, only whatever was on screen at the
  // moment the language was picked ever got translated.
  useEffect(() => {
    if (language === "en") {
      void translateDocument(language, originals.current, cache.current);
      return;
    }
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void translateDocument(language, originals.current, cache.current), 150);
    };
    schedule();
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [language]);

  const setLanguage=(v:LanguageCode)=>{setLanguageState(v);localStorage.setItem("plateguard-language",v);apply(v)};
  const value=useMemo(()=>({language,setLanguage,t:(key:string)=>text[language][key]??text.en[key]??key}),[language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage=()=>useContext(LanguageContext); export function languageName(code:LanguageCode){return LANGUAGES.find(x=>x.code===code)?.label??"English";}
