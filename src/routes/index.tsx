import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Candy,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Croissant,
  Facebook,
  History,
  Instagram,
  Languages,
  Linkedin,
  ListChecks,
  Lock,
  Milk,
  Popcorn,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Menu,
  Twitter,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Moon,
  Sun,
  Play,
  Pause,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav";
import { useLanguage } from "@/lib/i18n";
import { useAiTranslate, usePhrases } from "@/hooks/use-ai-translate";
import { HOME_PHRASES } from "@/lib/ui-phrases";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Scan any food label for your allergies" },
      {
        name: "description",
        content:
          "Point your camera at a packaged food label and get an instant green or red light, with the exact ingredient that puts you or your child at risk.",
      },
      {
        property: "og:title",
        content: "PlateGuard AI — Instant allergen label scanner",
      },
      {
        property: "og:description",
        content:
          "Set your allergy and health profile once, then scan any label for a green or red light with a plain-English reason.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

/** English source labels + i18n keys for the top / mobile menu.
 *  Static keys cover ml/hi/ta/ar/es/fr; all other languages use AI translation
 *  via useAiTranslate so the menu never stays stuck in English. */

/** Landing-page copy — English source of truth; translated via AI when language ≠ en. */
function useHomeCopy() {
  const tp = usePhrases(HOME_PHRASES);
  return {
    tasteOfCertainty: tp("The taste of certainty"),
    readingEveryLabel: tp("Reading every label"),
    protectingEveryBite: tp("Protecting every bite"),
    smarterScans: tp("Smarter scans. Safer bites. Every label decoded in plain English, for every aisle in the store."),
    startScanning: tp("Start scanning"),
    setYourProfile: tp("Set your profile"),
    scroll: tp("Scroll"),
    typicalTime: tp("Typical time to a verdict"),
    allergensTracked: tp("Allergens tracked by default"),
    healthConditions: tp("Health conditions supported"),
    ingredientsGuesswork: tp("Ingredients left to guesswork"),
    connectingCopy: tp("Connecting a photo, an ingredient list, and your medical profile through one careful check — making every trip down the snack aisle faster, calmer, and genuinely informed."),
  };
}

const NAV_LINKS = [
  { key: "HowItWorks", label: "How it works", href: "#how-it-works" },
  { key: "UserGuide", label: "User guide", href: "#user-guide" },
  { key: "WhatWeScan", label: "What we scan", href: "#coverage" },
  { key: "Verdicts", label: "Verdicts", href: "#verdicts" },
] as const;

function HomePage() {
  const tp = usePhrases(HOME_PHRASES);
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(!!data.session?.user);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoggedIn(!!session?.user);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Single canonical sign-in surface: send anyone not logged in straight to
  // /login instead of duplicating a second login screen here.
  useEffect(() => {
    if (authReady && !loggedIn) {
      void navigate({ to: "/login" });
    }
  }, [authReady, loggedIn, navigate]);

  if (!authReady || !loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-pulse rounded-full bg-primary/20" />
          <p className="text-sm text-muted-foreground">{tp("Checking your account…")}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <SiteNav />
      <HeroVideo />
      <PhoneScanReveal />
      <HeroWordmark />
      <UserGuideVideo />
      <Coverage />
      <HowItWorks />
      <RecentVerdicts />
      <OneProfile />
      <SiteFooter />
      <div className="md:hidden" style={{ paddingBottom: BOTTOM_NAV_HEIGHT }} />
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

/* ---------------------------------- Nav ---------------------------------- */

function ThemeToggle() {
  const [dark, setDark] = useState(false); // default light

  useEffect(() => {
    const saved = window.localStorage.getItem("plateguard-theme");
    setDark(saved ? saved === "dark" : false);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("plateguard-theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      aria-pressed={dark}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

function SiteNav() {
  const tp = usePhrases(HOME_PHRASES);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { t, language } = useLanguage();

  // English source strings for the menu. Static i18n covers ml/hi/ta/ar/es/fr;
  // every other language is filled in by AI translation so the circled menu
  // items never stay stuck in English.
  const navEnglish = NAV_LINKS.map((l) => l.label);
  const { texts: aiNavLabels } = useAiTranslate(navEnglish);

  const navLinks = NAV_LINKS.map((l, i) => {
    const staticLabel = t(l.key);
    // Prefer static dictionary when it actually differs from English (or when
    // language is English). Otherwise use the AI result.
    const label =
      language === "en" || staticLabel !== l.label ? staticLabel : (aiNavLabels[i] ?? l.label);
    return { ...l, label };
  });

  /** Static dictionary first; fall back to AI phrase pack so every language gets a translation. */
  function navT(key: string, englishFallback: string): string {
    try {
      if (language === "en") return englishFallback;
      const staticLabel = t(key);
      if (staticLabel && staticLabel !== key && staticLabel !== englishFallback) return staticLabel;
      return tp(englishFallback);
    } catch {
      return englishFallback;
    }
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await signOut();
    setLoggedIn(false);
    setMenuOpen(false);
  };

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between rounded-full border border-white/10 bg-background/70 pl-4 pr-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src="/icons/logo.png"
            alt="PlateGuard AI"
            className="size-8 rounded-full object-contain"
          />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            PlateGuard <span className="text-muted-foreground sm:inline">AI</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}

          <Link
            to="/profile"
            className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
          >
            {navT("Profile", "Profile")}
          </Link>

          {loggedIn ? (
            <button
              onClick={logout}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {navT("Logout", "Logout")}
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {navT("Login", "Login")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/scan">
                {navT("StartScanning", "Start scanning")} <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Theme toggle is intentionally available only on the index page. */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            className="flex size-9 items-center justify-center rounded-full text-foreground md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={tp("Toggle menu")}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="animate-rise-in mx-auto mt-2 max-w-5xl rounded-3xl border border-white/10 bg-background/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}

            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
            >
              {navT("Profile", "Profile")}
            </Link>

            {loggedIn ? (
              <button
                onClick={logout}
                className="rounded-lg px-2 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {navT("Logout", "Logout")}
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {navT("Login", "Login")}
              </Link>
            )}
          </nav>

          <Button asChild className="mt-3 w-full justify-center rounded-full">
            <Link to="/scan" onClick={() => setMenuOpen(false)}>
              {navT("StartScanning", "Start scanning")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Hero: video scene ------------------------------ */

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const copy = useHomeCopy();
  const tp = usePhrases(HOME_PHRASES);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section id="top" className="relative flex h-screen min-h-[640px] items-end overflow-hidden">
      <div aria-hidden className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="size-full object-cover"
          src="/media/hero-bg.mp4"
          poster="/media/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-40 sm:pb-28 md:px-8">
        <p className="animate-rise-in text-center text-xs font-semibold uppercase tracking-[0.35em] text-foreground/60 sm:text-left">
          {copy.tasteOfCertainty}
        </p>

        <h1
          className="animate-rise-in mt-4 text-center font-display text-[13vw] font-bold uppercase leading-[0.95] tracking-tight sm:text-left sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {copy.readingEveryLabel}
          <br />
          <span className="text-primary">{copy.protectingEveryBite}</span>
        </h1>
      </div>

      <a
        href="#phone-scan"
        aria-label={tp("Scroll to learn more")}
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-foreground/50"
      >
        <span className="h-10 w-px bg-foreground/30" />
        <span className="text-[10px] uppercase tracking-[0.3em]">{copy.scroll}</span>
      </a>
    </section>
  );
}

/* -------------------- Scroll: phone appears + package scan -------------------- */

/**
 * Phone stays LOCKED in the safe zone between the fixed top nav and bottom nav.
 * Scroll only drives the scan laser / OCR / verdict — the phone does not drift
 * off-screen or fade to blank. When the sticky section ends, the next section
 * (Snack) naturally takes over.
 */
function PhoneScanReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const tp = usePhrases(HOME_PHRASES);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const total = Math.max(1, el.offsetHeight - window.innerHeight);
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        setProgress(scrolled / total);
      });
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Phases — phone is always fully on-screen; only UI inside changes
  // 0.00–0.08  enter (scale up)
  // 0.08–0.72  scan (laser up/down, OCR 0→100)
  // 0.68–0.88  verdict
  // 0.88–1.00  hold verdict until sticky releases into Snack
  const enter = clamp01(progress / 0.08);
  const scanT = clamp01((progress - 0.08) / 0.64);
  const verdictIn = clamp01((progress - 0.68) / 0.16);

  // Laser ping-pongs 3 full cycles (up→down→up…) while scanning
  const cycles = 3;
  const phase = scanT * cycles * Math.PI; // cos goes 1→-1→1 each π
  const laserY = 12 + ((1 - Math.cos(phase)) / 2) * 72; // 12% ↔ 84%
  const scanning = scanT > 0.01 && scanT < 0.99 && verdictIn < 0.6;
  const ocrPct = Math.min(100, Math.round(scanT * 100));

  // Tiny enter only — NEVER translate off-screen, NEVER fade to blank
  const phoneScale = 0.92 + enter * 0.08;
  const phoneOpacity = 0.35 + enter * 0.65; // always at least partly visible once section hits

  return (
    <section
      ref={sectionRef}
      id="phone-scan"
      aria-label={tp("Watch a label get scanned")}
      className="relative h-[240vh] bg-gradient-to-b from-background via-background to-primary/12"
    >
      {/*
        Sticky stage sits UNDER the fixed top nav and ABOVE the bottom nav.
        Phone is sized with max-height so the whole device is always visible.
      */}
      <div
        className="sticky z-10 flex items-center justify-center overflow-hidden px-4"
        style={{
          top: "4.75rem", // clear fixed SiteNav
          height: "calc(100dvh - 4.75rem - 5.25rem)", // clear bottom nav
        }}
      >
        {/* Soft glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: enter * 0.85 }}
        >
          <div className="size-[min(80vw,22rem)] rounded-full bg-primary/25 blur-3xl" />
        </div>

        <div
          className="relative z-10 flex w-full flex-col items-center"
          style={{
            maxWidth: "min(86vw, 17.5rem)",
            opacity: phoneOpacity,
            transform: `scale(${phoneScale})`,
            willChange: "transform, opacity",
          }}
        >
          {/* Phone chrome */}
          <div
            className="relative w-full overflow-hidden rounded-[2.15rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.5)]"
            style={{ maxHeight: "min(58dvh, 26rem)" }}
          >
            {/* Notch */}
            <div className="absolute left-1/2 top-1.5 z-30 h-3.5 w-[4.5rem] -translate-x-1/2 rounded-full bg-black" />

            {/* Screen — fill phone; height capped by parent maxHeight */}
            <div
              className="relative w-full overflow-hidden bg-zinc-950"
              style={{
                aspectRatio: "9 / 16",
                maxHeight: "min(58dvh, 26rem)",
              }}
            >
              <img
                src="/media/snack-package.jpg"
                alt="Snack package nutrition and ingredients label"
                className="absolute inset-0 size-full object-cover object-center"
                style={{ opacity: 0.55 + enter * 0.45 }}
                draggable={false}
              />

              {/* Light vignette only — keep label readable */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
              />

              {/* Bright green laser */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-20"
                style={{
                  top: `${laserY}%`,
                  opacity: scanning ? 1 : 0,
                  height: 4,
                  background:
                    "linear-gradient(90deg, transparent 5%, #4ade80 25%, #bbf7d0 50%, #4ade80 75%, transparent 95%)",
                  boxShadow:
                    "0 0 8px 2px rgba(74,222,128,0.95), 0 0 24px 10px rgba(74,222,128,0.55), 0 0 48px 16px rgba(74,222,128,0.25)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-4 z-10"
                style={{
                  top: `calc(${laserY}% - 22px)`,
                  height: 44,
                  opacity: scanning ? 0.55 : 0,
                  background:
                    "radial-gradient(ellipse at center, rgba(74,222,128,0.5), transparent 70%)",
                }}
              />

              {/* Corner brackets */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-4 z-20"
                style={{ opacity: enter * (1 - verdictIn * 0.45) }}
              >
                <span className="absolute left-0 top-0 h-6 w-6 border-l-[2.5px] border-t-[2.5px] border-primary" />
                <span className="absolute right-0 top-0 h-6 w-6 border-r-[2.5px] border-t-[2.5px] border-primary" />
                <span className="absolute bottom-0 left-0 h-6 w-6 border-b-[2.5px] border-l-[2.5px] border-primary" />
                <span className="absolute bottom-0 right-0 h-6 w-6 border-b-[2.5px] border-r-[2.5px] border-primary" />
              </div>

              {/* Status */}
              <div
                className="absolute left-1/2 top-7 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md"
                style={{ opacity: enter }}
              >
                <ScanLine className="size-3 text-primary" />
                {verdictIn > 0.45 ? tp("Scan complete") : tp("Scanning label…")}
              </div>

              {/* OCR bar */}
              <div
                className="absolute bottom-[4.25rem] left-4 right-4 z-30"
                style={{ opacity: enter * (1 - verdictIn) }}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
                  <span>{tp("Ingredients OCR")}</span>
                  <span>{ocrPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${ocrPct}%` }}
                  />
                </div>
              </div>

              {/* SAFE verdict */}
              <div
                className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-safe px-4 py-2.5 shadow-xl"
                style={{
                  opacity: verdictIn,
                  transform: `translate(-50%, ${(1 - verdictIn) * 14}px) scale(${0.94 + verdictIn * 0.06})`,
                }}
              >
                <CheckCircle2 className="size-5 shrink-0 text-safe-foreground" />
                <div className="text-left leading-tight">
                  <p className="text-sm font-bold text-safe-foreground">{tp("SAFE")}</p>
                  <p className="text-[11px] text-safe-foreground/90">
                    {tp("No allergens matched")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p
            className="mt-3 max-w-[15rem] text-center text-xs text-muted-foreground sm:text-sm"
            style={{ opacity: enter }}
          >
            {verdictIn > 0.4
              ? tp("Clear verdict in seconds")
              : scanT > 0.15
                ? tp("Reading every ingredient against your profile")
                : tp("Point at any packaged label")}
          </p>
        </div>
      </div>
    </section>
  );
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/* --------------------------- Hero: giant wordmark scene --------------------------- */

function HeroWordmark() {
  const copy = useHomeCopy();
  return (
    <section
      id="wordmark"
      className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-background"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-20 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:pt-28">
        <div className="animate-rise-in">
          <h2 className="flex items-center font-mascot text-[18vw] font-extrabold leading-none tracking-tight text-primary sm:text-8xl md:text-8xl lg:text-9xl">
            Snack ⛶
          </h2>

          <p className="mt-3 max-w-md text-base text-muted-foreground sm:text-lg">
            {copy.smarterScans}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-14 rounded-full px-7 text-base">
              <Link to="/scan">
                <Camera className="size-5" />
                {copy.startScanning}
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-2 px-7 text-base"
            >
              <Link to="/profile">{copy.setYourProfile}</Link>
            </Button>
          </div>
        </div>

        <div
          className="animate-rise-in relative mx-auto aspect-square w-full max-w-[320px]"
          style={{ animationDelay: "100ms" }}
        >
          <div className="animate-float-soft absolute inset-0 overflow-hidden rounded-[3rem] border-4 border-background shadow-2xl">
            <img
              src="/media/snack-package.jpg"
              alt="Scanned snack package label"
              className="size-full object-cover object-center"
            />
          </div>

          <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-safe px-4 py-2.5 shadow-xl">
            <CheckCircle2 className="size-4 text-safe-foreground" />
            <span className="text-sm font-bold text-safe-foreground">SAFE</span>
          </div>
        </div>
      </div>

      <ConnectingCopy />

      <StatsStrip />
    </section>
  );
}

function ConnectingCopy() {
  const copy = useHomeCopy();
  return (
    <p className="mx-auto max-w-3xl px-5 pb-16 text-center text-sm text-muted-foreground sm:text-base md:px-8">
      {copy.connectingCopy}
    </p>
  );
}

function StatsStrip() {
  const copy = useHomeCopy();
  const stats = [
    { value: "15–30s", label: copy.typicalTime },
    { value: "10", label: copy.allergensTracked },
    { value: "8", label: copy.healthConditions },
    { value: "0", label: copy.ingredientsGuesswork },
  ];
  return (
    <div className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4 md:px-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="animate-rise-in text-center md:text-left"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ User guide video ------------------------------ */

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function UserGuideVideo() {
  const tp = usePhrases(HOME_PHRASES);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const wasPlayingBeforeScrub = useRef(false);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  function setPlaybackSpeed(rate: number) {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setSpeed(rate);
    setSpeedMenuOpen(false);
  }

  function ratioFromPointer(clientX: number): number {
    const el = scrubberRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  // While dragging we only move the visual bar/time label — we do NOT touch
  // video.currentTime on every pointermove. Setting currentTime dozens of
  // times a second (once per drag frame) is what was causing the seek to
  // snap back to 0:00: rapid repeated seeks on a not-fully-buffered video
  // race each other, and the browser can end up resolving to an earlier
  // (sometimes the very first, i.e. 0:00) pending seek. Only committing the
  // seek once, on release, avoids that entirely.
  const lastRatio = useRef(0);

  function previewTo(ratio: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    lastRatio.current = ratio;
    setProgress(ratio * 100);
    setCurrentTime(ratio * video.duration);
  }

  function commitSeek() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.currentTime = lastRatio.current * video.duration;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video) return;
    wasPlayingBeforeScrub.current = !video.paused;
    video.pause();
    setScrubbing(true);
    scrubberRef.current?.setPointerCapture(e.pointerId);
    previewTo(ratioFromPointer(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbing) return;
    previewTo(ratioFromPointer(e.clientX));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbing) return;
    setScrubbing(false);
    scrubberRef.current?.releasePointerCapture(e.pointerId);
    commitSeek();
    if (wasPlayingBeforeScrub.current) void videoRef.current?.play();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (e.key === "ArrowRight") {
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      video.currentTime = Math.max(0, video.currentTime - 5);
      e.preventDefault();
    }
  }

  return (
    <section id="user-guide" className="bg-background py-24">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          See it in action
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          A 4-minute walkthrough of the whole app
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          From setting up your profile to reading a verdict — watch at your own pace, pause
          anywhere, or speed through the parts you already know.
        </p>

        <div className="group relative mx-auto mt-10 max-w-sm overflow-hidden rounded-3xl border border-border bg-black shadow-xl">
          <video
            ref={videoRef}
            className="aspect-[480/1016] w-full bg-black object-cover"
            src="/media/user-guide.mp4"
            poster="/media/user-guide-poster.jpg"
            preload="auto"
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={togglePlay}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onTimeUpdate={(e) => {
              if (scrubbing) return; // avoid fighting the drag position
              const v = e.currentTarget;
              setCurrentTime(v.currentTime);
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
          />

          {/* Center play button — shown when paused, tap anywhere on the video also toggles */}
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={tp("Play video")}
              className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105">
                <Play className="size-7 translate-x-0.5" fill="currentColor" />
              </span>
            </button>
          )}

          {/* Controls bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8">
            <div
              ref={scrubberRef}
              className="group/scrub relative mb-1 flex h-4 w-full cursor-pointer items-center touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="slider"
              aria-label="Seek — drag, click, or use arrow keys to jump to any point in the video"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            >
              <div className="h-1.5 w-full rounded-full bg-white/25">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <div
                className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow transition-transform ${
                  scrubbing ? "scale-125" : "scale-100 group-hover/scrub:scale-110"
                }`}
                style={{ left: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
                >
                  {playing ? (
                    <Pause className="size-4" fill="currentColor" />
                  ) : (
                    <Play className="size-4 translate-x-0.5" fill="currentColor" />
                  )}
                </button>
                <span className="font-mono text-[11px] tabular-nums text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSpeedMenuOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                  aria-label={tp("Playback speed")}
                >
                  <Gauge className="size-3.5" />
                  {speed}×
                </button>
                {speedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/90 py-1 shadow-lg backdrop-blur">
                    {PLAYBACK_SPEEDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPlaybackSpeed(s)}
                        className={`block w-full whitespace-nowrap px-4 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/10 ${
                          s === speed ? "text-primary" : "text-white"
                        }`}
                      >
                        {s}× {s === 1 ? "(normal)" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Coverage -------------------------------- */

const CATEGORIES = [
  { label: "Chips & crisps", Icon: Popcorn },
  { label: "Cookies & biscuits", Icon: Cookie },
  { label: "Bakery & pastries", Icon: Croissant },
  { label: "Dairy & yoghurt", Icon: Milk },
  { label: "Drinks & coffee", Icon: Coffee },
  { label: "Candy & sweets", Icon: Candy },
];

function Coverage() {
  const { t } = useLanguage();
  const tp = usePhrases(HOME_PHRASES);
  return (
    <section
      id="coverage"
      className="relative overflow-hidden bg-[oklch(0.12_0.02_255)] py-24 text-white"
    >
      <p
        aria-hidden
        className="wordmark-outline pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[16vw] font-bold uppercase leading-none text-white/20 sm:text-[9rem]"
      >
        Every Aisle
      </p>

      <div className="relative mx-auto max-w-6xl px-5 pt-24 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {t("WhatWeScan")}
        </p>

        <h2 className="mt-3 max-w-lg font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One camera, every packaged category
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <div
              key={c.label}
              className="animate-rise-in group rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/50 hover:bg-white/10"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <c.Icon className="size-6" />
              </div>
              <p className="mt-4 text-sm font-semibold sm:text-base">{tp(c.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ How it works ------------------------------ */

const STEPS = [
  {
    n: "01",
    title: "Set your profile",
    body: "Add your allergies, medical conditions, or things you're just avoiding. Takes under a minute.",
    Icon: SlidersHorizontal,
  },
  {
    n: "02",
    title: "Scan any label",
    body: "Fill the frame with the ingredients panel. No barcode needed — just the printed text on the pack.",
    Icon: ScanLine,
  },
  {
    n: "03",
    title: "Get a plain verdict",
    body: "Safe, caution, or do-not-eat — with the exact ingredient responsible.",
    Icon: ShieldCheck,
  },
];

function HowItWorks() {
  const { t } = useLanguage();
  const tp = usePhrases(HOME_PHRASES);
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {t("HowItWorks")}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {tp("Three steps between you and a safe snack")}
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="animate-rise-in group relative rounded-3xl border border-border bg-card/60 p-7 transition-colors hover:border-primary/40"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="font-display text-sm font-bold text-muted-foreground/50">{s.n}</span>
            <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <s.Icon className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{tp(s.title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tp(s.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ Recent verdicts ------------------------------ */

const VERDICTS = [
  {
    tag: "Danger",
    tone: "danger" as const,
    title: "Choco wafer bar flagged for hidden peanut oil",
    detail: 'Listed as "groundnut oil" — a peanut derivative most labels don\'t spell out.',
    Icon: ShieldAlert,
  },
  {
    tag: "Caution",
    tone: "caution" as const,
    title: "Instant noodles came back at 42% daily sodium",
    detail: "Within range for most people — flagged for anyone managing hypertension.",
    Icon: AlertTriangle,
  },
  {
    tag: "Safe",
    tone: "safe" as const,
    title: "Rice crackers cleared with no listed allergens",
    detail: "Matched cleanly against a peanut and gluten profile in about 15–30 seconds.",
    Icon: CheckCircle2,
  },
];

function RecentVerdicts() {
  const tp = usePhrases(HOME_PHRASES);
  return (
    <section id="verdicts" className="bg-card/40 py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{tp("Real scans")}</p>

        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          What a verdict actually looks like
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VERDICTS.map((v, i) => (
            <div
              key={v.title}
              className="animate-rise-in flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div
                className={`flex h-32 items-center justify-center ${
                  v.tone === "safe"
                    ? "bg-safe/15"
                    : v.tone === "caution"
                      ? "bg-caution/15"
                      : "bg-danger/15"
                }`}
              >
                <v.Icon
                  className={`size-10 ${
                    v.tone === "safe"
                      ? "text-safe"
                      : v.tone === "caution"
                        ? "text-caution"
                        : "text-danger"
                  }`}
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    v.tone === "safe"
                      ? "bg-safe/15 text-safe"
                      : v.tone === "caution"
                        ? "bg-caution/15 text-caution"
                        : "bg-danger/15 text-danger"
                  }`}
                >
                  {tp(v.tag)}
                </span>

                <h3 className="mt-3 text-base font-semibold leading-snug">{tp(v.title)}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{tp(v.detail)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link to="/scan">
              {tp("Try your own scan")} <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ One profile ------------------------------ */

const PROFILE_FEATURES = [
  { label: "Allergy match", body: "Checked against your exact list", Icon: ShieldCheck },
  { label: "Condition check", body: "Sodium, sugar, gluten and more", Icon: ListChecks },
  { label: "Multi-label OCR", body: "Reads dense, small-print panels", Icon: ScanLine },
  { label: "Clear verdict", body: "Green, caution, or red — typically ready in 15–30 seconds", Icon: Sparkles },
  { label: "Private by design", body: "Your profile stays protected", Icon: Lock },
  { label: "Scan memory", body: "Revisit what you've already checked", Icon: History },
];

function OneProfile() {
  const tp = usePhrases(HOME_PHRASES);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="bg-[oklch(0.12_0.02_255)] py-24 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-8">
        <div className="animate-rise-in relative mx-auto w-full max-w-[240px]">
          <div className="animate-float-soft relative overflow-hidden rounded-[2.25rem] border-[6px] border-white/10 bg-black shadow-2xl">
            <div className="relative aspect-[9/19.5] w-full overflow-hidden">
              <video
                ref={videoRef}
                className="size-full object-cover"
                src="/media/hero-bg.mp4"
                poster="/media/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="animate-scanline pointer-events-none absolute inset-x-0 h-0.5 bg-primary/80 shadow-[0_0_20px_3px_var(--primary)]" />
            </div>
            <div className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
          </div>
        </div>

        <div className="animate-rise-in" style={{ animationDelay: "80ms" }}>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One profile.
            <br />
            <span className="text-primary">{tp("Every aisle, covered.")}</span>
          </h2>

          <p className="mt-4 max-w-lg text-white/70">
            {tp("Your allergies and conditions are saved to your account and checked automatically on every scan.")}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {PROFILE_FEATURES.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <f.Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{tp(f.label)}</p>
                <p className="mt-1 text-xs text-white/60">{tp(f.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Footer --------------------------------- */

function SiteFooter() {
  const { t, language } = useLanguage();
  const tp = usePhrases(HOME_PHRASES);
  function footerT(key: string, english: string): string {
    try {
      if (language === "en") return english;
      const s = t(key);
      if (s && s !== key && s !== english) return s;
      return tp(english);
    } catch {
      return english;
    }
  }
  return (
    <footer className="relative overflow-hidden bg-brand-amber text-brand-amber-foreground">
      <p
        aria-hidden
        className="wordmark-outline pointer-events-none -mb-6 select-none whitespace-nowrap px-5 pt-10 text-center font-display text-[15vw] font-bold uppercase leading-none sm:text-[8rem] md:px-8"
      >
        PlateGuard
      </p>

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/icons/logo.png"
                alt="PlateGuard AI"
                className="size-7 rounded-full object-contain"
              />
              <span className="font-display text-lg font-bold">PlateGuard AI</span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-amber-foreground/80">
              A camera, a profile, and a plain answer — built for the ten seconds before you decide
              to eat something.
            </p>

            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <span
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full bg-brand-amber-foreground/10"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div className="space-y-2.5 text-sm">
              <Link to="/" className="block font-semibold hover:underline">
                {footerT("Home", "Home")}
              </Link>
              <Link to="/scan" className="block hover:underline">
                {footerT("Scan", "Scan")}
              </Link>
              <a href="#how-it-works" className="block hover:underline">
                {footerT("HowItWorks", "How it works")}
              </a>
              <a href="#coverage" className="block hover:underline">
                {footerT("WhatWeScan", "What we scan")}
              </a>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="font-semibold">{tp("Account")}</p>
              <Link to="/profile" className="block hover:underline">
                {footerT("Profile", "Profile")}
              </Link>
              <Link to="/login" className="block hover:underline">
                {footerT("Login", "Login")}
              </Link>
              <a href="#verdicts" className="block hover:underline">
                {footerT("Verdicts", "Verdicts")}
              </a>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="font-semibold">{tp("Languages supported")}</p>
              <p className="flex items-center gap-1.5 text-brand-amber-foreground/80">
                <Languages className="size-3.5" /> {tp("Auto-detected on scan")}
              </p>
              <p className="text-brand-amber-foreground/80">
                {tp("PlateGuard assists, it doesn't replace the printed label or medical advice.")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-brand-amber-foreground/15 pt-6 text-xs text-brand-amber-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PlateGuard AI. Not a substitute for medical advice.</p>
          <p>{tp("When in doubt, don't eat it.")}</p>
        </div>
      </div>
    </footer>
  );
}
