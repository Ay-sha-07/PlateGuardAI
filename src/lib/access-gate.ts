/**
 * History, Card, and Profile hold personal health data, so they should
 * only be reachable after the person has actually gone through the login
 * page — either by signing in, or by explicitly choosing the
 * "scan without logging in" accessibility path there. Landing on any of
 * those pages any other way (e.g. a bookmarked/typed URL on a fresh
 * browser) should bounce to /login instead of showing the page.
 *
 * This flag records that the accessibility path was chosen. It's separate
 * from being logged in (checked live against Supabase session) — either
 * one is enough to unlock the gated pages.
 */
const ACCESS_KEY = "PlateGuard.accessibilityEntry";

export function grantAccessibilityEntry() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_KEY, "true");
  } catch {
    /* ignore */
  }
}

export function hasAccessibilityEntry(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ACCESS_KEY) === "true";
  } catch {
    return false;
  }
}

export function revokeAccessibilityEntry() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
}
