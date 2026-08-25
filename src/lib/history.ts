import type { ScanResult } from "./scan.server";
import { scopedKey } from "./account-scope";

export type ScanHistoryEntry = {
  id: string;
  profileId: string;
  profileName: string;
  mode: "food" | "medicine";
  image: string; // small thumbnail data URL
  rating: number;
  headline: string;
  productGuess: string;
  // Full structured AI response captured at scan time for the History detail page.
  aiResult?: ScanResult;
  createdAt: number;
};

const KEY_BASE = "PlateGuard.history.v1";
const RATING_MIGRATION_KEY_BASE = "PlateGuard.history.ratingScale.v2";
const MAX_ENTRIES = 60;

function invertRating(value: number): number {
  return 6 - value;
}

function migrateRatingScale(entries: ScanHistoryEntry[]): ScanHistoryEntry[] {
  if (typeof window === "undefined") return entries;
  if (window.localStorage.getItem(scopedKey(RATING_MIGRATION_KEY_BASE)) === "done") return entries;

  const migrated = entries.map((entry) => ({
    ...entry,
    rating: invertRating(entry.rating),
    ...(entry.aiResult
      ? {
          aiResult: {
            ...entry.aiResult,
            rating: invertRating(entry.aiResult.rating),
            profileImpact: entry.aiResult.profileImpact.map((item) => ({
              ...item,
              rating: invertRating(item.rating),
            })),
            reasons: entry.aiResult.reasons.map((item) => ({
              ...item,
              rating: invertRating(item.rating),
            })),
          },
        }
      : {}),
  }));

  try {
    window.localStorage.setItem(scopedKey(KEY_BASE), JSON.stringify(migrated.slice(0, MAX_ENTRIES)));
    window.localStorage.setItem(scopedKey(RATING_MIGRATION_KEY_BASE), "done");
  } catch {
    // If storage is unavailable, keep the in-memory migrated copy.
  }
  return migrated;
}

export function loadHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(scopedKey(KEY_BASE));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? migrateRatingScale(parsed) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: ScanHistoryEntry[]) {
  if (typeof window === "undefined") return;
  // Local to this device only, scoped to whichever account is active —
  // never synced to a server database.
  try {
    window.localStorage.setItem(scopedKey(KEY_BASE), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage full (likely from image thumbnails) — drop the oldest
    // half and try once more before giving up silently.
    try {
      window.localStorage.setItem(
        scopedKey(KEY_BASE),
        JSON.stringify(entries.slice(0, Math.floor(MAX_ENTRIES / 2))),
      );
    } catch {
      /* give up quietly — history is a convenience, not critical data */
    }
  }
}

export function addHistoryEntry(entry: Omit<ScanHistoryEntry, "id" | "createdAt">): void {
  const entries = loadHistory();
  const withNew: ScanHistoryEntry = {
    ...entry,
    id: `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  saveHistory([withNew, ...entries]);
  void import("./cloud-sync").then(({ pushHistory }) => pushHistory(loadHistory()));
}

export function deleteHistoryEntry(id: string): void {
  saveHistory(loadHistory().filter((e) => e.id !== id));
  void import("./cloud-sync").then(({ pushHistory }) => pushHistory(loadHistory()));
}

export function clearHistory(): void {
  saveHistory([]);
  void import("./cloud-sync").then(({ pushHistory }) => pushHistory([]));
}

/** Downscales a full-size scan image into a small square thumbnail so history doesn't blow past localStorage limits. */
export async function makeThumbnail(dataUrl: string, size = 160): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    try {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return dataUrl;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      return canvas.toDataURL("image/jpeg", 0.6);
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      img.src = "";
    }
  } catch {
    return dataUrl;
  }
}

export function ratingIsOk(rating: number): boolean {
  return rating >= 4;
}

export type { ScanResult };
