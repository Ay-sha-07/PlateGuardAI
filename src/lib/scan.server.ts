import { generateText, Output } from "ai";
import { z } from "zod";
import { getVisionProviders, diagnoseProviderError } from "./ai-provider.server";
import { markProviderFailure, markProviderSuccess, shouldSkipProvider } from "./ai-health.server";

const DiabetesDetailSchema = z.object({
  type: z.string().default(""),
  treatment: z.string().default(""),
});
const HypertensionDetailSchema = z.object({ status: z.string().default("") });
const KidneyDetailSchema = z.object({ status: z.string().default("") });

export const ScanInputSchema = z
  .object({
    // A scan can come from a label image, pasted label text, or a verified
    // barcode/catalog match. Barcode identity is a complete scan path even
    // when the catalog does not provide an ingredient list.
    image: z.string().min(20).optional(), // data URL
    ingredientText: z.string().min(3).optional(), // pasted/typed label text, no photo
    productName: z.string().default(""), // optional user-typed product name, or barcode-lookup result
    barcode: z.string().optional(),
    barcodeProductName: z.string().default(""),
    barcodeIngredientText: z.string().default(""),
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
  })
  .refine((v) => !!v.image || !!v.ingredientText || (!!v.barcode && !!v.barcodeProductName), {
    message: "Provide a label photo, pasted ingredient text, or a verified barcode match.",
    path: ["image"],
  });

// 1 = safest, 5 = avoid. Graduated on purpose — a strict binary eat/don't-eat
// verdict misidentifies borderline cases as often as it protects, so 2–4
// give room for "technically fine but worth a second look" type verdicts.
export const RATING_LABELS: Record<number, string> = {
  1: "Avoid",
  2: "Risky",
  3: "Use caution",
  4: "Mostly safe",
  5: "Safe",
};

