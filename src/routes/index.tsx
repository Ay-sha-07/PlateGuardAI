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

  const cycles = 4;
  const phase = scanT * cycles * Math.PI;
  const laserY = 12 + ((1 - Math.cos(phase)) / 2) * 72;

  const ocrPct = Math.min(100, Math.round(scanT * 100));
  const phoneScale = 0.94 + enter * 0.06;

  return (
    <section
      ref={sectionRef}
      id="phone-scan"
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
            <span
              className="absolute inset-x-0"
              style={{ opacity: introOpacity }}
            >
              {tp("Align the label")}
            </span>

            <span
              className="absolute inset-x-0"
              style={{ opacity: scannerOpacity }}
            >
              {tp("Reading ingredients")}
            </span>

            <span
              className="absolute inset-x-0"
              style={{ opacity: resultOpacity }}
            >
              {tp("Result ready")}
            </span>
          </div>
        </div>

        <div
          className="relative z-10 flex w-full flex-col items-center"
          style={{
            maxWidth: "min(82vw, 16rem)",
            opacity: sceneOpacity,
            transform: `translateY(2.5rem) scale(${phoneScale})`,
            willChange: "transform, opacity",
          }}
        >
          <div className="relative w-full overflow-hidden rounded-[2.15rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-2xl">
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
              />

              <div
                className="pointer-events-none absolute inset-0 bg-emerald-400/20 mix-blend-screen"
                style={{ opacity: scannerOpacity * 0.55 }}
              />

              <div
                className="pointer-events-none absolute inset-x-0 z-20"
                style={{
                  top: `${laserY}%`,
                  opacity: scannerOpacity,
                  height: 4,
                  background:
                    "linear-gradient(90deg, transparent 5%, #4ade80 25%, #bbf7d0 50%, #4ade80 75%, transparent 95%)",
                  boxShadow:
                    "0 0 8px 2px rgba(74,222,128,0.95), 0 0 24px 10px rgba(74,222,128,0.55)",
                }}
              />

              <div
                className="absolute left-1/2 top-7 z-30 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold tracking-wide text-white"
                style={{ opacity: sceneOpacity }}
              >
                <ScanLine className="size-3 shrink-0 text-primary" />

                <span className="relative h-4 min-w-[7.25rem] leading-4">
                  <span
                    className="absolute inset-x-0"
                    style={{ opacity: 1 - resultOpacity }}
                  >
                    {tp("Scanning label…")}
                  </span>

                  <span
                    className="absolute inset-x-0"
                    style={{ opacity: resultOpacity }}
                  >
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
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.16em] text-white/80">
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

              <div
                className="absolute inset-x-3 bottom-3 z-30 rounded-2xl bg-card/95 p-3 shadow-2xl"
                style={{
                  opacity: verdictIn,
                  transform: `translateY(${(1 - verdictIn) * 8}px) scale(${
                    0.985 + verdictIn * 0.015
                  })`,
                }}
              >
                <p className="text-sm font-bold text-foreground">
                  {tp("SAFE TO EAT")}
                </p>

                <p className="text-[10px] text-muted-foreground">
                  {tp("No allergens matched your profile")}
                </p>

                <div className="mt-2 border-t border-border/70 pt-2 text-[10px]">
                  <span>{tp("Ingredient check")}</span>
                  <span className="float-right text-primary">
                    {tp("All clear")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-3 h-10 w-full max-w-[12rem] text-center text-xs leading-5 text-muted-foreground">
            <span
              className="absolute inset-x-0"
              style={{ opacity: introOpacity }}
            >
              {tp("Bring the label into view")}
            </span>

            <span
              className="absolute inset-x-0"
              style={{ opacity: scannerOpacity }}
            >
              {tp("Hold steady — checking every ingredient")}
            </span>

            <span
              className="absolute inset-x-0"
              style={{ opacity: resultOpacity }}
            >
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
