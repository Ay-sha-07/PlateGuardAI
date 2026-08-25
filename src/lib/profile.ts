export type AgeGroup = "child" | "teen" | "adult" | "senior";
export type BiologicalSex = "male" | "female" | "intersex_other";
export type ReproductiveStatus =
  "not_applicable" | "pregnant" | "breastfeeding" | "trying_to_conceive";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type AllergySeverity = "mild_to_moderate" | "severe_anaphylaxis";

export type DiabetesDetail = {
  type: "" | "prediabetes" | "type1" | "type2" | "gestational";
  treatment: "" | "lifestyle" | "oral_medication" | "insulin";
};

export type HypertensionDetail = {
  status: "" | "pre_hypertension" | "stage1_2" | "coronary_artery_disease" | "heart_failure";
};

export type KidneyDetail = {
  status: "" | "ckd_1_4_non_dialysis" | "ckd_5_dialysis";
};

export type SafetyProfile = {
  name: string;
  avatarUrl: string;
  ageGroup: AgeGroup | "";
  biologicalSex: BiologicalSex | "";
  reproductiveStatus: ReproductiveStatus | "";
  weightKg: string;
  heightCm: string;
  activityLevel: ActivityLevel | "";

  allergens: string[];
  allergySeverity: AllergySeverity | "";
  glutenStatus: "" | "celiac" | "non_celiac_sensitivity";

  conditions: string[];
  diabetes: DiabetesDetail;
  hypertension: HypertensionDetail;
  kidney: KidneyDetail;

  sensitivities: string[];
  bowelHabits: string[];

  dietaryPatterns: string[];
  medications: string;
  notes: string;
};

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "child", label: "Child (under 13)" },
  { value: "teen", label: "Teen (13–17)" },
  { value: "adult", label: "Adult (18–64)" },
  { value: "senior", label: "Senior (65+)" },
];

export const BIOLOGICAL_SEXES: { value: BiologicalSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "intersex_other", label: "Intersex / other" },
];

export const REPRODUCTIVE_STATUSES: { value: ReproductiveStatus; label: string }[] = [
  { value: "not_applicable", label: "Not applicable" },
  { value: "pregnant", label: "Pregnant" },
  { value: "breastfeeding", label: "Breastfeeding" },
  { value: "trying_to_conceive", label: "Trying to conceive" },
];

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "high", label: "Highly active" },
];

export const ALLERGY_SEVERITIES: { value: AllergySeverity; label: string }[] = [
  { value: "mild_to_moderate", label: "Mild to moderate reaction" },
  { value: "severe_anaphylaxis", label: "Severe / anaphylaxis risk" },
];

export const GLUTEN_STATUSES: {
  value: Exclude<SafetyProfile["glutenStatus"], "">;
  label: string;
}[] = [
  { value: "celiac", label: "Celiac disease (strict zero-gluten)" },
  { value: "non_celiac_sensitivity", label: "Non-celiac gluten sensitivity" },
];

export const COMMON_ALLERGENS = [
  "Peanuts",
  "Tree nuts",
  "Milk / dairy",
  "Eggs",
  "Wheat",
  "Barley",
  "Rye",
  "Oats",
  "Soy",
  "Fish",
  "Crustacean shellfish",
  "Sesame",
  "Mustard",
  "Celery",
  "Lupin / chickpeas / lentils",
  "Sulphites",
  "Corn",
  "Rosaceae fruits (apple, peach, plum)",
  "Latex-fruit group (avocado, banana, kiwi)",
];

export const DIABETES_TYPES: { value: Exclude<DiabetesDetail["type"], "">; label: string }[] = [
  { value: "prediabetes", label: "Pre-diabetes" },
  { value: "type1", label: "Type 1" },
  { value: "type2", label: "Type 2" },
  { value: "gestational", label: "Gestational" },
];

