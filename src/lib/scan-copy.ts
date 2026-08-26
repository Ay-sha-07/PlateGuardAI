
/** English UI copy for the scan screen — AI-translated with the active language. */
export const SCAN_COPY = {
  startingScan: "Starting scan…",
  preparingLabel: "Preparing label…",
  checkingBarcode: "Checking product barcode…",
  lookingUpProduct: "Looking up product details…",
  analyzingLabel: "Analyzing label with AI…",
  analyzingAi: "Analyzing with AI…",
  buildingResult: "Building your result…",
  savingHistory: "Saving to history…",
  scanComplete: "Scan complete",
  preparingProduct: "Preparing product information…",
  preparingFile: "Preparing file…",
  scanTakesTime: "This usually takes about 10–30 seconds",
  scanningFor: "Scanning for",
  uploadPhoto: "Upload a photo or PDF",
  takePhoto: "Take photo",
  fromGallery: "From gallery",
  barcodeLookupFailed: "Barcode lookup failed — check your connection and try again.",
  barcodeNotFound: "We couldn't find this barcode in the open catalog.",
} as const;

export type ScanCopy = Record<keyof typeof SCAN_COPY, string>;
