import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
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
  subscribeProfileChanges,
  SENSITIVITIES,
  type SafetyProfile,
  type StoredProfile,
  updateProfile,
} from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { RequireEntry } from "@/components/require-entry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/multi-select";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav";
import { usePhrases } from "@/hooks/use-ai-translate";
import { PROFILE_PHRASES } from "@/lib/ui-phrases";
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

function ProfileAvatar({
  name,
  avatarUrl,
  size = "size-6",
  textSize = "text-[10px]",
  className = "",
  active = false,
}: {
  name: string;
  avatarUrl?: string;
  size?: string;
  textSize?: string;
  className?: string;
  active?: boolean;
}) {
  const initial = (name.trim() || "?").slice(0, 1).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name || "Profile"} photo`}
        className={`${size} shrink-0 rounded-full border border-border object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full border ${active ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground" : "border-primary/20 bg-primary/10 text-primary"} ${textSize} font-bold ${className}`}
      aria-label={`Default profile picture for ${name || "profile"}`}
    >
      {initial}
    </span>
  );
}

function ProfilePage() {
  return (
    <RequireEntry>
      <ProfilePageContent />
    </RequireEntry>
  );
}

function ProfilePageContent() {
  const tp = usePhrases(PROFILE_PHRASES);

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

    // Cloud hydration can finish after this page mounts. Re-read the scoped
    // profile store whenever it changes so another device's profile data
    // appears without requiring a manual refresh.
    const refresh = () => {
      const next = loadProfileStore();
      setProfiles(next.profiles);
      setActiveId(next.activeId);
      setProfile(next.profiles.find((p) => p.id === next.activeId) ?? EMPTY_PROFILE);
    };
    const unsubscribeProfile = subscribeProfileChanges(refresh);

    return () => unsubscribeProfile();
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
    const name = window.prompt(tp("Name for the new profile (e.g. a family member)"));
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
    if (
      !window.confirm(
        `${tp("Delete the profile")} "${target.name}"? ${tp("This can't be undone.")}`,
      )
    )
      return;
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
      `${profile.name || tp("Profile")} ${tp("saved — scans now weigh their full health picture.")}`,
    );
    void router.navigate({ to: "/scan" });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background/72">
      <main className="mx-auto w-full max-w-md px-5 pb-44 pt-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{tp("Health profile")}</h1>
            <p className="text-xs text-muted-foreground">
              {tp("Every field feeds one rating — nothing here is judged in isolation.")}
            </p>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-border bg-card/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.name || "Profile"} photo`}
                  className="size-14 rounded-full border border-border object-cover"
                />
              ) : (
                <div
                  className="flex size-14 items-center justify-center rounded-full border border-border bg-primary/10 text-lg font-bold text-primary"
                  aria-label={`Initial for ${profile.name || "profile"}`}
                >
                  {(profile.name || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={() => patch({ avatarUrl: "" })}
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent"
                  aria-label={tp("Remove profile photo")}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{tp("Profile photo")}</h2>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {tp("Optional • helps identify profiles")}
                  </p>
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent">
                  <ImagePlus className="size-3.5" />
                  {profile.avatarUrl ? tp("Change") : tp("Add")}
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
                        toast.success(tp("Profile photo updated."));
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : tp("Could not upload the photo."),
                        );
                      }
                    }}
                  />
                </label>
              </div>
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
                <ProfileAvatar
                  name={p.name}
                  avatarUrl={p.avatarUrl}
                  size="size-7"
                  textSize="text-xs"
                  active={p.id === activeId}
                />
                <span className="min-w-0 truncate">{p.name || tp("Unnamed")}</span>
              </button>
              {profiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-danger focus-visible:opacity-100"
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
            {tp("Add profile")}
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
                aria-label={`Go to step ${i + 1}: ${tp(label)}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {tp("Step")} {step + 1} {tp("of")} {STEPS.length} — {tp(STEPS[step]!)}
          </p>
        </div>

        <div className="animate-rise-in mt-6" key={step}>
          {step === 0 && <StepAbout profile={profile} patch={patch} />}
          {step === 1 && <StepAllergies profile={profile} patch={patch} />}
          {step === 2 && <StepConditions profile={profile} patch={patch} />}
          {step === 3 && <StepSensitivities profile={profile} patch={patch} />}
          {step === 4 && <StepLifestyle profile={profile} patch={patch} />}
        </div>

        {profiles.length > 1 && (
          <button
            type="button"
            onClick={() => handleDeleteProfile(activeId)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="size-4" />
            {tp("Delete")} "{profile.name || tp("this")}" {tp("Profile").toLowerCase()}
          </button>
        )}

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
                {tp("Save profile")}
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-14 flex-1 rounded-2xl text-base font-semibold"
                onClick={() => setStep((s) => s + 1)}
              >
                {tp("Continue")}
                <ArrowRight className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

type StepProps = {
  profile: SafetyProfile;
  patch: (partial: Partial<SafetyProfile>) => void;
};

function StepAbout({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
  return (
    <div className="space-y-6">
      <FieldIntro
        title={tp("Who is this for?")}
        body={tp(
          "Age, sex, and body baseline change what's actually risky in a food — not just what's flagged.",
        )}
      />
      <div className="space-y-2">
        <Label htmlFor="name">{tp("Name (optional)")}</Label>
        <Input
          id="name"
          placeholder={tp("e.g. Maya")}
          value={profile.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{tp("Age group")}</Label>
          <Select
            value={profile.ageGroup}
            onValueChange={(v) => patch({ ageGroup: v as SafetyProfile["ageGroup"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder={tp("Select")} />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {tp(g.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{tp("Biological sex")}</Label>
          <Select
            value={profile.biologicalSex}
            onValueChange={(v) => patch({ biologicalSex: v as SafetyProfile["biologicalSex"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder={tp("Select")} />
            </SelectTrigger>
            <SelectContent>
              {BIOLOGICAL_SEXES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {tp(s.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{tp("Pregnancy / breastfeeding status")}</Label>
        <Select
          value={profile.reproductiveStatus}
          onValueChange={(v) =>
            patch({ reproductiveStatus: v as SafetyProfile["reproductiveStatus"] })
          }
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder={tp("Select if relevant")} />
          </SelectTrigger>
          <SelectContent>
            {REPRODUCTIVE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {tp(s.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="weight">{tp("Weight (kg, optional)")}</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder={tp("e.g. 62")}
            value={profile.weightKg}
            onChange={(e) => patch({ weightKg: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <HeightField profile={profile} patch={patch} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{tp("Activity level (optional)")}</Label>
        <Select
          value={profile.activityLevel}
          onValueChange={(v) => patch({ activityLevel: v as SafetyProfile["activityLevel"] })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder={tp("Select")} />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVELS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {tp(a.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Height input with a cm / ft+in unit toggle. `profile.heightCm` stays the
 * single source of truth (in centimeters) — the ft+in mode just converts
 * on the way in and out, so nothing downstream (AI prompt, BMI calc,
 * history) needs to know which unit the person prefers to type in.
 */
function HeightField({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const cmValue = parseFloat(profile.heightCm);
  const hasCm = Number.isFinite(cmValue) && cmValue > 0;

  const totalInches = hasCm ? cmValue / 2.54 : 0;
  const feet = hasCm ? Math.floor(totalInches / 12) : 0;
  const inches = hasCm ? Math.round(totalInches - feet * 12) : 0;
  // Rounding inches up to 12 should carry over into a whole extra foot.
  const feetDisplay = inches === 12 ? feet + 1 : feet;
  const inchesDisplay = inches === 12 ? 0 : inches;

  function setFromFeetInches(nextFeet: number, nextInches: number) {
    if (!Number.isFinite(nextFeet) && !Number.isFinite(nextInches)) {
      patch({ heightCm: "" });
      return;
    }
    const totalIn =
      (Number.isFinite(nextFeet) ? nextFeet : 0) * 12 +
      (Number.isFinite(nextInches) ? nextInches : 0);
    const cm = totalIn * 2.54;
    patch({ heightCm: cm > 0 ? Math.round(cm * 10) / 10 + "" : "" });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Label htmlFor="height">{tp("Height (optional)")}</Label>
        <div className="flex rounded-full border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setUnit("cm")}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
              unit === "cm" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            cm
          </button>
          <button
            type="button"
            onClick={() => setUnit("ft")}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
              unit === "ft" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            ft/in
          </button>
        </div>
      </div>

      {unit === "cm" ? (
        <Input
          id="height"
          type="number"
          inputMode="decimal"
          placeholder={tp("e.g. 165")}
          value={profile.heightCm}
          onChange={(e) => patch({ heightCm: e.target.value })}
          className="h-11 rounded-xl"
        />
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="height"
              type="number"
              inputMode="numeric"
              placeholder={tp("e.g. 5")}
              value={hasCm ? feetDisplay : ""}
              onChange={(e) => setFromFeetInches(parseFloat(e.target.value), inchesDisplay)}
              className="h-11 rounded-xl pr-9"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ft
            </span>
          </div>
          <div className="relative flex-1">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={tp("e.g. 5")}
              value={hasCm ? inchesDisplay : ""}
              onChange={(e) => setFromFeetInches(feetDisplay, parseFloat(e.target.value))}
              className="h-11 rounded-xl pr-9"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              in
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function StepAllergies({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
  return (
    <div className="space-y-6">
      <FieldIntro
        title={tp("Allergies")}
        body={tp(
          "Treated as life-critical — any direct ingredient or hidden derivative triggers the highest-risk rating.",
        )}
      />
      <div className="space-y-2">
        <Label>{tp("Select every allergen that applies")}</Label>
        <MultiSelect
          options={COMMON_ALLERGENS}
          selected={profile.allergens}
          onChange={(v) => patch({ allergens: v })}
          placeholder={tp("Select allergens")}
          searchPlaceholder={tp("Search allergens…")}
          getLabel={tp}
          selectedCountLabel={tp("selected")}
          nothingFoundLabel={tp("Nothing found.")}
        />
      </div>

      {profile.allergens.length > 0 && (
        <div className="animate-rise-in space-y-2">
          <Label>{tp("How severe is the reaction, typically?")}</Label>
          <Select
            value={profile.allergySeverity}
            onValueChange={(v) => patch({ allergySeverity: v as SafetyProfile["allergySeverity"] })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder={tp("Select severity")} />
            </SelectTrigger>
            <SelectContent>
              {ALLERGY_SEVERITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {tp(s.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>{tp("Gluten status (optional)")}</Label>
        <Select
          value={profile.glutenStatus}
          onValueChange={(v) => patch({ glutenStatus: v as SafetyProfile["glutenStatus"] })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder={tp("Not applicable")} />
          </SelectTrigger>
          <SelectContent>
            {GLUTEN_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {tp(s.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Celiac disease is treated far more strictly than general sensitivity — worth being precise
          here.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otherAllergies">{tp("Any other allergies (optional)")}</Label>
        <Textarea
          id="otherAllergies"
          rows={2}
          placeholder={tp("e.g. mango, chickpea flour, specific spice blends")}
          value={profile.otherAllergies}
          onChange={(e) => patch({ otherAllergies: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          {tp(
            "List anything not covered above — treated with the same priority as selected allergens.",
          )}
        </p>
      </div>
    </div>
  );
}

function StepConditions({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
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
        title={tp("Health conditions")}
        body={tp(
          "Select everything that applies, not just the most urgent one — conditions are weighed together, since combinations can even reverse each other's dietary advice.",
        )}
      />
      {CONDITION_CATEGORIES.map((group) => (
        <div key={group.category} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {tp(group.category)}
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
                  {tp(o)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hasDiabetes && (
        <div className="animate-rise-in space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">{tp("Diabetes detail")}</p>
          <div className="space-y-2">
            <Label>{tp("Type")}</Label>
            <Select
              value={profile.diabetes.type}
              onValueChange={(v) => patch({ diabetes: { ...profile.diabetes, type: v as never } })}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background">
                <SelectValue placeholder={tp("Select type")} />
              </SelectTrigger>
              <SelectContent>
                {DIABETES_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {tp(t.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{tp("Treatment")}</Label>
            <Select
              value={profile.diabetes.treatment}
              onValueChange={(v) =>
                patch({ diabetes: { ...profile.diabetes, treatment: v as never } })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-background">
                <SelectValue placeholder={tp("Select treatment")} />
              </SelectTrigger>
              <SelectContent>
                {DIABETES_TREATMENTS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {tp(t.label)}
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
              <SelectValue placeholder={tp("Select status")} />
            </SelectTrigger>
            <SelectContent>
              {HYPERTENSION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {tp(s.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasKidney && (
        <div className="animate-rise-in space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">{tp("Kidney detail")}</p>
          <Select
            value={profile.kidney.status}
            onValueChange={(v) => patch({ kidney: { status: v as never } })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue placeholder={tp("Select status")} />
            </SelectTrigger>
            <SelectContent>
              {KIDNEY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {tp(s.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Dialysis status matters a lot here — protein needs go up on dialysis, down without it.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="otherConditions">{tp("Any other health conditions (optional)")}</Label>
        <Textarea
          id="otherConditions"
          rows={2}
          placeholder={tp("e.g. gout, history of kidney stones, recent surgery")}
          value={profile.otherConditions}
          onChange={(e) => patch({ otherConditions: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          {tp("Anything not listed above that should influence food advice.")}
        </p>
      </div>
    </div>
  );
}

function StepSensitivities({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
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
        title={tp("Specific sensitivities")}
        body={tp(
          "Not allergies, but things that still change what's comfortable to eat — only flagged if you select them.",
        )}
      />
      <div className="space-y-2">
        <Label>{tp("Chemical / additive sensitivities (optional)")}</Label>
        <MultiSelect
          options={SENSITIVITIES}
          selected={profile.sensitivities}
          onChange={(v) => patch({ sensitivities: v })}
          placeholder={tp("Select any that apply")}
          searchPlaceholder={tp("Search…")}
          getLabel={tp}
          selectedCountLabel={tp("selected")}
          nothingFoundLabel={tp("Nothing found.")}
        />
      </div>

      <div className="space-y-2.5">
        <Label>{tp("Digestive symptom pattern (optional)")}</Label>
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
                {tp(o)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {tp("Helps direct fiber and FODMAP-related notes in the right direction.")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otherSensitivities">{tp("Any other sensitivities (optional)")}</Label>
        <Textarea
          id="otherSensitivities"
          rows={2}
          placeholder={tp("e.g. high histamine foods, nightshades, artificial sweeteners")}
          value={profile.otherSensitivities}
          onChange={(e) => patch({ otherSensitivities: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          {tp("Not true allergies — only flagged when relevant to comfort or tolerance.")}
        </p>
      </div>
    </div>
  );
}

function StepLifestyle({ profile, patch }: StepProps) {
  const tp = usePhrases(PROFILE_PHRASES);
  return (
    <div className="space-y-6">
      <FieldIntro
        title={tp("Lifestyle, medications & anything else")}
        body={tp(
          "Dietary and religious patterns add a separate layer of checks; medications matter only for well-established food-drug interactions.",
        )}
      />
      <div className="space-y-2">
        <Label>{tp("Dietary / religious pattern (optional)")}</Label>
        <MultiSelect
          options={DIETARY_PATTERNS}
          selected={profile.dietaryPatterns}
          onChange={(v) => patch({ dietaryPatterns: v })}
          placeholder={tp("Select any that apply")}
          searchPlaceholder={tp("Search…")}
          getLabel={tp}
          selectedCountLabel={tp("selected")}
          nothingFoundLabel={tp("Nothing found.")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">{tp("Current medications (optional)")}</Label>
        <Textarea
          id="medications"
          rows={2}
          placeholder={tp("e.g. warfarin, lisinopril")}
          value={profile.medications}
          onChange={(e) => patch({ medications: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          Only used for well-known food interactions (e.g. grapefruit, vitamin K-rich greens).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tp("Anything else to watch for?")}</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder={tp("e.g. also avoid red food dye; sodium under 140mg per serving")}
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
