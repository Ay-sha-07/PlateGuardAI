import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  GitCompare,
  Pill,
  Soup,
  Trash2,
  Sparkles,
  X,
} from "lucide-react";
import {
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  subscribeHistoryChanges,
  type ScanHistoryEntry,
} from "@/lib/history";
import { SCOPE_CHANGED_EVENT } from "@/lib/account-scope";
import { isHistoryPullInFlight, subscribeHistoryPullStatus } from "@/lib/cloud-sync";
import { RATING_LABELS, type ScanResult } from "@/lib/scan.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";
import { RequireEntry } from "@/components/require-entry";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Scan history" },
      {
        name: "description",
        content: "Your recent food and medicine label verdicts, with full AI scan details.",
      },
    ],
  }),
  component: HistoryPage,
});

const RATING_DOT: Record<number, string> = {
  1: "bg-danger",
  2: "bg-rating-4",
  3: "bg-caution",
  4: "bg-rating-2",
  5: "bg-safe",
};

const RATING_TEXT: Record<number, string> = {
  1: "text-danger",
  2: "text-rating-4",
  3: "text-caution",
  4: "text-rating-2",
  5: "text-safe",
};

function HistoryPage() {
  return (
    <RequireEntry>
      <HistoryPageContent />
    </RequireEntry>
  );
}