export const DIABETES_TREATMENTS: {
  value: Exclude<DiabetesDetail["treatment"], "">;
  label: string;
}[] = [
  { value: "lifestyle", label: "Lifestyle / diet only" },
  { value: "oral_medication", label: "Oral hypoglycemics (medication)" },
  { value: "insulin", label: "Insulin dependent" },
];

export const HYPERTENSION_STATUSES: {
  value: Exclude<HypertensionDetail["status"], "">;
  label: string;
}[] = [
  { value: "pre_hypertension", label: "Pre-hypertension" },
  { value: "stage1_2", label: "Stage 1 / Stage 2 hypertension" },
  { value: "coronary_artery_disease", label: "Coronary artery disease" },
  { value: "heart_failure", label: "Heart failure" },
];

export const KIDNEY_STATUSES: { value: Exclude<KidneyDetail["status"], "">; label: string }[] = [
  { value: "ckd_1_4_non_dialysis", label: "CKD stage 1–4 (non-dialysis)" },
  { value: "ckd_5_dialysis", label: "CKD stage 5 / dialysis" },
];

export const CONDITION_CATEGORIES: { category: string; options: string[] }[] = [
  {
    category: "Metabolic & endocrine",
    options: ["Diabetes (see detail below)", "Thyroid disorder", "PCOS"],
  },
  {
    category: "Heart & circulation",
    options: ["Hypertension (see detail below)", "High cholesterol"],
  },
  {
    category: "Kidney",
    options: ["Chronic kidney disease (see detail below)", "Kidney stones"],
  },
  {
    category: "Digestive",
    options: [
      "GERD / acid reflux",
      "Gastritis / peptic ulcer",
      "IBS (constipation-predominant)",
      "IBS (diarrhea-predominant)",
      "IBD (Crohn's / ulcerative colitis)",
      "Lactose intolerance",
      "Gallbladder disease",
    ],
  },
  {
    category: "Other",
    options: ["Gout / hyperuricemia", "Osteoporosis", "Anemia", "Liver disease"],
  },
];

export const COMMON_CONDITIONS = CONDITION_CATEGORIES.flatMap((c) => c.options);

export const SENSITIVITIES = [
  "MSG / E621 (monosodium glutamate)",
  "Artificial sweeteners (aspartame, sucralose, saccharin)",
  "Sugar alcohols / polyols (sorbitol, xylitol, maltitol)",
  "Artificial food dyes (Tartrazine/Yellow 5, Red 40)",
];

export const BOWEL_HABITS = ["Chronic constipation", "Chronic diarrhea", "Bloating / gas"];

export const DIETARY_PATTERNS = [
  "Halal",
  "Kosher",
  "Vegetarian",
  "Vegan",
  "Jain (no root vegetables)",
  "Hindu vegetarian (no eggs/meat)",
  "Low-FODMAP",
  "Ketogenic / very low carb",
  "Low sodium / DASH",
  "Renal-friendly",
  "Mediterranean",
];

export const EMPTY_PROFILE: SafetyProfile = {
  name: "",
  avatarUrl: "",
  ageGroup: "",
  biologicalSex: "",
  reproductiveStatus: "",
  weightKg: "",
  heightCm: "",
  activityLevel: "",

  allergens: [],
  allergySeverity: "",
  glutenStatus: "",

  conditions: [],
  diabetes: { type: "", treatment: "" },
  hypertension: { status: "" },
  kidney: { status: "" },

  sensitivities: [],
  bowelHabits: [],

  dietaryPatterns: [],
  medications: "",
  notes: "",
};

export function profileIsSet(profile: SafetyProfile | null): profile is SafetyProfile {
  if (!profile) return false;
  return (
    profile.allergens.length > 0 ||
    profile.conditions.length > 0 ||
    profile.dietaryPatterns.length > 0 ||
    profile.sensitivities.length > 0 ||
    profile.medications.trim().length > 0 ||
    profile.notes.trim().length > 0
  );
}

