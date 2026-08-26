import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { languageName, useLanguage, type LanguageCode } from "@/lib/i18n";
import { translateTexts } from "@/lib/translate.functions";

const CACHE_PREFIX = "plateguard-ai-i18n:";
const MAX_CACHE_ENTRIES = 80;

function cacheKey(lang: LanguageCode, texts: string[]): string {
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
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    if (keys.length > MAX_CACHE_ENTRIES) {
      keys.slice(0, keys.length - MAX_CACHE_ENTRIES).forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* ignore */
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
      setTexts(src);

      try {
        // Chunk large batches so we stay within the server validator limit (250).
        const CHUNK = 80;
        const out: string[] = [];
        for (let i = 0; i < src.length; i += CHUNK) {
          const slice = src.slice(i, i + CHUNK);
          const translated = (await translate({
            data: { language: languageName(lang), texts: slice },
          })) as string[];
          if (!Array.isArray(translated) || translated.length !== slice.length) {
            throw new Error("Incomplete translation");
          }
          out.push(...translated);
        }
        if (id !== requestId.current) return;
        writeCache(key, out);
        setTexts(out);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : "Translation failed");
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

/** Translate a fixed dictionary of English UI copy. Keys stay stable; values become translated. */
export function useTranslatedCopy<T extends Record<string, string>>(english: T): T {
  const keys = useMemo(() => Object.keys(english) as (keyof T & string)[], [english]);
  const values = useMemo(() => keys.map((k) => english[k]), [english, keys]);
  const { texts } = useAiTranslate(values);
  return useMemo(() => {
    const out = { ...english };
    keys.forEach((k, i) => {
      out[k] = (texts[i] ?? english[k]) as T[typeof k];
    });
    return out;
  }, [english, keys, texts]);
}

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
