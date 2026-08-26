import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { getVisionProviders } from "./ai-provider.server";

const Schema = z.object({
  // Accept ISO codes or human language names (e.g. "Bahasa Indonesia", "മലയാളം")
  language: z.string().min(2).max(40),
  texts: z.array(z.string().min(1).max(800)).min(1).max(300),
});

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const lang = data.language.trim().toLowerCase();
    if (lang === "en" || lang === "english") return data.texts;

    const provider = getVisionProviders()[0];
    if (!provider) {
      // Prefer English fallback over crashing the client language switch
      return data.texts;
    }

    try {
      const prompt = `Translate each item in this JSON array into ${data.language}. Keep product names, brand names, numbers, URLs, emojis, and technical safety verdict words unchanged unless a natural translation is clearly needed. Return ONLY a JSON array of strings in exactly the same order and with exactly the same number of items.\n\n${JSON.stringify(data.texts)}`;

      const { text } = await generateText({ model: provider.model, prompt, temperature: 0 });
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return data.texts;

      const translated = JSON.parse(match[0]);
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
