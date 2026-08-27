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

function useHomeCopy() {
  const tp = usePhrases(HOME_PHRASES);

  return {
    tasteOfCertainty: tp("The taste of certainty"),
    readingEveryLabel: tp("Reading every label"),
    protectingEveryBite: tp("Protecting every bite"),
    smarterScans: tp(
      "Smarter scans. Safer bites. Every label decoded in plain English, for every aisle in the store.",
    ),
    startScanning: tp("Start scanning"),
    setYourProfile: tp("Set your profile"),
    scroll: tp("Scroll"),
    typicalTime: tp("Typical time to a verdict"),
    allergensTracked: tp("Allergens tracked by default"),
    healthConditions: tp("Health conditions supported"),
    ingredientsGuesswork: tp("Ingredients left to guesswork"),
    connectingCopy: tp(
      "Connecting a photo, an ingredient list, and your medical profile through one careful check — making every trip down the snack aisle faster, calmer, and genuinely informed.",
    ),
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

function ThemeToggle() {
  const [dark, setDark] = useState(false);

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

  const navEnglish = NAV_LINKS.map((link) => link.label);
  const { texts: aiNavLabels } = useAiTranslate(navEnglish);

  const navLinks = NAV_LINKS.map((link, index) => {
    const staticLabel = t(link.key);

    const label =
      language === "en" || staticLabel !== link.label
        ? staticLabel
        : (aiNavLabels[index] ?? link.label);

    return {
      ...link,
      label,
    };
  });

  function navT(key: string, englishFallback: string): string {
    try {
      if (language === "en") return englishFallback;

      const staticLabel = t(key);

      if (staticLabel && staticLabel !== key && staticLabel !== englishFallback) {
        return staticLabel;
      }

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

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {link.label}
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
                {navT("StartScanning", "Start scanning")}
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          <ThemeToggle />

          <button
            className="flex size-9 items-center justify-center rounded-full text-foreground md:hidden"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label={tp("Toggle menu")}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="animate-rise-in mx-auto mt-2 max-w-5xl rounded-3xl border border-white/10 bg-background/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {link.label}
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

function PhoneScanReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const tp = usePhrases(HOME_PHRASES);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    let frame = 0;

    const updateProgress = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const total = Math.max(1, element.offsetHeight - window.innerHeight);
        const distance = Math.min(Math.max(-rect.top, 0), total);

        setProgress(distance / total);
      });
    };

    updateProgress();

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const enter = ease(clamp01(progress / 0.12));
  const exit = ease(clamp01((progress - 0.9) / 0.1));
  const sceneOpacity = enter * (1 - exit);

  const scanT = ease(clamp01((progress - 0.16) / 0.52));
  const verdictIn = ease(clamp01((progress - 0.72) / 0.12));

  const introOut = ease(clamp01((progress - 0.08) / 0.12));
  const scanOut = ease(clamp01((progress - 0.64) / 0.1));

  const introOpacity = 1 - introOut;
  const scannerOpacity = introOut * (1 - scanOut);
  const resultOpacity = scanOut;
  const resultLift = (1 - verdictIn) * 8;

  const cycles = 4;
  const phase = scanT * cycles * Math.PI;
  const laserY = 12 + ((1 - Math.cos(phase)) / 2) * 72;

  const ocrPct = Math.min(100, Math.round(scanT * 100));
  const phoneScale = 0.94 + enter * 0.06;
  const phoneOpacity = sceneOpacity;

  return (
    <section
      ref={sectionRef}
      id="phone-scan"
      aria-label={tp("Watch a label get scanned")}
      className="relative h-[360vh] bg-gradient-to-b from-background via-background via-primary/8 to-primary/14"
    >
      <div
        className={`${
          progress > 0 && progress < 1 ? "fixed inset-x-0" : "sticky"
        } z-10 flex items-center justify-center overflow-visible px-4`}
        style={{
          top: "4.75rem",
          height: "calc(100dvh - 4.75rem - 5.25rem)",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 text-center"
          style={{ opacity: sceneOpacity }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
            {tp("Live label scan")}
          </p>

          <div className="relative mt-1 h-4 min-w-[12rem] text-xs text-muted-foreground">
            <span className="absolute inset-x-0" style={{ opacity: introOpacity }}>
              {tp("Align the label")}
            </span>

            <span className="absolute inset-x-0" style={{ opacity: scannerOpacity }}>
              {tp("Reading ingredients")}
            </span>

            <span className="absolute inset-x-0" style={{ opacity: resultOpacity }}>
              {tp("Result ready")}
            </span>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            opacity: sceneOpacity * (0.45 + scannerOpacity * 0.55),
          }}
        >
          <div
            className="size-[min(92vw,31rem)] rounded-full bg-primary/30 blur-3xl"
            style={{
              transform: `scale(${0.8 + scannerOpacity * 0.32})`,
            }}
          />
        </div>

        <div
          className="relative z-10 flex w-full flex-col items-center"
          style={{
            maxWidth: "min(82vw, 16rem)",
            opacity: phoneOpacity,
            transform: `translateY(2.5rem) scale(${phoneScale})`,
            willChange: "transform, opacity",
          }}
        >
          <div className="relative w-full overflow-hidden rounded-[2.15rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.5)]">
            <div className="absolute left-1/2 top-1.5 z-30 h-3.5 w-[4.5rem] -translate-x-1/2 rounded-full bg-black" />

            <div
              className="relative w-full overflow-hidden bg-zinc-950"
              style={{
                aspectRatio: "9 / 19.5",
                maxHeight: "min(67dvh, 34rem)",
              }}
            >
              <img
                src="/media/snack-package.jpg"
                alt="Snack package nutrition and ingredients label"
                className="absolute inset-0 size-full object-cover object-center"
                style={{
                  opacity: 0.52 + enter * 0.48,
                  transform: `scale(${1.04 - verdictIn * 0.04})`,
                }}
                draggable={false}
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1] bg-emerald-400/20 mix-blend-screen"
                style={{ opacity: scannerOpacity * 0.55 }}
              />

              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-20"
                style={{
                  top: `${laserY}%`,
                  opacity: scannerOpacity,
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
                  opacity: scannerOpacity * 0.55,
                  background:
                    "radial-gradient(ellipse at center, rgba(74,222,128,0.5), transparent 70%)",
                }}
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-4 z-20"
                style={{
                  opacity: sceneOpacity * (1 - resultOpacity),
                }}
              >
                <span className="absolute left-0 top-0 h-6 w-6 border-l-[2.5px] border-t-[2.5px] border-primary" />
                <span className="absolute right-0 top-0 h-6 w-6 border-r-[2.5px] border-t-[2.5px] border-primary" />
                <span className="absolute bottom-0 left-0 h-6 w-6 border-b-[2.5px] border-l-[2.5px] border-primary" />
                <span className="absolute bottom-0 right-0 h-6 w-6 border-b-[2.5px] border-r-[2.5px] border-primary" />
              </div>

              <div
                className="absolute left-1/2 top-7 z-30 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md"
                style={{ opacity: sceneOpacity }}
              >
                <ScanLine className="size-3 shrink-0 text-primary" />

                <span className="relative h-4 min-w-[7.25rem] leading-4">
                  <span className="absolute inset-x-0" style={{ opacity: 1 - resultOpacity }}>
                    {tp("Scanning label…")}
                  </span>

                  <span className="absolute inset-x-0" style={{ opacity: resultOpacity }}>
                    {tp("Analysis complete")}
                  </span>
                </span>
              </div>

              <div
                className="absolute bottom-[4.25rem] left-4 right-4 z-30"
                style={{
                  opacity: sceneOpacity * (1 - resultOpacity),
                }}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
                  <span>{tp("Ingredients OCR")}</span>
                  <span>{ocrPct}%</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${ocrPct}%` }} />
                </div>
              </div>

              <div
                className="absolute inset-x-3 bottom-3 z-30 overflow-hidden rounded-2xl bg-card/95 p-3 shadow-2xl backdrop-blur-xl"
                style={{
                  opacity: verdictIn,
                  transform: `translateY(${resultLift}px) scale(${0.985 + verdictIn * 0.015})`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-safe">
                    <CheckCircle2 className="size-4 text-safe-foreground" />
                  </div>

                  <div className="min-w-0 text-left leading-tight">
                    <p className="text-sm font-bold text-foreground">{tp("SAFE TO EAT")}</p>

                    <p className="text-[10px] text-muted-foreground">
                      {tp("No allergens matched your profile")}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2 text-[10px] font-medium">
                  <span className="text-muted-foreground">{tp("Ingredient check")}</span>

                  <span className="text-primary">{tp("All clear")}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative mx-auto mt-3 h-10 w-full max-w-[12rem] text-center text-xs leading-5 text-muted-foreground sm:text-sm"
            style={{ opacity: enter }}
          >
            <span className="absolute inset-x-0" style={{ opacity: introOpacity }}>
              {tp("Bring the label into view")}
            </span>

            <span className="absolute inset-x-0" style={{ opacity: scannerOpacity }}>
              {tp("Hold steady — checking every ingredient")}
            </span>

            <span className="absolute inset-x-0" style={{ opacity: resultOpacity }}>
              {tp("Your clear answer, ready when you are")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function ease(value: number) {
  return value * value * (3 - 2 * value);
}

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
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-rise-in text-center md:text-left"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{stat.value}</p>

            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function UserGuideVideo() {
  const tp = usePhrases(HOME_PHRASES);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const wasPlayingBeforeScrub = useRef(false);
  const lastRatio = useRef(0);

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

    if (video) {
      video.playbackRate = rate;
    }

    setSpeed(rate);
    setSpeedMenuOpen(false);
  }

  function ratioFromPointer(clientX: number): number {
    const element = scrubberRef.current;
    if (!element) return 0;

    const rect = element.getBoundingClientRect();

    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

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

    if (wasPlayingBeforeScrub.current) {
      void videoRef.current?.play();
    }
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
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onTimeUpdate={(event) => {
              if (scrubbing) return;

              const video = event.currentTarget;

              setCurrentTime(video.currentTime);

              if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
              }
            }}
          />

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
                  onClick={() => setSpeedMenuOpen((value) => !value)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                  aria-label={tp("Playback speed")}
                >
                  <Gauge className="size-3.5" />
                  {speed}×
                </button>

                {speedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/90 py-1 shadow-lg backdrop-blur">
                    {PLAYBACK_SPEEDS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPlaybackSpeed(value)}
                        className={`block w-full whitespace-nowrap px-4 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/10 ${
                          value === speed ? "text-primary" : "text-white"
                        }`}
                      >
                        {value}× {value === 1 ? "(normal)" : ""}
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
          {CATEGORIES.map((category, index) => (
            <div
              key={category.label}
              className="animate-rise-in group rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/50 hover:bg-white/10"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <category.Icon className="size-6" />
              </div>

              <p className="mt-4 text-sm font-semibold sm:text-base">{tp(category.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
        {STEPS.map((step, index) => (
          <div
            key={step.n}
            className="animate-rise-in group relative rounded-3xl border border-border bg-card/60 p-7 transition-colors hover:border-primary/40"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="font-display text-sm font-bold text-muted-foreground/50">
              {step.n}
            </span>

            <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <step.Icon className="size-5" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">{tp(step.title)}</h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tp(step.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {tp("Real scans")}
        </p>

        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          What a verdict actually looks like
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VERDICTS.map((verdict, index) => (
            <div
              key={verdict.title}
              className="animate-rise-in flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div
                className={`flex h-32 items-center justify-center ${
                  verdict.tone === "safe"
                    ? "bg-safe/15"
                    : verdict.tone === "caution"
                      ? "bg-caution/15"
                      : "bg-danger/15"
                }`}
              >
                <verdict.Icon
                  className={`size-10 ${
                    verdict.tone === "safe"
                      ? "text-safe"
                      : verdict.tone === "caution"
                        ? "text-caution"
                        : "text-danger"
                  }`}
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    verdict.tone === "safe"
                      ? "bg-safe/15 text-safe"
                      : verdict.tone === "caution"
                        ? "bg-caution/15 text-caution"
                        : "bg-danger/15 text-danger"
                  }`}
                >
                  {tp(verdict.tag)}
                </span>

                <h3 className="mt-3 text-base font-semibold leading-snug">{tp(verdict.title)}</h3>

                <p className="mt-2 flex-1 text-sm text-muted-foreground">{tp(verdict.detail)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link to="/scan">
              {tp("Try your own scan")}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const PROFILE_FEATURES = [
  {
    label: "Allergy match",
    body: "Checked against your exact list",
    Icon: ShieldCheck,
  },
  {
    label: "Condition check",
    body: "Sodium, sugar, gluten and more",
    Icon: ListChecks,
  },
  {
    label: "Multi-label OCR",
    body: "Reads dense, small-print panels",
    Icon: ScanLine,
  },
  {
    label: "Clear verdict",
    body: "Green, caution, or red — typically ready in 15–30 seconds",
    Icon: Sparkles,
  },
  {
    label: "Private by design",
    body: "Your profile stays protected",
    Icon: Lock,
  },
  {
    label: "Scan memory",
    body: "Revisit what you've already checked",
    Icon: History,
  },
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
            {tp(
              "Your allergies and conditions are saved to your account and checked automatically on every scan.",
            )}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {PROFILE_FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <feature.Icon className="size-5 text-primary" />

                <p className="mt-3 text-sm font-semibold">{tp(feature.label)}</p>

                <p className="mt-1 text-xs text-white/60">{tp(feature.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const { t, language } = useLanguage();
  const tp = usePhrases(HOME_PHRASES);

  function footerT(key: string, english: string): string {
    try {
      if (language === "en") return english;

      const translated = t(key);

      if (translated && translated !== key && translated !== english) {
        return translated;
      }

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
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                <span
                  key={index}
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
                <Languages className="size-3.5" />
                {tp("Auto-detected on scan")}
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
