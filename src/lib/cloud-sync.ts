import type { ProfileStore } from "./profile";
import type { ScanHistoryEntry } from "./history";

const HISTORY_PULL_STATUS_EVENT = "plateguard:history-pull-status";
let historyPullInFlight = false;

function notifyHistoryPullStatus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HISTORY_PULL_STATUS_EVENT, { detail: { inFlight: historyPullInFlight } }));
}

export function isHistoryPullInFlight(): boolean {
  return historyPullInFlight;
}

export function subscribeHistoryPullStatus(onChange: (inFlight: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    onChange((event as CustomEvent<{ inFlight: boolean }>).detail?.inFlight === true);
  };
  window.addEventListener(HISTORY_PULL_STATUS_EVENT, handler);
  return () => window.removeEventListener(HISTORY_PULL_STATUS_EVENT, handler);
}

import { supabase } from "./supabase";

async function getUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

/**
 * Cloud sync for signed-in users. localStorage remains the fast local cache,
 * while Supabase is the account-level source of truth so the same account
 * gets the same profiles/history on every device.
 */
export async function pushProfileStore(store: ProfileStore) {
  const userId = await getUserId();
  if (!userId || !supabase) return false;

  if (!store.profiles.length) {
    // Nothing to upsert — the user really does have zero profiles now.
    const { error: deleteError } = await supabase.from("user_profiles").delete().eq("user_id", userId);
    if (deleteError) {
      console.warn("[cloud-sync] profile delete failed:", deleteError.message);
      return false;
    }
    return true;
  }

  const rows = store.profiles.map((profile) => ({
    id: profile.id,
    user_id: userId,
    createdAt: profile.createdAt,
    active: profile.id === store.activeId,
    name: profile.name,
    data: profile,
  }));

  // Upsert current profiles BEFORE deleting anything stale. Deleting first
  // (the previous approach) meant a failed insert left the account with
  // zero cloud profiles — full data loss. Upserting first means a failed
  // step here leaves the previous cloud state intact.
  const { error: upsertError } = await supabase.from("user_profiles").upsert(rows, { onConflict: "id" });
  if (upsertError) {
    console.warn("[cloud-sync] profile push failed:", upsertError.message);
    return false;
  }

  const currentIds = store.profiles.map((profile) => profile.id);
  const { error: deleteError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("user_id", userId)
    .not("id", "in", `(${currentIds.map((id) => `"${id}"`).join(",")})`);
  if (deleteError) {
    console.warn("[cloud-sync] stale profile cleanup failed:", deleteError.message);
    // Non-fatal: the current profiles are safely saved; a deleted-locally
    // profile may just linger in the cloud until the next successful sync.
  }
  return true;
}

export async function pullProfileStore(): Promise<ProfileStore | null> {
  const userId = await getUserId();
  if (!userId || !supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,user_id,createdAt,active,name,data")
    .eq("user_id", userId)
    .order("createdAt", { ascending: true });

  if (error || !data?.length) return null;

  const profiles = data.map((row: any) => ({
    ...(row.data ?? {}),
    id: row.id,
    createdAt: Number(row.createdAt),
    name: row.name ?? row.data?.name ?? "Me",
  }));
  const activeId = data.find((row: any) => row.active)?.id ?? profiles[0]?.id ?? "";
  return { profiles, activeId };
}

export async function pushHistory(entries: ScanHistoryEntry[]) {
  const userId = await getUserId();
  if (!userId || !supabase || !entries.length) return false;

  const rows = entries.map((entry) => ({
    id: entry.id,
    user_id: userId,
    profileId: entry.profileId,
    profileName: entry.profileName,
    mode: entry.mode,
    image: entry.image,
    rating: entry.rating,
    headline: entry.headline,
    productGuess: entry.productGuess,
    createdAt: entry.createdAt,
    aiResult: entry.aiResult ?? null,
  }));

  // IMPORTANT: never delete/rewrite the entire account history here.
  // A device can have an older/smaller local cache than another device.
  // Upserting individual records keeps both devices' histories intact.
  const { error } = await supabase
    .from("scan_history")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.warn("[cloud-sync] history push failed:", error.message);
    return false;
  }
  return true;
}

export async function deleteHistoryEntryCloud(id: string) {
  const userId = await getUserId();
  if (!userId || !supabase) return false;

  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    console.warn("[cloud-sync] history delete failed:", error.message);
    return false;
  }
  return true;
}

export async function clearHistoryCloud() {
  const userId = await getUserId();
  if (!userId || !supabase) return false;

  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.warn("[cloud-sync] history clear failed:", error.message);
    return false;
  }
  return true;
}

export async function pullHistory(): Promise<ScanHistoryEntry[] | null> {
  historyPullInFlight = true;
  notifyHistoryPullStatus();
  try {
    const userId = await getUserId();
    if (!userId || !supabase) return null;

    const { data, error } = await supabase
      .from("scan_history")
      .select("id,profileId,profileName,mode,image,rating,headline,productGuess,createdAt,aiResult")
      .eq("user_id", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.warn("[cloud-sync] history pull failed:", error.message);
      return null;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      profileId: row.profileId ?? "",
      profileName: row.profileName ?? "Me",
      mode: row.mode === "medicine" ? "medicine" : "food",
      image: row.image ?? "",
      rating: Number(row.rating ?? 0),
      headline: row.headline ?? "",
      productGuess: row.productGuess ?? "Unknown product",
      createdAt: Number(row.createdAt ?? Date.now()),
      aiResult: row.aiResult ?? undefined,
    }));
  } finally {
    historyPullInFlight = false;
    notifyHistoryPullStatus();
  }
}
