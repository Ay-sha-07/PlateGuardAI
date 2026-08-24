import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
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
 * IMPORTANT: failover only helps if more than one key is actually set.
 * If you're only seeing "the AI provider is rate-limiting requests" over
 * and over, you very likely have just ONE of these configured — add a
 * second (Groq's free tier is the easiest: no credit card, 30 req/min).
 *
 *   GROQ_API_KEY                  → Groq/Llama 4 Scout — free tier via https://console.groq.com/keys
 *   GOOGLE_GENERATIVE_AI_API_KEY  → Gemini — free tier via https://aistudio.google.com/apikey
 *   OPENAI_API_KEY                → OpenAI (gpt-4o-mini)
 *   ANTHROPIC_API_KEY             → Claude (claude-3-5-haiku)
 *   OPENAI_COMPATIBLE_API_KEY     → any other OpenAI-compatible endpoint (OpenRouter, etc.)
 *                                   — also set OPENAI_COMPATIBLE_BASE_URL and,
 *                                   optionally, OPENAI_COMPATIBLE_MODEL
 *
 * All five support image input, which the scanner requires. Set as many
 * as you like — order below is priority, and it's chosen to put the two
 * generous free tiers (Groq, then Gemini) first so paid keys are only
 * touched as a last resort.
 */
export type VisionProvider = {
  /** Short, human-readable name used in logs/error messages. */
  name: string;
  model: LanguageModel;
};

export function getVisionProviders(): VisionProvider[] {
  const providers: VisionProvider[] = [];

  const groq = process.env["GROQ_API_KEY"];
  if (groq) {
    providers.push({
      name: "Groq",
      model: createGroq({ apiKey: groq })(
        process.env["GROQ_MODEL"] || "meta-llama/llama-4-scout-17b-16e-instruct",
      ),
    });
  }

  const google = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (google) {
    providers.push({
      name: "Google Gemini",
      model: createGoogleGenerativeAI({ apiKey: google })(
        process.env["GOOGLE_MODEL"] || "gemini-2.5-flash",
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
      "No AI provider configured. Set one of GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, " +
        "OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_COMPATIBLE_API_KEY + " +
        "OPENAI_COMPATIBLE_BASE_URL in your .env file. See .env.example for details.",
    );
  }

  if (providers.length === 1) {
    console.warn(
      `[scan] only one AI provider configured (${providers[0]!.name}). ` +
        "Rate limits will surface as scan failures with no fallback — add a second key " +
        "(GROQ_API_KEY is free and quick to get) to enable real failover.",
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
