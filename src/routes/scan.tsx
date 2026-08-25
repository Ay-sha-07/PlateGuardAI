import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  FileImage,
  History as HistoryIcon,
  Loader2,
  Pill,
  Plus,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Soup,
  Users,
  X,
  Barcode,
  ClipboardPaste,
  Search,
  Sparkles,
} from "lucide-react";
import { scanLabel } from "@/lib/scan.functions";
import { lookupBarcode } from "@/lib/barcode";
import { RATING_LABELS, type ScanResult } from "@/lib/scan.server";
import { addProfile, loadProfileStore, setActiveProfile, type StoredProfile } from "@/lib/profile";
import { addHistoryEntry, makeThumbnail } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Scan food & medicine labels" },
      {
        name: "description",
        content: "Scan any food or medicine label for allergen and health risk checks.",
      },
    ],
  }),
  component: ScanRouteWrapper,
});

function ScanRouteWrapper() {
  return (
    <ClientOnly
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ScannerPage />
    </ClientOnly>
  );
}

type ScanMode = "food" | "medicine";

const RATING_STYLE: Record<
  number,
  {
    bg: string;
    text: string;
    fg: string;
    glow: string;
    Icon: typeof CheckCircle2;
  }
> = {
  1: {
    bg: "bg-safe",
    text: "text-safe",
    fg: "text-safe-foreground",
    glow: "glow-safe",
    Icon: CheckCircle2,
  },
  2: {
    bg: "bg-rating-2",
    text: "text-rating-2",
    fg: "text-rating-2-foreground",
    glow: "glow-safe",
    Icon: CheckCircle2,
  },
  3: {
    bg: "bg-caution",
    text: "text-caution",
    fg: "text-caution-foreground",
    glow: "glow-caution",
    Icon: AlertTriangle,
  },
  4: {
    bg: "bg-rating-4",
    text: "text-rating-4",
    fg: "text-rating-4-foreground",
    glow: "glow-danger",
    Icon: AlertTriangle,
  },
  5: {
    bg: "bg-danger",
    text: "text-danger",
    fg: "text-danger-foreground",
    glow: "glow-danger",
    Icon: ShieldAlert,
  },
};

function ratingTheme(rating: number) {
  const style = RATING_STYLE[rating] ?? RATING_STYLE[3]!;
  return { ...style, label: RATING_LABELS[rating] ?? "Use caution" };
}

