export type BarcodeLookupResult = {
  found: true;
  productName: string;
  ingredientText: string;
} | {
  found: false;
};

/**
 * Looks up a barcode against the free, keyless Open Food Facts catalog
 * and returns the product name + ingredient list as plain text, ready to
 * drop into the scanner's "paste label text" field. Runs client-side —
 * Open Food Facts' read API is CORS-enabled for browser use.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const trimmed = barcode.trim();
  if (!trimmed) return { found: false };

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json?fields=product_name,ingredients_text,nutriments,brands`,
    );
    if (!res.ok) return { found: false };
    const data = await res.json();
    if (data.status !== 1 || !data.product) return { found: false };

    const p = data.product as {
      product_name?: string;
      brands?: string;
      ingredients_text?: string;
      nutriments?: Record<string, number | string>;
    };

    const ingredientText = p.ingredients_text?.trim();
    if (!ingredientText) return { found: false };

    const nutrientLines = p.nutriments
      ? [
          fmtNutrient("Energy", p.nutriments["energy-kcal_100g"], "kcal/100g"),
          fmtNutrient("Sugars", p.nutriments["sugars_100g"], "g/100g"),
          fmtNutrient("Salt", p.nutriments["salt_100g"], "g/100g"),
          fmtNutrient("Saturated fat", p.nutriments["saturated-fat_100g"], "g/100g"),
        ]
          .filter(Boolean)
          .join("; ")
      : "";

    return {
      found: true,
      productName: [p.brands, p.product_name].filter(Boolean).join(" — ") || trimmed,
      ingredientText: nutrientLines
        ? `Ingredients: ${ingredientText}\nNutrition (per 100g): ${nutrientLines}`
        : `Ingredients: ${ingredientText}`,
    };
  } catch {
    return { found: false };
  }
}

function fmtNutrient(label: string, value: number | string | undefined, unit: string): string {
  if (value === undefined || value === null || value === "") return "";
  return `${label} ${value}${unit.startsWith("kcal") ? "" : ""} ${unit}`;
}
