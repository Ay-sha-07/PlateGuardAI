/**
 * Canonical English UI copy for the home / marketing page.
 * Translated as a batch when the user switches language.
 */
export const HOME_COPY = {
  checkingAccount: "Checking your account…",

  // Hero
  tasteOfCertainty: "The taste of certainty",
  readingEveryLabel: "Reading every label",
  protectingEveryBite: "Protecting every bite",
  scroll: "Scroll",
  scrollToLearnMore: "Scroll to learn more",

  // Wordmark / CTA
  smarterScans:
    "Smarter scans. Safer bites. Every label decoded in plain language, for every aisle in the store.",
  startScanning: "Start scanning",
  setYourProfile: "Set your profile",
  safeBadge: "SAFE",
  thoroughCheck:
    "Connecting a photo, an ingredient list, and your medical profile through one thorough check — making every trip down the snack aisle faster, calmer, and genuinely informed.",

  // Stats
  typicalTime: "Typical time to a verdict",
  allergensTracked: "Allergens tracked by default",
  healthConditions: "Health conditions supported",
  noGuesswork: "Ingredients left to guesswork",
  statTimeValue: "10–30 s",

  // User guide
  seeItInAction: "See it in action",
  walkthroughTitle: "A 5-minute walkthrough of the whole app",
  walkthroughBody:
    "From setting up your profile to reading a verdict — watch at your own pace, pause anywhere, or speed through the parts you already know.",
  playVideo: "Play video",
  pause: "Pause",
  play: "Play",
  playbackSpeed: "Playback speed",

  // Coverage
  whatWeScan: "What we scan",
  everyCategory: "One camera, every packaged category",
  chips: "Chips & crisps",
  cookies: "Cookies & biscuits",
  bakery: "Bakery & pastries",
  dairy: "Dairy & yoghurt",
  drinks: "Drinks & coffee",
  candy: "Candy & sweets",

  // How it works
  howItWorks: "How it works",
  threeSteps: "Three steps between you and a safe snack",
  step1Title: "Set your profile",
  step1Body:
    "Add your allergies, medical conditions, or things you're just avoiding. Takes under a minute.",
  step2Title: "Scan any label",
  step2Body:
    "Fill the frame with the ingredients panel. No barcode needed — just the printed text on the pack.",
  step3Title: "Get a plain verdict",
  step3Body: "Safe, caution, or do-not-eat — with the exact ingredient responsible.",

  // Verdicts
  realScans: "Real scans",
  verdictLooksLike: "What a verdict actually looks like",
  danger: "Danger",
  caution: "Caution",
  safe: "Safe",
  verdict1Title: "Choco wafer bar flagged for hidden peanut oil",
  verdict1Detail: 'Listed as "groundnut oil" — a peanut derivative most labels don\'t spell out.',
  verdict2Title: "Instant noodles came back at 42% daily sodium",
  verdict2Detail: "Within range for most people — flagged for anyone managing hypertension.",
  verdict3Title: "Rice crackers cleared with no listed allergens",
  verdict3Detail: "Matched cleanly against a peanut and gluten profile in under a minute.",

  // Snacks carousel labels
  peanutGranola: "Peanut butter granola",
  saltedChips: "Salted potato chips",
  sesameBreadsticks: "Sesame breadsticks",
  yoghurtCup: "Flavoured yoghurt cup",
  coldBrew: "Bottled cold brew",
  gummyCandy: "Gummy fruit candy",

  // Safety process
  builtForTrust: "Built for trust",
  howScanBecomesVerdict: "How a scan becomes a verdict",
  process1Label: "Label scan",
  process1Title: "Every ingredient, read in place",
  process1Body: "Vision AI reads the printed ingredients panel exactly as it's written.",
  process2Label: "Cross-check",
  process2Title: "Matched against your profile",
  process2Body: "Every ingredient is checked against your saved allergens and conditions.",
  process3Label: "Clear verdict",
  process3Title: "One plain answer, one reason",
  process3Body: "Safe, caution, or do-not-eat — paired with the specific ingredient responsible.",

  // One profile features
  allergyMatch: "Allergy match",
  allergyMatchBody: "Checked against your exact list",
  conditionCheck: "Condition check",
  conditionCheckBody: "Sodium, sugar, gluten and more",
  multiLabelOcr: "Multi-label OCR",
  multiLabelOcrBody: "Reads dense, small-print panels",
  clearVerdict: "Clear verdict",
  clearVerdictBody: "Green, caution, or red — with a clear reason",
  privateByDesign: "Private by design",
  privateByDesignBody: "Your profile stays protected",
  scanMemory: "Scan memory",
  scanMemoryBody: "Revisit what you've already checked",
  everyAisle: "Every aisle, covered.",

  // Footer
  footerBlurb:
    "A camera, a profile, and a plain answer — built for the ten seconds before you decide to eat something.",
  account: "Account",
  languagesSupported: "Languages supported",
  autoDetected: "Auto-detected on scan",
  assistsDisclaimer:
    "PlateGuard assists, it doesn't replace the printed label or medical advice.",
  copyrightNote: "Not a substitute for medical advice.",
  whenInDoubt: "When in doubt, don't eat it.",
  home: "Home",
  scan: "Scan",
  profile: "Profile",
  login: "Login",
  howItWorksLink: "How it works",
  whatWeScanLink: "What we scan",
  verdictsLink: "Verdicts",
  userGuideLink: "User guide",
  safetyLink: "Safety",
  logout: "Logout",
  startScanningCta: "Start Scanning",
} as const;

export type HomeCopyKey = keyof typeof HOME_COPY;
export type HomeCopy = Record<HomeCopyKey, string>;
