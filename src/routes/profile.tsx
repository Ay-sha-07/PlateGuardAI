import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ImagePlus, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  ACTIVITY_LEVELS,
  addProfile,
  AGE_GROUPS,
  ALLERGY_SEVERITIES,
  BIOLOGICAL_SEXES,
  BOWEL_HABITS,
  CONDITION_CATEGORIES,
  COMMON_ALLERGENS,
  deleteProfile,
  DIABETES_TREATMENTS,
  DIABETES_TYPES,
  DIETARY_PATTERNS,
  EMPTY_PROFILE,
  GLUTEN_STATUSES,
  HYPERTENSION_STATUSES,
  KIDNEY_STATUSES,
  loadProfileStore,
  REPRODUCTIVE_STATUSES,
  setActiveProfile,
  SENSITIVITIES,
  type SafetyProfile,
  type StoredProfile,
  updateProfile,
} from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/multi-select";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your health profile — PlateGuard AI" },
      {
        name: "description",
        content:
          "A complete clinical health questionnaire — allergies, conditions, medications, and dietary needs — so every label scan is judged against your full picture, not just one detail.",
      },
      { property: "og:title", content: "Your health profile — PlateGuard AI" },
      {
        property: "og:description",
        content: "Set your complete profile once; every scan is judged against all of it together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const STEPS = [
  "About you",
  "Allergies",
  "Health conditions",
  "Sensitivities",
  "Lifestyle & medications",
] as const;