function ScannerPage() {
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mode, setMode] = useState<ScanMode>("food");

  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Manual-entry alternative to the camera: product name, barcode lookup
  // (via Open Food Facts), and pasted/typed ingredient text. Any one of
  // these lets a shopper get a verdict without a usable photo.
  const [manualOpen, setManualOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodePending, setBarcodePending] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [ingredientText, setIngredientText] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(scanLabel);

  useEffect(() => {
    const store = loadProfileStore();
    setProfiles(store.profiles);
    setActiveId(store.activeId);
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;
  const hasProfile = !!activeProfile;

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

  function profilePayload() {
    return {
      mode,
      ageGroup: activeProfile?.ageGroup ?? "",
      biologicalSex: activeProfile?.biologicalSex ?? "",
      reproductiveStatus: activeProfile?.reproductiveStatus ?? "",
      weightKg: activeProfile?.weightKg ?? "",
      heightCm: activeProfile?.heightCm ?? "",
      activityLevel: activeProfile?.activityLevel ?? "",
      allergens: activeProfile?.allergens ?? [],
      allergySeverity: activeProfile?.allergySeverity ?? "",
      glutenStatus: activeProfile?.glutenStatus ?? "",
      conditions: activeProfile?.conditions ?? [],
      diabetes: activeProfile?.diabetes ?? { type: "", treatment: "" },
      hypertension: activeProfile?.hypertension ?? { status: "" },
      kidney: activeProfile?.kidney ?? { status: "" },
      sensitivities: activeProfile?.sensitivities ?? [],
      bowelHabits: activeProfile?.bowelHabits ?? [],
      dietaryPatterns: activeProfile?.dietaryPatterns ?? [],
      medications: activeProfile?.medications ?? "",
      notes: activeProfile?.notes ?? "",
    } as const;
  }

  function reportScanFailure(e: unknown) {
    console.error("[scan] failed:", e);
    const rawMessage = e instanceof Error ? e.message : "";
    const looksLikeHtml = /^\s*<(!doctype|html)/i.test(rawMessage);
    const detail =
      rawMessage && !looksLikeHtml ? rawMessage : !looksLikeHtml && e ? String(e) : "";
    setError(
      detail && !/^\s*<(!doctype|html)/i.test(detail)
        ? "Scan failed — please try again. " + detail.slice(0, 140)
        : "Scan failed — please try again. Check the browser console for details.",
    );
  }

  async function runScan(dataUrl: string) {
    setError(null);
    setResult(null);
    setImage(dataUrl);
    setPending(true);
    try {
      const res = (await run({
        data: { image: dataUrl, productName: productName.trim(), ...profilePayload() },
      })) as ScanResult;
      setResult(res);

      const thumb = await makeThumbnail(dataUrl);
      addHistoryEntry({
        profileId: activeProfile?.id ?? "",
        profileName: activeProfile?.name || "Unnamed profile",
        mode,
        image: thumb,
        rating: res.rating,
        headline: res.headline,
        productGuess: res.productGuess,
      });
    } catch (e) {
      reportScanFailure(e);
    } finally {
      setPending(false);
    }
  }

  /** Alternative to the camera: scans pasted/typed ingredient text (e.g. from a barcode lookup) with no photo. */
  async function runTextScan() {
    if (!ingredientText.trim()) return;
    setError(null);
    setResult(null);
    setImage(null);
    setPending(true);
    try {
      const res = (await run({
        data: {
          ingredientText: ingredientText.trim(),
          productName: productName.trim(),
          ...profilePayload(),
        },
      })) as ScanResult;
      setResult(res);

      addHistoryEntry({
        profileId: activeProfile?.id ?? "",
        profileName: activeProfile?.name || "Unnamed profile",
        mode,
        image: TEXT_SCAN_THUMB,
        rating: res.rating,
        headline: res.headline,
        productGuess: res.productGuess,
      });
    } catch (e) {
      reportScanFailure(e);
    } finally {
      setPending(false);
    }
  }

  async function runBarcodeLookup() {
    if (!barcode.trim()) return;
    setBarcodePending(true);
    setBarcodeError(null);
    try {
      const result = await lookupBarcode(barcode.trim());
      if (!result.found) {
        setBarcodeError("We couldn't find this barcode in the open catalog.");
        return;
      }
      setProductName(result.productName);
      setIngredientText(result.ingredientText);
    } catch {
      setBarcodeError("Barcode lookup failed — check your connection and try again.");
    } finally {
      setBarcodePending(false);
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setPreparing(true);
    let dataUrl: string;
    try {
      dataUrl = await fileToImageDataUrl(file);
    } catch (e) {
      console.error("[scan] couldn't prepare file:", e);
      setPreparing(false);
      setError(
        file.type === "application/pdf"
          ? "Couldn't read that PDF — try a clearer scan or a photo instead."
          : "Couldn't read that file — try a different photo.",
      );
      return;
    }
    setPreparing(false);
    await runScan(dataUrl);
  }

  const theme = result ? ratingTheme(result.rating) : null;
  const scanTargetLabel = mode === "medicine" ? "medicine label" : "food label";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute -left-24 -top-24 size-[22rem] rounded-full bg-primary/25 blur-[90px]" />
        <div
          className="animate-aurora absolute -right-28 top-1/3 size-[20rem] rounded-full bg-danger/25 blur-[90px]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="animate-aurora absolute bottom-0 left-1/4 size-[18rem] rounded-full bg-caution/20 blur-[90px]"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="animate-rise-in flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back to Home Button 👇 */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-9 rounded-full border border-border/50 bg-card/60 transition-transform active:scale-95"
            >
              <Link to="/home" title="Back to Home">
                <ArrowLeft className="size-4 text-foreground" />
              </Link>
            </Button>

            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Plate<span className="text-primary">Guard</span> AI
              </h1>
              <p className="text-xs text-muted-foreground">
                <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-primary align-middle" />
                Label check in one second
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full transition-transform active:scale-95"
            >
              <Link to="/history" title="Scan history">
                <HistoryIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-full transition-transform active:scale-95"
            >
              <Link to="/profile">
                <SlidersHorizontal className="size-4" />
                Profile
              </Link>
            </Button>
          </div>
        </header>

        <div className="animate-rise-in relative z-30 mt-4" style={{ animationDelay: "40ms" }}>
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card/80 px-3.5 py-2.5 backdrop-blur transition-colors hover:bg-card"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="size-4 text-primary" />
              {hasProfile ? activeProfile!.name : "No profile yet"}
            </span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${switcherOpen ? "rotate-180" : ""}`}
            />
          </button>
          {switcherOpen && (
            <div className="animate-rise-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
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

        <div
          className="animate-rise-in mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card/60 p-1"
          style={{ animationDelay: "60ms" }}
        >
          {[
            { key: "food" as const, label: "Food label", Icon: Soup },
            { key: "medicine" as const, label: "Medicine", Icon: Pill },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key);
                setImage(null);
                setResult(null);
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors ${
                mode === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.Icon className="size-4" />
              {m.label}
            </button>
          ))}
        </div>

        <section
          className="animate-rise-in mt-3 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur"
          style={{ animationDelay: "80ms" }}
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Scanning for</p>
          {hasProfile ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeProfile!.allergens.map((a, i) => (
                <Badge
                  key={a}
                  className="animate-rise-in bg-danger/15 text-danger"
                  style={{ animationDelay: `${140 + i * 50}ms` }}
                >
                  {a}
                </Badge>
              ))}
              {activeProfile!.conditions.map((c, i) => (
                <Badge
                  key={c}
                  className="animate-rise-in bg-accent text-accent-foreground"
                  style={{ animationDelay: `${180 + i * 50}ms` }}
                >
                  {c}
                </Badge>
              ))}
              {activeProfile!.dietaryPatterns.map((d, i) => (
                <Badge
                  key={d}
                  variant="secondary"
                  className="animate-rise-in"
                  style={{ animationDelay: `${220 + i * 50}ms` }}
                >
                  {d}
                </Badge>
              ))}
              {activeProfile!.sensitivities.map((s, i) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="animate-rise-in"
                  style={{ animationDelay: `${260 + i * 50}ms` }}
                >
                  {s}
                </Badge>
              ))}
              {activeProfile!.allergens.length === 0 &&
                activeProfile!.conditions.length === 0 &&
                activeProfile!.dietaryPatterns.length === 0 &&
                activeProfile!.sensitivities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    This profile has no allergies or conditions set yet.
                  </p>
                )}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                No profile yet. Add allergies and conditions so scans mean something.
              </p>
              <Button size="sm" onClick={createProfile}>
                <Plus className="size-4" />
                Create a profile
              </Button>
            </div>
          )}
        </section>

        <section className="mt-5 flex-1">
          <div
            className={`animate-rise-in relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-secondary/70 transition-shadow duration-500 ${
              result ? theme!.glow : ""
            }`}
            style={{ animationDelay: "140ms" }}
          >
            {image ? (
              <img
                src={image}
                alt="Captured label"
                className="animate-rise-in size-full bg-background object-contain"
              />
            ) : result ? (
              <div className="animate-rise-in flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <ClipboardPaste className="size-6" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {productName || result.productGuess || "Pasted label text"}
                </p>
                <p className="line-clamp-4 text-xs text-muted-foreground">{ingredientText}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex size-full flex-col items-center justify-center gap-4 p-6 text-center"
              >
                <span className="relative flex size-24 items-center justify-center">
                  <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-primary/50" />
                  <span
                    className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-primary/30"
                    style={{ animationDelay: "-1.2s" }}
                  />
                  <span className="animate-float-soft flex size-16 items-center justify-center rounded-full bg-primary/15">
                    <Camera className="size-8 text-primary" />
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Point at the{" "}
                  {scanTargetLabel === "medicine label"
                    ? "medicine box or leaflet"
                    : "ingredients panel"}{" "}
                  and capture. Fill the frame with the text.
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    galleryRef.current?.click();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      galleryRef.current?.click();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  <FileImage className="size-3.5" />
                  or upload a photo / PDF instead
                </span>
              </button>
            )}

            {!image && (
              <div aria-hidden className="pointer-events-none absolute inset-4">
                {[
                  "left-0 top-0 border-l-2 border-t-2 rounded-tl-xl",
                  "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl",
                  "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-xl",
                  "right-0 bottom-0 border-b-2 border-r-2 rounded-br-xl",
                ].map((c, i) => (
                  <span
                    key={c}
                    className={`animate-corner-breathe absolute size-8 border-primary/70 ${c}`}
                    style={{ animationDelay: `${i * 260}ms` }}
                  />
                ))}
              </div>
            )}

            {preparing && !image && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-[2px]">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="animate-pulse text-sm text-foreground">Preparing file…</p>
              </div>
            )}

            {pending && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]">
                <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary/80 shadow-[0_0_24px_4px_var(--primary)]" />
                <div className="flex size-full flex-col items-center justify-center gap-2">
                  <Loader2 className="size-7 animate-spin text-primary" />
                  <p className="animate-pulse text-sm text-foreground">Reading label…</p>
                </div>
              </div>
            )}

            {result && theme && (
              <div
                className={`animate-pop-verdict absolute inset-x-0 bottom-0 ${theme.bg} px-4 py-3`}
              >
                <div className={`flex items-center gap-2 ${theme.fg}`}>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-black/10 font-display text-sm font-bold ${
                      result.rating >= 4 ? "animate-pulse" : ""
                    }`}
                  >
                    {result.rating}
                  </span>
                  <theme.Icon className={`size-6 ${result.rating >= 4 ? "animate-pulse" : ""}`} />
                  <span className="font-display text-xl font-bold uppercase tracking-tight">
                    {theme.label}
                  </span>
                </div>
                <p className={`mt-0.5 text-sm font-medium ${theme.fg}`}>{result.headline}</p>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />

          <div className="mt-4 flex gap-2">
            <Button
              size="lg"
              className="relative h-14 flex-1 overflow-hidden rounded-2xl bg-gradient-to-b from-primary to-[oklch(0.66_0.13_58)] text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
              disabled={pending || preparing}
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="size-5" />
              {image ? "Scan another label" : "Scan a label"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 rounded-2xl px-4 transition-transform active:scale-95"
              disabled={pending || preparing}
              onClick={() => galleryRef.current?.click()}
              title="Upload a photo or PDF"
            >
              <FileImage className="size-5" />
            </Button>
            {(image || result) && (
              <Button
                size="lg"
                variant="secondary"
                className="h-14 rounded-2xl transition-transform active:scale-95"
                disabled={pending || preparing}
                onClick={() => {
                  setImage(null);
                  setResult(null);
                  setError(null);
                  setIngredientText("");
                  setBarcode("");
                  setProductName("");
                  setBarcodeError(null);
                }}
              >
                <RotateCcw className="size-5" />
              </Button>
            )}
          </div>

          {!image && !result && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setManualOpen((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                <ClipboardPaste className="size-3.5" />
                {manualOpen ? "Hide barcode / paste-text entry" : "Or scan a barcode / paste ingredient text"}
              </button>

              {manualOpen && (
                <div className="animate-rise-in mt-3 space-y-3 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Product name
                    </label>
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Harvest Oat Granola"
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Scan barcode
                    </label>
                    <div className="mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void runBarcodeLookup();
                          }}
                          inputMode="numeric"
                          placeholder="e.g. 8908010046488"
                          className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 shrink-0 rounded-xl px-3"
                        disabled={barcodePending || !barcode.trim()}
                        onClick={() => void runBarcodeLookup()}
                      >
                        {barcodePending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Search className="size-4" />
                        )}
                        Look up
                      </Button>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Looks up the free Open Food Facts catalog and fills in ingredients below.
                    </p>
                    {barcodeError && (
                      <p className="mt-1 text-xs text-danger">{barcodeError}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Or paste / edit label text
                    </label>
                    <textarea
                      value={ingredientText}
                      onChange={(e) => setIngredientText(e.target.value)}
                      rows={4}
                      placeholder="Ingredients: oats, sugar, sodium…"
                      className="mt-1 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="h-12 w-full rounded-xl text-sm font-semibold"
                    disabled={pending || !ingredientText.trim()}
                    onClick={() => void runTextScan()}
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {pending ? "Analyzing…" : "Analyze label"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!image && !pending && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card/60 py-2.5 backdrop-blur">
              <div className="animate-ticker flex w-max gap-3 pl-3">
                {[...TICKER, ...TICKER].map((t, i) => (
                  <span
                    key={i}
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground"
                  >
                    <span className={`size-1.5 rounded-full ${t.ok ? "bg-safe" : "bg-danger"}`} />
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="animate-rise-in mt-3 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-5 space-y-3">
              <div
                className="animate-rise-in rounded-2xl border border-border bg-card/80 p-4 backdrop-blur"
                style={{ animationDelay: "60ms" }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {mode === "medicine" ? "Medicine" : "Product"}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {result.productGuess}
                </p>
                {mode === "medicine" && result.purpose && (
                  <p className="mt-1 text-sm text-muted-foreground">{result.purpose}</p>
                )}
                {mode === "medicine" && result.activeIngredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.activeIngredients.map((ai) => (
                      <Badge key={ai} variant="secondary">
                        {ai}
                      </Badge>
                    ))}
                  </div>
                )}
                {!result.labelReadable && (
                  <p className="mt-2 text-sm text-caution">
                    The label wasn't fully readable — retake the photo closer and in better light.
                  </p>
                )}
              </div>

              {result.reasons.map((r, i) => {
                const t = ratingTheme(r.rating);
                return (
                  <div
                    key={i}
                    className={`animate-rise-in rounded-2xl border border-border bg-card/80 p-4 backdrop-blur transition-transform hover:-translate-y-0.5 ${
                      r.rating >= 4 ? "glow-danger" : ""
                    }`}
                    style={{ animationDelay: `${120 + i * 90}ms` }}
                  >
                    <div className={`flex items-center gap-2 ${t.text}`}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-current/15 text-[11px] font-bold">
                        {r.rating}
                      </span>
                      <t.Icon className="size-4" />
                      <p className="text-sm font-semibold">{r.trigger}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                  </div>
                );
              })}

              {result.flaggedIngredients.length > 0 && (
                <div
                  className="animate-rise-in rounded-2xl border border-border bg-card/80 p-4 backdrop-blur"
                  style={{ animationDelay: "260ms" }}
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Flagged on the label
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.flaggedIngredients.map((f, i) => (
                      <Badge
                        key={f}
                        className="animate-rise-in bg-danger/15 text-danger"
                        style={{ animationDelay: `${300 + i * 60}ms` }}
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="px-1 text-xs text-muted-foreground">
                PlateGuard AI assists, it does not replace the printed label
                {mode === "medicine" ? ", pharmacist, or doctor" : " or medical advice"}. When in
                doubt, {mode === "medicine" ? "check with a pharmacist" : "don't eat it"}.
              </p>
            </div>
          )}
        </section>
      </main>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(dataUrl) => {
            setCameraOpen(false);
            void runScan(dataUrl);
          }}
          onFallbackToFile={() => {
            setCameraOpen(false);
            fileRef.current?.click();
          }}
        />
      )}
      <BottomNav />
    </div>
  );
}

/* ------------------------------- Live camera ------------------------------ */

function CameraCapture({
  onClose,
  onCapture,
  onFallbackToFile,
}: {
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  onFallbackToFile: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"requesting" | "ready" | "denied" | "unsupported">(
    "requesting",
  );

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[camera] permission/getUserMedia failed:", err);
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    const max = 1200;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-black">
      <div className="relative size-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`size-full object-cover ${status === "ready" ? "" : "hidden"}`}
        />

        {status === "requesting" && (
          <div className="flex size-full flex-col items-center justify-center gap-3 text-white">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">Requesting camera permission…</p>
          </div>
        )}

        {status === "denied" && (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <ShieldAlert className="size-8 text-caution" />
            <p className="text-sm font-medium">Camera access was blocked</p>
            <p className="text-xs text-white/70">
              Allow camera access for this site in your browser settings, or upload a photo instead.
            </p>
            <Button size="sm" className="mt-2" onClick={onFallbackToFile}>
              <FileImage className="size-4" />
              Upload a photo instead
            </Button>
          </div>
        )}

        {status === "unsupported" && (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <ShieldAlert className="size-8 text-caution" />
            <p className="text-sm font-medium">Live camera isn't supported here</p>
            <Button size="sm" className="mt-2" onClick={onFallbackToFile}>
              <FileImage className="size-4" />
              Upload a photo instead
            </Button>
          </div>
        )}

        {status === "ready" && (
          <div aria-hidden className="pointer-events-none absolute inset-8 sm:inset-16">
            {[
              "left-0 top-0 border-l-2 border-t-2 rounded-tl-xl",
              "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl",
              "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-xl",
              "right-0 bottom-0 border-b-2 border-r-2 rounded-br-xl",
            ].map((c) => (
              <span key={c} className={`absolute size-10 border-primary ${c}`} />
            ))}
            <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-primary/80 shadow-[0_0_20px_3px_var(--primary)]" />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-transform active:scale-95"
          aria-label="Close camera"
        >
          <X className="size-5" />
        </button>

        {status === "ready" && (
          <div className="absolute inset-x-0 bottom-8 z-20 flex items-center justify-center">
            <button
              type="button"
              onClick={capture}
              className="group flex size-20 items-center justify-center rounded-full border-4 border-white bg-black/30 shadow-2xl backdrop-blur-sm transition-transform active:scale-90"
              aria-label="Capture photo"
            >
              <span className="size-14 rounded-full bg-primary ring-2 ring-white/50 transition-all group-hover:scale-105" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Small inline placeholder thumbnail used for history entries created from
// pasted text / barcode lookups, which have no captured photo.
const TEXT_SCAN_THUMB =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="20" fill="#1f2a24"/>
      <g fill="none" stroke="#7fd996" stroke-width="6" stroke-linecap="round">
        <line x1="40" y1="52" x2="120" y2="52"/>
        <line x1="40" y1="80" x2="120" y2="80"/>
        <line x1="40" y1="108" x2="90" y2="108"/>
      </g>
    </svg>`,
  );

const TICKER = [
  { text: "Granola bar — hidden almond butter", ok: false },
  { text: "Rice crackers — clear", ok: true },
  { text: "Instant noodles — 42% DV sodium", ok: false },
  { text: "Oat milk — clear", ok: true },
  { text: "Choco wafer — groundnut oil = peanut", ok: false },
  { text: "Apple crisps — clear", ok: true },
];

async function fileToImageDataUrl(file: File, max = 1200): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const bitmap = isPdf ? await renderFirstPdfPage(file) : await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function renderFirstPdfPage(file: File): Promise<ImageBitmap> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return createImageBitmap(canvas);
}
