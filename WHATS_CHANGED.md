# PlateGuard AI — scan reliability update

## Scan UI
- Kept the scanner layout and moved the AI capacity bar directly underneath the profile switcher, matching the preferred `scan.tsx` layout.
- Kept the history and profile actions in the header.

## Low-memory protection
- Reduced browser-side scan images to a maximum 896px long side and JPEG quality 0.68.
- Replaced the full-resolution `createImageBitmap` upload path with an object-URL image decode + downsample path.
- Reduced live camera capture to 1280×720 at up to 24fps.
- Reduced barcode detection working images to 640px.
- Added explicit canvas/image cleanup after barcode detection, thumbnail creation, photo conversion, and PDF rendering.
- Reduced first-page PDF rendering and destroys the PDF document after conversion.
- Added a specific user-facing low-memory error instead of the generic scan failure message.

## AI provider fixes
- Gemini automatically migrates the retired `gemini-2.5-flash` model (including a `models/` prefix) to `gemini-3.6-flash`.
- Existing Groq Llama 4 Scout configuration is migrated to the current Qwen vision model.
- Provider failover still skips providers that are known to be blocked/unavailable.
- When every configured provider fails, the error now summarizes each provider's failure category so an invalid API key, missing credits, or retired model is immediately visible.

## Important
- An invalid Groq API key or an xAI team with no credits cannot be repaired by application code; those credentials/account settings must be fixed in the provider dashboard.
- The scanner will automatically use the next configured provider after a provider-specific failure.

## Profile + Card translation extension (2026-08-26)

- Extended `PROFILE_PHRASES` / `CARD_PHRASES` with all option labels (age groups, allergens, conditions, severities, dietary patterns, etc.) and remaining UI copy.
- Profile and Card screens now pass every display string through `tp()` — including SelectItem labels, MultiSelect options, condition chips, and card body text.
- MultiSelect accepts `getLabel` so stored English values stay English while UI shows the active language.
- Removed sparse-array holes in phrase packs that could produce empty translation items.
- `usePhrases` now skips non-string / blank entries before calling the server.
- Root error boundary only auto-retries known *transient* failures (chunk load / network / language race) so permanent errors no longer loop on “This page didn’t load”.
