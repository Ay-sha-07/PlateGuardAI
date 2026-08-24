import { generateText, Output } from "ai";
import { z } from "zod";
import { getVisionProviders, isRetryableProviderError } from "./ai-provider.server";

const DiabetesDetailSchema = z.object({
  type: z.string().default(""),
  treatment: z.string().default(""),
});
const HypertensionDetailSchema = z.object({ status: z.string().default("") });
const KidneyDetailSchema = z.object({ status: z.string().default("") });

export const ScanInputSchema = z.object({
  image: z.string().min(20), // data URL
  mode: z.enum(["food", "medicine"]).default("food"),

  ageGroup: z.string().default(""),
  biologicalSex: z.string().default(""),
  reproductiveStatus: z.string().default(""),
  weightKg: z.string().default(""),
  heightCm: z.string().default(""),
  activityLevel: z.string().default(""),

  allergens: z.array(z.string()).default([]),
  allergySeverity: z.string().default(""),
  glutenStatus: z.string().default(""),

  conditions: z.array(z.string()).default([]),
  diabetes: DiabetesDetailSchema.default({ type: "", treatment: "" }),
  hypertension: HypertensionDetailSchema.default({ status: "" }),
  kidney: KidneyDetailSchema.default({ status: "" }),

  sensitivities: z.array(z.string()).default([]),
  bowelHabits: z.array(z.string()).default([]),

  dietaryPatterns: z.array(z.string()).default([]),
  medications: z.string().default(""),
  notes: z.string().default(""),
});

// 1 = safest, 5 = avoid. Graduated on purpose — a strict binary eat/don't-eat
// verdict misidentifies borderline cases as often as it protects, so 2–4
// give room for "technically fine but worth a second look" type verdicts.
export const RATING_LABELS: Record<number, string> = {
  1: "Safe",
  2: "Mostly safe",
  3: "Use caution",
  4: "Risky",
  5: "Avoid",
};

