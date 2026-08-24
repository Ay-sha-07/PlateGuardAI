import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Standalone AI provider setup — no Lovable gateway involved.
 *
 * Instead of picking a single provider and giving up if it's rate-limited,
 * this collects EVERY provider that has an API key set in the environment
 * and returns them in priority order. The caller (scan.server.ts) tries
 * each one in turn and only surfaces an error once all of them fail —
 * that's the failover behavior.
 *
 * Set as many of these as you like. Only one is required for the scanner
 * to work; setting two or more just adds redundancy against rate limits.
 *
 *   GOOGLE_GENERATIVE_AI_API_KEY   → Gemini (free tier via https://aistudio.google.com/apikey)
 *   OPENAI_API_KEY                → OpenAI (gpt-4o-mini)
 *   ANTHROPIC_API_KEY             → Claude (claude-3-5-haiku)
 *   OPENAI_COMPATIBLE_API_KEY     → any OpenAI-compatible endpoint (Groq, OpenRouter, etc.)
 *                                   — also set OPENAI_COMPATIBLE_BASE_URL and,
 *                                   optionally, OPENAI_COMPATIBLE_MODEL
 *
 * All four support image input, which the scanner requires.
 */
export type VisionProvider = {
  /** Short, human-readable name used in logs/error messages. */
  name: string;
  model: LanguageModel;
};

export function getVisionProviders(): VisionProvider[] {
  const providers: VisionProvider[] = [];

  const google = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (google) {
    providers.push({
      name: "Google Gemini",
      model: createGoogleGenerativeAI({ apiKey: google })(
        process.env["GOOGLE_MODEL"] || "gemini-3.6-flash",
      ),
    });
  }

  const openai = process.env["OPENAI_API_KEY"];
  if (openai) {
    providers.push({
      name: "OpenAI",
      model: createOpenAI({ apiKey: openai })(process.env["OPENAI_MODEL"] || "gpt-4o-mini"),
    });
  }

  const anthropic = process.env["ANTHROPIC_API_KEY"];
  if (anthropic) {
    providers.push({
      name: "Anthropic Claude",
      model: createAnthropic({ apiKey: anthropic })(
        process.env["ANTHROPIC_MODEL"] || "claude-3-5-haiku-20241022",
      ),
    });
  }

  const compatibleKey = process.env["OPENAI_COMPATIBLE_API_KEY"];
  const compatibleUrl = process.env["OPENAI_COMPATIBLE_BASE_URL"];
  if (compatibleKey && compatibleUrl) {
    const provider = createOpenAICompatible({
      name: "custom-openai-compatible",
      baseURL: compatibleUrl,
      apiKey: compatibleKey,
      supportsStructuredOutputs: true,
    });
    providers.push({
      name: "OpenAI-compatible",
      model: provider(process.env["OPENAI_COMPATIBLE_MODEL"] || "gpt-4o-mini"),
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "No AI provider configured. Set one of GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, " +
        "ANTHROPIC_API_KEY, or OPENAI_COMPATIBLE_API_KEY + OPENAI_COMPATIBLE_BASE_URL in your " +
        ".env file. See .env.example for details.",
    );
  }

  return providers;
}

/** True if an error looks like a rate-limit / quota / overload response worth failing over on. */
export function isRetryableProviderError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("overloaded") ||
    lower.includes("503") ||
    lower.includes("529")
  );
}