function HistoryPageContent() {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(() => isHistoryPullInFlight());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareResult, setShowCompareResult] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
    const id = new URLSearchParams(window.location.search).get("scan");
    setSelectedId(id);
    setLoaded(true);

    // Keep selectedId in sync when the browser/back button changes the URL
    // (pushState navigations don't fire a re-render on their own).
    const onPopState = () => {
      const nextId = new URLSearchParams(window.location.search).get("scan");
      setSelectedId(nextId);
    };
    window.addEventListener("popstate", onPopState);

    // Re-read from localStorage whenever it changes underneath us. This is
    // what makes cross-device sync actually show up: signing in kicks off a
    // background pull from the cloud (see __root.tsx) that can finish well
    // after this page has already mounted and taken its first snapshot.
    // Without this, that fresher data would sit in localStorage but never
    // reach the screen until a manual refresh.
    const refresh = () => setEntries(loadHistory());
    const unsubscribeHistory = subscribeHistoryChanges(refresh);
    const unsubscribePullStatus = subscribeHistoryPullStatus(setSyncing);
    window.addEventListener(SCOPE_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("popstate", onPopState);
      unsubscribeHistory();
      unsubscribePullStatus();
      window.removeEventListener(SCOPE_CHANGED_EVENT, refresh);
    };
  }, []);

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  function remove(id: string) {
    deleteHistoryEntry(id);
    const next = loadHistory();
    setEntries(next);
    if (id === selectedId) {
      window.history.replaceState({}, "", "/history");
      setSelectedId(null);
    }
  }

  function removeAll() {
    if (!window.confirm("Clear all scan history on this device?")) return;
    clearHistory();
    setEntries([]);
    window.history.replaceState({}, "", "/history");
    setSelectedId(null);
  }

  function toggleCompareMode() {
    setCompareMode((v) => !v);
    setCompareIds([]);
    setShowCompareResult(false);
  }

  function toggleCompareSelect(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap at 3 — more than that stops being readable side-by-side
      return [...prev, id];
    });
  }

  const compareEntries = useMemo(
    () =>
      compareIds
        .map((id) => entries.find((e) => e.id === id))
        .filter((e): e is ScanHistoryEntry => !!e),
    [compareIds, entries],
  );

  if (showCompareResult && compareEntries.length >= 2) {
    return (
      <CompareView
        entries={compareEntries}
        onBack={() => setShowCompareResult(false)}
        onExit={() => {
          setCompareMode(false);
          setCompareIds([]);
          setShowCompareResult(false);
        }}
      />
    );
  }

  if (selected) {
    return <HistoryDetail entry={selected} onDelete={() => remove(selected.id)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
              <Link to="/">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-foreground">
                {compareMode ? `Select to compare (${compareIds.length}/3)` : "Scan history"}
              </h1>
              {syncing && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground" role="status" aria-live="polite">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                  Syncing…
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {entries.length >= 2 && (
              <Button
                variant={compareMode ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleCompareMode}
              >
                {compareMode ? <X className="size-4" /> : <GitCompare className="size-4" />}
                {compareMode ? "Cancel" : "Compare"}
              </Button>
            )}
            {!compareMode && entries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:text-danger"
                onClick={removeAll}
              >
                <Trash2 className="size-4" />
                Clear all
              </Button>
            )}
          </div>
        </header>

        {loaded && entries.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Soup className="size-7" />
            </div>
            <p className="text-sm font-medium text-foreground">No scans yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Verdicts you get from scanning a food or medicine label will show up here.
            </p>
            <Button asChild className="mt-2">
              <Link to="/scan">Scan a label</Link>
            </Button>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {entries.map((e) => {
            const isSelected = compareIds.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  if (compareMode) {
                    toggleCompareSelect(e.id);
                    return;
                  }
                  window.history.pushState({}, "", `/history?scan=${encodeURIComponent(e.id)}`);
                  setSelectedId(e.id);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur transition-transform hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-primary bg-primary/8"
                    : "border-border bg-card/80 hover:border-primary/30"
                }`}
              >
                {compareMode && (
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                )}
                <img
                  src={e.image}
                  alt=""
                  className="size-16 shrink-0 rounded-xl border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-2 shrink-0 rounded-full ${RATING_DOT[e.rating] ?? "bg-caution"}`}
                    />
                    <p className="truncate text-sm font-semibold text-foreground">
                      {e.productGuess || "Unreadable label"}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.headline}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      {e.mode === "medicine" ? (
                        <Pill className="size-3" />
                      ) : (
                        <Soup className="size-3" />
                      )}
                      {RATING_LABELS[e.rating] ?? "Use caution"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{e.profileName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ·{" "}
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {!compareMode && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
        </div>

        {compareMode && compareIds.length >= 2 && (
          <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-5">
            <Button
              className="h-12 w-full max-w-md rounded-2xl shadow-lg"
              onClick={() => setShowCompareResult(true)}
            >
              <GitCompare className="size-4" />
              Compare {compareIds.length} products
            </Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function CompareView({
  entries,
  onBack,
  onExit,
}: {
  entries: ScanHistoryEntry[];
  onBack: () => void;
  onExit: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={onBack}>
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground">
                Comparing {entries.length}
              </h1>
              <p className="text-xs text-muted-foreground">Swipe to see each product</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="size-4" />
            Done
          </Button>
        </header>

        <div className="mt-5 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {entries.map((e) => (
            <div
              key={e.id}
              className="w-[86%] shrink-0 snap-start space-y-3 rounded-2xl border border-border bg-card/80 p-4"
            >
              <img
                src={e.image}
                alt=""
                className="h-36 w-full rounded-xl border border-border object-cover"
              />

              <div>
                <p className="truncate text-sm font-bold text-foreground">
                  {e.productGuess || "Unreadable label"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {e.profileName} ·{" "}
                  {new Date(e.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${RATING_TEXT[e.rating] ?? "text-caution"}`}>
                  {e.rating}/5
                </span>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  {e.mode === "medicine" ? (
                    <Pill className="size-3" />
                  ) : (
                    <Soup className="size-3" />
                  )}
                  {RATING_LABELS[e.rating] ?? "Use caution"}
                </Badge>
              </div>

              <p className="text-sm leading-5 text-foreground">{e.headline}</p>

              {e.aiResult ? (
                <>
                  {e.aiResult.flaggedIngredients.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Flagged
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.aiResult.flaggedIngredients.map((f) => (
                          <Badge key={f} className="bg-danger/15 text-[10px] text-danger">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {e.aiResult.profileImpact.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Profile impact
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {e.aiResult.profileImpact.map((item, i) => (
                          <p key={i} className="text-xs leading-4 text-muted-foreground">
                            <span
                              className={`font-semibold ${RATING_TEXT[item.rating] ?? "text-caution"}`}
                            >
                              {item.trigger}
                            </span>{" "}
                            — {item.detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {e.aiResult.recommendation && (
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Recommendation
                      </p>
                      <p className="mt-1 text-xs leading-5 text-foreground">
                        {e.aiResult.recommendation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Saved before detailed AI results were enabled — only the summary verdict is
                  available.
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Higher rating = safer. Ratings are personalized to each entry's active profile at scan
          time.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

function HistoryDetail({ entry, onDelete }: { entry: ScanHistoryEntry; onDelete: () => void }) {
  const result = entry.aiResult;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-24 pt-6">
        <header className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-foreground">
              {entry.productGuess || "Scan details"}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString()} · {entry.profileName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-danger hover:text-danger"
            onClick={onDelete}
            aria-label="Delete scan"
          >
            <Trash2 className="size-4" />
          </Button>
        </header>

        <div className="mt-5 space-y-3">
          <img
            src={entry.image}
            alt="Scanned label"
            className="max-h-72 w-full rounded-2xl border border-border object-cover"
          />

          <div className="rounded-2xl border border-border bg-card/80 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">AI verdict</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-2xl font-black ${RATING_TEXT[entry.rating] ?? "text-caution"}`}
              >
                {entry.rating}/5
              </span>
              <Badge variant="secondary">{RATING_LABELS[entry.rating] ?? "Use caution"}</Badge>
            </div>
            <p className="mt-2 text-base font-semibold text-foreground">{entry.headline}</p>
          </div>

          {!result ? (
            <div className="rounded-2xl border border-caution/30 bg-caution/5 p-4 text-sm text-muted-foreground">
              This scan was saved before detailed AI results were enabled, so only its summary
              verdict is available.
            </div>
          ) : (
            <DetailedResult result={result} />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function DetailedResult({ result }: { result: ScanResult }) {
  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-widest">What the AI found</p>
        </div>
        {result.summary && (
          <p className="mt-2 text-sm leading-6 text-foreground">{result.summary}</p>
        )}
        {result.whatItIs && (
          <div className="mt-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">What it is</p>
            <p className="mt-1 text-sm text-foreground">{result.whatItIs}</p>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Confidence: <span className="font-semibold text-foreground">{result.confidence}</span>
        </p>
      </div>

      {result.purpose && <DetailBlock title="Purpose" items={[result.purpose]} />}
      {result.activeIngredients.length > 0 && (
        <DetailBlock title="Active ingredients" items={result.activeIngredients} />
      )}
      {result.labelEvidence.length > 0 && (
        <DetailBlock title="Label evidence" items={result.labelEvidence} />
      )}
      {result.nutritionHighlights.length > 0 && (
        <DetailBlock title="Nutrition & ingredient highlights" items={result.nutritionHighlights} />
      )}
      {result.flaggedIngredients.length > 0 && (
        <DetailBlock title="Flagged ingredients" items={result.flaggedIngredients} danger />
      )}

      {result.profileImpact.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/80 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            How it affected the profile
          </p>
          <div className="mt-3 space-y-4">
            {result.profileImpact.map((item, i) => (
              <div key={i}>
                <p
                  className={`text-sm font-semibold ${RATING_TEXT[item.rating] ?? "text-caution"}`}
                >
                  {item.rating}/5 · {item.trigger}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/80 p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">AI reasons</p>
        <div className="mt-3 space-y-4">
          {result.reasons.map((reason, i) => (
            <div key={i}>
              <p
                className={`text-sm font-semibold ${RATING_TEXT[reason.rating] ?? "text-caution"}`}
              >
                {reason.rating}/5 · {reason.trigger}
              </p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{reason.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {result.recommendation && (
        <DetailBlock title="Recommendation" items={[result.recommendation]} />
      )}
    </>
  );
}

function DetailBlock({
  title,
  items,
  danger = false,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${danger ? "border-danger/30 bg-danger/5" : "border-border bg-card/80"}`}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-5 text-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}