import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";
import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportError } from "../lib/error-reporting";
import { startAccountScopeSync, setActiveScope } from "../lib/account-scope";
import { pullHistory, pullProfileStore } from "../lib/cloud-sync";
import { saveHistory } from "../lib/history";
import { saveProfileStore } from "../lib/profile";
import { supabase } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background/72 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const router = useRouter();
  const retried = React.useRef(false);

  useEffect(() => {
    try {
      reportError(error, {
        boundary: "tanstack_root_error_component",
      });
    } catch {
      // reporting must never block recovery
    }
  }, [error]);

  // One automatic soft retry only for known transient client errors
  // (language-switch races, chunk load failures). Permanent errors stay on this screen.
  useEffect(() => {
    if (retried.current) return;
    const msg = String(error?.message || error?.name || "");
    const transient =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically|useServerFn|NetworkError|AbortError|language/i.test(
        msg,
      );
    if (!transient) return;
    let already = false;
    try {
      const key = `pg-err-retry:${msg.slice(0, 80)}`;
      already = sessionStorage.getItem(key) === "1";
      if (!already) sessionStorage.setItem(key, "1");
    } catch {
      already = false;
    }
    if (already) return;
    retried.current = true;
    const t = window.setTimeout(() => {
      try {
        router.invalidate();
        reset();
      } catch {
        // ignore
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [error, router, reset]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/72 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              try {
                router.invalidate();
                reset();
              } catch {
                window.location.assign("/");
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },

      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover",
      },

      {
        title: "PlateGuard AI",
      },

      {
        name: "description",
        content: "Allergen and nutrition label scanning for your medical profile.",
      },

      {
        property: "og:title",
        content: "PlateGuard AI",
      },

      {
        property: "og:description",
        content: "Allergen and nutrition label scanning for your medical profile.",
      },

      {
        property: "og:type",
        content: "website",
      },

      {
        name: "twitter:card",
        content: "summary_large_image",
      },

      /* PWA settings */
      {
        name: "theme-color",
        content: "#000000",
      },

      {
        name: "mobile-web-app-capable",
        content: "yes",
      },

      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },

      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black",
      },

      {
        name: "apple-mobile-web-app-title",
        content: "PlateGuard AI",
      },
    ],

    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },

      {
        rel: "icon",
        href: "/favicon.ico?v=3",
        type: "image/x-icon",
      },

      /* PWA manifest */
      {
        rel: "manifest",
        href: "/manifest.webmanifest?v=3",
      },

      /* iPhone / iPad app icon */
      {
        rel: "apple-touch-icon",
        href: "/icons/icon-192.png?v=3",
      },

      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },

      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },

      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),

  shellComponent: RootShell,

  component: RootComponent,

  notFoundComponent: NotFoundComponent,

  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        <LanguageProvider>
          {children}
          <Scripts />
        </LanguageProvider>
      </body>
    </html>
  );
}

function ThemeSync() {
  useEffect(() => {
    // Keep the local cache scoped to the signed-in account, then hydrate that
    // cache from Supabase so the same account sees the same data on every device.
    startAccountScopeSync();

    let cancelled = false;
    const hydrateAccountData = async () => {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id ?? null;
      setActiveScope(userId);
      if (!userId || cancelled) return;

      const [cloudProfiles, cloudHistory] = await Promise.all([pullProfileStore(), pullHistory()]);
      if (cancelled) return;
      if (cloudProfiles) saveProfileStore(cloudProfiles);

      if (cloudHistory) {
        // Keep local-only records as well. This is important for existing
        // accounts whose older phone history was created before cloud sync
        // was working. Once merged, upload the combined set so every device
        // gets the same account history.
        const { loadHistory } = await import("@/lib/history");
        const localHistory = loadHistory();
        const byId = new Map(cloudHistory.map((entry) => [entry.id, entry]));
        for (const entry of localHistory) {
          if (!byId.has(entry.id)) byId.set(entry.id, entry);
        }
        const mergedHistory = [...byId.values()]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 60);
        saveHistory(mergedHistory);

        if (mergedHistory.length) {
          const { pushHistory } = await import("@/lib/cloud-sync");
          await pushHistory(mergedHistory);
        }
      }
    };

    void hydrateAccountData();

    const authListener = supabase?.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setActiveScope(userId);
      if (!userId) return;
      // Auth changes can happen after the root has mounted (normal login flow).
      // Hydrate again so a newly signed-in device immediately receives the
      // account's cloud profiles and scan history.
      void (async () => {
        const [cloudProfiles, cloudHistory] = await Promise.all([pullProfileStore(), pullHistory()]);
        if (cancelled) return;
        if (cloudProfiles) saveProfileStore(cloudProfiles);

        if (cloudHistory) {
          const { loadHistory } = await import("@/lib/history");
          const localHistory = loadHistory();
          const byId = new Map(cloudHistory.map((entry) => [entry.id, entry]));
          for (const entry of localHistory) {
            if (!byId.has(entry.id)) byId.set(entry.id, entry);
          }
          const mergedHistory = [...byId.values()]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 60);
          saveHistory(mergedHistory);

          if (mergedHistory.length) {
            const { pushHistory } = await import("@/lib/cloud-sync");
            await pushHistory(mergedHistory);
          }
        }
      })();
    });

    const saved = window.localStorage.getItem("plateguard-theme");
    const nextDark = saved ? saved === "dark" : false; // default: light mode (Leafora vibe)
    document.documentElement.classList.toggle("dark", nextDark);

    return () => {
      cancelled = true;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Keep the mobile app at a fixed scale. This complements the viewport
    // meta tag and prevents pinch, gesture, and Ctrl/Cmd+wheel zoom.
    const preventZoomGesture = (event: Event) => event.preventDefault();
    const preventCtrlWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };
    const preventZoomKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) {
        event.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventZoomGesture, { passive: false });
    document.addEventListener("gesturechange", preventZoomGesture, { passive: false });
    document.addEventListener("gestureend", preventZoomGesture, { passive: false });
    document.addEventListener("wheel", preventCtrlWheel, { passive: false });
    document.addEventListener("keydown", preventZoomKeys, { passive: false });

    if ("serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");

          console.log("Service Worker registered successfully:", registration.scope);

          // Check for updated service workers
          registration.update().catch(() => {});
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker, {
          once: true,
        });
      }
    }

    return () => {
      document.removeEventListener("gesturestart", preventZoomGesture);
      document.removeEventListener("gesturechange", preventZoomGesture);
      document.removeEventListener("gestureend", preventZoomGesture);
      document.removeEventListener("wheel", preventCtrlWheel);
      document.removeEventListener("keydown", preventZoomKeys);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative isolate min-h-screen bg-transparent text-foreground">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://cdn.builder.io/api/v1/image/assets%2F1ca2bca50f224495a7c3d73527d7ae0b%2F8ce028537f8645afa9ddb1eb8ffa699e?format=webp&width=800&height=1200')",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-background/45 dark:bg-background/60"
        />
        <ThemeSync />
        <Outlet />
        <Toaster position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
