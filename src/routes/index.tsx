import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Candy,
  ChevronDown,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlateGuard AI — Scan any food label for your allergies" },
      {
        name: "description",
        content:
          "Point your camera at a packaged food label and get an instant green or red light, with the exact ingredient that puts you or your child at risk.",
      },
      { property: "og:title", content: "PlateGuard AI — Instant allergen label scanner" },
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

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "What we scan", href: "#coverage" },
  { label: "Verdicts", href: "#verdicts" },
  { label: "Safety", href: "#safety" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <HeroVideo />
      <HeroWordmark />
      <Coverage />
      <HowItWorks />
      <RecentVerdicts />
      <SnackCarousel />
      <SafetyProcess />
      <OneProfile />
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------- Nav ---------------------------------- */

function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          {NAV_LINKS.map((l) => (
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
            Profile
          </Link>
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/scan">
              Start Scanning <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        <button
          className="flex size-9 items-center justify-center rounded-full text-foreground md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {menuOpen && (
        <div className="animate-rise-in mx-auto mt-2 max-w-5xl rounded-3xl border border-white/10 bg-background/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              Profile
            </Link>
          </nav>
          <Button asChild className="mt-3 w-full justify-center rounded-full">
            <Link to="/scan">Start Scanning</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Hero: video scene ------------------------------ */

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
          The taste of certainty
        </p>
        <h1
          className="animate-rise-in mt-4 text-center font-display text-[13vw] font-bold uppercase leading-[0.95] tracking-tight sm:text-left sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Reading every label
          <br />
          <span className="text-primary">Protecting every bite</span>
        </h1>
      </div>

      <a
        href="#wordmark"
        aria-label="Scroll to learn more"
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-foreground/50"
      >
        <span className="h-10 w-px bg-foreground/30" />
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
      </a>
    </section>
  );
}

/* --------------------------- Hero: giant wordmark scene --------------------------- */

function HeroWordmark() {
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
            Smarter scans. Safer bites. Every label decoded in plain English, for every aisle in the
            store.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-14 rounded-full px-7 text-base">
              <Link to="/scan">
                <Camera className="size-5" />
                Start scanning
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-2 px-7 text-base"
            >
              <Link to="/profile">Set your profile</Link>
            </Button>
          </div>
        </div>

        <div
          className="animate-rise-in relative mx-auto aspect-square w-full max-w-[320px]"
          style={{ animationDelay: "100ms" }}
        >
          <div className="animate-float-soft absolute inset-0 overflow-hidden rounded-[3rem] border-4 border-background shadow-2xl">
            <img
              src="/media/hero-poster.jpg"
              alt="A bowl of scanned snacks"
              className="size-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-safe px-4 py-2.5 shadow-xl">
            <CheckCircle2 className="size-4 text-safe-foreground" />
            <span className="text-sm font-bold text-safe-foreground">SAFE</span>
          </div>
        </div>
      </div>

      <p className="mx-auto max-w-3xl px-5 pb-16 text-center text-sm text-muted-foreground sm:text-base md:px-8">
        Connecting a photo, an ingredient list, and your medical profile through one instant check —
        making every trip down the snack aisle faster, calmer, and genuinely informed.
      </p>

      <StatsStrip />
    </section>
  );
}

const STATS = [
  { value: "<1 sec", label: "Average time to a verdict" },
  { value: "10", label: "Allergens tracked by default" },
  { value: "8", label: "Health conditions supported" },
  { value: "0", label: "Ingredients left to guesswork" },
];

function StatsStrip() {
  return (
    <div className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4 md:px-8">
        {STATS.map((s, i) => (
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

/* -------------------------------- Coverage (dark) -------------------------------- */

const CATEGORIES = [
  { label: "Chips & crisps", Icon: Popcorn },
  { label: "Cookies & biscuits", Icon: Cookie },
  { label: "Bakery & pastries", Icon: Croissant },
  { label: "Dairy & yoghurt", Icon: Milk },
  { label: "Drinks & coffee", Icon: Coffee },
  { label: "Candy & sweets", Icon: Candy },
];

function Coverage() {
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
          What we scan
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
              <p className="mt-4 text-sm font-semibold sm:text-base">{c.label}</p>
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
    body: "Add your allergies, medical conditions, or things you're just avoiding. Takes under a minute, and it stays on your device.",
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
    body: "Safe, caution, or do-not-eat — with the exact ingredient responsible, in language you don't have to decode.",
    Icon: ShieldCheck,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          How it works
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps between you and a safe snack
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
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ Recent verdicts (light) ------------------------------ */

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
    detail: "Matched cleanly against a peanut and gluten profile in under a second.",
    Icon: CheckCircle2,
  },
];

function RecentVerdicts() {
  return (
    <section id="verdicts" className="bg-card/40 py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Real scans</p>
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
                  {v.tag}
                </span>
                <h3 className="mt-3 text-base font-semibold leading-snug">{v.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{v.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link to="/scan">
              Try your own scan <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Snack carousel (light green) ------------------------------ */

const SNACKS = [
  { label: "Peanut butter granola", Icon: Cookie },
  { label: "Salted potato chips", Icon: Popcorn },
  { label: "Sesame breadsticks", Icon: Croissant },
  { label: "Flavoured yoghurt cup", Icon: Milk },
  { label: "Bottled cold brew", Icon: Coffee },
  { label: "Gummy fruit candy", Icon: Candy },
];

function SnackCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);

  function goTo(next: number) {
    const wrapped = (next + SNACKS.length) % SNACKS.length;
    setIndex(wrapped);
    cardRefs.current[wrapped]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  return (
    <section className="bg-gradient-to-b from-safe/10 via-safe/15 to-safe/10 py-24">
      <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
        <h2 className="font-mascot text-3xl font-bold tracking-tight sm:text-4xl">
          Snacks we catch <span className="text-primary">every day</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          A rotating look at the everyday packaged foods people scan most — and the hidden
          ingredients that most often trip a warning.
        </p>
      </div>

      {/* Added justify-center / md:justify-center below 👇 */}
      <div
        ref={scrollerRef}
        className="mt-10 flex snap-x snap-mandatory justify-start md:justify-center gap-5 overflow-x-auto px-5 pb-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SNACKS.map((s, i) => (
          <div
            key={s.label}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`flex w-40 shrink-0 snap-center flex-col items-center gap-3 rounded-3xl border p-6 text-center shadow-sm transition-colors ${
              i === index ? "border-primary bg-card" : "border-border bg-card/70"
            }`}
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <s.Icon className="size-7" />
            </span>
            <p className="text-sm font-semibold leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => goTo(index - 1)}
          aria-label="Scroll left"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent active:scale-95"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => goTo(index + 1)}
          aria-label="Scroll right"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent active:scale-95"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------ Safety process (wave/amber) ------------------------------ */

const PROCESS_TABS = [
  {
    n: "01",
    label: "Label scan",
    title: "Every ingredient, read in place",
    body: "Vision AI reads the printed ingredients panel exactly as it's written — including fine print, sub-ingredients in parentheses, and regional spellings.",
  },
  {
    n: "02",
    label: "Cross-check",
    title: "Matched against your profile",
    body: "Every ingredient is checked against your saved allergens and conditions, including known derivatives and less obvious aliases.",
  },
  {
    n: "03",
    label: "Instant verdict",
    title: "One plain answer, one reason",
    body: "Safe, caution, or do-not-eat — always paired with the specific ingredient responsible, never a vague warning.",
  },
];

function SafetyProcess() {
  const [active, setActive] = useState(0);
  const tab = PROCESS_TABS[active] ?? PROCESS_TABS[0]!;

  return (
    <section id="safety" className="relative overflow-hidden">
      <svg
        aria-hidden
        viewBox="0 0 1440 100"
        className="block w-full text-safe/15"
        preserveAspectRatio="none"
      >
        <path fill="currentColor" d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" />
      </svg>

      <div className="bg-gradient-to-b from-safe/15 via-primary/10 to-brand-amber/10 py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Built for trust
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How a scan becomes a verdict
          </h2>

          <div className="mt-10 flex flex-wrap gap-2">
            {PROCESS_TABS.map((t, i) => (
              <button
                key={t.n}
                onClick={() => setActive(i)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.n} · {t.label}
              </button>
            ))}
          </div>

          <div className="animate-rise-in mt-8 max-w-2xl" key={tab.n}>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{tab.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{tab.body}</p>
          </div>
        </div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 1440 100"
        className="block w-full text-background"
        preserveAspectRatio="none"
      >
        <path fill="currentColor" d="M0,60 C360,0 1080,100 1440,40 L1440,100 L0,100 Z" />
      </svg>
    </section>
  );
}

/* ------------------------------ One profile (dark card) ------------------------------ */

const PROFILE_FEATURES = [
  { label: "Allergy match", body: "Checked against your exact list", Icon: ShieldCheck },
  { label: "Condition check", body: "Sodium, sugar, gluten and more", Icon: ListChecks },
  { label: "Multi-label OCR", body: "Reads dense, small-print panels", Icon: ScanLine },
  { label: "Instant verdict", body: "Green, caution, or red — no delay", Icon: Sparkles },
  { label: "Private by design", body: "Your profile stays on your device", Icon: Lock },
  { label: "Scan memory", body: "Revisit what you've already checked", Icon: History },
];

function OneProfile() {
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
            <span className="text-primary">Every aisle, covered.</span>
          </h2>
          <p className="mt-4 max-w-lg text-white/70">
            Your allergies and conditions are your all-access pass to a safe decision — set once,
            checked automatically on every single scan from then on.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {PROFILE_FEATURES.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <f.Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{f.label}</p>
                <p className="mt-1 text-xs text-white/60">{f.body}</p>
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
                Home
              </Link>
              <Link to="/scan" className="block hover:underline">
                Scanner
              </Link>
              <a href="#how-it-works" className="block hover:underline">
                How it works
              </a>
              <a href="#coverage" className="block hover:underline">
                What we scan
              </a>
            </div>
            <div className="space-y-2.5 text-sm">
              <p className="font-semibold">Account</p>
              <Link to="/profile" className="block hover:underline">
                Your profile
              </Link>
              <a href="#verdicts" className="block hover:underline">
                Recent verdicts
              </a>
              <a href="#safety" className="block hover:underline">
                How it verifies
              </a>
            </div>
            <div className="space-y-2.5 text-sm">
              <p className="font-semibold">Languages supported</p>
              <p className="flex items-center gap-1.5 text-brand-amber-foreground/80">
                <Languages className="size-3.5" /> Auto-detected on scan
              </p>
              <p className="text-brand-amber-foreground/80">
                PlateGuard assists, it doesn't replace the printed label or medical advice.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-brand-amber-foreground/15 pt-6 text-xs text-brand-amber-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PlateGuard AI. Not a substitute for medical advice.</p>
          <p>When in doubt, don't eat it.</p>
        </div>
      </div>
    </footer>
  );
}