export const ScanResultSchema = z.object({
  rating: z.number().int().min(1).max(5),
  headline: z.string(),
  productGuess: z.string(),
  // Detailed, user-facing explanation. These fields are persisted with the scan
  // so the History detail view can reproduce the AI result later.
  summary: z.string().default(""),
  whatItIs: z.string().default(""),
  labelEvidence: z.array(z.string()).default([]),
  nutritionHighlights: z.array(z.string()).default([]),
  profileImpact: z.array(
    z.object({
      rating: z.number().int().min(1).max(5),
      trigger: z.string(),
      detail: z.string(),
    }),
  ).default([]),
  recommendation: z.string().default(""),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
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
  itemType: z.enum(["food", "non_food", "medicine", "unclear"]).default("unclear"),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

const SYSTEM = `You are PlateGuard AI, a food-label safety scanner used by parents and patients in grocery aisles.
You first classify what is actually shown. For food mode, the primary safety question is EDIBILITY: is this a food or beverage intended for human consumption? Cosmetics, perfume, body oil, mineral oil/cosmetic oil, body lotion, shampoo, soap, detergent, cleaners, medicines, supplements, and other non-food products are NOT edible and must never receive a food rating of Safe or Mostly safe. Set itemType="non_food" for those products. Only set itemType="food" when the visible product is clearly intended to be eaten or drunk. If you cannot tell, use itemType="unclear". Then, if and only if it is food, judge it against ONE person's FULL clinical profile — never just a single field in isolation. Weigh every field given together, since conditions interact and can even reverse each other's advice — e.g. dialysis-dependent kidney disease REQUIRES more protein while non-dialysis CKD restricts it; a pregnancy note changes advice on deli meats and raw ingredients; a medication note may flag a food-drug interaction (grapefruit, vitamin K-rich greens, tyramine); biological sex, weight, and activity level inform whether a nutrient level is actually significant for this person.

Output a RATING from 1 to 5, not a strict eat/don't-eat verdict — this is intentional, to avoid misidentifying borderline products as unsafe or vice versa:
1 = Safe — nothing in the profile is triggered.
2 = Mostly safe — a very minor, low-stakes note (e.g. a non-severe dietary-pattern mismatch, or a trace nutrient close to but under a limit).
3 = Use caution — a real but moderate concern (e.g. a condition-relevant nutrient meaningfully elevated, a "may contain traces" statement for a mild/moderate allergy).
4 = Risky — a significant concern that most people in this situation should avoid (e.g. a nutrient well past the person's limit, a likely but not 100%-certain allergen derivative).
5 = Avoid — a clear, direct match: a declared allergen (especially with severe/anaphylaxis severity), or a condition-defining ingredient at a dangerous level.
Give the SAME 1–5 rating to each individual "reasons" entry for the specific thing it flags, so the overall rating is a defensible aggregate of the reasons rather than a separate guess.

Detailed result requirements:
- summary: 2–4 plain-English sentences explaining what was scanned, the main result, and why the rating was reached.
- whatItIs: identify the generic product type/variant only from visible or verified evidence. Do NOT mention the manufacturer, company, brand, trademark, or seller name.
- labelEvidence: list the important visible label facts that support the result (ingredients, nutrition values, warnings, certification wording, barcode evidence, or readable claims). Never invent a value.
- nutritionHighlights: list relevant nutrition/ingredient observations, including actual visible quantities when readable; otherwise say that the quantity was not readable.
- profileImpact: explain how each important part of THIS person's profile affected the decision. Include only meaningful checks; do not pretend every profile field was relevant.
- recommendation: give a short practical next step in plain English. For safe foods, explain what is safe about it; for caution/risk, say what to limit/avoid or verify.
- confidence: high only when product identity and label evidence are clear; medium for partial evidence; low when the image or identity is uncertain.
- Never mention a manufacturer, company, brand, trademark, or seller name anywhere in the user-facing output, including summary, whatItIs, reasons, labelEvidence, nutritionHighlights, profileImpact, recommendation, purpose, or activeIngredients. Use generic descriptions such as "packaged drinking water", "clarified butter (ghee)", "black tea", or "pain-relief medicine".
- Do not hide uncertainty behind confident language. Never invent ingredients, nutrition values, medical interactions, or product facts.

Rules:
- Identity accuracy is more important than producing a confident-looking answer. Never invent a brand/product from a blurry label. If the visible image and barcode/catalog evidence disagree, set itemType="unclear", rating=3, and ask the user to rescan the label or confirm the product.
- Barcode/catalog evidence: when a verified barcode match is supplied, treat its product name as strong identity evidence. Do not replace a verified barcode product with an unrelated product merely because a logo/color/package shape resembles something else.
- Water and beverages: drinking water is a food/beverage. If the product is clearly plain drinking water, do not call it unsafe merely because it has no ingredients. Only raise a health concern when the person's profile or visible product information provides a real reason (for example, a documented fluid restriction).
- Common edible foods must not be classified as non-food: ghee/clarified butter, butter, milk, curd/yogurt, cheese, cooking oil, flour, rice, grains, spices, tea, coffee, packaged snacks, fruits, vegetables, meat, fish, eggs, and other clearly edible foods are itemType="food". A nutrition facts panel and an ingredient such as milk fat are strong evidence of a food product.
- Food-mode hard gate: if itemType="non_food", rating MUST be 5, headline MUST clearly say "Not edible — do not eat", and include a reason stating that the scanned item is not food. Do not describe a non-food item as safe merely because no allergy or health trigger was found.
- Food-mode uncertainty: if itemType="unclear", never call the item Safe; use rating 3 and clearly ask the user to verify the product type.
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
- productGuess: the generic medicine/product type and variant only. Never include the manufacturer, company, brand, trademark, or seller name.
- purpose: one short plain-English sentence on what this medicine is generally used to treat (e.g. "Pain and fever relief" for paracetamol). Base this only on what's printed or unambiguously implied by the name/active ingredient — never invent an indication you can't support.
- activeIngredients: every active ingredient/strength you can read (e.g. "Ibuprofen 400mg").

Then output a RATING from 1 to 5 for whether THIS person, given their profile, should be cautious about taking it — this is decision support, not a prescription:
1 = No known concern for this profile based on what's visible.
2 = Minor note — a mild, low-stakes interaction or a "take with food" type caution.
3 = Use caution — a real but moderate interaction/condition conflict, or the person should confirm dose with a pharmacist.
4 = Risky — a well-established contraindication or interaction that most people in this situation should avoid without medical sign-off (e.g. NSAIDs with significant CKD, decongestants with uncontrolled hypertension, an allergen match in an inactive/active ingredient).
5 = Avoid — a clear, dangerous match (e.g. a declared drug allergy, a hard contraindication like MAOIs with certain decongestants, aspirin for a child under the Reye's-syndrome age range).
Give the SAME 1–5 rating to each individual "reasons" entry for the specific thing it flags.

Detailed result requirements:
- summary: 2–4 plain-English sentences explaining what the medicine is and why the rating was reached.
- whatItIs: the generic medicine/product type, dosage form, and variant from the label. Never include a manufacturer, company, brand, trademark, or seller name.
- labelEvidence: visible active ingredients, strengths, warnings, age/dose information, and other important label facts; never invent unreadable values.
- nutritionHighlights: leave empty for medicine scans unless the label contains a meaningful excipient/sugar detail relevant to the decision.
- profileImpact: explain the important interactions with the person's conditions, allergies, age, pregnancy status, or medicines.
- recommendation: a practical next step, such as checking with a pharmacist or following the printed directions.
- confidence: high/medium/low based on label readability and identity certainty.

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

/**
 * Keep product naming generic in the UI. AI/barcode identity is still used
 * internally for verification, but the user-facing product label should not
 * repeat a potentially hallucinated company/brand name.
 */
function genericProductName(value: string): string {
  const raw = value.trim();
  if (!raw) return raw;

  // Common product-category anchors let us discard leading brand/manufacturer
  // text without damaging useful variant information. This is deliberately
  // conservative: if no clear category is present, keep the model's generic
  // wording rather than guessing what part is a brand.
  const anchors = [
    "packaged drinking water", "drinking water", "mineral water",
    "black tea", "green tea", "tea", "coffee", "ghee", "clarified butter",
    "butter", "milk", "curd", "yogurt", "yoghurt", "cheese", "paneer",
    "cooking oil", "edible oil", "olive oil", "sunflower oil", "rice",
    "wheat flour", "flour", "atta", "oats", "bread", "biscuits",
    "cookies", "noodles", "pasta", "cereal", "chips", "snack",
    "juice", "beverage", "soft drink", "chocolate", "honey", "jam",
    "pickle", "sauce", "ketchup", "salt", "sugar", "spice", "masala",
    "lentils", "dal", "chickpeas", "beans", "egg", "eggs", "chicken",
    "fish", "meat", "paracetamol", "acetaminophen", "ibuprofen",
    "naproxen", "aspirin", "antacid", "antihistamine", "cough syrup",
  ];
  const lower = raw.toLowerCase();
  let bestIndex = -1;
  let bestLength = 0;
  for (const anchor of anchors) {
    const idx = lower.indexOf(anchor);
    if (idx >= 0 && anchor.length > bestLength) {
      bestIndex = idx;
      bestLength = anchor.length;
    }
  }
  if (bestIndex > 0) {
    return raw.slice(bestIndex).trim().replace(/^[-–—:|]+\s*/, "");
  }
  return raw;
}

function withoutBrandName(result: ScanResult): ScanResult {
  return { ...result, productGuess: genericProductName(result.productGuess) };
}

/**
 * The model internally reasons on the original risk scale (1 = safest, 5 =
 * highest risk). PlateGuard's public UI uses the more intuitive safety scale:
 * 1 = avoid/unsafe and 5 = safe. Convert every rating-bearing field at the
 * server boundary so the UI, history, and persisted results all use one scale.
 */
function toSafetyRating(value: number): number {
  return 6 - value;
}

function toSafetyScale(result: ScanResult): ScanResult {
  return {
    ...result,
    rating: toSafetyRating(result.rating),
    profileImpact: result.profileImpact.map((item) => ({
      ...item,
      rating: toSafetyRating(item.rating),
    })),
    reasons: result.reasons.map((item) => ({
      ...item,
      rating: toSafetyRating(item.rating),
    })),
  };
}

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

  const productNameNote = data.productName.trim()
    ? `The shopper typed/scanned this product name: "${data.productName.trim()}".`
    : "";

  const barcodeEvidence = data.barcodeProductName.trim()
    ? [
        `Verified barcode detected: ${data.barcode ?? "unknown"}.`,
        `A verified barcode catalog matched this item. Use the match only as identity evidence; do not repeat any brand, manufacturer, company, trademark, or seller name in the response.`,
        data.barcodeIngredientText.trim()
          ? `Catalog label/nutrition evidence: ${data.barcodeIngredientText.trim()}`
          : "The catalog has no ingredient list for this product; do not treat that absence as evidence that it is not food.",
      ].join("\n")
    : "";

  const hasImage = !!data.image;
  const hasBarcodeMatch = !hasImage && !!data.barcode && !!data.barcodeProductName.trim();
  const source = hasImage
    ? "Scan this label photo"
    : hasBarcodeMatch
      ? "Analyze this product using the verified barcode/catalog identity and any catalog evidence provided (no label photo was provided)"
      : "Analyze this ingredient/nutrition text the shopper typed or pasted (no photo was provided)";

  const instruction = [
    `${source} for the following person.`,
    productNameNote,
    barcodeEvidence,
    !hasImage && data.ingredientText ? `Label text:\n${data.ingredientText.trim()}` : "",
    "",
    profileText,
  ]
    .filter(Boolean)
    .join("\n");

  let result: Awaited<ReturnType<typeof generateText>> | null = null;
  let lastDiagnosis: ReturnType<typeof diagnoseProviderError> | null = null;
  const providerFailures: Array<{ name: string; diagnosis: ReturnType<typeof diagnoseProviderError> }> = [];

  // Failover strategy, using the REAL diagnosis (HTTP status + response
  // body via APICallError, see ai-provider.server.ts) rather than guessing
  // from error text:
  //  - image_size / request_format: the problem is the request itself, not
  //    the provider — it would fail identically on every provider, so stop
  //    immediately instead of burning through the whole list.
  //  - rate_limit / server_overload / network: transient, worth one retry
  //    on the SAME provider after a short delay before moving on.
  //  - auth / quota / model_not_found / unknown: specific to that provider
  //    or key — no point retrying it, but a different provider may well
  //    work, so move on immediately.
  providerLoop: for (const provider of providers) {
    // Do not waste requests on a provider that recently proved rate-limited,
    // out of quota, unauthorized, or otherwise unavailable.
    if (shouldSkipProvider(provider.name)) {
      console.info(`[scan] skipping provider "${provider.name}" because it is temporarily unavailable`);
      continue;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        result = await generateText({
          model: provider.model,
          system,
          output: Output.object({ schema: ScanResultSchema }),
          messages: [
            {
              role: "user",
              content: hasImage
                ? [
                    { type: "text", text: instruction },
                    { type: "file", data: data.image!, mediaType: "image/jpeg" },
                  ]
                : [{ type: "text", text: instruction }],
            },
          ],
        });
        markProviderSuccess(provider.name);
        break providerLoop;
      } catch (err) {
        const diagnosis = diagnoseProviderError(err);
        lastDiagnosis = diagnosis;
        providerFailures.push({ name: provider.name, diagnosis });
        markProviderFailure(provider.name, diagnosis);
        console.error(
          `[scan] provider "${provider.name}" attempt ${attempt + 1} failed ` +
            `[category=${diagnosis.category}]: ${diagnosis.detail}`,
        );

        if (diagnosis.category === "image_size" || diagnosis.category === "request_format") {
          throw new Error(describeProviderError(diagnosis, provider.name));
        }
        if (diagnosis.retryable && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500));
          continue; // retry the same provider once
        }
        break; // move on to the next provider
      }
    }
  }

  if (!result) {
    const summary = providerFailures
      .map(({ name, diagnosis }) => `${name}: ${diagnosis.category}`)
      .join("; ");
    const hint =
      providers.length === 1
        ? " Add a second valid vision provider key for automatic failover."
        : " Fix at least one configured provider key/model/billing setting, then retry.";
    throw new Error(
      `${lastDiagnosis ? describeProviderError(lastDiagnosis) : "No AI provider was reachable."} ` +
        `Providers tried: ${summary || "none"}.${hint}`,
    );
  }

  const parsed = ScanResultSchema.parse(await result.output);
  // Keep a raw copy only for internal barcode-vs-vision consistency checks.
  // The user-facing result is immediately normalized to a generic product
  // description so a mistaken brand/company guess is never shown as fact.
  const rawProductGuess = parsed.productGuess;
  parsed.productGuess = genericProductName(parsed.productGuess);

  // Barcode identity is a strong, deterministic product signal. If it says
  // one product and vision invents a different product (as happened with a
  // bottled-water scan being called tea), never display the hallucinated name.
  // We retain the safety analysis only when it is still about the same item;
  // otherwise force a conservative identity-mismatch result.
  if (data.mode === "food" && data.barcodeProductName.trim()) {
    const catalogName = data.barcodeProductName.trim().toLowerCase();
    const visionName = `${rawProductGuess} ${parsed.headline}`.toLowerCase();
    const catalogTokens = catalogName.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
    const matchesCatalog = catalogTokens.length > 0 && catalogTokens.some((token) => visionName.includes(token));
    if (!matchesCatalog) {
      const looksLikeWater = /\b(water|aquafina|bisleri|drinking water|mineral water|packaged drinking)\b/i.test(catalogName);

      if (looksLikeWater) {
        // Plain packaged water should not inherit tea/food-specific warnings
        // from a hallucinated vision result. Only flag water when the profile
        // itself contains a plausible fluid-restriction concern.
        const profileMayRestrictFluids =
          /\b(heart\s*failure|fluid\s*restriction|fluid\s*overload|oedema|edema|hyponatremia)\b/i.test(
            data.conditions.join(" "),
          ) || /ckd|kidney|dialysis/i.test(data.kidney.status);
        const waterRating = profileMayRestrictFluids ? 3 : 1;

        return toSafetyScale({
          ...parsed,
          rating: waterRating,
          headline: profileMayRestrictFluids
            ? "Drinking water — check your fluid limit"
            : "Drinking water — verified",
          productGuess: genericProductName(data.barcodeProductName.trim()),
          labelReadable: true,
          itemType: "food",
          reasons: [
            {
              rating: waterRating,
              trigger: "Verified product",
              detail: "A verified barcode matched this product category.",
            },
            ...(profileMayRestrictFluids
              ? [{
                  rating: 3,
                  trigger: "Fluid intake may need limits",
                  detail: "Your profile may require a fluid limit; follow the amount advised by your clinician.",
                }]
              : []),
          ],
        });
      }

      return toSafetyScale({
        ...parsed,
        rating: 3,
        headline: "Product identity could not be confirmed",
        productGuess: genericProductName(data.barcodeProductName.trim()),
        labelReadable: false,
        itemType: "unclear",
        reasons: [
          {
            rating: 3,
            trigger: "Product identity mismatch",
            detail: "The verified barcode and image analysis disagree. Please rescan the label clearly before relying on the result.",
          },
        ],
      });
    }
  }

  // Deterministic non-food evidence is collected before the edible override so
  // a phrase such as "FOR EXTERNAL USE ONLY" can never be overridden by a
  // generic word such as "oil" or "food" elsewhere on the label.
  const nonFoodPattern = /\b(perfume|parfum|fragrance|body\s+oil|cosmetic\s+oil|massage\s+oil|hair\s+oil|mineral\s+oil|body\s+lotion|lotion|moisturizer|moisturiser|shampoo|conditioner|soap|body\s+wash|face\s+wash|cleanser|sunscreen|deodorant|makeup|cosmetic|lipstick|foundation|detergent|dishwasher|dish\s+soap|floor\s+cleaner|toilet\s+cleaner|bleach|fabric\s+softener|hand\s+sanitizer|sanitiser|air\s+freshener|insecticide|pesticide)\b/i;
  const externalUsePattern = /\b(for\s+external\s+use\s+only|external\s+use\s+only|not\s+for\s+human\s+consumption|not\s+intended\s+for\s+human\s+consumption|do\s+not\s+ingest|do\s+not\s+eat|cosmetic\s+product)\b/i;
  const classificationText = [
    data.productName,
    data.barcodeProductName,
    data.barcodeIngredientText,
    parsed.productGuess,
    parsed.headline,
    parsed.summary,
    parsed.whatItIs,
    parsed.recommendation,
    ...parsed.labelEvidence,
    ...parsed.nutritionHighlights,
    ...parsed.flaggedIngredients,
    ...parsed.reasons.map((reason) => `${reason.trigger} ${reason.detail}`),
  ].join(" ");
  const hasStrongExternalUseEvidence = externalUsePattern.test(classificationText);

  // Deterministic food override: some ordinary edible products can be
  // mislabeled by vision models as non-food (for example ghee because its
  // label is dominated by nutrition facts and manufacturing text). Strong
  // edible-food terms take precedence over a contradictory itemType.
  const foodPattern = /\b(ghee|clarified\s+butter|butter|milk\s+fat|milk|curd|yogurt|yoghurt|cheese|paneer|cooking\s+oil|edible\s+oil|flour|atta|rice|wheat|oats|barley|rye|lentil|dal|chickpea|bean|tea|coffee|biscuit|cookie|bread|cereal|snack|chips|juice|drink|beverage|water|mineral\s+water|drinking\s+water|fruit|vegetable|meat|chicken|fish|egg|spice|masala|sugar|salt|honey|jam|pickle|sauce|ketchup)\b/i;
  const foodEvidenceText = [
    data.productName,
    data.barcodeProductName,
    data.barcodeIngredientText,
    parsed.productGuess,
    parsed.headline,
    ...parsed.reasons.map((reason) => `${reason.trigger} ${reason.detail}`),
  ].join(" ");
  const clearlyEdible =
    data.mode === "food" &&
    foodPattern.test(foodEvidenceText) &&
    !hasStrongExternalUseEvidence &&
    !nonFoodPattern.test(classificationText);

  if (clearlyEdible && parsed.itemType === "non_food") {
    const filteredReasons = parsed.reasons.filter(
      (reason) => !/not (a )?food|non[- ]?food|cosmetic|lotion|perfume|soap|detergent|shampoo/i.test(`${reason.trigger} ${reason.detail}`),
    );
    return toSafetyScale({
      ...parsed,
      itemType: "food",
      rating: filteredReasons.length > 0 ? Math.min(5, Math.max(1, Math.max(...filteredReasons.map((reason) => reason.rating)))) : 1,
      headline: filteredReasons.length > 0 ? parsed.headline.replace(/not edible[^—-]*[—-]?\s*/i, "") || "Food product — see profile checks" : "Food product — safe based on the scanned information",
      reasons: filteredReasons.length > 0 ? filteredReasons : [{
        rating: 1,
        trigger: "Verified food product",
        detail: "The label appears to be an edible food product intended for human consumption.",
      }],
    });
  }

  // Deterministic non-food guard: if the model or the shopper's typed name
  // contains an unmistakable cosmetic/household/product term, never let the
  // food scanner classify it as edible. This specifically prevents items such
  // as perfume and body lotion from receiving a misleading "Safe" verdict.
  const isClearlyNonFood =
    data.mode === "food" &&
    (parsed.itemType === "non_food" ||
      nonFoodPattern.test(classificationText) ||
      hasStrongExternalUseEvidence);

  // Never allow a non-edible product to be reported as safe in food mode.
  // This is a deterministic safety gate in addition to the model instruction.
  if (isClearlyNonFood) {
    const cleanedReasons = parsed.reasons.filter(
      (reason) =>
        !/verified food|food product|safe based on the scanned information|not (a )?food|non[- ]?food|cosmetic|body\s+oil|lotion|perfume|soap|detergent|shampoo/i.test(
          `${reason.trigger} ${reason.detail}`,
        ),
    );
    return toSafetyScale({
      ...parsed,
      itemType: "non_food",
      rating: 5,
      headline: "Not edible — do not ingest",
      summary:
        "The label indicates that this is a non-food product intended for external use, not human consumption.",
      whatItIs: genericProductName(parsed.whatItIs || parsed.productGuess),
      recommendation: "Do not ingest this product. Follow the printed directions for external use only.",
      reasons: [
        {
          rating: 5,
          trigger: "Not a food product",
          detail: "The label identifies this as a non-food/external-use product, so it should not be eaten or swallowed.",
        },
        ...cleanedReasons,
      ],
    });
  }

  if (data.mode === "food" && parsed.itemType === "unclear") {
    return toSafetyScale({
      ...parsed,
      rating: Math.max(3, parsed.rating),
      headline: "Product type unclear — do not eat until verified",
      reasons: [
        {
          rating: 3,
          trigger: "Product type unclear",
          detail: "The scan could not confirm that this item is food intended for eating or drinking.",
        },
        ...parsed.reasons,
      ],
    });
  }

  return toSafetyScale(withoutBrandName(parsed));
}

// Builds a short, actionable message from a structured diagnosis instead of
// a generic "something went wrong" — the category comes from the real HTTP
// status code + response body where the provider gave us one (see
// diagnoseProviderError in ai-provider.server.ts), not from string-matching
// on `.message`.
function describeProviderError(
  diagnosis: ReturnType<typeof diagnoseProviderError>,
  providerName?: string,
): string {
  const who = providerName ? ` (${providerName})` : "";
  switch (diagnosis.category) {
    case "auth":
      return `The AI provider${who} rejected the API key — it's missing, wrong, or lacks access to this model. [${diagnosis.detail}]`;
    case "quota":
      return `The AI provider${who} has run out of quota (not just a momentary rate limit — the account/key needs a billing or plan check). [${diagnosis.detail}]`;
    case "rate_limit":
      return `The AI provider${who} is rate-limiting requests right now. Wait a moment and try again. [${diagnosis.detail}]`;
    case "model_not_found":
      return `The AI provider${who} doesn't recognize the configured model name — check the *_MODEL override in .env. [${diagnosis.detail}]`;
    case "image_size":
      return `The photo is too large or in an unsupported format for the AI provider${who} to accept. Try retaking it closer/at lower resolution. [${diagnosis.detail}]`;
    case "request_format":
      return `The AI provider${who} rejected the request as malformed. [${diagnosis.detail}]`;
    case "server_overload":
      return `The AI provider${who} is temporarily overloaded on their end. Try again shortly. [${diagnosis.detail}]`;
    case "network":
      return `Couldn't reach the AI provider${who} — check your network connection. [${diagnosis.detail}]`;
    default:
      return `The AI provider${who} returned an error we haven't specifically classified yet. [${diagnosis.detail}]`;
  }
}
