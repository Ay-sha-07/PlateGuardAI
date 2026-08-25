import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ScanLine, History, IdCard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/scan", label: "Scan", Icon: ScanLine },
  { to: "/history", label: "History", Icon: History },
  { to: "/card", label: "Card", Icon: IdCard },
  { to: "/profile", label: "Profile", Icon: UserRound },
] as const;

/**
 * Fixed bottom tab bar shared by the main app screens (Home, Scan,
 * History, Card, Profile). Renders inside a max-w-md shell to match the
 * mobile-first layout the rest of the app uses.
 *
 * `stacked` renders it as a normal (non-fixed) bar instead — used on
 * /profile, which already owns a fixed action bar for its step wizard;
 * the two are composed together there instead of overlapping.
 */
export function BottomNav({ stacked = false }: { stacked?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className={cn(
        "inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur",
        stacked ? "relative" : "fixed bottom-0",
      )}
      aria-label="Primary"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-5 px-2 py-2">
        {TABS.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "fill-primary/15")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Height of the fixed BottomNav in px — use to pad page bottoms so content doesn't sit under it. */
export const BOTTOM_NAV_HEIGHT = 64;
