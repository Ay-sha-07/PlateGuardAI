import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { getVisionProviders } from "./ai-provider.server";

const Schema = z.object({
  // Accept ISO codes or human language names (e.g. "Bahasa Indonesia", "മലയാളം")
  language: z.string().min(2).max(40),
  texts: z.array(z.string().min(1).max(500)).min(1).max(250),
});

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const lang = data.language.trim().toLowerCase();
    if (lang === "en" || lang === "english") return data.texts;

    const provider = getVisionProviders()[0];
    if (!provider) {
      throw new Error("AI translation is unavailable because no AI provider is configured.");
    }

    const prompt = `Translate each item in this JSON array into ${data.language}. Keep product names, brand names, numbers, URLs, emojis, and technical safety verdict words unchanged unless a natural translation is clearly needed. Return ONLY a JSON array of strings in exactly the same order and with exactly the same number of items.\n\n${JSON.stringify(data.texts)}`;

    const { text } = await generateText({ model: provider.model, prompt, temperature: 0 });
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI returned an invalid translation response.");

    const translated = JSON.parse(match[0]);
    if (
      !Array.isArray(translated) ||
      translated.length !== data.texts.length ||
      !translated.every((x) => typeof x === "string")
    ) {
      throw new Error("AI returned an incomplete translation response.");
    }

    return translated as string[];
  });
