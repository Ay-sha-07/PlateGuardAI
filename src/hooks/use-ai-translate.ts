import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { languageName, useLanguage, type LanguageCode } from "@/lib/i18n";
import { translateTexts } from "@/lib/translate.functions";

const CACHE_PREFIX = "plateguard-ai-i18n:";
const MAX_CACHE_ENTRIES = 40;

function cacheKey(lang: LanguageCode, texts: string[]): string {
  // Stable fingerprint of the English source strings
  let h = 0;
  const joined = texts.join("\u0001");
  for (let i = 0; i < joined.length; i++) {
    h = (Math.imul(31, h) + joined.charCodeAt(i)) | 0;
  }
  return `${CACHE_PREFIX}${lang}:${h}`;
}

function readCache(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) return null;
    return parsed as string[];
  } catch {
    return null;
  }
}

function writeCache(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
    // Soft bound: drop oldest cache keys if we grow too large
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    if (keys.length > MAX_CACHE_ENTRIES) {
      keys
        .slice(0, keys.length - MAX_CACHE_ENTRIES)
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * Translates an ordered list of English UI strings into the active language
 * via the AI translation server function. Results are cached per language.
 * While loading (or on failure) the original English strings are shown.
 */
export function useAiTranslate(englishTexts: readonly string[]): {
  texts: string[];
  loading: boolean;
  error: string | null;
} {
  const { language } = useLanguage();
  const translate = useServerFn(translateTexts);
  const sourceKey = englishTexts.join("\u0001");
  const sources = useMemo(() => [...englishTexts], [sourceKey]);
  const [texts, setTexts] = useState<string[]>(() => [...sources]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const run = useCallback(
    async (lang: LanguageCode, src: string[]) => {
      if (lang === "en" || src.length === 0) {
        setTexts(src);
        setLoading(false);
        setError(null);
        return;
      }

      const key = cacheKey(lang, src);
      const cached = readCache(key);
      if (cached && cached.length === src.length) {
        setTexts(cached);
        setLoading(false);
        setError(null);
        return;
      }

      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      setTexts(src); // show English until translation arrives

      try {
        // Pass a human language name (e.g. "മലയാളം") so the model targets the
        // right script, not a bare ISO code.
        const translated = (await translate({
          data: { language: languageName(lang), texts: src },
        })) as string[];
        if (id !== requestId.current) return;
        if (Array.isArray(translated) && translated.length === src.length) {
          writeCache(key, translated);
          setTexts(translated);
        } else {
          setError("Incomplete translation");
        }
      } catch (e) {
        if (id !== requestId.current) return;
        const message = e instanceof Error ? e.message : "Translation failed";
        setError(message);
        // keep English fallback
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [translate],
  );

  useEffect(() => {
    void run(language, sources);
  }, [language, sources, run]);

  return { texts, loading, error };
}

/**
 * Convenience: map a list of objects that have string fields to translate.
 * Pass the field names to extract; returns the same objects with those fields replaced.
 */
export function useAiTranslateFields<T extends Record<string, unknown>>(
  items: readonly T[],
  fields: readonly (keyof T & string)[],
): T[] {
  const fieldKey = fields.join(",");
  const flat = useMemo(() => {
    const out: string[] = [];
    for (const item of items) {
      for (const f of fields) {
        const v = item[f];
        out.push(typeof v === "string" ? v : String(v ?? ""));
      }
    }
    return out;
  }, [items, fieldKey]);

  const { texts } = useAiTranslate(flat);

  return useMemo(() => {
    let i = 0;
    return items.map((item) => {
      const next = { ...item };
      for (const f of fields) {
        (next as Record<string, unknown>)[f] = texts[i++] ?? item[f];
      }
      return next;
    });
  }, [items, fields, texts]);
}
