import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { APICallError, type LanguageModel } from "ai";

/**
 * Standalone AI provider setup — no Lovable gateway involved.
 *
 * Instead of picking a single provider and giving up if it's rate-limited,
 * this collects EVERY provider that has an API key set in the environment
 * and returns them in priority order. The caller (scan.server.ts) tries
 * each one in turn and only surfaces an error once all of them fail —
 * that's the failover behavior.
 *
 * Priority order (first configured key wins as the default, each
 * subsequent one is a fallback if the previous fails/rate-limits):
 *
 *   1. GOOGLE_GENERATIVE_AI_API_KEY  → Gemini (default) — https://aistudio.google.com/apikey
 *   2. XAI_API_KEY (or GROK_API_KEY) → xAI Grok (fallback) — https://console.x.ai
 *   3. GROQ_API_KEY                  → Groq/Llama 4 Scout — https://console.groq.com/keys
 *   4. OPENAI_API_KEY                → OpenAI (gpt-4o-mini)
 *   5. ANTHROPIC_API_KEY             → Claude (claude-3-5-haiku)
 *   6. OPENAI_COMPATIBLE_API_KEY     → any other OpenAI-compatible endpoint (OpenRouter, etc.)
 *                                      — also set OPENAI_COMPATIBLE_BASE_URL and,
 *                                      optionally, OPENAI_COMPATIBLE_MODEL
 *
 * All six support image input, which the scanner requires. IMPORTANT:
 * failover only helps if more than one key is actually set — with just
 * one, a rate limit has nowhere to fail over to and the scan fails
 * outright. Set Gemini + Grok at minimum for the setup this app expects.
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
        process.env["GOOGLE_MODEL"] || "gemini-2.5-flash",
      ),
    });
  }

  const xai = process.env["XAI_API_KEY"] || process.env["GROK_API_KEY"];
  if (xai) {
    providers.push({
      name: "xAI Grok",
      model: createXai({ apiKey: xai })(process.env["XAI_MODEL"] || "grok-4.6"),
    });
  }

  const groq = process.env["GROQ_API_KEY"];
  if (groq) {
    providers.push({
      name: "Groq",
      model: createGroq({ apiKey: groq })(
        process.env["GROQ_MODEL"] || "meta-llama/llama-4-scout-17b-16e-instruct",
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
        "XAI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_COMPATIBLE_API_KEY + " +
        "OPENAI_COMPATIBLE_BASE_URL in your .env file. See .env.example for details.",
    );
  }

  if (providers.length === 1) {
    console.warn(
      `[scan] only one AI provider configured (${providers[0]!.name}). ` +
        "Rate limits will surface as scan failures with no fallback — set a second key " +
        "(XAI_API_KEY for Grok, alongside GOOGLE_GENERATIVE_AI_API_KEY for Gemini) to enable real failover.",
    );
  }

  return providers;
}

/** Broad category a provider failure falls into, derived from the real HTTP status/response where possible. */
export type ProviderErrorCategory =
  | "auth"
  | "rate_limit"
  | "quota"
  | "model_not_found"
  | "request_format"
  | "image_size"
  | "network"
  | "server_overload"
  | "unknown";

export type ProviderErrorDiagnosis = {
  category: ProviderErrorCategory;
  statusCode?: number | undefined;
  retryable: boolean;
  /** Short technical string safe to log/surface: e.g. "HTTP 429 from api.groq.com · rate_limit_exceeded". */
  detail: string;
};

/**
 * Inspects a failed provider call and classifies it using the ACTUAL HTTP
 * status code and response body when the AI SDK gives us one (it does for
 * every real API call, via `APICallError`), instead of guessing from
 * `.message` text. This is what lets the UI/logs say "401 from OpenAI —
 * bad key" instead of a generic "unexpected error".
 */
export function diagnoseProviderError(err: unknown): ProviderErrorDiagnosis {
  if (APICallError.isInstance(err)) {
    const status = err.statusCode;
    const body = (err.responseBody ?? "").slice(0, 400);
    const bodyLower = body.toLowerCase();
    const msgLower = err.message.toLowerCase();
    let host = "provider";
    try {
      host = new URL(err.url).host;
    } catch {
      /* keep default */
    }

    let category: ProviderErrorCategory = "unknown";
    if (status === 401 || status === 403) {
      category = "auth";
    } else if (status === 404) {
      category = "model_not_found";
    } else if (status === 413) {
      category = "image_size";
    } else if (status === 429) {
      // Distinguish a hard daily/monthly quota from a momentary rate limit —
      // providers usually say "quota" explicitly for the former.
      category = bodyLower.includes("quota") || msgLower.includes("quota") ? "quota" : "rate_limit";
    } else if (status === 400) {
      category =
        bodyLower.includes("image") ||
        bodyLower.includes("too large") ||
        bodyLower.includes("payload") ||
        bodyLower.includes("size")
          ? "image_size"
          : "request_format";
    } else if (status !== undefined && status >= 500) {
      category = "server_overload";
    } else if (status === undefined) {
      category = "network";
    }

    const retryable =
      category === "rate_limit" || category === "server_overload" || category === "network";

    return {
      category,
      statusCode: status,
      retryable,
      detail: `HTTP ${status ?? "?"} from ${host}${body ? ` · ${body}` : ""}`,
    };
  }

  // Not a structured API error (e.g. a network/timeout failure that never
  // reached the provider, or an SDK-internal validation error) — fall back
  // to message inspection since there's no status code to read.
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  let category: ProviderErrorCategory = "unknown";
  if (lower.includes("api key") || lower.includes("unauthorized")) {
    category = "auth";
  } else if (lower.includes("quota")) {
    category = "quota";
  } else if (lower.includes("rate limit")) {
    category = "rate_limit";
  } else if (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("enotfound") ||
    lower.includes("timeout") ||
    lower.includes("econnreset")
  ) {
    category = "network";
  } else if (
    lower.includes("model") &&
    (lower.includes("not found") || lower.includes("does not exist"))
  ) {
    category = "model_not_found";
  }

  return {
    category,
    retryable: category === "rate_limit" || category === "network",
    detail: raw.slice(0, 400),
  };
}

/** True if an error looks like a rate-limit / overload / network blip worth failing over on. */
export function isRetryableProviderError(err: unknown): boolean {
  return diagnoseProviderError(err).retryable;
}
