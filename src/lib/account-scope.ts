/**
 * All of PlateGuard's data (health profiles, scan history) lives only in
 * this browser's localStorage — there is no server database for it. That
 * used to mean every account signed in on a given phone/browser shared the
 * exact same localStorage keys, so logging in as a different person on the
 * same device showed the previous person's profiles and scan history.
 *
 * This module namespaces every storage key by "scope": the signed-in
 * user's id, or "guest" when nobody is logged in (e.g. the "scan without
 * logging in" path). Switching accounts on the same device switches the
 * scope, which switches which slice of localStorage is read/written —
 * each account's data stays fully separate, still entirely on-device.
 */
import { supabase } from "./supabase";

const SCOPE_KEY = "PlateGuard.activeScope";
export const GUEST_SCOPE = "guest";

export function getActiveScope(): string {
  if (typeof window === "undefined") return GUEST_SCOPE;
  try {
    return window.localStorage.getItem(SCOPE_KEY) || GUEST_SCOPE;
  } catch {
    return GUEST_SCOPE;
  }
}

export function setActiveScope(scope: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCOPE_KEY, scope || GUEST_SCOPE);
  } catch {
    /* ignore — worst case this device falls back to the guest scope */
  }
}

/** Prefixes a base localStorage key with the currently active account scope. */
export function scopedKey(base: string): string {
  return `${base}::${getActiveScope()}`;
}

let syncStarted = false;

/**
 * Keeps the active scope in sync with Supabase auth state. Call once, as
 * early as possible (root layout), so a page that loads profile/history
 * data on mount reads it under the right account. Safe to call repeatedly
 * — only the first call does anything.
 */
export function startAccountScopeSync() {
  if (syncStarted || typeof window === "undefined" || !supabase) return;
  syncStarted = true;

  supabase.auth.getSession().then(({ data }) => {
    setActiveScope(data.session?.user?.id);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setActiveScope(session?.user?.id);
  });
}