async function resizeProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Please choose an image smaller than 8 MB.");

  const bitmap = await createImageBitmap(file);
  const size = 512;
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function ProfilePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [profile, setProfile] = useState<SafetyProfile>(EMPTY_PROFILE);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let store = loadProfileStore();
    if (store.profiles.length === 0) {
      store = addProfile("Me");
    }
    setProfiles(store.profiles);
    setActiveId(store.activeId);
    const active = store.profiles.find((p) => p.id === store.activeId);
    if (active) setProfile(active);
  }, []);

  function patch(partial: Partial<SafetyProfile>) {
    setProfile((p) => ({ ...p, ...partial }));
  }

  function persistCurrent(id: string, current: SafetyProfile) {
    if (!id) return;
    const store = updateProfile(id, current);
    setProfiles(store.profiles);
  }

  function selectProfile(id: string) {
    if (id === activeId) return;
    persistCurrent(activeId, profile);
    const store = setActiveProfile(id);
    setProfiles(store.profiles);
    setActiveId(id);
    setProfile(store.profiles.find((p) => p.id === id) ?? EMPTY_PROFILE);
    setStep(0);
  }

  function handleAddProfile() {
    persistCurrent(activeId, profile);
    const name = window.prompt("Name for the new profile (e.g. a family member's name)");
    if (name === null) return;
    const store = addProfile(name);
    setProfiles(store.profiles);
    setActiveId(store.activeId);
    setProfile(store.profiles.find((p) => p.id === store.activeId) ?? EMPTY_PROFILE);
    setStep(0);
  }

  function handleDeleteProfile(id: string) {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    if (!window.confirm(`Delete the profile "${target.name}"? This can't be undone.`)) return;
    const store = deleteProfile(id);
    setProfiles(store.profiles);
    setActiveId(store.activeId);
    const next = store.profiles.find((p) => p.id === store.activeId);
    setProfile(next ?? EMPTY_PROFILE);
    setStep(0);
  }

  function submit() {
    if (activeId) {
      updateProfile(activeId, profile);
    }
    toast.success(
      `${profile.name || "Profile"} saved — scans now weigh their full health picture.`,
    );
    void router.navigate({ to: "/scan" });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-44 pt-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Health profile</h1>
          <p className="text-xs text-muted-foreground">
            Every field feeds one rating — nothing here is judged in isolation.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card/70 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name || "Profile"} photo`}
                className="size-24 rounded-full border-2 border-border object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex size-24 items-center justify-center rounded-full border-2 border-border bg-primary/10 text-2xl font-bold text-primary"
                aria-label={`Initial for ${profile.name || "profile"}`}
              >
                {(profile.name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            {profile.avatarUrl && (
              <button
                type="button"
                onClick={() => patch({ avatarUrl: "" })}
                className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent"
                aria-label="Remove profile photo"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-foreground">Profile photo</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Add a photo so family members are easier to identify when switching profiles.
              The image is resized before it is saved.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent">
              <ImagePlus className="size-4" />
              {profile.avatarUrl ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) return;
                  try {
                    patch({ avatarUrl: await resizeProfilePhoto(file) });
                    toast.success("Profile photo updated.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not upload the photo.");
                  }
                }}
              />
            </label>
          </div>
        </div>
      </section>

      {/* profile switcher — one card per family member */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {profiles.map((p) => (
          <div key={p.id} className="group relative shrink-0">
            <button
              type="button"
              onClick={() => selectProfile(p.id)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                p.id === activeId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/70 text-foreground hover:bg-accent"
              }`}
            >
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {(p.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              {p.name || "Unnamed"}
            </button>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteProfile(p.id)}
                aria-label={`Delete ${p.name}`}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddProfile}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-4" />
          Add profile
        </button>
      </div>

      {/* progress */}
      <div className="mt-6">
        <div className="flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`}
              aria-label={`Go to step ${i + 1}: ${label}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      <div className="animate-rise-in mt-6" key={step}>
        {step === 0 && <StepAbout profile={profile} patch={patch} />}
        {step === 1 && <StepAllergies profile={profile} patch={patch} />}
        {step === 2 && <StepConditions profile={profile} patch={patch} />}
        {step === 3 && <StepSensitivities profile={profile} patch={patch} />}
        {step === 4 && <StepLifestyle profile={profile} patch={patch} />}
      </div>

      <div
        className="fixed inset-x-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 px-5 py-4 backdrop-blur"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        <div className="flex gap-2">
          {step > 0 && (
            <Button
              size="lg"
              variant="secondary"
              className="h-14 rounded-2xl px-5"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}
          {isLast ? (
            <Button
              size="lg"
              className="h-14 flex-1 rounded-2xl text-base font-semibold"
              onClick={submit}
            >
              <Check className="size-5" />
              Save profile
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-14 flex-1 rounded-2xl text-base font-semibold"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
              <ArrowRight className="size-5" />
            </Button>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

type StepProps = {
  profile: SafetyProfile;
  patch: (partial: Partial<SafetyProfile>) => void;
};

function StepAbout({ profile, patch }: StepProps) {
  return (
    <div className="space-y-6">
      <FieldIntro
        title="Who is this for?"
        body="Age, sex, and body baseline change what's actually risky in a food — not just what's flagged."
      />
      <div className="space-y-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          placeholder="e.g. Maya"
          value={profile.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Age group</Label>
          <Select
            value={profile.ageGroup}
            onValueChange={(v) => patch({ ageGroup: v as SafetyProfile["ageGroup"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Biological sex</Label>
          <Select
            value={profile.biologicalSex}
            onValueChange={(v) => patch({ biologicalSex: v as SafetyProfile["biologicalSex"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {BIOLOGICAL_SEXES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pregnancy / breastfeeding status</Label>
        <Select
          value={profile.reproductiveStatus}
          onValueChange={(v) =>
            patch({ reproductiveStatus: v as SafetyProfile["reproductiveStatus"] })
          }
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Select if relevant" />
          </SelectTrigger>
          <SelectContent>
            {REPRODUCTIVE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg, optional)</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 62"
            value={profile.weightKg}
            onChange={(e) => patch({ weightKg: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm, optional)</Label>
          <Input
            id="height"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 165"
            value={profile.heightCm}
            onChange={(e) => patch({ heightCm: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Activity level (optional)</Label>
        <Select
          value={profile.activityLevel}
          onValueChange={(v) => patch({ activityLevel: v as SafetyProfile["activityLevel"] })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVELS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StepAllergies({ profile, patch }: StepProps) {
  return (
    <div className="space-y-6">
      <FieldIntro
        title="Allergies"
        body="Treated as life-critical — any direct ingredient or hidden derivative triggers the highest-risk rating."
      />
      <div className="space-y-2">
        <Label>Select every allergen that applies</Label>
        <MultiSelect
          options={COMMON_ALLERGENS}
          selected={profile.allergens}
          onChange={(v) => patch({ allergens: v })}
          placeholder="Select allergens"
          searchPlaceholder="Search allergens…"
        />
      </div>

      {profile.allergens.length > 0 && (
        <div className="animate-rise-in space-y-2">
          <Label>How severe is the reaction, typically?</Label>
          <Select
            value={profile.allergySeverity}
            onValueChange={(v) => patch({ allergySeverity: v as SafetyProfile["allergySeverity"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              {ALLERGY_SEVERITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Gluten status (optional)</Label>
        <Select
          value={profile.glutenStatus}
          onValueChange={(v) => patch({ glutenStatus: v as SafetyProfile["glutenStatus"] })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Not applicable" />
          </SelectTrigger>
          <SelectContent>
            {GLUTEN_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Celiac disease is treated far more strictly than general sensitivity — worth being precise
          here.
        </p>
      </div>
    </div>
  );
}

function StepConditions({ profile, patch }: StepProps) {
  function toggle(value: string) {
    patch({
      conditions: profile.conditions.includes(value)
        ? profile.conditions.filter((v) => v !== value)
        : [...profile.conditions, value],
    });
  }

  const hasDiabetes = profile.conditions.includes("Diabetes (see detail below)");
  const hasHypertension = profile.conditions.includes("Hypertension (see detail below)");
  const hasKidney = profile.conditions.includes("Chronic kidney disease (see detail below)");

  return (
    <div className="space-y-6">
      <FieldIntro
        title="Health conditions"
        body="Select everything that applies, not just the most urgent one — conditions are weighed together, since combinations can even reverse each other's dietary advice."
      />
      {CONDITION_CATEGORIES.map((group) => (
        <div key={group.category} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {group.category}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((o) => {
              const on = profile.conditions.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-colors ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hasDiabetes && (
        <div className="animate-rise-in space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Diabetes detail</p>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={profile.diabetes.type}
              onValueChange={(v) => patch({ diabetes: { ...profile.diabetes, type: v as never } })}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DIABETES_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Treatment</Label>
            <Select
              value={profile.diabetes.treatment}
              onValueChange={(v) =>
                patch({ diabetes: { ...profile.diabetes, treatment: v as never } })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-background">
                <SelectValue placeholder="Select treatment" />
              </SelectTrigger>
              <SelectContent>
                {DIABETES_TREATMENTS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {hasHypertension && (
        <div className="animate-rise-in space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Hypertension / cardiovascular detail
          </p>
          <Select
            value={profile.hypertension.status}
            onValueChange={(v) => patch({ hypertension: { status: v as never } })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {HYPERTENSION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasKidney && (
        <div className="animate-rise-in space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Kidney detail</p>
          <Select
            value={profile.kidney.status}
            onValueChange={(v) => patch({ kidney: { status: v as never } })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {KIDNEY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Dialysis status matters a lot here — protein needs go up on dialysis, down without it.
          </p>
        </div>
      )}
    </div>
  );
}

function StepSensitivities({ profile, patch }: StepProps) {
  function toggleBowel(value: string) {
    patch({
      bowelHabits: profile.bowelHabits.includes(value)
        ? profile.bowelHabits.filter((v) => v !== value)
        : [...profile.bowelHabits, value],
    });
  }

  return (
    <div className="space-y-6">
      <FieldIntro
        title="Specific sensitivities"
        body="Not allergies, but things that still change what's comfortable to eat — only flagged if you select them."
      />
      <div className="space-y-2">
        <Label>Chemical / additive sensitivities (optional)</Label>
        <MultiSelect
          options={SENSITIVITIES}
          selected={profile.sensitivities}
          onChange={(v) => patch({ sensitivities: v })}
          placeholder="Select any that apply"
          searchPlaceholder="Search…"
        />
      </div>

      <div className="space-y-2.5">
        <Label>Digestive symptom pattern (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {BOWEL_HABITS.map((o) => {
            const on = profile.bowelHabits.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleBowel(o)}
                className={`rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-secondary-foreground hover:bg-muted"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Helps direct fiber and FODMAP-related notes in the right direction.
        </p>
      </div>
    </div>
  );
}

function StepLifestyle({ profile, patch }: StepProps) {
  return (
    <div className="space-y-6">
      <FieldIntro
        title="Lifestyle, medications & anything else"
        body="Dietary and religious patterns add a separate layer of checks; medications matter only for well-established food-drug interactions."
      />
      <div className="space-y-2">
        <Label>Dietary / religious pattern (optional)</Label>
        <MultiSelect
          options={DIETARY_PATTERNS}
          selected={profile.dietaryPatterns}
          onChange={(v) => patch({ dietaryPatterns: v })}
          placeholder="Select any that apply"
          searchPlaceholder="Search…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">Current medications (optional)</Label>
        <Textarea
          id="medications"
          rows={2}
          placeholder="e.g. warfarin, lisinopril"
          value={profile.medications}
          onChange={(e) => patch({ medications: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          Only used for well-known food interactions (e.g. grapefruit, vitamin K-rich greens).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Anything else to watch for?</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="e.g. also avoid red food dye; sodium under 140mg per serving"
          value={profile.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}

function FieldIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