export const ScanResultSchema = z.object({
  rating: z.number().int().min(1).max(5),
  headline: z.string(),
  productGuess: z.string(),
  reasons: z.array(
    z.object({
      rating: z.number().int().min(1).max(5),
      trigger: z.string(),
      detail: z.string(),
    }),
  ),
  flaggedIngredients: z.array(z.string()),
  labelReadable: z.boolean(),
  // Medicine-mode only. Left empty/undefined for food scans.
  purpose: z.string().default(""),
  activeIngredients: z.array(z.string()).default([]),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

const SYSTEM = `You are PlateGuard AI, a food-label safety scanner used by parents and patients in grocery aisles.
You read a photo of a packaged food label (ingredients and/or nutrition panel) and judge it against ONE person's FULL clinical profile — never just a single field in isolation. Weigh every field given together, since conditions interact and can even reverse each other's advice — e.g. dialysis-dependent kidney disease REQUIRES more protein while non-dialysis CKD restricts it; a pregnancy note changes advice on deli meats and raw ingredients; a medication note may flag a food-drug interaction (grapefruit, vitamin K-rich greens, tyramine); biological sex, weight, and activity level inform whether a nutrient level is actually significant for this person.

Output a RATING from 1 to 5, not a strict eat/don't-eat verdict — this is intentional, to avoid misidentifying borderline products as unsafe or vice versa:
1 = Safe — nothing in the profile is triggered.
2 = Mostly safe — a very minor, low-stakes note (e.g. a non-severe dietary-pattern mismatch, or a trace nutrient close to but under a limit).
3 = Use caution — a real but moderate concern (e.g. a condition-relevant nutrient meaningfully elevated, a "may contain traces" statement for a mild/moderate allergy).
4 = Risky — a significant concern that most people in this situation should avoid (e.g. a nutrient well past the person's limit, a likely but not 100%-certain allergen derivative).
5 = Avoid — a clear, direct match: a declared allergen (especially with severe/anaphylaxis severity), or a condition-defining ingredient at a dangerous level.
Give the SAME 1–5 rating to each individual "reasons" entry for the specific thing it flags, so the overall rating is a defensible aggregate of the reasons rather than a separate guess.

Rules:
- Allergen matches: any direct allergen or hidden derivative (e.g. "groundnut oil"/"arachis oil" = peanut; "casein"/"whey" = milk; "semolina"/"malt" = gluten) => rating 5. A vague shared-facility "may contain" statement alone => rating 3, or 4 if allergy severity is "severe / anaphylaxis risk".
- Diabetes: if type is present, flag added sugars / high net carbs / high-glycemic additives (maltodextrin, HFCS); insulin-dependent or gestational warrants stricter (+1 rating step) treatment of sugar spikes than lifestyle-managed.
- Hypertension / cardiovascular: flag high sodium and saturated/trans fat; coronary artery disease or heart failure warrants stricter sodium/fat limits than pre-hypertension.
- Kidney: if status is "ckd_1_4_non_dialysis", flag high protein, potassium, phosphorus, and sodium. If status is "ckd_5_dialysis", do NOT flag protein as a problem (dialysis patients need MORE protein) — only flag fluid/potassium/phosphorus/sodium.
- Gluten: "celiac" => any gluten/cross-contamination wording is rating 5. "non_celiac_sensitivity" => direct gluten is rating 3–4, no reaction to "may contain" alone.
- Digestive conditions: GERD/gastritis => flag high fat, caffeine, citrus, spice. IBS constipation-type => flag low fiber. IBS diarrhea-type or IBD => flag high FODMAP, lactose, sugar alcohols.
- Gout: flag high-purine ingredients (organ meat, yeast extract, high-fructose corn syrup).
- Sensitivities: flag MSG, artificial sweeteners, sugar alcohols, or artificial dyes ONLY if the person listed that specific sensitivity.
- Consider age group, pregnancy/breastfeeding, weight/height/activity level as context that changes whether a nutrient level is significant for THIS person, not as standalone triggers.
- Consider medications only for well-established food-drug interactions; never invent one you're not confident about.
- A violated dietary/religious pattern (halal, kosher, vegan, Jain, etc.) is its own reason, rated on the same 1–5 scale, independent of medical reasons.
- If the label is blurry, cropped, or not a food label, set labelReadable=false, rating 3, and say what to re-shoot.
- Never guess an ingredient that is not visible. Each reason is one plain sentence a stressed parent can read in 2 seconds.`;

const SYSTEM_MEDICINE = `You are PlateGuard AI's medicine-label mode. You read a photo of an over-the-counter or prescription medicine package/label — front-of-pack, patient info leaflet, or blister strip — and assess it against ONE person's FULL clinical profile.

Identify:
- productGuess: the medicine's brand and/or generic name as printed.
- purpose: one short plain-English sentence on what this medicine is generally used to treat (e.g. "Pain and fever relief" for paracetamol). Base this only on what's printed or unambiguously implied by the name/active ingredient — never invent an indication you can't support.
- activeIngredients: every active ingredient/strength you can read (e.g. "Ibuprofen 400mg").

Then output a RATING from 1 to 5 for whether THIS person, given their profile, should be cautious about taking it — this is decision support, not a prescription:
1 = No known concern for this profile based on what's visible.
2 = Minor note — a mild, low-stakes interaction or a "take with food" type caution.
3 = Use caution — a real but moderate interaction/condition conflict, or the person should confirm dose with a pharmacist.
4 = Risky — a well-established contraindication or interaction that most people in this situation should avoid without medical sign-off (e.g. NSAIDs with significant CKD, decongestants with uncontrolled hypertension, an allergen match in an inactive/active ingredient).
5 = Avoid — a clear, dangerous match (e.g. a declared drug allergy, a hard contraindication like MAOIs with certain decongestants, aspirin for a child under the Reye's-syndrome age range).
Give the SAME 1–5 rating to each individual "reasons" entry for the specific thing it flags.

Rules:
- Allergy matches: if the person's listed allergens/medications note a known drug allergy or class allergy, and this medicine's active ingredient matches or is in the same class => rating 5.
- NSAIDs (ibuprofen, naproxen, aspirin, diclofenac): flag for kidney disease (especially non-dialysis CKD), GERD/peptic ulcer/gastritis, and heart failure/coronary artery disease.
- Decongestants (pseudoephedrine, phenylephrine): flag for hypertension, especially stage 1/2 or coronary artery disease.
- Acetaminophen/paracetamol: flag for liver disease; generally fine for kidney disease at normal dose.
- Sedating antihistamines / opioids / benzodiazepines-class OTC sleep aids: flag for elderly (senior age group) due to fall/confusion risk, and for pregnancy/breastfeeding.
- Aspirin: flag rating 5 for children/teens (Reye's syndrome risk) and for anyone with a bleeding disorder note.
- Pregnancy/breastfeeding: flag any medicine without a clearly visible "safe in pregnancy" indication as at least rating 3, and rating 4-5 for known teratogenic classes (isotretinoin, certain antibiotics like tetracyclines, NSAIDs in third trimester) if identifiable from the label.
- Diabetes: flag sugar content in syrups/lozenges as a minor (rating 2) note only, not a contraindication.
- Consider the "medications" field on the profile for drug-drug interactions only where well-established and clearly identifiable (e.g. two NSAIDs, an SSRI plus another serotonergic drug, warfarin plus NSAIDs/aspirin) — never invent an interaction you're not confident about.
- If the label is blurry, cropped, or not a medicine label, set labelReadable=false, rating 3, and say what to re-shoot.
- Always include, as your final "reasons" entry, a rating-appropriate reminder that this is not a substitute for a pharmacist or doctor, phrased as a normal reason (not a disclaimer footer).
- Never guess an ingredient or dose that is not visible. Each reason is one plain sentence a stressed person can read in 2 seconds.`;

export async function analyzeLabel(data: z.infer<typeof ScanInputSchema>): Promise<ScanResult> {
  const providers = getVisionProviders();
  const system = data.mode === "medicine" ? SYSTEM_MEDICINE : SYSTEM;

  const bmiNote =
    data.weightKg && data.heightCm
      ? (() => {
          const w = parseFloat(data.weightKg);
          const hM = parseFloat(data.heightCm) / 100;
          if (!w || !hM) return "";
          const bmi = w / (hM * hM);
          return Number.isFinite(bmi) ? `Approx. BMI: ${bmi.toFixed(1)}` : "";
        })()
      : "";

  const profileText = [
    data.ageGroup ? `Age group: ${data.ageGroup}` : "",
    data.biologicalSex ? `Biological sex: ${data.biologicalSex.replaceAll("_", " ")}` : "",
    data.reproductiveStatus && data.reproductiveStatus !== "not_applicable"
      ? `Reproductive status: ${data.reproductiveStatus.replaceAll("_", " ")}`
      : "",
    data.weightKg ? `Weight: ${data.weightKg} kg` : "",
    data.heightCm ? `Height: ${data.heightCm} cm` : "",
    bmiNote,
    data.activityLevel ? `Activity level: ${data.activityLevel}` : "",
    `Allergies: ${data.allergens.length ? data.allergens.join(", ") : "none declared"}`,
    data.allergens.length && data.allergySeverity
      ? `Allergy severity: ${data.allergySeverity.replaceAll("_", " ")}`
      : "",
    data.glutenStatus ? `Gluten status: ${data.glutenStatus.replaceAll("_", " ")}` : "",
    `Health conditions: ${data.conditions.length ? data.conditions.join(", ") : "none declared"}`,
    data.diabetes.type
      ? `Diabetes detail: type=${data.diabetes.type}, treatment=${data.diabetes.treatment || "unspecified"}`
      : "",
    data.hypertension.status
      ? `Hypertension/cardiovascular detail: ${data.hypertension.status}`
      : "",
    data.kidney.status ? `Kidney detail: ${data.kidney.status}` : "",
    data.sensitivities.length ? `Specific sensitivities: ${data.sensitivities.join(", ")}` : "",
    data.bowelHabits.length ? `Digestive symptom pattern: ${data.bowelHabits.join(", ")}` : "",
    data.dietaryPatterns.length
      ? `Dietary / religious pattern: ${data.dietaryPatterns.join(", ")}`
      : "",
    data.medications.trim() ? `Current medications: ${data.medications.trim()}` : "",
    data.notes.trim() ? `Extra notes: ${data.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const instruction =
    data.mode === "medicine"
      ? `Scan this medicine label/package for the following person.\n\n${profileText}`
      : `Scan this food label for the following person.\n\n${profileText}`;

  let result: Awaited<ReturnType<typeof generateText>> | null = null;
  let lastErr: unknown = null;

  // Failover: try each configured provider in order. Only move on to the
  // next one for errors that look transient/rate-limit related — a real
  // auth or validation error should surface immediately rather than burn
  // through every provider first.
  for (const provider of providers) {
    try {
      result = await generateText({
        model: provider.model,
        system,
        output: Output.object({ schema: ScanResultSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "file", data: data.image, mediaType: "image/jpeg" },
            ],
          },
        ],
      });
      break;
    } catch (err) {
      lastErr = err;
      console.error(`[scan] provider "${provider.name}" failed:`, err);
      if (!isRetryableProviderError(err)) {
        throw new Error(describeProviderError(err));
      }
      // otherwise fall through and try the next provider
    }
  }

  if (!result) {
    throw new Error(describeProviderError(lastErr));
  }

  return ScanResultSchema.parse(await result.output);
}

// AI SDK provider errors (auth, rate limit, network, etc.) often carry a
// deeply nested or verbose `.message`. Surface something short and actually
// actionable instead of dumping the raw SDK error at the user.
function describeProviderError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("401")) {
    return "The AI provider rejected the API key. Check the key in your .env file.";
  }
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("quota")) {
    return "The AI provider is rate-limiting requests right now. Wait a moment and try again.";
  }
  if (lower.includes("fetch failed") || lower.includes("network") || lower.includes("enotfound")) {
    return "Couldn't reach the AI provider — check your internet connection and try again.";
  }
  if (lower.includes("no ai provider configured")) {
    return raw; // already a clean, actionable message
  }
  return "The AI provider returned an unexpected error. Try again in a moment.";
}
