import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { getVisionProviders } from "./ai-provider.server";

const Schema = z.object({
  // Prefer English language names ("Hindi", "Malayalam", "Spanish").
  // ISO codes and native labels are also accepted and normalized.
  language: z.string().min(2).max(60),
  texts: z.array(z.string().min(1).max(800)).min(1).max(300),
});

/** Map common codes / native labels → stable English names for the model. */
const LANGUAGE_ALIASES: Record<string, string> = {
  en: "English",
  english: "English",
  ml: "Malayalam",
  malayalam: "Malayalam",
  "മലയാളം": "Malayalam",
  hi: "Hindi",
  hindi: "Hindi",
  हिन्दी: "Hindi",
  ta: "Tamil",
  tamil: "Tamil",
  தமிழ்: "Tamil",
  te: "Telugu",
  telugu: "Telugu",
  తెలుగు: "Telugu",
  kn: "Kannada",
  kannada: "Kannada",
  ಕನ್ನಡ: "Kannada",
  bn: "Bengali",
  bengali: "Bengali",
  বাংলা: "Bengali",
  mr: "Marathi",
  marathi: "Marathi",
  मराठी: "Marathi",
  gu: "Gujarati",
  gujarati: "Gujarati",
  ગુજરાતી: "Gujarati",
  pa: "Punjabi",
  punjabi: "Punjabi",
  ਪੰਜਾਬੀ: "Punjabi",
  ur: "Urdu",
  urdu: "Urdu",
  اردو: "Urdu",
  ar: "Arabic",
  arabic: "Arabic",
  العربية: "Arabic",
  es: "Spanish",
  spanish: "Spanish",
  español: "Spanish",
  espanol: "Spanish",
  fr: "French",
  french: "French",
  français: "French",
  francais: "French",
  de: "German",
  german: "German",
  deutsch: "German",
  it: "Italian",
  italian: "Italian",
  italiano: "Italian",
  pt: "Portuguese",
  portuguese: "Portuguese",
  português: "Portuguese",
  ru: "Russian",
  russian: "Russian",
  русский: "Russian",
  tr: "Turkish",
  turkish: "Turkish",
  türkçe: "Turkish",
  zh: "Chinese",
  chinese: "Chinese",
  中文: "Chinese",
  ja: "Japanese",
  japanese: "Japanese",
  日本語: "Japanese",
  ko: "Korean",
  korean: "Korean",
  한국어: "Korean",
  id: "Indonesian",
  indonesian: "Indonesian",
  "bahasa indonesia": "Indonesian",
  vi: "Vietnamese",
  vietnamese: "Vietnamese",
  "tiếng việt": "Vietnamese",
  th: "Thai",
  thai: "Thai",
  ไทย: "Thai",
};

function resolveLanguageName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "English";
  const lower = trimmed.toLowerCase();
  if (LANGUAGE_ALIASES[lower]) return LANGUAGE_ALIASES[lower];
  if (LANGUAGE_ALIASES[trimmed]) return LANGUAGE_ALIASES[trimmed];
  // Already an English name like "Hindi" / "Malayalam"
  return trimmed;
}

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const target = resolveLanguageName(data.language);
    if (target.toLowerCase() === "english") return data.texts;

    const provider = getVisionProviders()[0];
    if (!provider) {
      // Prefer English fallback over crashing the client language switch
      return data.texts;
    }

    try {
      const prompt = `You are a professional UI translator. Translate each string in the JSON array below into ${target}.

Rules:
- Return ONLY a valid JSON array of strings (no markdown, no commentary).
- Keep the exact same number of items, in the same order.
- Preserve product names, brand names, numbers, units (mg, kg, cm), URLs, emojis.
- Keep technical safety words natural in ${target} (e.g. Safe / Caution / Avoid).
- Do not add or remove items.

Input:
${JSON.stringify(data.texts)}`;

      const { text } = await generateText({
        model: provider.model,
        prompt,
        temperature: 0,
      });

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return data.texts;

      let translated: unknown;
      try {
        translated = JSON.parse(match[0]);
      } catch {
        return data.texts;
      }

      if (
        !Array.isArray(translated) ||
        translated.length !== data.texts.length ||
        !translated.every((x) => typeof x === "string")
      ) {
        return data.texts;
      }

      return translated as string[];
    } catch {
      // Never fail the page because translation failed — show English
      return data.texts;
    }
  });
