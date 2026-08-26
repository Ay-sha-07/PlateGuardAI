import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  CircleHelp,
  FileWarning,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { usePhrases } from "@/hooks/use-ai-translate";
import { SAFETY_PHRASES } from "@/lib/ui-phrases";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Safety Center" },
      {
        name: "description",
        content:
          "Practical guidance for interpreting PlateGuard scan results and handling uncertain results safely.",
      },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const tp = usePhrases(SAFETY_PHRASES);
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{tp("Safety Center")}</h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              {tp("How to use a scan safely")}
            </p>
          </div>
        </header>

        <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/8 p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {tp("A scan is a safety aid, not a guarantee")}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {tp(
                  "Always check the physical package when the result is uncertain, the label is unreadable, or the product does not look like the identified item.",
                )}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 space-y-3">
          <SafetyCard
            icon={<Utensils className="size-5" />}
            title={tp("Know the 1–5 rating")}
            tone="primary"
          >
            <p>
              <strong>{tp("5/5 — Safe: no relevant concern was found from the available evidence.")}</strong>
            </p>
            <p>
              <strong>
                {tp(
                  "4/5 — Likely safe: low concern, but review the details if the product matters for a strict diet.",
                )}
              </strong>
            </p>
            <p>
              <strong>
                {tp("3/5 — Use caution: something is uncertain or needs verification.")}
              </strong>
            </p>
            <p>
              <strong>
                {tp("2/5 — High concern: avoid unless you can verify the issue is not relevant.")}
              </strong>
            </p>
            <p>
              <strong>{tp("1/5 — Unsafe: do not consume or use for eating.")}</strong>
            </p>
          </SafetyCard>

          <SafetyCard icon={<Barcode className="size-5" />} title={tp("Barcode vs. label")} tone="blue">
            <p>
              {tp(
                "A barcode can identify a catalogued product even when you do not have the ingredients text.",
              )}
            </p>
            <p>
              {tp(
                "If the barcode identifies a different product from what you are holding, stop and scan the physical label instead.",
              )}
            </p>
          </SafetyCard>

          <SafetyCard
            icon={<FileWarning className="size-5" />}
            title={tp("If the result looks wrong")}
            tone="warning"
          >
            <div className="space-y-2">
              <Step n={1}>{tp("Do not rely on the rating yet.")}</Step>
              <Step n={2}>
                {tp(
                  "Check the product name, ingredients, allergen statement, and warnings on the package.",
                )}
              </Step>
              <Step n={3}>{tp("Rescan a clearer image or paste the label text manually.")}</Step>
              <Step n={4}>
                {tp(
                  "For a serious allergy or medical restriction, follow the advice of your clinician or pharmacist.",
                )}
              </Step>
            </div>
          </SafetyCard>

          <SafetyCard
            icon={<AlertTriangle className="size-5" />}
            title={tp("Non-food products")}
            tone="danger"
          >
            <p>
              {tp(
                "Cosmetics, perfume, body lotion, cleaning products, medicines, and other non-food items are not food. They should never receive a “safe to eat” interpretation.",
              )}
            </p>
            <p>
              {tp(
                "If PlateGuard identifies an item as non-food, treat it as not edible regardless of its ingredient safety rating.",
              )}
            </p>
          </SafetyCard>

          <SafetyCard
            icon={<CircleHelp className="size-5" />}
            title={tp("Need another check?")}
            tone="primary"
          >
            <p>
              {tp(
                "Open your scan history to review the complete AI explanation from a previous scan, or start a new scan for clearer evidence.",
              )}
            </p>
            <Button asChild className="mt-2 w-full rounded-xl">
              <Link to="/scan">{tp("Scan a product")}</Link>
            </Button>
          </SafetyCard>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function SafetyCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: "primary" | "blue" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    primary: "text-primary bg-primary/12",
    blue: "text-sky-400 bg-sky-400/12",
    warning: "text-caution bg-caution/12",
    danger: "text-danger bg-danger/12",
  } as const;

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-caution/15 text-[11px] font-bold text-caution">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}