/* ------------------------------------------------------------------ */
/* Multi-profile store                                                 */
/*                                                                      */
/* PlateGuard now supports one profile per family member. Everything    */
/* lives in localStorage as a map of id -> profile, plus a pointer to  */
/* whichever profile is currently active (shown in the scanner/header  */
/* switcher). Old single-profile data (v1–v3) is migrated in as the    */
/* first profile the first time this loads.                            */
/* ------------------------------------------------------------------ */

export type StoredProfile = SafetyProfile & { id: string; createdAt: number };

export type ProfileStore = {
  profiles: StoredProfile[];
  activeId: string;
};

import { scopedKey, getActiveScope, GUEST_SCOPE } from "./account-scope";

const STORE_KEY_BASE = "PlateGuard.profiles.v1";
const LEGACY_KEY = "PlateGuard.profile.v3";
const LEGACY_PRIOR_KEYS = ["PlateGuard.profile.v2", "PlateGuard.profile.v1"];

function makeId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function migrateLegacyProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  // Old pre-account data belongs to whoever is using the device with nobody
  // logged in — never hand it to a freshly signed-in account.
  if (getActiveScope() !== GUEST_SCOPE) return null;
  try {
    for (const key of [LEGACY_KEY, ...LEGACY_PRIOR_KEYS]) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<SafetyProfile>;
      return {
        ...EMPTY_PROFILE,
        ...parsed,
        name: parsed.name?.trim() || "Me",
        id: makeId(),
        createdAt: Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function loadProfileStore(): ProfileStore {
  if (typeof window === "undefined") return { profiles: [], activeId: "" };
  try {
    const raw = window.localStorage.getItem(scopedKey(STORE_KEY_BASE));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileStore>;
      const profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
      if (profiles.length > 0) {
        const activeId =
          parsed.activeId && profiles.some((p) => p.id === parsed.activeId)
            ? parsed.activeId
            : profiles[0]!.id;
        return { profiles, activeId };
      }
    }
  } catch {
    // fall through to migration/empty below
  }

  const migrated = migrateLegacyProfile();
  if (migrated) {
    const store = { profiles: [migrated], activeId: migrated.id };
    saveProfileStore(store);
    return store;
  }
  return { profiles: [], activeId: "" };
}

export function saveProfileStore(store: ProfileStore) {
  if (typeof window === "undefined") return;
  // Everything stays local to this device, scoped to whichever account is
  // currently active — never synced to a server database.
  window.localStorage.setItem(scopedKey(STORE_KEY_BASE), JSON.stringify(store));
  void import("./cloud-sync").then(({ pushProfileStore }) => pushProfileStore(store));
}

/** Convenience: the profile currently active in the switcher, or null if none exist. */
export function loadProfile(): SafetyProfile | null {
  const store = loadProfileStore();
  return store.profiles.find((p) => p.id === store.activeId) ?? store.profiles[0] ?? null;
}

export function addProfile(name: string): ProfileStore {
  const store = loadProfileStore();
  const profile: StoredProfile = {
    ...EMPTY_PROFILE,
    name: name.trim() || `Profile ${store.profiles.length + 1}`,
    id: makeId(),
    createdAt: Date.now(),
  };
  const next = { profiles: [...store.profiles, profile], activeId: profile.id };
  saveProfileStore(next);
  return next;
}

export function updateProfile(id: string, profile: SafetyProfile): ProfileStore {
  const store = loadProfileStore();
  const next: ProfileStore = {
    ...store,
    profiles: store.profiles.map((p) =>
      p.id === id ? { ...p, ...profile, id, createdAt: p.createdAt } : p,
    ),
  };
  saveProfileStore(next);
  return next;
}

export function deleteProfile(id: string): ProfileStore {
  const store = loadProfileStore();
  const profiles = store.profiles.filter((p) => p.id !== id);
  const activeId = store.activeId === id ? (profiles[0]?.id ?? "") : store.activeId;
  const next = { profiles, activeId };
  saveProfileStore(next);
  return next;
}

export function setActiveProfile(id: string): ProfileStore {
  const store = loadProfileStore();
  const next = { ...store, activeId: id };
  saveProfileStore(next);
  return next;
}
