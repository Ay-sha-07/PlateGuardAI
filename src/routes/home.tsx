import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Pill,
  Soup,
  Sparkles,
  ShieldCheck,
  Users,
  Check,
  Plus,
} from "lucide-react";
import {
  addProfile,
  loadProfileStore,
  setActiveProfile,
  type StoredProfile,
} from "@/lib/profile";
import { loadHistory, type ScanHistoryEntry } from "@/lib/history";
import { RATING_LABELS } from "@/lib/scan.server";
import { NEWS_ARTICLES } from "@/lib/news";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Home" },
      {
        name: "description",
        content: "Your health dashboard: quick scans, recent verdicts, and curated health news.",
      },
    ],
  }),
  component: HomePage,
});

const RATING_DOT: Record<number, string> = {
  1: "bg-safe",
  2: "bg-rating-2",
  3: "bg-caution",
  4: "bg-rating-4",
  5: "bg-danger",
};

function HomePage() {
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const store = loadProfileStore();
    setProfiles(store.profiles);
    setActiveId(store.activeId);
    setHistory(loadHistory().slice(0, 3));
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;

  const primaryGoal = useMemo(() => {
    if (!activeProfile) return null;
    return (
      activeProfile.dietaryPatterns[0] ??
      activeProfile.conditions[0] ??
      activeProfile.allergens[0] ??
      null
    );
  }, [activeProfile]);

  function switchTo(id: string) {
    setActiveProfile(id);
    setActiveId(id);
    setSwitcherOpen(false);
  }

  function createProfile() {
    const name = window.prompt("Name for the new profile (e.g. a family member's name)");
    if (name === null) return;
    const store = addProfile(name);
    setProfiles(store.profiles);
    setActiveId(store.activeId);
    setSwitcherOpen(false);
  }

  const article = NEWS_ARTICLES[newsIndex % NEWS_ARTICLES.length]!;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/icons/logo.png"
              alt="PlateGuard AI"
              className="size-8 rounded-full object-contain"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              Plate<span className="text-primary">Guard</span>
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSwitcherOpen((v) => !v)}
              className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
            >
              {activeProfile?.name?.[0]?.toUpperCase() ?? <Users className="size-4" />}
            </button>
            {switcherOpen && (
              <div className="animate-rise-in absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => switchTo(p.id)}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="text-foreground">{p.name}</span>
                    {p.id === activeId && <Check className="size-4 text-primary" />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={createProfile}
                  className="flex w-full items-center gap-2 border-t border-border px-3.5 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="size-4" />
                  Add a profile
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Personal shield active
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            Hello, {activeProfile?.name || "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Make your next choice with a little more clarity.
          </p>
        </div>

        {/* Health news & AI insights */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Health news &amp; AI insights</h2>
            <Link
              to="/news"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Sparkles className="size-3.5" />
              Tailored to you
            </Link>
          </div>

          <Link
            to="/news"
            className="mt-3 block overflow-hidden rounded-2xl border border-border bg-card/80 transition-transform active:scale-[0.99]"
          >
            <img
              src={article.image}
              alt=""
              className="h-36 w-full object-cover"
            />
            <div className="p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {article.tag}
              </span>
              <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                {article.title}
              </p>
              <span className="mt-1.5 inline-block text-xs font-medium text-primary">
                Read article →
              </span>
            </div>
          </Link>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Previous article"
              onClick={() => setNewsIndex((i) => (i - 1 + NEWS_ARTICLES.length) % NEWS_ARTICLES.length)}
              className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              {NEWS_ARTICLES.map((a, i) => (
                <span
                  key={a.slug}
                  className={`h-1.5 rounded-full transition-all ${
                    i === newsIndex % NEWS_ARTICLES.length ? "w-5 bg-primary" : "w-1.5 bg-secondary"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next article"
              onClick={() => setNewsIndex((i) => (i + 1) % NEWS_ARTICLES.length)}
              className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </section>

        {/* Quick scan */}
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Quick scan</h2>
            {activeProfile && (
              <span className="text-xs text-muted-foreground">1 profile filters</span>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            <Link
              to="/scan"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3.5 transition-transform active:scale-[0.99]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-safe/15 text-safe">
                <ShieldCheck className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Scan medicine</span>
                <span className="block text-xs text-muted-foreground">Check directions &amp; safety</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>

            <Link
              to="/scan"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3.5 transition-transform active:scale-[0.99]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-caution/15 text-caution">
                <Sparkles className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Scan food</span>
                <span className="block text-xs text-muted-foreground">Evaluate ingredients &amp; risk</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>

            {primaryGoal && (
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 transition-transform active:scale-[0.99]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    Your profile is shaping every result
                  </span>
                  <span className="block text-xs text-muted-foreground">Goal: {primaryGoal}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </Link>
            )}
          </div>
        </section>

        {/* Recent activity */}
        {history.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Recent activity</h2>
              <Link to="/history" className="text-xs font-medium text-primary hover:underline">
                See all
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {history.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3"
                >
                  <img
                    src={e.image}
                    alt=""
                    className="size-11 shrink-0 rounded-lg border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${RATING_DOT[e.rating] ?? "bg-caution"}`}
                      />
                      <p className="truncate text-sm font-medium text-foreground">
                        {e.productGuess || "Unreadable label"}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        {e.mode === "medicine" ? (
                          <Pill className="size-3" />
                        ) : (
                          <Soup className="size-3" />
                        )}
                        {RATING_LABELS[e.rating] ?? "Use caution"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
