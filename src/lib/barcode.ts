export type BarcodeLookupResult = {
  found: true;
  productName: string;
  ingredientText: string;
  barcode: string;
} | {
  found: false;
};


const KNOWN_PRODUCT_BARCODES: Record<string, { productName: string; ingredientText?: string }> = {
  // Common Indian packaged-water EANs. These are used as a local identity
  // fallback if the free catalog is missing or has stale data.
  "8902080504060": { productName: "Aquafina Packaged Drinking Water 1 L", ingredientText: "Ingredients: Treated water" },
  "8906017290033": { productName: "Bisleri Packaged Drinking Water 500 ml", ingredientText: "Ingredients: Treated water" },
  "8906017290040": { productName: "Bisleri Packaged Drinking Water 1 L", ingredientText: "Ingredients: Treated water" },
  "8906017290064": { productName: "Bisleri Packaged Drinking Water 2 L", ingredientText: "Ingredients: Treated water" },
  "8906017290071": { productName: "Bisleri Packaged Drinking Water 5 L", ingredientText: "Ingredients: Treated water" },
  "8906017290088": { productName: "Bisleri Packaged Drinking Water 10 L", ingredientText: "Ingredients: Treated water" },
};

export function knownBarcodeProduct(barcode: string): { productName: string; ingredientText: string } | null {
  const match = KNOWN_PRODUCT_BARCODES[barcode.trim()];
  return match ? { productName: match.productName, ingredientText: match.ingredientText ?? "" } : null;
}

/**
 * Looks up a barcode against the free, keyless Open Food Facts catalog
 * and returns the product name + ingredient list as plain text, ready to
 * drop into the scanner's "paste label text" field. Runs client-side —
 * Open Food Facts' read API is CORS-enabled for browser use.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const trimmed = barcode.trim();
  if (!trimmed) return { found: false };

  const known = knownBarcodeProduct(trimmed);
  if (known) {
    return { found: true, productName: known.productName, ingredientText: known.ingredientText, barcode: trimmed };
  }

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

    const ingredientText = p.ingredients_text?.trim() ?? "";
    const productName = [p.brands, p.product_name].filter(Boolean).join(" — ") || trimmed;
    // A catalog match is still useful when ingredients are absent (common for
    // bottled water). Do not require an ingredient list to establish identity.

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
      productName,
      ingredientText: nutrientLines
        ? `${ingredientText ? `Ingredients: ${ingredientText}\n` : ""}Nutrition (per 100g): ${nutrientLines}`
        : ingredientText
          ? `Ingredients: ${ingredientText}`
          : "",
      barcode: trimmed,
    };
  } catch {
    return { found: false };
  }
}

function fmtNutrient(label: string, value: number | string | undefined, unit: string): string {
  if (value === undefined || value === null || value === "") return "";
  return `${label} ${value}${unit.startsWith("kcal") ? "" : ""} ${unit}`;
}


/**
 * Best-effort automatic EAN/UPC detection from a captured image. This uses
 * the browser's native BarcodeDetector when available, so no extra package
 * or API quota is required. If the browser does not support it, scanning
 * simply continues with the vision model.
 */
export async function detectBarcodeFromDataUrl(dataUrl: string): Promise<string | null> {
  try {
    const BarcodeDetectorCtor = (globalThis as typeof globalThis & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
      };
    }).BarcodeDetector;

    if (!BarcodeDetectorCtor) return null;

    const detector = new BarcodeDetectorCtor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
    });

    const image = await loadImage(dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const max = 640;
    const scale = Math.min(1, max / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    try {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx || !canvas.width || !canvas.height) return null;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const codes = await detector.detect(canvas);
      const value = codes.find((code) => code.rawValue?.trim())?.rawValue?.trim();
      return value || null;
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      image.src = "";
    }
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
