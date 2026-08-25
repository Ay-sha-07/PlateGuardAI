import { getVisionProviders, type ProviderErrorCategory, type ProviderErrorDiagnosis } from "./ai-provider.server";

export type ProviderHealthStatus = "ready" | "cooldown" | "blocked";

export type ProviderHealth = {
  name: string;
  status: ProviderHealthStatus;
  reason: ProviderErrorCategory | "healthy";
  retryAt: number | null;
  lastCheckedAt: number | null;
};

type ProviderState = {
  reason: ProviderErrorCategory | "healthy";
  retryAt: number | null;
  lastCheckedAt: number | null;
};

// Server-process health memory. This is intentionally lightweight: provider
// APIs do not expose a universal "remaining scans" value, and exact quotas
// vary by account/model. We therefore track observed rate limits/errors and
// use them to avoid repeatedly hammering dead providers.
const globalState = globalThis as typeof globalThis & {
  __plateGuardProviderHealth?: Map<string, ProviderState>;
};

const state =
  globalState.__plateGuardProviderHealth ??
  (globalState.__plateGuardProviderHealth = new Map<string, ProviderState>());

const COOLDOWNS_MS: Partial<Record<ProviderErrorCategory, number>> = {
  rate_limit: 60_000,
  server_overload: 20_000,
  network: 15_000,
  quota: 6 * 60 * 60_000,
  auth: 30 * 60_000,
  model_not_found: 24 * 60 * 60_000,
};

function initialState(): ProviderState {
  return { reason: "healthy", retryAt: null, lastCheckedAt: null };
}

function getState(name: string) {
  let current = state.get(name);
  if (!current) {
    current = initialState();
    state.set(name, current);
  }
  return current;
}

export function markProviderSuccess(name: string) {
  const current = getState(name);
  current.reason = "healthy";
  current.retryAt = null;
  current.lastCheckedAt = Date.now();
}

export function markProviderFailure(name: string, diagnosis: ProviderHealthDiagnosisLike) {
  const current = getState(name);
  const cooldown = COOLDOWNS_MS[diagnosis.category] ?? 30_000;
  current.reason = diagnosis.category;
  current.retryAt = Date.now() + cooldown;
  current.lastCheckedAt = Date.now();
}

type ProviderHealthDiagnosisLike = Pick<ProviderErrorDiagnosis, "category">;

export function shouldSkipProvider(name: string): boolean {
  const current = getState(name);
  return current.retryAt !== null && current.retryAt > Date.now();
}

function toHealth(name: string): ProviderHealth {
  const current = getState(name);
  const now = Date.now();
  if (current.retryAt && current.retryAt > now) {
    return {
      name,
      status: current.reason === "quota" || current.reason === "auth" || current.reason === "model_not_found" ? "blocked" : "cooldown",
      reason: current.reason,
      retryAt: current.retryAt,
      lastCheckedAt: current.lastCheckedAt,
    };
  }
  return {
    name,
    status: "ready",
    reason: current.reason === "healthy" ? "healthy" : "healthy",
    retryAt: null,
    lastCheckedAt: current.lastCheckedAt,
  };
}

export function getAIHealth() {
  const providers = getVisionProviders();
  const health = providers.map((provider) => toHealth(provider.name));
  const ready = health.filter((item) => item.status === "ready").length;
  const total = health.length;
  const blocked = health.filter((item) => item.status === "blocked").length;
  const cooldown = health.filter((item) => item.status === "cooldown").length;

  let capacity: "High" | "Medium" | "Low";
  if (ready >= Math.max(2, Math.ceil(total * 0.6))) capacity = "High";
  else if (ready > 0) capacity = "Medium";
  else capacity = "Low";

  return {
    capacity,
    ready,
    total,
    blocked,
    cooldown,
    providers: health,
    checkedAt: Date.now(),
  };
}
