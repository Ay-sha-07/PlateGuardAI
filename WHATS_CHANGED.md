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
