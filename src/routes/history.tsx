import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Pill, Soup, Trash2 } from "lucide-react";
import {
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  type ScanHistoryEntry,
} from "@/lib/history";
import { RATING_LABELS } from "@/lib/scan.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "SnackSafe AI — Scan history" },
      {
        name: "description",
        content: "Your recent food and medicine label verdicts, on this device.",
      },
    ],
  }),
  component: HistoryPage,
});

const RATING_DOT: Record<number, string> = {
  1: "bg-safe",
  2: "bg-rating-2",
  3: "bg-caution",
  4: "bg-rating-4",
  5: "bg-danger",
};

function HistoryPage() {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
    setLoaded(true);
  }, []);

  function remove(id: string) {
    deleteHistoryEntry(id);
    setEntries(loadHistory());
  }

  function removeAll() {
    if (!window.confirm("Clear all scan history on this device?")) return;
    clearHistory();
    setEntries([]);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link to="/scan">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">Scan history</h1>
          </div>
          {entries.length > 0 && (
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
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur"
            >
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
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label="Delete entry"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
