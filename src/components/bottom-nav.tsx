import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ScanLine, History, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { usePhrases } from "@/hooks/use-ai-translate";
import { COMMON_PHRASES } from "@/lib/ui-phrases";
import { LanguageSelector } from "@/components/language-selector";

const TABS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/scan", label: "Scan", Icon: ScanLine },
  { to: "/history", label: "History", Icon: History },
  { to: "/card", label: "Card", Icon: CreditCard },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

/**
 * Primary bottom navigation (Home, Scan, History, Card, Profile).
 * Static dictionary first; AI phrases fill in any language without a static pack.
 */
export function BottomNav({ stacked = false }: { stacked?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, language } = useLanguage();
  const tp = usePhrases(COMMON_PHRASES);

  function tabLabel(english: string): string {
    try {
      if (language === "en") return english;
      const staticLabel = t(english);
      if (staticLabel && staticLabel !== english) return staticLabel;
      return tp(english);
    } catch {
      return english;
    }
  }

  return (
    <nav
      className={cn(
        "inset-x-0 z-40 border-t border-border bg-background/88 backdrop-blur",
        stacked ? "relative" : "fixed bottom-0",
      )}
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch gap-1 px-2 py-2">
        <div className="grid flex-1 grid-cols-5">
          {TABS.map(({ to, label, Icon }) => {
            const active =
              to === "/"
                ? pathname === "/" || pathname === "/home"
                : pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => {
                  // Always scroll to top of the home page when Home is pressed
                  if (to === "/") {
                    // Defer slightly so navigation/redirect can finish first when coming from another route
                    requestAnimationFrame(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    });
                  } else if (active) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "fill-primary/15")} />
                {tabLabel(label)}
              </Link>
            );
          })}
        </div>

        <div className="flex w-11 shrink-0 items-center justify-center border-l border-border/60 pl-1">
          <LanguageSelector compact inline />
        </div>
      </div>
    </nav>
  );
}

/** Height of the fixed BottomNav in px — use to pad page bottoms so content doesn't sit under it. */
export const BOTTOM_NAV_HEIGHT = 64;
